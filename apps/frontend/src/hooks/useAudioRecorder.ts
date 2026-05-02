import { useCallback, useRef, useState } from 'react';

interface AudioRecorderOptions {
  chunkDurationMs?: number;
  onChunkReady?: (blob: Blob) => Promise<void>;
  onError?: (error: Error) => void;
}

export interface AudioRecorderControls {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
  error: Error | null;
  isProcessing: boolean;
}

/**
 * Custom hook for live audio recording with automatic chunk sending
 * Handles MediaStream cleanup and memory management
 */
export function useAudioRecorder({
  chunkDurationMs = 2500,
  onChunkReady,
  onError,
}: AudioRecorderOptions = {}): AudioRecorderControls {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timesliceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const isStoppingRef = useRef(false);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setIsProcessing(true);

      // Reset abort controller for new session
      abortControllerRef.current = new AbortController();
      chunksRef.current = [];

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;

      // Create MediaRecorder with audio/webm codec for better compression
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      // Handle individual chunks
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Handle errors
      mediaRecorder.onerror = (event: Event) => {
        const errorEvent = event as any;
        const error = new Error(`MediaRecorder error: ${errorEvent.error || 'Unknown error'}`);
        setError(error);
        onError?.(error);
        stopRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Request timeslices every chunk duration to trigger ondataavailable
      if (timesliceIntervalRef.current) {
        clearInterval(timesliceIntervalRef.current);
      }

      timesliceIntervalRef.current = setInterval(() => {
        if (
          mediaRecorderRef.current &&
          mediaRecorderRef.current.state === 'recording'
        ) {
          mediaRecorderRef.current.requestData();

          // Send accumulated chunks to backend
          if (chunksRef.current.length > 0 && !abortControllerRef.current.signal.aborted) {
            (async () => {
              try {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await onChunkReady?.(blob);
                chunksRef.current = [];
              } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                setError(error);
                onError?.(error);
              }
            })();
          }
        }
      }, chunkDurationMs);

      setIsProcessing(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setIsRecording(false);
      onError?.(error);
      setIsProcessing(false);

      // Cleanup on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [chunkDurationMs, onChunkReady, onError]);

  const stopRecording = useCallback(async () => {
    if (isStoppingRef.current) {
      return;
    }

    try {
      isStoppingRef.current = true;
      setIsProcessing(true);
      abortControllerRef.current.abort();

      // Stop the interval
      if (timesliceIntervalRef.current) {
        clearInterval(timesliceIntervalRef.current);
        timesliceIntervalRef.current = null;
      }

      const recorder = mediaRecorderRef.current;

      if (recorder && recorder.state !== 'inactive') {
        // Request final data before stopping
        try {
          recorder.requestData();
        } catch {
          // Recorder can become inactive between checks; continue graceful shutdown.
        }

        // Send any remaining chunks
        if (chunksRef.current.length > 0) {
          try {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            await onChunkReady?.(blob);
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            onError?.(error);
          }
          chunksRef.current = [];
        }

        // Stop recording
        await new Promise<void>((resolve) => {
          const handleStop = () => {
            recorder.removeEventListener('stop', handleStop);
            resolve();
          };

          recorder.addEventListener('stop', handleStop);

          try {
            recorder.stop();
          } catch {
            recorder.removeEventListener('stop', handleStop);
            resolve();
          }
        });

        if (mediaRecorderRef.current === recorder) {
          mediaRecorderRef.current = null;
        }
      }

      // Stop all audio tracks and close the stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
          track.onmute = null;
          track.onended = null;
        });
        mediaStreamRef.current = null;
      }

      setIsRecording(false);
      setIsProcessing(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
      setIsRecording(false);
      setIsProcessing(false);

      // Force cleanup even on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        mediaStreamRef.current = null;
      }
    } finally {
      isStoppingRef.current = false;
    }
  }, [onChunkReady, onError]);

  return {
    startRecording,
    stopRecording,
    isRecording,
    error,
    isProcessing,
  };
}
