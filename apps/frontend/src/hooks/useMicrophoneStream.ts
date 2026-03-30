import { useState, useRef, useCallback, useEffect } from 'react';

interface StreamState {
  isConnected: boolean;
  isRecording: boolean;
  bufferedChunks: number;
  isAnalyzing: boolean;
  error: string | null;
  analysisResult: any | null;
  recordingTime: number;
  liveResult: any | null; // Real-time streaming result
}

interface WebSocketMessage {
  type: string;
  clientId?: string;
  chunkNumber?: number;
  bufferedChunks?: number;
  isProcessing?: boolean;
  result?: any;
  message?: string;
  details?: string;
  timestamp?: string;
}

export function useMicrophoneStream(wsUrl: string = 'ws://localhost:8080') {
  const [state, setState] = useState<StreamState>({
    isConnected: false,
    isRecording: false,
    bufferedChunks: 0,
    isAnalyzing: false,
    error: null,
    analysisResult: null,
    recordingTime: 0,
    liveResult: null,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    try {
      console.log('🔌 Connecting to microphone stream...');

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Store for later cleanup

      console.log(`✓ Microphone stream obtained (${stream.getAudioTracks().length} audio tracks)`);

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('✓ WebSocket connected');
        setState((prev) => ({ ...prev, isConnected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          console.log('📨 WebSocket message received (raw):', event.data.substring(0, 100));

          let message: WebSocketMessage;
          try {
            message = JSON.parse(event.data);
          } catch (parseErr) {
            console.error('❌ Failed to parse WebSocket message:', parseErr);
            console.error('   Raw data:', event.data);
            return;
          }

          console.log('📋 Parsed message type:', message.type);
          console.log('📊 Message data:', message);

          switch (message.type) {
            case 'connected':
              console.log('✓ Connected to server with clientId:', message.clientId);
              break;

            case 'chunk_received':
              console.log(`✓ Chunk received - buffer: ${message.bufferedChunks}/5`);
              setState((prev) => {
                console.log('  → Updating bufferedChunks:', message.bufferedChunks);
                return {
                  ...prev,
                  bufferedChunks: message.bufferedChunks || 0,
                };
              });
              break;

            // Handle live analysis updates during processing
            case 'live_analysis':
            case 'progress_update':
            case 'analysis_progress':
              console.log('📊 Live analysis update received:', message);
              console.log('   Update type:', message.type);
              console.log('   Partial result:', message.result);

              if (message.result) {
                // Transform partial result data
                const partialData = message.result;
                const partialTransformed = {
                  deceptionScore: partialData?.credibility?.lie_probability || 0,
                  credibilityScore: 100 - (partialData?.credibility?.lie_probability || 0),
                  confidence: (partialData?.credibility?.confidence || 0) / 100,
                  metrics: {
                    lie_probability: partialData?.credibility?.lie_probability,
                    credibility_confidence: partialData?.credibility?.confidence,
                    voice_stress: partialData?.voice?.stress?.stress_level,
                    voice_emotion: partialData?.voice?.emotion?.emotion,
                    transcription: partialData?.voice?.transcription?.transcript || '(Processing...)',
                  },
                  insights: [
                    partialData?.credibility?.analysis || 'Analyzing deception indicators',
                    `Voice emotion: ${partialData?.voice?.emotion?.emotion || 'Detecting...'}`,
                    `Stress level: ${partialData?.voice?.stress?.stress_level || 0}/100`,
                  ],
                };

                console.log('   Transformed partial data:', partialTransformed);

                setState((prev) => {
                  const newState = {
                    ...prev,
                    isAnalyzing: true,
                    liveResult: {
                      timestamp: message.timestamp || new Date().toISOString(),
                      status: 'processing' as const,
                      data: partialTransformed,
                    },
                  };
                  console.log('  → Updating state with live progress:', newState.liveResult);
                  return newState;
                });
              }
              break;

            case 'analysis_complete':
              console.log('✓ Analysis complete received');
              console.log('   Response data:', message.result);

              // Transform Flask response to expected format
              const flaskData = message.result;
              console.log('   Flask analysis object:', flaskData?.analysis);

              const transformedData = {
                deceptionScore: flaskData?.analysis?.credibility?.lie_probability || 0,
                credibilityScore: 100 - (flaskData?.analysis?.credibility?.lie_probability || 0),
                confidence: (flaskData?.analysis?.credibility?.confidence || 0) / 100,
                metrics: {
                  lie_probability: flaskData?.analysis?.credibility?.lie_probability,
                  credibility_confidence: flaskData?.analysis?.credibility?.confidence,
                  voice_stress: flaskData?.analysis?.voice?.stress?.stress_level,
                  voice_emotion: flaskData?.analysis?.voice?.emotion?.emotion,
                  transcription: flaskData?.analysis?.voice?.transcription?.transcript || '(Silent)',
                },
                insights: [
                  flaskData?.analysis?.credibility?.analysis || 'No deception indicators detected',
                  `Voice emotion: ${flaskData?.analysis?.voice?.emotion?.emotion || 'Unknown'}`,
                  `Stress level: ${flaskData?.analysis?.voice?.stress?.stress_level || 0}/100`,
                ],
              };

              console.log('   Transformed data:', transformedData);

              setState((prev) => {
                const newState = {
                  ...prev,
                  isAnalyzing: false,
                  analysisResult: message.result,
                  liveResult: {
                    timestamp: message.timestamp || new Date().toISOString(),
                    status: 'complete' as const,
                    data: transformedData,
                  },
                  bufferedChunks: 0,
                };
                console.log('  → Updating state with liveResult:', newState.liveResult);
                return newState;
              });
              break;

            case 'analysis_error':
              console.error('✗ Analysis error received:', message.details);
              setState((prev) => {
                console.log('  → Updating state with error:', message.details);
                return {
                  ...prev,
                  isAnalyzing: false,
                  error: message.details || message.message,
                  liveResult: {
                    timestamp: new Date().toISOString(),
                    status: 'error' as const,
                    error: message.details || message.message,
                  },
                };
              });
              break;

            case 'error':
              console.error('✗ WebSocket error message:', message.details);
              setState((prev) => ({
                ...prev,
                error: message.details || message.message,
              }));
              break;

            case 'status':
              console.log('📊 Status update:', message);
              setState((prev) => ({
                ...prev,
                bufferedChunks: message.bufferedChunks,
                isAnalyzing: message.isProcessing,
              }));
              break;

            default:
              console.warn('⚠️ Unknown WebSocket message type:', message.type, message);
          }
        } catch (err) {
          console.error('❌ Unexpected error in WebSocket onmessage handler:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('❌ WebSocket connection error:', event);
        console.error('   Error detail:', (event as any).message);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: 'WebSocket connection error',
        }));
      };

      ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isRecording: false,
        }));
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      };

      wsRef.current = ws;

      // Setup MediaRecorder for 2-second intervals
      mediaRecorderRef.current = new MediaRecorder(stream);

      let chunkCount = 0;
      mediaRecorderRef.current.ondataavailable = (event) => {
        chunkCount++;
        console.log(`📦 ondataavailable fired (chunk #${chunkCount}): ${event.data.size} bytes, WS state: ${ws.readyState}`);
        if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
          ws.send(event.data);
          console.log(`✓ Sent audio chunk to WebSocket: ${event.data.size} bytes`);
        } else if (event.data.size === 0) {
          console.warn('⚠ Empty audio chunk received');
        } else if (ws.readyState !== WebSocket.OPEN) {
          console.warn(`⚠ WebSocket not open (state: ${ws.readyState}), cannot send chunk`);
        }
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event.error);
      };

      return stream;
    } catch (err) {
      const error = err as Error;
      console.error('Connection error:', error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
      throw error;
    }
  }, [wsUrl]);

  // Start recording and streaming
  const startRecording = useCallback(async () => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      if (!mediaRecorderRef.current) {
        throw new Error('MediaRecorder not initialized');
      }

      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder API not supported in this browser');
      }

      console.log(`📹 Starting recording, MediaRecorder state: ${mediaRecorderRef.current.state}`);

      // Start recording with 2-second timeslice
      mediaRecorderRef.current.start(2000);

      console.log(`✓ Recording started with 2-second timeslice, state: ${mediaRecorderRef.current.state}`);

      setState((prev) => ({
        ...prev,
        isRecording: true,
        recordingTime: 0,
        error: null,
        analysisResult: null,
        liveResult: null,
      }));

      // Start recording time counter
      recordingTimerRef.current = window.setInterval(() => {
        setState((prev) => ({
          ...prev,
          recordingTime: prev.recordingTime + 1,
        }));
      }, 1000);

      console.log('✓ Recording started');
    } catch (err) {
      const error = err as Error;
      console.error('❌ Failed to start recording:', error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  // Stop recording
  const stopRecording = useCallback(() => {
    try {
      console.log('🛑 Stopping recording...');

      if (mediaRecorderRef.current) {
        // Stop MediaRecorder if recording
        if (mediaRecorderRef.current.state === 'recording') {
          console.log('  📹 Stopping MediaRecorder...');
          mediaRecorderRef.current.stop();
        }
      }

      // Stop ALL media tracks (audio + video)
      if (streamRef.current) {
        console.log('  🎙️ Stopping media stream tracks...');
        streamRef.current.getTracks().forEach((track) => {
          console.log(`    → Stopping ${track.kind} track (state: ${track.readyState})`);
          track.stop();
          console.log(`    ✓ ${track.kind.toUpperCase()} stopped`);
        });
      }

      // Stop recording state
      setState((prev) => ({
        ...prev,
        isRecording: false,
      }));

      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      console.log('✓ Recording fully stopped - microphone OFF');

      // After 2 seconds, send analyze command to process buffered chunks
      // This gives time for final ondataavailable events to complete
      setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          console.log('📊 Sending analyze_now command...');
          wsRef.current.send(
            JSON.stringify({
              type: 'analyze_now',
            })
          );
          console.log('✓ Auto-triggered analysis after recording stopped');
        } else {
          console.warn('⚠️ WebSocket not ready for analyze_now command');
        }
      }, 2000);
    } catch (err) {
      const error = err as Error;
      console.error('❌ Failed to stop recording:', error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  // Send analysis command
  const analyzeBuffer = useCallback(() => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      setState((prev) => ({
        ...prev,
        isAnalyzing: true,
        error: null,
      }));

      wsRef.current.send(
        JSON.stringify({
          type: 'analyze_now',
        })
      );

      console.log('Analysis requested');
    } catch (err) {
      const error = err as Error;
      console.error('Failed to request analysis:', error);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: error.message,
      }));
    }
  }, []);

  // Clear buffer
  const clearBuffer = useCallback(() => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'clear_buffer',
        })
      );

      setState((prev) => ({
        ...prev,
        bufferedChunks: 0,
        analysisResult: null,
        error: null,
      }));

      console.log('Buffer cleared');
    } catch (err) {
      const error = err as Error;
      console.error('Failed to clear buffer:', error);
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    }
  }, []);

  // Get status
  const getStatus = useCallback(() => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        throw new Error('WebSocket not connected');
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'status',
        })
      );
    } catch (err) {
      const error = err as Error;
      console.error('Failed to get status:', error);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    try {
      console.log('🔌 Disconnecting...');

      // Stop MediaRecorder if still recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        console.log('  📹 Stopping MediaRecorder...');
        mediaRecorderRef.current.stop();
      }

      // Clear recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      // Close WebSocket connection
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        console.log('  🌐 Closing WebSocket...');
        wsRef.current.close();
      }
      wsRef.current = null;

      // Stop ALL media tracks (critical for stopping camera/microphone)
      if (streamRef.current) {
        console.log('  🎙️ Stopping ALL media tracks...');
        streamRef.current.getTracks().forEach((track) => {
          if (track.readyState === 'live') {
            console.log(`    → Stopping ${track.kind} track`);
            track.stop();
            console.log(`    ✓ ${track.kind.toUpperCase()} stopped`);
          }
        });
        streamRef.current = null;
      }

      setState((prev) => ({
        ...prev,
        isConnected: false,
        isRecording: false,
      }));

      console.log('✓ Disconnected completely - all media stopped');
    } catch (err) {
      console.error('❌ Error during disconnect:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    startRecording,
    stopRecording,
    analyzeBuffer,
    clearBuffer,
    getStatus,
    disconnect,
  };
}
