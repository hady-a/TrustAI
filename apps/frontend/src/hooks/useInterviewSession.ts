import { useState, useCallback } from 'react';

/**
 * Hook for managing interview session state
 * Handles question navigation, answer storage, and session lifecycle
 */

interface InterviewResponse {
  questionIndex: number;
  questionText: string;
  answerText: string;
  answerVoice: boolean;
  audioBlob?: Blob;
  recordedAt: number;
  duration?: number;
}

interface LiveAnalysisResult {
  timestamp: string;
  status: 'processing' | 'complete' | 'error';
  data?: Record<string, any>;
  error?: string;
}

interface InterviewState {
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: InterviewResponse[];
  isRecording: boolean;
  cameraActive: boolean;
  micActive: boolean;
  micLevel: number;
  error: string | null;
  recordingTime: number;
  isAnalyzing: boolean;
  analysisResult: LiveAnalysisResult | null;
  permission: 'pending' | 'granted' | 'denied';
}

export function useInterviewSession(totalQuestions: number) {
  const [state, setState] = useState<InterviewState>({
    currentQuestionIndex: 0,
    totalQuestions,
    answers: [],
    isRecording: false,
    cameraActive: false,
    micActive: false,
    micLevel: 0,
    error: null,
    recordingTime: 0,
    isAnalyzing: false,
    analysisResult: null,
    permission: 'pending',
  });

  /**
   * Initialize camera/microphone permissions
   */
  const initializeCamera = useCallback(
    async (onStream: (stream: MediaStream) => void) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        setState((prev) => ({
          ...prev,
          cameraActive: true,
          micActive: true,
          permission: 'granted',
          error: null,
        }));

        onStream(stream);
      } catch (err) {
        const mediaError = err as DOMException;
        if (mediaError.name === 'NotAllowedError') {
          setState((prev) => ({
            ...prev,
            error: 'Camera and microphone permissions are required. Please grant them in your browser settings.',
            permission: 'denied',
          }));
        } else {
          setState((prev) => ({
            ...prev,
            error: `Device access error: ${mediaError.message}`,
          }));
        }
      }
    },
    []
  );

  /**
   * Update current question index
   */
  const goToQuestion = useCallback((index: number) => {
    if (index >= 0 && index < totalQuestions) {
      setState((prev) => ({
        ...prev,
        currentQuestionIndex: index,
      }));
    }
  }, [totalQuestions]);

  /**
   * Move to next question
   */
  const nextQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.min(prev.currentQuestionIndex + 1, totalQuestions - 1),
    }));
  }, [totalQuestions]);

  /**
   * Move to previous question
   */
  const previousQuestion = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(prev.currentQuestionIndex - 1, 0),
    }));
  }, []);

  /**
   * Check if we're at the last question
   */
  const isLastQuestion = useCallback(() => {
    return state.currentQuestionIndex === totalQuestions - 1;
  }, [state.currentQuestionIndex, totalQuestions]);

  /**
   * Check if we're at the first question
   */
  const isFirstQuestion = useCallback(() => {
    return state.currentQuestionIndex === 0;
  }, [state.currentQuestionIndex]);

  /**
   * Save answer for current question
   */
  const saveAnswer = useCallback(
    (questionText: string, answerText: string, answerVoice: boolean, audioBlob?: Blob) => {
      const response: InterviewResponse = {
        questionIndex: state.currentQuestionIndex,
        questionText,
        answerText,
        answerVoice,
        audioBlob,
        recordedAt: Date.now(),
      };

      setState((prev) => {
        const existingIndex = prev.answers.findIndex(
          (a) => a.questionIndex === state.currentQuestionIndex
        );

        let updatedAnswers = [...prev.answers];
        if (existingIndex >= 0) {
          updatedAnswers[existingIndex] = response;
        } else {
          updatedAnswers.push(response);
        }

        return {
          ...prev,
          answers: updatedAnswers,
        };
      });
    },
    [state.currentQuestionIndex]
  );

  /**
   * Get answer for current question (if exists)
   */
  const getCurrentAnswer = useCallback((): InterviewResponse | undefined => {
    return state.answers.find((a) => a.questionIndex === state.currentQuestionIndex);
  }, [state.answers, state.currentQuestionIndex]);

  /**
   * Check if current question has been answered
   */
  const isCurrentQuestionAnswered = useCallback((): boolean => {
    return state.answers.some((a) => a.questionIndex === state.currentQuestionIndex);
  }, [state.answers, state.currentQuestionIndex]);

  /**
   * Set recording state
   */
  const setRecording = useCallback((isRecording: boolean) => {
    setState((prev) => ({ ...prev, isRecording }));
  }, []);

  /**
   * Set analyzing state
   */
  const setAnalyzing = useCallback((isAnalyzing: boolean) => {
    setState((prev) => ({ ...prev, isAnalyzing }));
  }, []);

  /**
   * Set analysis result
   */
  const setAnalysisResult = useCallback((result: any) => {
    setState((prev) => ({
      ...prev,
      analysisResult: result,
    }));
  }, []);

  /**
   * Set error
   */
  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  /**
   * Reset session
   */
  const reset = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      totalQuestions,
      answers: [],
      isRecording: false,
      cameraActive: false,
      micActive: false,
      micLevel: 0,
      error: null,
      recordingTime: 0,
      isAnalyzing: false,
      analysisResult: null,
      permission: 'pending',
    });
  }, [totalQuestions]);

  return {
    state,
    initializeCamera,
    goToQuestion,
    nextQuestion,
    previousQuestion,
    isLastQuestion,
    isFirstQuestion,
    saveAnswer,
    getCurrentAnswer,
    isCurrentQuestionAnswered,
    setRecording,
    setAnalyzing,
    setAnalysisResult,
    setError,
    reset,
  };
}
