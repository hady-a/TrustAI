/**
 * Document analysis routes.
 *
 * Extracts text from PDFs and Word documents on the Node side, then returns a
 * Flask-compatible response shape so the existing frontend transformer can
 * render it. Flask itself only accepts audio/video — documents never reach it.
 *
 * Endpoints:
 *   POST /api/analyze/:mode/document   form-data: { document: file }
 * Mode: business | interview | criminal | investigation
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import mammoth from 'mammoth';
import { logger } from '../config/logger';

const uploadsDir = path.join(process.cwd(), 'uploads');
fs.ensureDirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const stamp = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `doc-${stamp}${path.extname(file.originalname)}`);
  },
});

const docMimes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
  'text/plain',
]);

const docExts = new Set(['.pdf', '.doc', '.docx', '.txt']);

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (docMimes.has(file.mimetype) || docExts.has(ext)) cb(null, true);
    else cb(new Error(`Unsupported document type: ${file.mimetype || ext}`));
  },
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const router = Router();

const VALID_MODES = new Set(['business', 'interview', 'criminal', 'investigation']);

router.post(
  '/analyze/:mode/document',
  upload.single('document'),
  async (req: Request, res: Response) => {
    const start = Date.now();
    const filePath = req.file?.path;
    const mode = (req.params.mode || '').toLowerCase();

    try {
      if (!VALID_MODES.has(mode)) {
        return res.status(400).json({ success: false, error: `Unknown mode: ${mode}` });
      }
      if (!filePath) {
        return res.status(400).json({ success: false, error: 'Document file is required' });
      }

      const ext = path.extname(filePath).toLowerCase();
      logger.info({ mode, ext, size: req.file?.size }, '📄 Document analyse request');

      const text = await extractText(filePath, ext);
      if (!text || !text.trim()) {
        return res.status(422).json({
          success: false,
          error: 'No text could be extracted from this document.',
        });
      }

      const analysis = buildTextAnalysis(text, mode);
      const processingTime = Date.now() - start;

      logger.info({ mode, processingTime, words: analysis.voice.transcription.word_count }, '✅ Document analysis complete');

      return res.status(200).json({
        success: true,
        data: {
          mode,
          analysis,
          errors: [],
          modules_available: { face: false, voice: false, credibility: true, report: true },
          interpretation: analysis.credibility.interpretation,
        },
        timestamp: new Date().toISOString(),
        report_type: `${mode}_document`,
        processingTime,
      });
    } catch (err) {
      const e = err as Error;
      logger.error({ err: e.message }, '❌ Document analysis failed');
      return res.status(500).json({ success: false, error: e.message || 'Document analysis failed' });
    } finally {
      if (filePath && (await fs.pathExists(filePath))) {
        try { await fs.remove(filePath); } catch {}
      }
    }
  }
);

export default router;

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------
async function extractText(filePath: string, ext: string): Promise<string> {
  if (ext === '.pdf') {
    const { PDFParse } = await import('pdf-parse');
    const buffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    return (result.text || '').toString();
  }
  if (ext === '.docx' || ext === '.doc') {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  if (ext === '.txt') {
    return (await fs.readFile(filePath, 'utf-8')).toString();
  }
  // Fallback: try PDF then DOCX
  try {
    const { PDFParse } = await import('pdf-parse');
    const buffer = await fs.readFile(filePath);
    return (await new PDFParse({ data: new Uint8Array(buffer) }).getText()).text || '';
  } catch {
    const buffer = await fs.readFile(filePath);
    return (await mammoth.extractRawText({ buffer })).value || '';
  }
}

// ---------------------------------------------------------------------------
// Lightweight text credibility heuristic.
//
// Produces the same envelope the Flask analyzers do so the frontend
// transformer + display can render documents identically to audio/video.
// ---------------------------------------------------------------------------
const HEDGES = [
  'maybe', 'perhaps', 'possibly', 'probably', 'sort of', 'kind of',
  'i guess', 'i think', 'i believe', 'somewhat', 'might', 'could be',
  'apparently', 'allegedly', 'supposedly',
];
const CERTAINTY = [
  'definitely', 'certainly', 'absolutely', 'clearly', 'undoubtedly',
  'without doubt', 'for sure', 'no question',
];
const NEGATIONS = ['not', "didn't", "doesn't", "don't", 'never', 'no'];

function buildTextAnalysis(text: string, mode: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = cleaned.split(/[.!?]+\s/).filter((s) => s.trim().length);
  const sentenceCount = sentences.length || 1;
  const avgSentenceLen = wordCount / sentenceCount;

  const lower = cleaned.toLowerCase();
  const count = (terms: string[]) => terms.reduce((n, t) => n + occurrences(lower, t), 0);
  const hedgeCount = count(HEDGES);
  const certaintyCount = count(CERTAINTY);
  const negationCount = count(NEGATIONS);

  const hedgeRatio = hedgeCount / Math.max(wordCount, 1);
  const certaintyRatio = certaintyCount / Math.max(wordCount, 1);

  // Heuristic: high hedging + low certainty drags credibility down.
  // Numbers are intentionally soft — this is not a clinical score, it's a
  // signal so document inputs feel parallel to voice inputs in the UI.
  const baseScore = 0.7
    - Math.min(0.35, hedgeRatio * 15)
    + Math.min(0.15, certaintyRatio * 10);
  const credibilityScore = clamp(baseScore, 0.1, 0.95);
  const deceptionProbability = clamp(1 - credibilityScore, 0.05, 0.9);
  const confidence = clamp(0.5 + Math.min(0.4, wordCount / 800), 0.5, 0.9);

  const riskLevel = credibilityScore >= 0.7
    ? 'low'
    : credibilityScore >= 0.5
      ? 'medium'
      : credibilityScore >= 0.35
        ? 'high'
        : 'critical';

  const signals: string[] = [];
  if (hedgeCount > 0) signals.push(`Hedging language: ${hedgeCount} instance(s)`);
  if (certaintyCount > 0) signals.push(`Certainty language: ${certaintyCount} instance(s)`);
  if (negationCount > 5) signals.push(`Heavy negation use: ${negationCount}`);
  if (avgSentenceLen > 35) signals.push('Long, complex sentences — possible obfuscation');
  if (wordCount < 50) signals.push('Short document — interpret with caution');

  const recommendation = recommend(mode, riskLevel);

  return {
    mode,
    face: {
      success: false,
      dominant_emotion: 'unknown',
      emotion: 'unknown',
      message: 'No face data — document input.',
    },
    voice: {
      transcription: {
        transcript: cleaned.slice(0, 4000),
        word_count: wordCount,
        sentence_count: sentenceCount,
        source: 'document',
      },
      emotion: { emotion: 'neutral', confidence: 0 },
      stress: { stress_level: 0, pitch_jitter: 0, voiced_ratio: 0 },
    },
    credibility: {
      credibility_score: Math.round(credibilityScore * 100),
      confidence: Math.round(confidence * 100),
      confidence_level: Math.round(confidence * 100),
      deception_probability: deceptionProbability,
      risk_level: riskLevel,
      behavioral_signals: signals,
      interpretation: {
        recommendation,
        risk_level: riskLevel,
        focus_metrics: {
          hedge_count: hedgeCount,
          certainty_count: certaintyCount,
          word_count: wordCount,
          avg_sentence_length: Number(avgSentenceLen.toFixed(1)),
        },
      },
    },
  };
}

function recommend(mode: string, risk: string): string {
  if (mode === 'business') {
    return risk === 'low'
      ? 'PROCEED — written statement reads as consistent and confident.'
      : risk === 'medium'
        ? 'DUE DILIGENCE — hedging present; corroborate key claims.'
        : 'DROP / RENEGOTIATE — strong hedging and low certainty.';
  }
  if (mode === 'interview') {
    return risk === 'low'
      ? 'HIRE-leaning — written responses are direct.'
      : risk === 'medium'
        ? 'FURTHER REVIEW — clarify hedged answers in a follow-up.'
        : 'REJECT-leaning — evasive language across the document.';
  }
  // criminal / investigation
  return risk === 'low'
    ? 'Statement appears consistent — low priority for follow-up questioning.'
    : risk === 'medium'
      ? 'Behavioural review recommended — pursue clarification on hedged sections.'
      : 'High concern — re-interview with focused, direct questions.';
}

function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let idx = haystack.indexOf(needle);
  while (idx !== -1) {
    count++;
    idx = haystack.indexOf(needle, idx + needle.length);
  }
  return count;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
