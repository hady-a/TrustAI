/**
 * ReportPreview — renders the most recent analysis result for a given mode
 * from sessionStorage. Used by the "View full report" CTA on the
 * Business / Interview / Criminal analysis pages so users can review or
 * download (PDF) the result they just generated without hitting the DB.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Download } from "lucide-react";
import LiveAnalysisDisplay from "../components/LiveAnalysisDisplay";
import { generateCriminalPDF } from "../utils/pdfReports/criminalReport";

type Mode = "business" | "interview" | "criminal";

const TITLES: Record<Mode, string> = {
  business: "Business Analysis Report",
  interview: "Interview Analysis Report",
  criminal: "Investigation Report",
};

const ACCENT: Record<Mode, string> = {
  business: "from-amber-500 to-emerald-500",
  interview: "from-emerald-500 to-sky-500",
  criminal: "from-rose-500 to-purple-500",
};

export default function ReportPreview() {
  const navigate = useNavigate();
  const { mode } = useParams<{ mode: Mode }>();
  const safeMode: Mode = (mode as Mode) ?? "business";
  const [liveResult, setLiveResult] = useState<any | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`trustai:lastAnalysis:${safeMode}`);
      if (raw) setLiveResult(JSON.parse(raw));
    } catch {
      setLiveResult(null);
    }
  }, [safeMode]);

  const pdfPayload = useMemo(() => {
    if (!liveResult?.data) return null;
    const d = liveResult.data;
    return {
      id: liveResult.timestamp ?? new Date().toISOString(),
      mode: safeMode.toUpperCase(),
      createdAt: liveResult.timestamp ?? new Date().toISOString(),
      faceAnalysis: d.face ?? {},
      voiceAnalysis: d.voice ?? {},
      credibilityAnalysis: d.credibility ?? {},
      interpretation: d.interpretation ?? {},
      summary: d.summary ?? "",
    };
  }, [liveResult, safeMode]);

  const handleDownload = async () => {
    if (!pdfPayload) return;
    setIsGenerating(true);
    try {
      await generateCriminalPDF(pdfPayload);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!liveResult) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">No recent analysis</h1>
          <p className="text-slate-400 text-sm">
            Run an analysis first; the report viewer will read its result here.
          </p>
          <button
            onClick={() => navigate(`/analysis/${safeMode}`)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" /> Back to analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-2">
              {safeMode} mode
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              {TITLES[safeMode]}
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/analysis/${safeMode}`)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r ${ACCENT[safeMode]} shadow-lg disabled:opacity-60`}
            >
              <Download className="h-4 w-4" />
              {isGenerating ? "Preparing..." : "Download PDF"}
            </button>
          </div>
        </motion.div>

        <LiveAnalysisDisplay result={liveResult} isAnalyzing={false} />
      </div>
    </div>
  );
}
