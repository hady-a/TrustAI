import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

/**
 * WebSocket Client for Live Audio Analysis
 * Connects to the WebSocket server and streams audio chunks
 */

const WS_URL = 'ws://localhost:8080';

class LiveAnalysisClient {
  constructor(url = WS_URL) {
    this.url = url;
    this.ws = null;
    this.isConnected = false;
    this.clientId = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          this.isConnected = true;
          console.log('[CLIENT] Connected to WebSocket server');
          resolve();
        });

        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            this.handleMessage(message);
          } catch (err) {
            console.error('[CLIENT] Failed to parse message:', err.message);
          }
        });

        this.ws.on('close', () => {
          this.isConnected = false;
          console.log('[CLIENT] Disconnected from server');
        });

        this.ws.on('error', (err) => {
          console.error('[CLIENT] WebSocket error:', err.message);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send audio chunk
   */
  sendAudioChunk(audioBuffer) {
    if (!this.isConnected) {
      console.error('[CLIENT] Not connected to server');
      return false;
    }

    try {
      this.ws.send(audioBuffer, (err) => {
        if (err) {
          console.error('[CLIENT] Failed to send audio chunk:', err.message);
        }
      });
      return true;
    } catch (err) {
      console.error('[CLIENT] Error sending audio chunk:', err);
      return false;
    }
  }

  /**
   * Send text command
   */
  sendCommand(command, data = {}) {
    if (!this.isConnected) {
      console.error('[CLIENT] Not connected to server');
      return false;
    }

    try {
      const message = { type: command, ...data };
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('[CLIENT] Error sending command:', err);
      return false;
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    console.log(`[SERVER] ${message.type}:`, message);

    switch (message.type) {
      case 'connected':
        this.clientId = message.clientId;
        console.log(`[CLIENT] Connection confirmed. Client ID: ${this.clientId}`);
        break;

      case 'chunk_received':
        console.log(`[SERVER] Chunk received (${message.chunkNumber}/${5})`);
        break;

      case 'analysis_complete':
        console.log('[SERVER] Analysis complete!');
        console.log(JSON.stringify(message.result, null, 2));
        break;

      case 'analysis_error':
        console.error('[SERVER] Analysis error:', message.details);
        break;

      case 'status':
        console.log('[SERVER] Status:', {
          bufferedChunks: message.bufferedChunks,
          isProcessing: message.isProcessing,
          connectedDuration: `${message.connectedDuration}s`,
        });
        break;

      case 'error':
        console.error('[SERVER] Error:', message.message, message.details);
        break;

      case 'info':
        console.log('[SERVER] Info:', message.message);
        break;

      default:
        console.log('[SERVER] Unhandled message type:', message.type);
    }
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}

// Example usage
async function exampleUsage() {
  const client = new LiveAnalysisClient();

  try {
    // Connect to server
    console.log('\n=== Connecting to WebSocket server ===');
    await client.connect();
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read sample audio file (if available)
    const audioPath = '/Users/hadyakram/Desktop/trustai/test.wav';
    if (fs.existsSync(audioPath)) {
      console.log('\n=== Sending audio chunks ===');
      const audioBuffer = fs.readFileSync(audioPath);
      const chunkSize = Math.ceil(audioBuffer.length / 5);

      // Send 5 chunks
      for (let i = 0; i < 5; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, audioBuffer.length);
        const chunk = audioBuffer.slice(start, end);

        console.log(`Sending chunk ${i + 1}/5 (${chunk.length} bytes)`);
        client.sendAudioChunk(chunk);

        // Wait between chunks
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Wait for analysis
      console.log('\n=== Waiting for analysis ===');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } else {
      console.log(`\nAudio file not found at ${audioPath}`);
      console.log('Creating dummy audio chunks for testing...\n');

      // Send dummy chunks for testing
      for (let i = 0; i < 5; i++) {
        const dummyChunk = Buffer.alloc(4096, i); // Create dummy chunk
        console.log(`Sending dummy chunk ${i + 1}/5`);
        client.sendAudioChunk(dummyChunk);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      console.log('\n=== Waiting for analysis ===');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Check status
    console.log('\n=== Checking status ===');
    client.sendCommand('status');
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Disconnect
    console.log('\n=== Disconnecting ===');
    client.disconnect();
  } catch (err) {
    console.error('Error in example:', err);
  }
}

// Run example if executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

module.exports = LiveAnalysisClient;
