/**
 * Interview analysis (upload + live entry) — visual rebuild matching the
 * rest of the redesigned UI. Same upload flow, same backend call, same
 * navigation; only the surface changed.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  UserCheck,
  Video,
} from "lucide-react";
import AnalysisError from "../components/AnalysisError";
import AnalysisProgress from "../components/AnalysisProgress";
import AnalysisResults from "../components/AnalysisResults";
import FileUploader from "../components/FileUploader";
import InputTypeSelector, { type UploadKind } from "../components/InputTypeSelector";
import { useAnalysisState } from "../hooks/useAnalysisState";
import { transformAnalysisData } from "../utils/transformAnalysisData";

const MODE_KEY = "interview";
const MODE_PATH = "interview";

export default function InterviewAnalysis() {
  const navigate = useNavigate();
  const [uploadKind, setUploadKind] = useState<UploadKind | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const analysis = useAnalysisState();
  const latestRequestId = useRef(0);
  const currentController = useRef<AbortController | null>(null);

  const handleKindSelect = (kind: UploadKind) => {
    setUploadKind(kind);
    analysis.clearError();
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    analysis.clearError();
  };

  const buildRequest = (kind: UploadKind): { url: string; field: string } => {
    const apiBase = import.meta.env.VITE_API_URL || "/api";
    if (kind === "document") return { url: `${apiBase}/analyze/${MODE_PATH}/document`, field: "document" };
    if (kind === "image") return { url: `${apiBase}/analyze/${MODE_PATH}/image`, field: "image" };
    return { url: `${apiBase}/analyze/${MODE_PATH}`, field: "audio" };
  };

  const handleFileAnalysis = async () => {
    if (!selectedFile) {
      analysis.setAnalysisError("Please select a file to analyze");
      return;
    }
    if (!uploadKind) {
      analysis.setAnalysisError("Please choose what you're uploading");
      return;
    }
    const requestId = Date.now();
    latestRequestId.current = requestId;
    currentController.current?.abort();
    const controller = new AbortController();
    currentController.current = controller;

    analysis.setLiveResult(null);
    analysis.setIsAnalyzing(true);
    analysis.setProgress(0);
    analysis.clearError();

    let progressInterval: ReturnType<typeof setInterval> | null = null;
    try {
      progressInterval = analysis.startProgress();
      const formData = new FormData();
      const { url, field } = buildRequest(uploadKind);
      formData.append(field, selectedFile, selectedFile.name);
      const token = localStorage.getItem("authToken");
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal,
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errBody = await res.json();
          if (errBody?.error) msg = errBody.error;
          else if (errBody?.message) msg = errBody.message;
        } catch {}
        throw new Error(msg);
      }
      const response = await res.json();
      if (requestId !== latestRequestId.current) return;
      analysis.setAnalysisSuccess(response);
      try {
        const transformed = transformAnalysisData(response);
        if (transformed) {
          sessionStorage.setItem(
            `trustai:lastAnalysis:${MODE_KEY}`,
            JSON.stringify({
              timestamp: new Date().toISOString(),
              status: "complete",
              data: transformed,
            })
          );
        }
      } catch {}
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      if (requestId === latestRequestId.current) {
        analysis.setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      if (requestId === latestRequestId.current) analysis.setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    analysis.resetState();
    setUploadKind(null);
    setSelectedFile(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#070b14] text-white">
      <AmbientGlow tones={["from-emerald-500/10", "from-sky-500/10"]} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {/* ─── Stage 1: choose input method + live entry ───────────── */}
          {uploadKind === null && !analysis.isAnalyzing && !analysis.analysisComplete && (
            <motion.div key="hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Hero
                kicker="Interview mode"
                title="Interview"
                titleAccent="Analysis"
                accentGradient="from-emerald-300 via-emerald-400 to-sky-400"
                description="Per-window credibility, vocal stress and facial emotion. Hire / further-review / reject backed by transparent scoring."
                Icon={UserCheck}
              />
              <LiveBanner
                title="Host a live interview"
                description="Generate a join code, share with the candidate, and watch behavioural analysis arrive every 10 seconds while they speak."
                onClick={() => navigate("/interview/host")}
                gradient="from-emerald-500 to-sky-500"
                shadow="shadow-emerald-500/25"
                cta="Start live session"
              />
              <InputTypeSelector onSelect={handleKindSelect} isLoading={analysis.isAnalyzing} />
              <BackButton onClick={() => navigate(-1)} />
            </motion.div>
          )}

          {/* ─── Stage 2: upload + analyze ───────────────────────────── */}
          {uploadKind !== null && !analysis.isAnalyzing && !analysis.analysisComplete && (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <UploadHeader
                title={`Upload ${uploadKind}`}
                onBack={() => setUploadKind(null)}
              />
              {analysis.error && (
                <AnalysisError
                  message={analysis.error}
                  onRetry={() => {
                    analysis.handleRetry();
                    if (selectedFile) handleFileAnalysis();
                  }}
                />
              )}
              <FileUploader onFileSelect={handleFileSelect} kind={uploadKind} />
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setUploadKind(null)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </motion.button>
                <motion.button
                  whileHover={selectedFile ? { scale: 1.04 } : undefined}
                  whileTap={selectedFile ? { scale: 0.96 } : undefined}
                  onClick={handleFileAnalysis}
                  disabled={!selectedFile}
                  className={`inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-semibold transition-all ${
                    selectedFile
                      ? "bg-gradient-to-r from-emerald-500 to-sky-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                      : "bg-white/[0.04] text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {selectedFile ? "Analyse interview" : "Select a file first"}
                  {selectedFile && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ─── Stage 3: analysing ──────────────────────────────────── */}
          {analysis.isAnalyzing && (
            <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalysingState progress={analysis.progress} accent="emerald" />
            </motion.div>
          )}

          {/* ─── Stage 4: complete ───────────────────────────────────── */}
          {analysis.analysisComplete && !analysis.isAnalyzing && (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CompleteHeader
                title="Analysis complete"
                subtitle="Interview transcribed, scored, and ready to review."
              />
              <AnalysisResults
                liveResult={analysis.liveResult as any}
                onReset={handleReset}
              />
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] text-sm font-medium transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  New analysis
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/report/preview/interview`)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-semibold bg-gradient-to-r from-emerald-500 to-sky-500 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow"
                >
                  View full report
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shared visual primitives (used by the 3 mode pages — local to file for now)
// ────────────────────────────────────────────────────────────────────────────
export function Hero(props: {
  kicker: string;
  title: string;
  titleAccent: string;
  accentGradient: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const { kicker, title, titleAccent, accentGradient, description, Icon } = props;
  return (
    <div className="grid md:grid-cols-[1.3fr_1fr] gap-10 items-center mb-10">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[0.65rem] uppercase tracking-wider text-slate-300 mb-4">
          <Sparkles className="h-3 w-3 text-emerald-400" />
          {kicker}
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
          {title}
          <br />
          <span className={`bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent`}>
            {titleAccent}
          </span>
        </h1>
        <p className="mt-4 text-slate-300/80 text-lg leading-relaxed max-w-xl">
          {description}
        </p>
      </div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="hidden md:flex justify-center"
      >
        <div className="h-40 w-40 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 grid place-items-center shadow-2xl">
          <Icon className="h-20 w-20 text-emerald-300" />
        </div>
      </motion.div>
    </div>
  );
}

export function LiveBanner(props: {
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
  shadow: string;
  cta: string;
}) {
  const { title, description, onClick, gradient, shadow, cta } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-4 flex-1">
        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30 grid place-items-center flex-shrink-0">
          <Video className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold tracking-tight mb-1">{title}</h3>
          <p className="text-slate-300/80 text-sm leading-relaxed">{description}</p>
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r ${gradient} ${shadow} shadow-lg hover:shadow-emerald-500/40 transition-shadow whitespace-nowrap`}
      >
        {cta}
        <ArrowRight className="h-4 w-4" />
      </motion.button>
    </motion.div>
  );
}

export function UploadHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Change input method
      </button>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="text-slate-400 text-sm mt-1">
        Upload an audio or video file for the full multimodal analysis.
      </p>
    </div>
  );
}

export function AnalysingState({ progress, accent }: { progress: number; accent: "emerald" | "amber" | "rose" }) {
  const accentMap = {
    emerald: { from: "from-emerald-400", to: "to-sky-400", text: "text-emerald-300", ring: "ring-emerald-500/30" },
    amber: { from: "from-amber-400", to: "to-emerald-400", text: "text-amber-200", ring: "ring-amber-500/30" },
    rose: { from: "from-rose-400", to: "to-amber-400", text: "text-rose-300", ring: "ring-rose-500/30" },
  }[accent];
  return (
    <div className="grid place-items-center min-h-[60vh] text-center">
      <div className="max-w-xl w-full">
        <motion.div className={`mx-auto mb-6 h-24 w-24 rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 ring-1 ${accentMap.ring} grid place-items-center`}>
          <div className="flex items-end gap-1 h-12">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                animate={{ height: [10, 40, 10] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                className={`w-1.5 rounded-full bg-gradient-to-t ${accentMap.from} ${accentMap.to}`}
              />
            ))}
          </div>
        </motion.div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Analysing recording</h2>
        <p className={`text-sm ${accentMap.text} mb-6`}>
          Transcribing speech, scoring emotion, computing stress…
        </p>
        <AnalysisProgress progress={progress} isAnalyzing />
      </div>
    </div>
  );
}

export function CompleteHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <motion.div className="text-center mb-8">
      <motion.div
        initial={{ scale: 0, rotate: 180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, delay: 0.1 }}
        className="inline-flex h-16 w-16 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 grid place-items-center mb-4"
      >
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
      </motion.div>
      <h2 className="text-4xl font-black tracking-tight">{title}</h2>
      <p className="text-slate-400 text-sm mt-2">{subtitle}</p>
    </motion.div>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="mt-10 mx-auto block px-6 py-2.5 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-sm font-medium text-slate-300 transition-colors"
    >
      ← Back
    </motion.button>
  );
}

export function AmbientGlow({ tones }: { tones: [string, string] }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className={`absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-gradient-to-br ${tones[0]} blur-3xl`}
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute -bottom-64 -right-48 h-[640px] w-[640px] rounded-full bg-gradient-to-tr ${tones[1]} blur-3xl`}
        animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#070b14_80%)]" />
    </div>
  );
}
