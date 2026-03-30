/**
 * WAV File Utility Module
 * Handles WAV file creation, parsing, and manipulation
 */

/**
 * WAV File Configuration
 */
const WAV_CONFIG = {
  SAMPLE_RATE: 16000,      // Hz
  CHANNELS: 1,              // Mono
  BITS_PER_SAMPLE: 16,      // 16-bit PCM
};

/**
 * Create WAV file header
 * 
 * WAV file structure:
 * - RIFF header (12 bytes)
 * - fmt chunk (includes subchunk size, format, channels, sample rate, etc.)
 * - data chunk (audio samples)
 * 
 * @param {Buffer} audioData - Raw audio data (PCM samples)
 * @returns {Buffer} Complete WAV header (44 bytes)
 */
function createWavHeader(audioData) {
  const channels = WAV_CONFIG.CHANNELS;
  const sampleRate = WAV_CONFIG.SAMPLE_RATE;
  const bitsPerSample = WAV_CONFIG.BITS_PER_SAMPLE;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = audioData.length;
  const fileSize = 36 + dataSize;

  // Create header buffer (44 bytes for standard WAV)
  const header = Buffer.alloc(44);

  // RIFF Chunk Descriptor (12 bytes)
  // This identifies the file as WAV and contains the file size
  header.write('RIFF', 0);                    // ChunkID (4 bytes)
  header.writeUInt32LE(fileSize, 4);          // ChunkSize (4 bytes) = 36 + data size
  header.write('WAVE', 8);                    // Format (4 bytes)

  // fmt sub-chunk (24 bytes)
  // Describes audio format
  header.write('fmt ', 12);                   // Subchunk1ID (4 bytes)
  header.writeUInt32LE(16, 16);               // Subchunk1Size (4 bytes) = 16 for PCM
  header.writeUInt16LE(1, 20);                // AudioFormat (2 bytes) = 1 for PCM
  header.writeUInt16LE(channels, 22);         // NumChannels (2 bytes)
  header.writeUInt32LE(sampleRate, 24);       // SampleRate (4 bytes)
  header.writeUInt32LE(byteRate, 28);         // ByteRate (4 bytes)
  header.writeUInt16LE(blockAlign, 32);       // BlockAlign (2 bytes)
  header.writeUInt16LE(bitsPerSample, 34);    // BitsPerSample (2 bytes)

  // data sub-chunk (8 + data size)
  // Contains the actual audio samples
  header.write('data', 36);                   // Subchunk2ID (4 bytes)
  header.writeUInt32LE(dataSize, 40);         // Subchunk2Size (4 bytes) = audio data size

  return header;
}

/**
 * Combine multiple audio chunks into a single WAV buffer
 * 
 * Process:
 * 1. Concatenate all audio data chunks
 * 2. Create WAV header with proper metadata
 * 3. Combine header + audio data
 * 
 * @param {Buffer[]} chunks - Array of audio data chunks
 * @returns {Buffer|null} Complete WAV buffer or null if error
 * 
 * @example
 * const chunks = [buffer1, buffer2, buffer3];
 * const wavBuffer = combineChunksToWav(chunks);
 * // wavBuffer is a valid .wav file ready to send to Flask
 */
function combineChunksToWav(chunks) {
  if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
    return null;
  }

  try {
    // Concatenate all audio data
    const audioData = Buffer.concat(chunks);
    
    // Create WAV header
    const wavHeader = createWavHeader(audioData);
    
    // Combine header + audio data
    const wavBuffer = Buffer.concat([wavHeader, audioData]);
    
    return wavBuffer;
  } catch (err) {
    throw new Error(`Failed to combine chunks into WAV buffer: ${err.message}`);
  }
}

/**
 * Parse WAV file header
 * Extracts metadata from WAV file
 * 
 * @param {Buffer} wavBuffer - WAV file buffer
 * @returns {Object} Parsed WAV metadata
 * 
 * @example
 * const wavBuffer = fs.readFileSync('audio.wav');
 * const info = parseWavHeader(wavBuffer);
 * console.log(info.channels, info.sampleRate, info.duration);
 */
function parseWavHeader(wavBuffer) {
  if (wavBuffer.length < 44) {
    throw new Error('Invalid WAV file: header too small');
  }

  // Verify RIFF header
  if (wavBuffer.toString('ascii', 0, 4) !== 'RIFF') {
    throw new Error('Invalid WAV file: not a RIFF file');
  }

  // Verify WAVE format
  if (wavBuffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('Invalid WAV file: not a WAVE file');
  }

  // Extract metadata
  const audioFormat = wavBuffer.readUInt16LE(20);
  const channels = wavBuffer.readUInt16LE(22);
  const sampleRate = wavBuffer.readUInt32LE(24);
  const byteRate = wavBuffer.readUInt32LE(28);
  const blockAlign = wavBuffer.readUInt16LE(32);
  const bitsPerSample = wavBuffer.readUInt16LE(34);
  const dataSize = wavBuffer.readUInt32LE(40);

  // Calculate duration
  const audioDataSize = Math.min(dataSize, wavBuffer.length - 44);
  const samplesCount = audioDataSize / (channels * (bitsPerSample / 8));
  const duration = samplesCount / sampleRate; // in seconds

  return {
    audioFormat,      // 1 = PCM
    channels,
    sampleRate,
    byteRate,
    blockAlign,
    bitsPerSample,
    dataSize,
    audioDataSize,
    duration,         // in seconds
    isValid: audioFormat === 1, // PCM format
  };
}

/**
 * Get audio data from WAV buffer (without header)
 * 
 * @param {Buffer} wavBuffer - WAV file buffer
 * @returns {Buffer} Just the audio data (no header)
 */
function getWavAudioData(wavBuffer) {
  if (wavBuffer.length < 44) {
    throw new Error('Invalid WAV file: header too small');
  }

  return wavBuffer.slice(44);
}

/**
 * Convert audio duration to byte size
 * 
 * @param {number} durationSeconds - Duration in seconds
 * @returns {number} Size in bytes
 */
function durationToBytes(durationSeconds) {
  const channels = WAV_CONFIG.CHANNELS;
  const sampleRate = WAV_CONFIG.SAMPLE_RATE;
  const bitsPerSample = WAV_CONFIG.BITS_PER_SAMPLE;
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
  return Math.ceil(durationSeconds * bytesPerSecond);
}

/**
 * Convert byte size to audio duration
 * 
 * @param {number} bytes - Size in bytes
 * @returns {number} Duration in seconds
 */
function bytesToDuration(bytes) {
  const channels = WAV_CONFIG.CHANNELS;
  const sampleRate = WAV_CONFIG.SAMPLE_RATE;
  const bitsPerSample = WAV_CONFIG.BITS_PER_SAMPLE;
  const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
  return bytes / bytesPerSecond;
}

/**
 * Format audio info for logging
 * 
 * @param {number} sampleRate - Sample rate in Hz
 * @param {number} channels - Number of channels
 * @param {number} bitsPerSample - Bits per sample
 * @param {number} sizeBytes - Size in bytes
 * @returns {string} Formatted info string
 */
function formatAudioInfo(sampleRate, channels, bitsPerSample, sizeBytes) {
  const duration = bytesToDuration(sizeBytes);
  const bitrateKbps = Math.round((sampleRate * channels * bitsPerSample) / 1000);
  return `${channels}ch ${sampleRate}Hz ${bitsPerSample}bit @ ${bitrateKbps}kbps (${sizeBytes}B, ${duration.toFixed(2)}s)`;
}

export {
  WAV_CONFIG,
  createWavHeader,
  combineChunksToWav,
  parseWavHeader,
  getWavAudioData,
  durationToBytes,
  bytesToDuration,
  formatAudioInfo,
};
