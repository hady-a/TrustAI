import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, StopCircle, Play, AlertCircle, Download } from "lucide-react";

interface LiveCaptureProps {
  onAnalysisStart: (videoBlob: Blob, audioBlob: Blob) => Promise<void>;
  isAnalyzing: boolean;
  mode: string;
}

export default function LiveCapture({ onAnalysisStart, isAnalyzing, mode }: LiveCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [permission, setPermission] = useState<"pending" | "granted" | "denied">("pending");

  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Request camera and microphone permissions
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        // Store stream in ref for later cleanup and access
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraActive(true);
          setMicActive(true);
          setPermission("granted");

          // Setup audio visualization
          setupAudioVisualization(stream);
        }
      } catch (err) {
        const mediaError = err as DOMException;
        if (mediaError.name === "NotAllowedError") {
          setError("Camera and microphone permissions are required. Please grant them in your browser settings.");
          setPermission("denied");
        } else {
          setError(`Device access error: ${mediaError.message}`);
        }
      }
    };

    requestPermissions();

    // Cleanup on component unmount
    return () => {
      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop recording if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Clear video srcObject
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject = null;
      }

      // Stop all media tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clear timer if recording
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  // Setup audio visualization and frequency analysis
  const setupAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMicLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setMicLevel(average / 255); // Normalize to 0-1
        }
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
    } catch (err) {
      console.error("Audio visualization setup failed:", err);
    }
  };

  const startRecording = async () => {
    if (!videoRef.current?.srcObject || !streamRef.current) {
      setError("Camera stream not available");
      return;
    }

    try {
      videoChunksRef.current = [];
      audioChunksRef.current = [];
      recordingStartTimeRef.current = Date.now();

      const stream = streamRef.current;
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];

      if (!videoTrack || !audioTrack) {
        setError("Video or audio track not available");
        return;
      }

      // Create canvas stream for video recording
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const canvasStream = canvas.captureStream(30);
          const canvasVideoTrack = canvasStream.getVideoTracks()[0];

          // Combine canvas video with original audio
          const combinedStream = new MediaStream([canvasVideoTrack, audioTrack]);
          mediaRecorderRef.current = new MediaRecorder(combinedStream, {
            mimeType: "video/webm;codecs=vp9,opus",
          });

          mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              videoChunksRef.current.push(e.data);
            }
          };

          // Start recording
          mediaRecorderRef.current.start(100); // Collect data every 100ms
          setIsRecording(true);
          setRecordingTime(0);

          // Update recording time - store in ref for cleanup
          recordingTimerRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
          }, 1000);

          // Draw video frames to canvas
          const drawFrame = () => {
            if (videoRef.current && ctx && isRecording) {
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              animationFrameRef.current = requestAnimationFrame(drawFrame);
            }
          };
          drawFrame();
        }
      }
    } catch (err) {
      const recordError = err as Error;
      setError(`Recording failed: ${recordError.message}`);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.onstop = async () => {
          const videoBlob = new Blob(videoChunksRef.current, { type: "video/webm" });

          // For now, create a dummy audio blob (ideally would capture separate audio track)
          const audioBlob = new Blob(audioChunksRef.current.length > 0 ? audioChunksRef.current : [""], {
            type: "audio/wav",
          });

          setIsRecording(false);

          // Stop recording timer
          if (recordingTimerRef.current) {
            clearInterval(recordingTimerRef.current);
            recordingTimerRef.current = null;
          }

          // Stop animation frame
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }

          // Clear video srcObject
          if (videoRef.current?.srcObject) {
            videoRef.current.srcObject = null;
          }

          // Stop all media tracks from the stored stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
              track.stop();
            });
          }

          await onAnalysisStart(videoBlob, audioBlob);
          resolve();
        };

        mediaRecorderRef.current.stop();
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const downloadRecording = () => {
    if (videoChunksRef.current.length === 0) return;

    const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recording-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">Error</p>
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              {permission === "denied" && (
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-sm underline text-red-700 dark:text-red-400 hover:text-red-900"
                >
                  Retry after granting permissions
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Preview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl"
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Overlay for recording indicator */}
        {isRecording && (
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
            <span className="text-white font-semibold text-sm">{formatTime(recordingTime)}</span>
          </motion.div>
        )}

        {/* Microphone Level Indicator */}
        <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  height: micLevel > (i + 1) / 8 ? "24px" : "4px",
                }}
                transition={{ duration: 0.1 }}
                className="w-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full"
              />
            ))}
          </div>
          <p className="text-white text-xs font-semibold">Audio Level</p>
        </div>

        {/* Canvas for frame capture (hidden) */}
        <canvas ref={canvasRef} className="hidden" width={1280} height={720} />
      </motion.div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {!isRecording ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={!cameraActive || isAnalyzing}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Recording
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              disabled={isAnalyzing}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <StopCircle className="w-5 h-5" />
              Stop & Analyze
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={downloadRecording}
              className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Download
            </motion.button>
          </>
        )}
      </div>

      {/* Status Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Camera</p>
          </div>
          <p className={`text-sm font-bold ${cameraActive ? "text-cyan-600 dark:text-cyan-400" : "text-red-600"}`}>
            {cameraActive ? "Active" : "Inactive"}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Microphone</p>
          </div>
          <p className={`text-sm font-bold ${micActive ? "text-purple-600 dark:text-purple-400" : "text-red-600"}`}>
            {micActive ? "Active" : "Inactive"}
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Mode</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{mode}</p>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Duration</span>
          </div>
          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatTime(recordingTime)}</p>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <span className="font-semibold">💡 Tip:</span> Make sure your camera and microphone are working properly before starting recording. Keep good lighting and speak clearly for better analysis results.
        </p>
      </div>
    </div>
  );
}
