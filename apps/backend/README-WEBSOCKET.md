# WebSocket Live Analysis Server

A real-time WebSocket server for streaming audio to the TrustAI Flask API for live analysis and credibility assessment.

## Features

- **Real-time Audio Streaming**: Send audio in chunks via WebSocket
- **Automatic Batching**: Automatically processes when 5 chunks are buffered
- **Live Analysis**: Triggers Flask API analysis for face, voice, and credibility
- **Error Handling**: Comprehensive error handling and logging
- **Client Notifications**: Real-time updates to clients about processing status
- **Graceful Shutdown**: Safely closes all connections on shutdown

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ WebSocket Server (Port 8080)                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  On Client Connection:                                      │
│  └─ Create buffer & client context                          │
│                                                              │
│  On Audio Chunk Received:                                   │
│  ├─ Store chunk in buffer                                   │
│  ├─ Send acknowledgment to client                           │
│  └─ Check if buffer >= 5 chunks                             │
│       └─ If yes: Process Buffer                             │
│           ├─ Combine chunks into single Buffer              │
│           ├─ POST /analyze/business to Flask API            │
│           ├─ Send response to client                        │
│           └─ Clear buffer                                   │
│                                                              │
│  On Text Command:                                           │
│  ├─ analyze_now: Force analysis immediately                 │
│  ├─ clear_buffer: Discard buffered chunks                   │
│  └─ status: Get client status                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP POST
                              ▼
         ┌──────────────────────────────────────────┐
         │ Flask API (Port 8000)                    │
         │ POST /analyze/business                   │
         ├──────────────────────────────────────────┤
         │ Face Analysis + Voice Analysis +         │
         │ Lie Detection + Report Generation        │
         └──────────────────────────────────────────┘
```

## Installation

### Prerequisites
- Node.js >= 12.0
- Python Flask API running on `http://localhost:8000`

### Setup

```bash
cd /Users/hadyakram/Desktop/trustai/apps/backend

# Install dependencies
npm install ws axios form-data
```

Or use the startup script:
```bash
bash start-websocket-server.sh
```

## Usage

### Starting the Server

```bash
node websocket-server.js
```

Output:
```
[INFO] 2026-03-26T10:22:00.000Z - WebSocket server listening on port 8080
```

### Client Connection

```javascript
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Server message:', message);
});
```

### Sending Audio Chunks

```javascript
// Read audio file
const fs = require('fs');
const audioBuffer = fs.readFileSync('audio.wav');
const chunkSize = Math.ceil(audioBuffer.length / 5);

// Send 5 chunks (analysis triggers automatically)
for (let i = 0; i < 5; i++) {
  const chunk = audioBuffer.slice(i * chunkSize, (i + 1) * chunkSize);
  ws.send(chunk);
}
```

### Sending Commands

```javascript
// Force analysis immediately
ws.send(JSON.stringify({
  type: 'analyze_now'
}));

// Clear buffer
ws.send(JSON.stringify({
  type: 'clear_buffer'
}));

// Get status
ws.send(JSON.stringify({
  type: 'status'
}));
```

## Message Types

### Client → Server

**Binary Messages**: Audio chunks (automatically buffered)

**Text Messages** (JSON):
```json
{
  "type": "analyze_now|clear_buffer|status"
}
```

### Server → Client

**Status/Command Responses**:
```json
{
  "type": "chunk_received",
  "chunkNumber": 1,
  "bufferedChunks": 1
}
```

**Analysis Complete**:
```json
{
  "type": "analysis_complete",
  "timestamp": "2026-03-26T10:22:00.000Z",
  "analysisChunks": 5,
  "result": {
    "face_analysis": {...},
    "voice_analysis": {...},
    "lie_detection": {...},
    "report": {...}
  }
}
```

**Error**:
```json
{
  "type": "analysis_error",
  "message": "Failed to analyze audio",
  "details": "Connection refused"
}
```

**Status**:
```json
{
  "type": "status",
  "clientId": "client_1234567890_abc123",
  "bufferedChunks": 2,
  "isProcessing": false,
  "connectedDuration": 45
}
```

## Example Client

Run the example client:
```bash
node websocket-client-example.js
```

This will:
1. Connect to the WebSocket server
2. Read audio from `test.wav` or create dummy chunks
3. Send 5 audio chunks
4. Wait for analysis response
5. Disconnect

## Configuration

Edit `websocket-server.js` to modify:
- `WS_PORT`: WebSocket server port (default: 8080)
- `FLASK_API_URL`: Flask API endpoint (default: http://localhost:8000)
- `BUFFER_THRESHOLD`: Chunks to trigger analysis (default: 5)

## Logging

The server logs all events:
- Client connections/disconnections
- Audio chunk reception
- Buffer status
- Flask API calls
- Errors and warnings

Example log:
```
[INFO] 2026-03-26T10:22:00.000Z - Client connected: client_1234567890_abc123 (Total clients: 1)
[DEBUG] 2026-03-26T10:22:01.000Z - Received audio chunk. Buffer size: 1/5
[DEBUG] 2026-03-26T10:22:02.000Z - Received audio chunk. Buffer size: 2/5
...
[INFO] 2026-03-26T10:22:05.000Z - Processing buffer for client client_1234567890_abc123 (5 chunks)
[DEBUG] 2026-03-26T10:22:05.100Z - Combined audio size: 20480 bytes
[DEBUG] 2026-03-26T10:22:05.200Z - Calling Flask API at http://localhost:8000/analyze/business
[INFO] 2026-03-26T10:22:08.000Z - Received response from Flask API for client client_1234567890_abc123
```

## Error Handling

The server handles:
- **Connection errors**: Logged and client notified
- **Invalid messages**: Descriptive error response sent
- **Flask API failures**: Error sent to client, buffer preserved
- **Disconnections**: Cleanup client resources
- **Timeouts**: 30-second timeout on Flask API calls

## Performance Notes

- Each audio chunk is stored as a Buffer in memory
- Maximum concurrent connections: Limited by Node.js memory
- Typical memory per client: ~50KB (5 buffers of ~10KB each)
- Flask API call timeout: 30 seconds
- No message queue - processing happens sequentially per client

## Troubleshooting

### "Connection refused" error
- Ensure Flask API is running on port 8000
- Check Flask API logs for errors

### WebSocket connection fails
- Verify port 8080 is not in use: `lsof -i :8080`
- Check firewall settings

### Audio not being analyzed
- Check buffer size: Send status command to verify
- Ensure chunks are being received: Check logs for "Received audio chunk"

## Integration with Frontend

Example React integration:
```javascript
import { useEffect, useState } from 'react';

function LiveAnalysis() {
  const [ws, setWs] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8080');
    
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'analysis_complete') {
        setResults(message.result);
      }
    };

    setWs(socket);
    return () => socket.close();
  }, []);

  const sendAudio = (audioBuffer) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(audioBuffer);
    }
  };

  return (
    <div>
      {/* UI for audio streaming */}
      {results && <AnalysisResults data={results} />}
    </div>
  );
}
```

## Files

- `websocket-server.js`: Main server implementation
- `websocket-client-example.js`: Example client for testing
- `start-websocket-server.sh`: Startup script
- `README-WEBSOCKET.md`: This file

## License

Part of TrustAI project
