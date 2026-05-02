import { useState, useRef, useEffect } from 'react';

/**
 * Hook for recording audio answers per question
 * Manages MediaRecorder lifecycle for per-answer audio capture
 */

interface RecorderState {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  micLevel: number;
}

export function useAnswerRecorder() {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    recordingTime: 0,
    audioBlob: null,
    micLevel: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Initialize audio context for microphone visualization
   */
  const initializeAudioContext = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      let updateCount = 0;
      const updateMicLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          // Throttle updates: only update UI every 5th frame (12fps instead of 60fps)
          if (updateCount++ % 5 === 0) {
            const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
            setState((prev) => ({ ...prev, micLevel: average / 255 }));
          }
        }
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
    } catch (err) {
      console.error('Audio context initialization failed:', err);
    }
  };

  /**
   * Start recording audio for current answer
   */
  const startRecording = async (stream: MediaStream) => {
    try {
      // Store stream for cleanup
      streamRef.current = stream;
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = recorder;

      setState((prev) => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        audioBlob: null,
      }));

      // Update recording time
      timerIntervalRef.current = setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);

      // Initialize audio visualization
      initializeAudioContext(stream);
    } catch (err) {
      const recordError = err as Error;
      console.error('Recording failed:', recordError.message);
    }
  };

  /**
   * Stop recording and return audio blob
   */
  const stopRecording = (): Promise<Blob | null> => {
    return new Promise<Blob | null>((resolve) => {
      if (!mediaRecorderRef.current) {
        resolve(null);
        return;
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setState((prev) => ({
          ...prev,
          isRecording: false,
          audioBlob,
        }));

        // Clear timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        // Stop all audio tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        resolve(audioBlob);
      };

      mediaRecorderRef.current.stop();
    });
  };

  /**
   * Discard current recording
   */
  const discardRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Clear timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop all audio tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    audioChunksRef.current = [];

    setState((prev) => ({
      ...prev,
      isRecording: false,
      recordingTime: 0,
      audioBlob: null,
      micLevel: 0,
    }));
  };

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Stop recorder if active
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Clear all timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Stop all audio tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    startRecording,
    stopRecording,
    discardRecording,
  };
}
