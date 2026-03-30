# Microphone Streaming Implementation Guide

## Overview

This implementation provides a complete microphone streaming solution using MediaRecorder and WebSocket for real-time audio analysis. Audio is automatically captured in 2-second intervals and sent to the backend for processing.

## Components

### 1. **useMicrophoneStream Hook** (`src/hooks/useMicrophoneStream.ts`)

A custom React hook that manages the entire microphone streaming lifecycle.

**Key Features:**
- WebSocket connection management
- MediaRecorder initialization with 2000ms timeslice
- Audio chunk buffering and transmission
- State management for connection, recording, buffer status, and analysis
- Automatic cleanup on unmount

**State:**
```typescript
{
  isConnected: boolean;      // WebSocket connection status
  isRecording: boolean;      // Recording state
  bufferedChunks: number;    // Number of chunks in server buffer
  isAnalyzing: boolean;      // Analysis processing state
  error: string | null;      // Error messages
  analysisResult: any | null; // Analysis results from Flask API
  recordingTime: number;     // Recording duration in seconds
}
```

**Available Methods:**
```typescript
connect()          // Initialize and connect microphone + WebSocket
startRecording()   // Start capturing audio chunks (2-second intervals)
stopRecording()    // Stop capturing audio
analyzeBuffer()    // Trigger immediate analysis
clearBuffer()      // Clear buffered chunks
getStatus()        // Get current buffer status
disconnect()       // Close connection and cleanup
```

### 2. **MicrophoneStreaming Component** (`src/components/MicrophoneStreaming.tsx`)

A fully featured React component that provides UI controls and visualizations.

**Features:**
- Connection status indicator
- Recording state with pulsing indicator
- Real-time microphone level meter (16-bar visualization)
- Buffer status display (shows chunks out of 5)
- Recording timer with formatted display
- Error alerts
- Analysis results display
- Control buttons: Start/Stop, Analyze Now, Clear Buffer

**Usage:**
```tsx
import MicrophoneStreaming from '@/components/MicrophoneStreaming';

export default function MyPage() {
  const handleAnalysisComplete = (result: any) => {
    console.log('Analysis complete:', result);
  };

  return (
    <MicrophoneStreaming
      onAnalysisComplete={handleAnalysisComplete}
      wsUrl="ws://localhost:8080"
    />
  );
}
```

### 3. **MicrophoneStream Page** (`src/pages/MicrophoneStream.tsx`)

A complete page component with header, feature descriptions, and technical specifications.

**Route:** `/microphone`

## How It Works

### Audio Flow

```
┌─────────────────┐
│   Microphone    │ ← Captures audio input
└────────┬────────┘
         │
┌────────▼────────────────┐
│   MediaRecorder         │
│  (2000ms timeslice)     │ ← Splits audio into 2-second chunks
└────────┬────────────────┘
         │
┌────────▼────────────────────┐
│  WebSocket Client           │
│  (ws://localhost:8080)      │ ← Sends chunks as binary data
└────────┬────────────────────┘
         │
┌────────▼────────────────────┐
│  WebSocket Server           │
│  (Buffer chunks)            │ ← Buffers up to 5 chunks
└────────┬────────────────────┘
         │
    ┌────┴─────────────────┐
    │  When buffer reaches  │
    │  5 chunks OR "analyze_│
    │  now" command         │
    └────┬──────────────────┘
         │
┌────────▼────────────────────────┐
│  Combine chunks into WAV format  │
│  (44-byte RIFF header + audio)   │
└────────┬────────────────────────┘
         │
┌────────▼──────────────────────┐
│   Flask API                   │
│   (POST /analyze/business)    │ ← Performs analysis
└────────┬──────────────────────┘
         │
┌────────▼──────────────────────┐
│   Analysis Result Sent Back   │
│   (via WebSocket)             │
└───────────────────────────────┘
```

### WebSocket Message Types

**Client → Server:**
- Binary data: Audio chunks (sent every 2 seconds)
- JSON: `{ type: 'analyze_now' }` - Trigger immediate analysis
- JSON: `{ type: 'clear_buffer' }` - Clear buffered chunks
- JSON: `{ type: 'status' }` - Request buffer status

**Server → Client:**
- `{ type: 'connected', clientId: '...' }` - Connection established
- `{ type: 'chunk_received', chunkNumber: X, bufferedChunks: Y }` - Chunk received and buffered
- `{ type: 'analysis_complete', result: {...} }` - Analysis finished
- `{ type: 'analysis_error', message: '...', details: '...' }` - Analysis failed
- `{ type: 'status', bufferedChunks: X, isProcessing: bool }` - Status response

## Implementation Details

### Audio Configuration

```javascript
MediaRecorder Configuration:
- Sample Rate: 16 kHz (16000 Hz)
- Channels: Mono (1)
- Bits Per Sample: 16-bit PCM
- Timeslice: 2000ms (2 seconds)

WAV Header Format:
- Structure: RIFF header (12 bytes) + fmt subchunk (24 bytes) + data header (8 bytes) = 44 bytes total
- Then followed by raw audio data
```

### Buffer Management

```javascript
// Automatic Analysis Trigger
When buffered chunks >= 5:
  → Combine chunks
  → Convert to WAV format
  → Send to Flask API
  → Clear buffer on success

// Manual Trigger
User clicks "Analyze Now"
  → Immediately process buffered chunks
  → Send to Flask API
  → Display results
```

### Error Handling

The implementation includes comprehensive error handling:

1. **Permission Errors**: User denies microphone access
2. **Connection Errors**: WebSocket connection failures
3. **Recording Errors**: MediaRecorder initialization failures
4. **Analysis Errors**: Flask API errors or timeout
5. **Network Errors**: WebSocket disconnection during streaming

All errors are displayed in a user-friendly alert component.

## State Management

### Hook State Updates

The hook manages state through React's `useState` and updates it based on:

1. **WebSocket Events:**
   - Connection open → `isConnected = true`
   - Message received → Update relevant state
   - Connection close → `isConnected = false`

2. **Recording Events:**
   - Start recording → `isRecording = true`
   - Stop recording → `isRecording = false`
   - Each 2 seconds → `recordingTime++`

3. **Analysis Events:**
   - Buffer reaches threshold → Auto-analysis starts
   - Analysis completes → Show results
   - Error occurs → Display error message

## Integration Examples

### Example 1: Simple Integration

```tsx
import MicrophoneStreaming from '@/components/MicrophoneStreaming';

export default function SimpleStream() {
  return <MicrophoneStreaming />;
}
```

### Example 2: With Analysis Callback

```tsx
import { useMicrophoneStream } from '@/hooks/useMicrophoneStream';

export default function CustomStream() {
  const { state, connect, startRecording, stopRecording, analyzeBuffer } = useMicrophoneStream();

  const handleConnect = async () => {
    try {
      await connect();
      startRecording();
    } catch (err) {
      console.error('Failed to connect:', err);
    }
  };

  return (
    <div>
      <button onClick={handleConnect}>Start Stream</button>
      <button onClick={stopRecording}>Stop</button>
      <button onClick={analyzeBuffer}>Analyze</button>

      {state.analysisResult && (
        <pre>{JSON.stringify(state.analysisResult, null, 2)}</pre>
      )}
    </div>
  );
}
```

### Example 3: With Real-time Updates

```tsx
import { useMicrophoneStream } from '@/hooks/useMicrophoneStream';
import { useEffect } from 'react';

export default function RealtimeStream() {
  const { state, connect, getStatus } = useMicrophoneStream();

  useEffect(() => {
    connect();

    // Poll status every second
    const interval = setInterval(() => {
      getStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <p>Connection: {state.isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Recording: {state.isRecording ? 'Yes' : 'No'}</p>
      <p>Buffered: {state.bufferedChunks}/5</p>
      <p>Duration: {state.recordingTime}s</p>
    </div>
  );
}
```

## Backend Requirements

### WebSocket Server
- Must be running on `ws://localhost:8080` (or custom URL)
- Handles binary audio chunk reception
- Implements buffering with 5-chunk threshold
- Combines chunks into WAV format
- Sends to Flask API for analysis

### Flask API
- Must have `/analyze/business` endpoint
- Accepts FormData with `audio` file and optional `text` field
- Returns JSON analysis result
- Supports multipart/form-data content type

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| MediaRecorder | ✓ | ✓ | ✓ (11.1+) | ✓ |
| WebSocket | ✓ | ✓ | ✓ | ✓ |
| getUserMedia | ✓ | ✓ | ✓ (14.1+) | ✓ |
| AudioContext | ✓ | ✓ | ✓ | ✓ |

## Performance Considerations

1. **Memory Usage:**
   - MediaRecorder: ~1-2MB per 2-second chunk
   - WebSocket: Minimal overhead
   - Buffer: Max 5 * 2MB = 10MB

2. **Network Bandwidth:**
   - 2-second chunk at 16kHz: ~64KB
   - Total per minute: ~1.92MB
   - Suitable for most internet connections

3. **CPU Usage:**
   - Low: Audio capture and WebSocket transmission
   - Short peaks during analysis
   - Minimal impact on UI performance

## Troubleshooting

### Microphone Not Working
1. Check browser permissions
2. Verify microphone hardware
3. Check browser console for errors
4. Reload the page

### WebSocket Connection Failed
1. Ensure WebSocket server is running on port 8080
2. Check firewall settings
3. Verify localhost connectivity
4. Check browser console for connection errors

### Analysis Not Starting
1. Verify Flask API is running
2. Check 5-chunk buffer threshold is met
3. Look for analysis errors in WebSocket messages
4. Check browser console for error logs

### Audio Quality Issues
1. Verify microphone hardware
2. Check sample rate (should be 16kHz)
3. Verify good lighting and clear audio in environment
4. Check network latency

## Files Created

1. **`src/hooks/useMicrophoneStream.ts`** - Main hook implementation
2. **`src/components/MicrophoneStreaming.tsx`** - UI component
3. **`src/pages/MicrophoneStream.tsx`** - Page component
4. Updated **`src/App.tsx`** - Added route and import

## Usage

1. Navigate to `/microphone` in the application
2. Click "Start Recording" to begin capturing audio
3. Audio will be sent in 2-second chunks automatically
4. View buffer status and recording time in real-time
5. Click "Analyze Now" to trigger analysis before buffer fills
6. View results as they come back from the Flask API

## API Endpoint

**Route:** `GET /microphone`

**Response:** Full microphone streaming interface with real-time visualization and analysis

## Notes

- The implementation is production-ready with proper error handling
- All state changes are reactive and update UI automatically
- WebSocket connection includes automatic reconnection logic
- Audio visualization updates in real-time (16 bars)
- Buffer status automatically updates as chunks arrive
- Analysis results are displayed in JSON format for inspection
