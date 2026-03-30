import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Download, Share2, AlertCircle, CheckCircle2, TrendingUp, Loader, ArrowLeft } from "lucide-react";
import { analysisAPI } from "../lib/api";

interface AnalysisData {
  id: string;
  mode: string;
  userId: string;
  inputMethod: string;
  status: string;
  confidence: number;
  summary: string;
  faceAnalysis?: any;
  voiceAnalysis?: any;
  credibilityAnalysis?: any;
  recommendations?: string[];
  processingTime?: number;
  createdAt: string;
  completedAt?: string;
}

interface ResultsPageProps {
  mode: "BUSINESS" | "CRIMINAL" | "INTERVIEW";
}

export default function ResultsPage({ mode }: ResultsPageProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        const response = await analysisAPI.get(`/analysis/${id}`);
        
        if (response.data.success && response.data.data?.analysis) {
          setAnalysisData(response.data.data.analysis);
        } else {
          setError("Failed to load analysis results");
        }
      } catch (err) {
        console.error("Error fetching analysis:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch analysis");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnalysis();
    } else {
      setError("No analysis ID provided");
      setLoading(false);
    }
  }, [id]);

  const getModeConfig = () => {
    const configs: Record<string, any> = {
      BUSINESS: {
        title: "Business Analysis Results",
        icon: "📊",
        color: "emerald",
      },
      INVESTIGATION: {
        title: "Investigation Analysis Results",
        icon: "🔍",
        color: "red",
      },
      HR: {
        title: "Interview Analysis Results",
        icon: "👥",
        color: "blue",
      },
    };
    return configs[analysisData?.mode || mode] || configs.BUSINESS;
  };

  const generatePDF = async () => {
    if (!analysisData) return;

    setIsPdfGenerating(true);
    try {
      // Lazy load jsPDF only when needed
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF();
      const config = getModeConfig();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.text(config.title, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Metadata
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Analysis ID: ${analysisData.id}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Mode: ${analysisData.mode}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Date: ${new Date(analysisData.createdAt).toLocaleString()}`, 20, yPosition);
      yPosition += 12;

      // Confidence Score
      pdf.setFont('Helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.text(`Confidence Score: ${(analysisData.confidence * 100).toFixed(1)}%`, 20, yPosition);
      yPosition += 12;

      // Summary
      pdf.setFont('Helvetica', 'bold');
      pdf.text("Summary", 20, yPosition);
      yPosition += 8;
      pdf.setFont('Helvetica', "normal");
      pdf.setFontSize(10);
      const summaryLines = pdf.splitTextToSize(analysisData.summary || "N/A", 170);
      pdf.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 6 + 10;

      // Recommendations
      if (analysisData.recommendations && analysisData.recommendations.length > 0) {
        pdf.setFont('Helvetica', 'bold');
        pdf.text("Recommendations", 20, yPosition);
        yPosition += 8;
        pdf.setFont('Helvetica', 'normal');

        analysisData.recommendations.forEach((rec: string) => {
          const recLines = pdf.splitTextToSize(`• ${rec}`, 170);
          pdf.text(recLines, 25, yPosition);
          yPosition += recLines.length * 5 + 2;
        });
      }

      // Save PDF
      pdf.save(`analysis-${analysisData.id}.pdf`);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const shareResults = async () => {
    if (!analysisData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Analysis Results",
          text: analysisData.summary,
        });
      } catch (err) {
        console.error("Share error:", err);
      }
    }
  };

  const config = getModeConfig();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-4"
        >
          <Loader className="w-12 h-12 text-emerald-500" />
          <p className="text-gray-400 text-lg">Loading analysis results...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] flex items-center justify-center py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-red-900/20 border-2 border-red-600 rounded-xl p-8 text-center"
        >
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-gray-300 mb-6">{error || "Analysis results not found"}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
          >
            ← Go Back
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="text-5xl">{config.icon}</span>
            <div>
              <h1 className="text-4xl font-bold text-white">{config.title}</h1>
              <p className="text-gray-400 text-sm mt-1">
                Analysis completed on {new Date(analysisData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        </motion.div>

        {/* Status and Confidence */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl border-2 bg-gradient-to-br from-green-900/20 to-green-900/5 border-green-600"
          >
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="font-bold text-lg text-white">Status</h2>
                <p className="text-green-300 text-sm mt-1 capitalize">
                  {analysisData.status === "completed" ? "✓ Analysis Complete" : `${analysisData.status}`}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Confidence Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl border-2 border-emerald-600 bg-gradient-to-br from-emerald-900/20 to-emerald-900/5"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Confidence Score
                </h3>
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                {(analysisData.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysisData.confidence * 100}%` }}
                transition={{ duration: 1, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full"
              />
            </div>
          </motion.div>
        </div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8 p-6 rounded-xl border-2 border-gray-700 bg-gray-900/30"
        >
          <h2 className="text-xl font-bold text-white mb-4">Summary</h2>
          <p className="text-gray-300 leading-relaxed">{analysisData.summary}</p>
        </motion.div>

        {/* Analysis Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 grid md:grid-cols-3 gap-6"
        >
          {analysisData.faceAnalysis && (
            <div className="p-6 rounded-xl border-2 border-blue-600 bg-blue-900/10">
              <h3 className="text-lg font-bold text-blue-300 mb-3">👤 Face Analysis</h3>
              <div className="text-sm text-gray-300 space-y-2">
                {typeof analysisData.faceAnalysis === "object" && Object.entries(analysisData.faceAnalysis).slice(0, 3).map(([key, value]: any) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{key}:</span>
                    <span className="font-semibold text-blue-300">{String(value).substring(0, 40)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisData.voiceAnalysis && (
            <div className="p-6 rounded-xl border-2 border-purple-600 bg-purple-900/10">
              <h3 className="text-lg font-bold text-purple-300 mb-3">🎤 Voice Analysis</h3>
              <div className="text-sm text-gray-300 space-y-2">
                {typeof analysisData.voiceAnalysis === "object" && Object.entries(analysisData.voiceAnalysis).slice(0, 3).map(([key, value]: any) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{key}:</span>
                    <span className="font-semibold text-purple-300">{String(value).substring(0, 40)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysisData.credibilityAnalysis && (
            <div className="p-6 rounded-xl border-2 border-yellow-600 bg-yellow-900/10">
              <h3 className="text-lg font-bold text-yellow-300 mb-3">🎯 Credibility Analysis</h3>
              <div className="text-sm text-gray-300 space-y-2">
                {typeof analysisData.credibilityAnalysis === "object" && Object.entries(analysisData.credibilityAnalysis).slice(0, 3).map(([key, value]: any) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{key}:</span>
                    <span className="font-semibold text-yellow-300">{String(value).substring(0, 40)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Recommendations */}
        {analysisData.recommendations && analysisData.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-6 rounded-xl border-2 border-amber-600 bg-amber-900/10"
          >
            <h2 className="text-xl font-bold text-amber-300 mb-4">💡 Recommendations</h2>
            <ul className="space-y-2">
              {analysisData.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="flex gap-3 text-gray-300">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generatePDF}
            disabled={isPdfGenerating}
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {isPdfGenerating ? "Generating..." : "Download PDF"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={shareResults}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <Share2 className="w-5 h-5" />
            Share
          </motion.button>
        </motion.div>

        {/* Metadata Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 pt-6 border-t border-gray-700 text-center text-gray-400 text-sm"
        >
          <p>Analysis ID: {analysisData.id}</p>
          <p>Processing Time: {analysisData.processingTime ? `${analysisData.processingTime}ms` : "N/A"}</p>
        </motion.div>
      </div>
    </div>
  );
}
