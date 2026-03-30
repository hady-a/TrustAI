import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Play, StopCircle, AlertCircle, ChevronLeft, ChevronRight, Trash2, Send } from 'lucide-react';
import LiveAnalysisDisplay from './LiveAnalysisDisplay';
import { useAnswerRecorder } from '../hooks/useAnswerRecorder';
import { useInterviewSession } from '../hooks/useInterviewSession';
import { getQuestionsForMode, getTotalQuestions } from '../utils/interviewQuestions';

interface InterviewResponse {
  questionIndex: number;
  questionText: string;
  answerText: string;
  answerVoice: boolean;
  audioBlob?: Blob;
  recordedAt: number;
  duration?: number;
}

interface InterviewLiveFormProps {
  onAnalysisStart: (videoBlob: Blob, audioBlob: Blob, answers: InterviewResponse[]) => Promise<void>;
  isAnalyzing: boolean;
  mode: string;
}

export default memo(function InterviewLiveForm({
  onAnalysisStart,
  isAnalyzing,
  mode,
}: InterviewLiveFormProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const questions = getQuestionsForMode(mode);
  const totalQuestions = getTotalQuestions(mode);

  const session = useInterviewSession(totalQuestions);
  const answerRecorder = useAnswerRecorder();

  const [textAnswer, setTextAnswer] = useState('');
  const [videoChunksRef] = useState<Blob[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);

  /**
   * Initialize camera and microphone permissions
   */
  useEffect(() => {
    if (!interviewStarted) return;

    const startCamera = () => {
      session.initializeCamera((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Start recording entire interview
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
              const canvasStream = canvas.captureStream(30);
              const canvasVideoTrack = canvasStream.getVideoTracks()[0];

              const combinedStream = new MediaStream([canvasVideoTrack, stream.getAudioTracks()[0]]);
              mediaRecorderRef.current = new MediaRecorder(combinedStream, {
                mimeType: 'video/webm;codecs=vp9,opus',
              });

              mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                  videoChunksRef.push(e.data);
                }
              };

              mediaRecorderRef.current.start(100);

              // Draw video frames to canvas
              const drawFrame = () => {
                if (videoRef.current && ctx && interviewStarted) {
                  ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                  requestAnimationFrame(drawFrame);
                }
              };
              drawFrame();
            }
          }
        }
      });
    };

    startCamera();

    return () => {
      // Cleanup media tracks and contexts
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [interviewStarted]);

  /**
   * Start interview
   */
  const handleStartInterview = useCallback(() => {
    setInterviewStarted(true);
  }, []);

  /**
   * Save text answer and move to next question
   */
  const handleSubmitTextAnswer = useCallback(() => {
    if (!textAnswer.trim()) {
      session.setError('Please enter an answer or use voice');
      return;
    }

    const currentQuestion = questions[session.state.currentQuestionIndex];
    session.saveAnswer(currentQuestion, textAnswer, false);

    // Clear input and move to next
    setTextAnswer('');
    if (!session.isLastQuestion()) {
      session.nextQuestion();
    }
  }, [textAnswer, session, questions]);

  /**
   * Start voice recording for answer
   */
  const handleStartVoiceRecording = useCallback(async () => {
    if (!videoRef.current?.srcObject) {
      session.setError('Camera stream not available');
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    const audioTrack = stream.getAudioTracks()[0];

    if (!audioTrack) {
      session.setError('Microphone not available');
      return;
    }

    // Create audio stream
    const audioOnlyStream = new MediaStream([audioTrack]);
    await answerRecorder.startRecording(audioOnlyStream);
  }, [answerRecorder, session]);

  /**
   * Stop voice recording and save answer
   */
  const handleStopVoiceRecording = useCallback(async () => {
    const audioBlob = await answerRecorder.stopRecording();

    if (audioBlob) {
      const currentQuestion = questions[session.state.currentQuestionIndex];
      // For voice: use transcribed text if available, otherwise "Voice Answer"
      const answerText = textAnswer.trim() || '(Voice Answer)';
      session.saveAnswer(currentQuestion, answerText, true, audioBlob);

      // Clear input and move to next
      setTextAnswer('');
      if (!session.isLastQuestion()) {
        session.nextQuestion();
      }
    }
  }, [textAnswer, answerRecorder, session, questions]);

  /**
   * Skip current question
   */
  const handleSkipQuestion = useCallback(() => {
    setTextAnswer('');
    if (!session.isLastQuestion()) {
      session.nextQuestion();
    }
  }, [session]);

  /**
   * Discard voice recording
   */
  const handleDiscardVoiceRecording = useCallback(() => {
    answerRecorder.discardRecording();
  }, [answerRecorder]);

  /**
   * Finish interview and start analysis
   */
  const handleFinishInterview = useCallback(async () => {
    if (session.state.answers.length === 0) {
      session.setError('Please submit at least one answer');
      return;
    }

    // Stop video recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop camera
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }

    // Create blobs
    const videoBlob = new Blob(videoChunksRef, { type: 'video/webm' });
    let audioBlob = new Blob([], { type: 'audio/wav' });

    // Try to get audio from recorded chunks
    if (session.state.answers.some((a) => a.audioBlob)) {
      // If any answer has audio, combine them
      const audioChunks = session.state.answers
        .filter((a) => a.audioBlob)
        .map((a) => a.audioBlob!);
      audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    }

    // Trigger analysis
    try {
      await onAnalysisStart(videoBlob, audioBlob, session.state.answers);
    } catch (err) {
      session.setError((err as Error).message || 'Analysis failed');
    }
  }, [session.state.answers, onAnalysisStart, session]);

  /**
   * Format time for display
   */
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[session.state.currentQuestionIndex];
  const currentAnswer = session.getCurrentAnswer();

  // Show start screen
  if (!interviewStarted) {
    return (
      <div className="w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-xl text-center"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Ready to Start?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You'll be asked {totalQuestions} questions. You can answer with text or voice for each question.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartInterview}
            className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
          >
            🎬 Start Interview
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {session.state.error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300">{session.state.error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Layout: Camera on Left, Questions on Right */}
      <div className="grid grid-cols-3 gap-6">
        {/* Camera Section (2/3 width) */}
        <div className="col-span-2 space-y-4">
          {/* Progress */}
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-semibold text-gray-600 dark:text-gray-400"
            >
              Question {session.state.currentQuestionIndex + 1} of {totalQuestions}
            </motion.div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              Answered: {session.state.answers.length / totalQuestions * 100 | 0}%
            </div>
          </div>

          {/* Camera Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl"
          >
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />

            {/* Recording Status */}
            {interviewStarted && (
              <motion.div
                animate={{ opacity: [0.5, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-red-600 rounded-full"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="w-3 h-3 bg-red-300 rounded-full"
                />
                <span className="text-white font-semibold text-sm">Recording</span>
              </motion.div>
            )}

            {/* Microphone Level Indicator */}
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
              <div className="flex gap-1">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: Math.max(answerRecorder.micLevel, 0) > (i + 1) / 8 ? '24px' : '4px',
                    }}
                    transition={{ duration: 0.1 }}
                    className="w-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full"
                  />
                ))}
              </div>
              <p className="text-white text-xs font-semibold">Audio</p>
            </div>

            {/* Hidden Canvas */}
            <canvas ref={canvasRef} className="hidden" width={1280} height={720} />
          </motion.div>
        </div>

        {/* Questions Section (1/3 width) */}
        <div className="col-span-1 space-y-4">
          {/* Question Display */}
          <motion.div
            key={`question-${session.state.currentQuestionIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg"
          >
            <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 mb-2">Q{session.state.currentQuestionIndex + 1}</p>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">{currentQuestion}</p>
          </motion.div>

          {/* Answer Section */}
          <div className="space-y-3">
            {/* Text Input */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">📝 Text Answer</label>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder="Type your answer here..."
                disabled={answerRecorder.isRecording}
                className="w-full h-24 p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed max-h-24"
              />
            </div>

            {/* Voice Recording */}
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 block">🎤 Voice Answer</label>
              <div className="space-y-2">
                {!answerRecorder.isRecording ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStartVoiceRecording}
                    disabled={isAnalyzing}
                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Mic className="w-4 h-4" />
                    Record Voice
                  </motion.button>
                ) : (
                  <div className="space-y-2">
                    <motion.div
                      animate={{ opacity: [0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center"
                    >
                      <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Recording... {formatTime(answerRecorder.recordingTime)}
                      </p>
                    </motion.div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStopVoiceRecording}
                        className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1"
                      >
                        <StopCircle className="w-4 h-4" />
                        Stop
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDiscardVoiceRecording}
                        className="flex-1 px-3 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Discard
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Answer Indicator */}
          {currentAnswer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-center"
            >
              <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                ✓ Answered ({currentAnswer.answerVoice ? '🎤' : '📝'})
              </p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmitTextAnswer}
              disabled={!textAnswer.trim() || answerRecorder.isRecording || isAnalyzing}
              className="w-full px-4 py-2 bg-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Text
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSkipQuestion}
              disabled={isAnalyzing}
              className="w-full px-4 py-2 bg-gray-500 text-white text-sm font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              ⏭️ Skip
            </motion.button>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={session.previousQuestion}
              disabled={session.isFirstQuestion() || isAnalyzing}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={session.nextQuestion}
              disabled={session.isLastQuestion() || isAnalyzing}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Finish Button */}
          {session.state.currentQuestionIndex === totalQuestions - 1 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleFinishInterview}
              disabled={session.state.answers.length === 0 || isAnalyzing}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isAnalyzing ? '⏳ Analyzing...' : '✓ Finish & Analyze'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
});
