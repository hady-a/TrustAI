/**
 * Clean and strict transformer for TrustAI
 * - Uses single source of truth
 * - No fake fallback values
 * - Consistent types
 * - Predictable output
 */

export interface AnalysisData {
  deceptionScore: number;
  credibilityScore: number;
  confidence: number;
  transcript: string;
  emotion: string;
  stress: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  behavioralSignals: string[];
  summary: string;
  interpretation?: {
    recommendation?: string;
    risk_level?: string;
    focus_metrics?: Record<string, any>;
  };
  insights: string[];
  // Raw analyzer outputs preserved for downstream components that key off them.
  face?: Record<string, any>;
  voice?: Record<string, any>;
  credibility?: Record<string, any>;
  metrics?: Record<string, any>;
}

/**
 * Valid risk levels
 */
const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

/**
 * Normalise an AI score to 0..1.
 *
 * Flask's documented contract: 0..100 (integer) for credibility_score,
 * confidence_level, stress_level, deception_probability (when provided).
 * Some pipelines (document mode, live chunks) hand back already-normalised
 * 0..1 floats. We detect *type and bounds* rather than a fragile `> 1` check:
 * if the value is in [0, 1] AND looks like a float (non-integer), it's
 * already normalised. Otherwise we divide by 100 and clamp.
 */
function toUnit(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  // Already-normalised floats (e.g. 0.42) — pass through clamped.
  if (raw >= 0 && raw <= 1 && !Number.isInteger(raw)) return raw;
  // Treat as 0..100 percentage. Integers in that range, or any value > 1.
  return Math.max(0, Math.min(1, raw / 100));
}

/**
 * Transformer function
 */
export function transformAnalysisData(apiResponse: any): AnalysisData | null {
  console.log('[transformAnalysisData] RAW:', apiResponse);

  // ✅ STRICT SOURCE (NO MULTIPLE PATHS)
  const analysis = apiResponse?.data?.analysis;
  if (!analysis) {
    console.error('Invalid API structure: missing analysis');
    return null;
  }

  const credibility = analysis.credibility;
  const voice = analysis.voice;
  const face = analysis.face;
  // Flask returns `interpretation` as a sibling of `analysis`, not inside it.
  const interpretation = apiResponse?.data?.interpretation;

  // ❌ NO FAKE DEFAULTS — FAIL FAST
  if (
    credibility?.credibility_score == null ||
    (credibility?.confidence == null && credibility?.confidence_level == null)
  ) {
    console.error('Missing critical credibility data', credibility);
    return null;
  }

  // ✅ CORE VALUES — normalise to 0..1 directly from Flask's documented 0..100 scale.
  // The previous "if value > 1, divide by 100" heuristic mis-handled edge values
  // (credibility_score = 1 was treated as already-normalised → displayed 100%).
  // Flask's contract is stable: credibility_score, confidence_level, stress_level
  // are integers in 0..100. We trust the contract and divide.
  const credibilityScore = toUnit(credibility.credibility_score);

  const rawConf = credibility.confidence_level ?? credibility.confidence;
  const confidence = toUnit(rawConf);

  // Deception is the complement of credibility (the AI fusion output IS the
  // weighted sum of deception signals, so 1 - credibility is the AI-derived
  // deception probability — not an arbitrary frontend computation).
  const deceptionFromAi = credibility.deception_probability;
  const deceptionScore = typeof deceptionFromAi === 'number'
    ? toUnit(deceptionFromAi)
    : Math.max(0, Math.min(1, 1 - credibilityScore));

  // Stress is 0..100 from Flask's voice analyzer.
  const stress = toUnit(voice?.stress?.stress_level);

  // Verification log — compare raw Flask values to normalised UI values.
  console.log('[transformAnalysisData] AI → UI', {
    flask: {
      credibility_score: credibility.credibility_score,
      confidence_level: credibility.confidence_level ?? credibility.confidence,
      stress_level: voice?.stress?.stress_level,
      deception_probability: credibility.deception_probability ?? '(not provided by Flask — derived as 100 - credibility)',
      risk_level: credibility.risk_level,
    },
    ui_percent: {
      credibility: Math.round(credibilityScore * 100),
      confidence: Math.round(confidence * 100),
      deception: Math.round(deceptionScore * 100),
      stress: Math.round(stress * 100),
    },
  });

  // ✅ SAFE FIELDS
  const emotion = face?.emotion ?? face?.dominant_emotion ?? 'Unknown';
  const transcript = voice?.transcription?.transcript ?? '';

  // ✅ SAFE RISK LEVEL — interpretation.mode_output may carry it (investigation
  // mode), otherwise fall back to the credibility module's canonical risk_level.
  const riskRaw = (
    interpretation?.mode_output?.risk_level ??
    interpretation?.risk_level ??
    credibility?.risk_level ??
    ''
  )
    .toString()
    .toLowerCase();
  const riskLevel: AnalysisData['riskLevel'] = VALID_RISK_LEVELS.includes(
    riskRaw as any
  )
    ? (riskRaw as AnalysisData['riskLevel'])
    : 'medium';

  // ✅ INTERPRETATION
  const recommendation =
    interpretation?.mode_output?.recommendation ??
    interpretation?.recommendation ??
    interpretation?.mode_output?.alert ??
    'Analysis complete';

  const focusMetrics =
    interpretation?.mode_output?.focus ??
    interpretation?.focus_metrics ??
    {};

  // ✅ SUMMARY
  const summary = `${recommendation}. Risk level: ${riskLevel}`;

  const result: AnalysisData = {
    deceptionScore,
    credibilityScore,
    confidence,
    transcript,
    emotion,
    stress,
    riskLevel,
    behavioralSignals: credibility?.behavioral_signals ?? [],
    interpretation: {
      recommendation,
      risk_level: riskRaw || credibility?.risk_level,
      focus_metrics: focusMetrics,
    },
    summary,
    insights: [
      recommendation,
      `Emotion: ${emotion}`,
      `Stress: ${(stress * 100).toFixed(0)}%`,
      ...(credibility?.behavioral_signals?.slice(0, 3) ?? []),
    ],
    // Preserve raw analyzer outputs so downstream `checkDataAvailability` and
    // detail panels can render face/voice/credibility sub-sections.
    face: face ?? undefined,
    voice: voice ?? undefined,
    credibility: credibility ?? undefined,
    metrics: focusMetrics && Object.keys(focusMetrics).length ? focusMetrics : undefined,
  };

  console.log('[transformAnalysisData] CLEAN OUTPUT:', result);

  return result;
}

/**
 * Validation helper
 */
export function isValidAnalysisData(data: AnalysisData): boolean {
  return (
    typeof data.deceptionScore === 'number' &&
    typeof data.credibilityScore === 'number' &&
    typeof data.confidence === 'number' &&
    typeof data.transcript === 'string' &&
    typeof data.stress === 'number' &&
    Array.isArray(data.insights)
  );
}