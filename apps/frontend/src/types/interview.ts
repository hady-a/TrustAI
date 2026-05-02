/**
 * Interview & Business Analysis Types
 * Defines interfaces for interview sessions, responses, and state management
 */

export type AnalysisMode = 'INTERVIEW' | 'BUSINESS';

/**
 * Represents a single response to a question
 */
export interface InterviewResponse {
  questionIndex: number;
  questionText: string;
  answerText: string;        // User's typed response
  answerVoice: boolean;      // Whether voice was used
  audioBlob?: Blob;          // Audio recording if voice was used
  recordedAt: number;        // Timestamp
  duration?: number;         // Duration in ms
}

/**
 * Represents the entire interview session
 */
export interface InterviewSession {
  mode: AnalysisMode;
  videoBlob: Blob;           // Full interview recording
  audioBlob: Blob;           // Full audio stream
  responses: InterviewResponse[];
  totalQuestionsCount: number;
  startTime: number;
  endTime?: number;
}

/**
 * Live analysis result format
 */
export interface LiveAnalysisResult {
  timestamp: string;
  status: 'processing' | 'complete' | 'error';
  data?: {
    deceptionScore?: number;
    credibilityScore?: number;
    confidence?: number;
    metrics?: Record<string, number | string>;
    insights?: string[];
  };
  error?: string;
}

/**
 * Interview state management
 */
export interface InterviewState {
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

/**
 * Answer recorder state
 */
export interface AnswerRecorderState {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  micLevel: number;
}
