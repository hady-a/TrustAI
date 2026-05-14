/**
 * Criminal investigation analysis (upload + live entry) — same shell as
 * InterviewAnalysis with the criminal mode's rose gradient and the
 * `/analyze/investigation` endpoint.
 */
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import AnalysisError from "../components/AnalysisError";
import AnalysisResults from "../components/AnalysisResults";
import FileUploader from "../components/FileUploader";
import InputTypeSelector, { type UploadKind } from "../components/InputTypeSelector";
import { useAnalysisState } from "../hooks/useAnalysisState";
import { transformAnalysisData } from "../utils/transformAnalysisData";
import {
  AmbientGlow,
  AnalysingState,
  BackButton,
  CompleteHeader,
  Hero,
  LiveBanner,
  UploadHeader,
} from "./InterviewAnalysis";

const MODE_KEY = "criminal";
const MODE_PATH = "investigation";

export default function CriminalAnalysis() {
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
      <AmbientGlow tones={["from-rose-500/10", "from-amber-500/10"]} />
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {uploadKind === null && !analysis.isAnalyzing && !analysis.analysisComplete && (
            <motion.div key="hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Hero
                kicker="Criminal investigation"
                title="Criminal"
                titleAccent="Investigation"
                accentGradient="from-rose-300 via-rose-400 to-amber-400"
                description="Surface behavioural risk indicators — stress, vocal jitter, emotion mismatch. Output is decision support, never a verdict."
                Icon={ShieldAlert}
              />
              <LiveBanner
                title="Upload a video for timeline analysis"
                description="Drop a video of the statement. We sample face emotion per window and align it with vocal stress to produce a per-second risk timeline."
                onClick={() => setUploadKind("video")}
                gradient="from-rose-500 to-amber-500"
                shadow="shadow-rose-500/25"
                cta="Upload now"
              />
              <InputTypeSelector onSelect={handleKindSelect} isLoading={analysis.isAnalyzing} />
              <BackButton onClick={() => navigate(-1)} />
            </motion.div>
          )}

          {uploadKind !== null && !analysis.isAnalyzing && !analysis.analysisComplete && (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <UploadHeader title={`Upload ${uploadKind}`} onBack={() => setUploadKind(null)} />
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
                      ? "bg-gradient-to-r from-rose-500 to-amber-500 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40"
                      : "bg-white/[0.04] text-slate-500 cursor-not-allowed"
                  }`}
                >
                  {selectedFile ? "Run investigation" : "Select a file first"}
                  {selectedFile && <ArrowRight className="h-4 w-4" />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {analysis.isAnalyzing && (
            <motion.div key="busy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <AnalysingState progress={analysis.progress} accent="rose" />
            </motion.div>
          )}

          {analysis.analysisComplete && !analysis.isAnalyzing && (
            <motion.div key="done" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <CompleteHeader
                title="Analysis complete"
                subtitle="Behavioural risk indicators surfaced. Decision support — not a verdict."
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
                  onClick={() => navigate(`/report/preview/criminal`)}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl font-semibold bg-gradient-to-r from-rose-500 to-amber-500 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-shadow"
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
