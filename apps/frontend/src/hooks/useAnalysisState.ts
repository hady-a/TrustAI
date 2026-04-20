import { useState, useCallback } from "react";
import { transformAnalysisData } from "../utils/transformAnalysisData";

interface UseAnalysisStateOptions {
  onRetry?: () => Promise<void> | void;
}

export function useAnalysisState(options?: UseAnalysisStateOptions) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [analysisId, setAnalysisId] = useState<string>("");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [liveResult, setLiveResult] = useState<any | null>(null);

  const handleRetry = useCallback(async () => {
    setError("");
    if (options?.onRetry) {
      await options.onRetry();
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const resetState = useCallback(() => {
    setIsAnalyzing(false);
    setProgress(0);
    setError("");
    setAnalysisComplete(false);
    setLiveResult(null);
  }, []);

  const setAnalysisSuccess = useCallback(
    (analysisData: any) => {
      console.log('[useAnalysisState] Raw analysis data received:', analysisData);
      console.log('[useAnalysisState] Data structure:', {
        hasFace: !!analysisData?.face,
        hasVoice: !!analysisData?.voice,
        hasCredibility: !!analysisData?.credibility,
        keys: Object.keys(analysisData || {}),
      });

      const transformedData = transformAnalysisData(analysisData);

      console.log('[useAnalysisState] Transformation complete');
      console.log('[useAnalysisState] Transformed data:', transformedData);

      setLiveResult({
        timestamp: new Date().toISOString(),
        status: "complete",
        data: transformedData,
      });
      setProgress(100);
      setAnalysisComplete(true);
    },
    []
  );

  const setAnalysisError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setProgress(0);
  }, []);

  const startProgress = useCallback(() => {
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 20, 95));
    }, 500);
    return progressInterval;
  }, []);

  return {
    // State
    isAnalyzing,
    progress,
    error,
    analysisId,
    analysisComplete,
    liveResult,

    // State setters
    setIsAnalyzing,
    setProgress,
    setError,
    setAnalysisId,
    setAnalysisComplete,
    setLiveResult,

    // Helper methods
    handleRetry,
    clearError,
    resetState,
    setAnalysisSuccess,
    setAnalysisError,
    startProgress,
  };
}
