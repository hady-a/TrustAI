import { WebSocketServer } from 'ws';
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

// Configuration
const WS_PORT = 8080;
const FLASK_API_URL = 'http://localhost:8000';
const BUFFER_THRESHOLD = 5; // Trigger analysis when buffer reaches this many chunks

// WAV file configuration
const WAV_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BITS_PER_SAMPLE: 16,
};

/**
 * Create WAV file header
 * Constructs proper WAV file format with RIFF headers
 */
function createWavHeader(audioData) {
  const channels = WAV_CONFIG.CHANNELS;
  const sampleRate = WAV_CONFIG.SAMPLE_RATE;
  const bitsPerSample = WAV_CONFIG.BITS_PER_SAMPLE;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = audioData.length;
  const fileSize = 36 + dataSize;

  // Create header buffer
  const header = Buffer.alloc(44);

  // RIFF Chunk Descriptor
  header.write('RIFF', 0);
  header.writeUInt32LE(fileSize, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  header.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
  header.writeUInt16LE(channels, 22); // NumChannels
  header.writeUInt32LE(sampleRate, 24); // SampleRate
  header.writeUInt32LE(byteRate, 28); // ByteRate
  header.writeUInt16LE(blockAlign, 32); // BlockAlign
  header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40); // Subchunk2Size

  return header;
}

/**
 * Combine audio chunks into a single WAV buffer
 */
function combineChunksToWav(chunks) {
  if (!chunks || chunks.length === 0) {
    return null;
  }

  try {
    // Concatenate all audio data
    const audioData = Buffer.concat(chunks);
    
    // Create WAV header
    const wavHeader = createWavHeader(audioData);
    
    // Combine header + audio data
    const wavBuffer = Buffer.concat([wavHeader, audioData]);
    
    logger.debug(`Created WAV buffer: header=${wavHeader.length}B, audio=${audioData.length}B, total=${wavBuffer.length}B`);
    
    return wavBuffer;
  } catch (err) {
    logger.error('Failed to combine chunks into WAV buffer:', err);
    return null;
  }
}

// Logger utility
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, err?.message || ''),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`),
  debug: (msg) => console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`),
};

// Store active clients with their buffers
const clients = new Map();

// WebSocket Server
const wss = new WebSocketServer({ port: WS_PORT });

logger.info(`WebSocket server listening on port ${WS_PORT}`);

wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientData = {
    id: clientId,
    audioBuffer: [],
    isProcessing: false,
    connectedAt: new Date(),
  };

  clients.set(ws, clientData);
  logger.info(`Client connected: ${clientId} (Total clients: ${clients.size})`);

  // Send welcome message
  sendToClient(ws, {
    type: 'connected',
    message: 'Connected to live analysis server',
    clientId: clientId,
  });

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      // Check if it's binary audio chunk
      if (Buffer.isBuffer(data)) {
        await handleAudioChunk(ws, data);
      } else {
        // Handle text commands
        const message = JSON.parse(data.toString());
        handleTextMessage(ws, message);
      }
    } catch (err) {
      logger.error(`Error processing message from ${clientId}:`, err);
      sendToClient(ws, {
        type: 'error',
        message: 'Failed to process message',
        details: err.message,
      });
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    const data = clients.get(ws);
    if (data) {
      logger.info(`Client disconnected: ${data.id} (Total clients: ${clients.size - 1})`);
      clients.delete(ws);
    }
  });

  // Handle errors
  ws.on('error', (err) => {
    const data = clients.get(ws);
    const clientId = data ? data.id : 'unknown';
    logger.error(`WebSocket error for ${clientId}:`, err);
  });
});

/**
 * Handle incoming audio chunk
 */
async function handleAudioChunk(ws, chunkData) {
  const clientData = clients.get(ws);

  if (!clientData) {
    logger.warn('Received audio chunk from disconnected client');
    return;
  }

  // Store chunk in buffer
  clientData.audioBuffer.push(chunkData);
  logger.debug(`Received audio chunk. Buffer size: ${clientData.audioBuffer.length}/${BUFFER_THRESHOLD}`);

  // Send acknowledgment
  sendToClient(ws, {
    type: 'chunk_received',
    chunkNumber: clientData.audioBuffer.length,
    bufferedChunks: clientData.audioBuffer.length,
  });

  // Check if buffer reached threshold
  if (clientData.audioBuffer.length >= BUFFER_THRESHOLD) {
    await processAudioBuffer(ws);
  }
}

/**
 * Handle text commands
 */
function handleTextMessage(ws, message) {
  const clientData = clients.get(ws);

  if (!clientData) {
    logger.warn('Received text message from disconnected client');
    return;
  }

  logger.debug(`Received command from ${clientData.id}: ${message.type}`);

  switch (message.type) {
    case 'analyze_now':
      // Force analysis even if buffer not full
      if (clientData.audioBuffer.length > 0) {
        processAudioBuffer(ws);
      } else {
        sendToClient(ws, {
          type: 'info',
          message: 'No audio chunks in buffer to analyze',
        });
      }
      break;

    case 'clear_buffer':
      clientData.audioBuffer = [];
      sendToClient(ws, {
        type: 'info',
        message: 'Buffer cleared',
      });
      break;

    case 'status':
      sendToClient(ws, {
        type: 'status',
        clientId: clientData.id,
        bufferedChunks: clientData.audioBuffer.length,
        isProcessing: clientData.isProcessing,
        connectedDuration: Math.round((Date.now() - clientData.connectedAt.getTime()) / 1000),
      });
      break;

    default:
      sendToClient(ws, {
        type: 'error',
        message: `Unknown command: ${message.type}`,
      });
  }
}

/**
 * Process audio buffer and send to Flask API
 */
async function processAudioBuffer(ws) {
  const clientData = clients.get(ws);

  if (!clientData) {
    logger.warn('Client disconnected before processing buffer');
    return;
  }

  if (clientData.isProcessing) {
    logger.warn(`Client ${clientData.id} already processing, skipping`);
    return;
  }

  clientData.isProcessing = true;
  logger.info(`Processing buffer for client ${clientData.id} (${clientData.audioBuffer.length} chunks)`);

  try {
    // Combine chunks into WAV format
    const wavBuffer = combineChunksToWav(clientData.audioBuffer);
    
    if (!wavBuffer) {
      throw new Error('Failed to create WAV buffer from audio chunks');
    }

    // Log WAV file info
    logger.debug(`WAV buffer info:`);
    logger.debug(`  - Format: PCM, ${WAV_CONFIG.CHANNELS}ch, ${WAV_CONFIG.SAMPLE_RATE}Hz, ${WAV_CONFIG.BITS_PER_SAMPLE}bit`);
    logger.debug(`  - Chunks: ${clientData.audioBuffer.length}`);
    logger.debug(`  - Total size: ${wavBuffer.length} bytes`);

    // Create FormData with audio
    const formData = new FormData();
    
    // Add audio file as WAV
    const audioStream = Readable.from([wavBuffer]);
    formData.append('audio', audioStream, 'analysis.wav');
    
    // Add metadata
    formData.append('text', `Live WebSocket analysis - ${clientData.audioBuffer.length} chunks combined`);

    // Call Flask API
    logger.debug(`Calling Flask API at ${FLASK_API_URL}/analyze/business`);
    
    const response = await axios.post(
      `${FLASK_API_URL}/analyze/business`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000, // 30 second timeout
      }
    );

    logger.info(`Received response from Flask API for client ${clientData.id}`);

    // Send response to client
    sendToClient(ws, {
      type: 'analysis_complete',
      timestamp: new Date().toISOString(),
      analysisChunks: clientData.audioBuffer.length,
      wavBufferSize: wavBuffer.length,
      result: response.data,
    });

    // Clear buffer after successful analysis
    clientData.audioBuffer = [];
    logger.debug(`Buffer cleared for client ${clientData.id}`);
  } catch (err) {
    logger.error(`Failed to process audio buffer for client ${clientData.id}:`, err);

    // Send error to client
    sendToClient(ws, {
      type: 'analysis_error',
      message: 'Failed to analyze audio',
      details: err.response?.data?.message || err.message,
    });
  } finally {
    clientData.isProcessing = false;
  }
}

/**
 * Send message to client
 */
function sendToClient(ws, message) {
  if (ws.readyState === 1) { // WebSocketServer.OPEN = 1
    try {
      ws.send(JSON.stringify(message));
      logger.debug(`Sent message to client: ${message.type}`);
    } catch (err) {
      logger.error('Failed to send message to client:', err);
    }
  } else {
    logger.warn('Cannot send message - client connection not open');
  }
}

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Handle server errors
 */
wss.on('error', (err) => {
  logger.error('WebSocket server error:', err);
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', () => {
  logger.info('Shutting down WebSocket server...');
  
  // Close all client connections
  clients.forEach((clientData, ws) => {
    sendToClient(ws, {
      type: 'server_shutdown',
      message: 'Server is shutting down',
    });
    ws.close();
  });

  // Close server
  wss.close(() => {
    logger.info('WebSocket server closed');
    process.exit(0);
  });

  // Force exit after 5 seconds
  setTimeout(() => {
    logger.error('Forced shutdown timeout reached');
    process.exit(1);
  }, 5000);
});

// Export for testing
export { wss, clients, logger };
