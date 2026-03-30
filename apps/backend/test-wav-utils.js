/**
 * WAV File Creation Test
 * Tests the WAV chunk combining functionality
 */

import { 
  combineChunksToWav, 
  parseWavHeader,
  formatAudioInfo,
  WAV_CONFIG,
} from './wav-utils.js';

/**
 * Create dummy audio chunk (random PCM data)
 */
function createDummyAudioChunk(sizeBytes = 10240) {
  return Buffer.alloc(sizeBytes, Math.floor(Math.random() * 256));
}

/**
 * Create multiple dummy chunks
 */
function createDummyChunks(count = 5, sizePerChunk = 10240) {
  const chunks = [];
  for (let i = 0; i < count; i++) {
    chunks.push(createDummyAudioChunk(sizePerChunk));
  }
  return chunks;
}

/**
 * Test 1: Create WAV from dummy chunks
 */
function testCreateWav() {
  console.log('\n=== Test 1: Create WAV from Dummy Chunks ===');
  
  try {
    const chunks = createDummyChunks(5);
    console.log(`Created ${chunks.length} dummy chunks`);
    
    const wavBuffer = combineChunksToWav(chunks);
    
    if (!wavBuffer) {
      throw new Error('Failed to create WAV buffer');
    }
    
    console.log(`✅ WAV buffer created: ${wavBuffer.length} bytes`);
    console.log(`   Header: 44 bytes`);
    console.log(`   Audio data: ${wavBuffer.length - 44} bytes`);
    
    return wavBuffer;
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Test 2: Validate WAV header
 */
function testValidateWav(wavBuffer) {
  console.log('\n=== Test 2: Validate WAV Header ===');
  
  try {
    const info = parseWavHeader(wavBuffer);
    
    console.log(`✅ WAV header parsed`);
    console.log(`   Audio Format: ${info.audioFormat} (${info.audioFormat === 1 ? 'PCM' : 'UNKNOWN'})`);
    console.log(`   Channels: ${info.channels}`);
    console.log(`   Sample Rate: ${info.sampleRate} Hz`);
    console.log(`   Bits Per Sample: ${info.bitsPerSample}`);
    console.log(`   Audio Data Size: ${info.audioDataSize} bytes`);
    console.log(`   Duration: ${info.duration.toFixed(3)} seconds`);
    console.log(`   Valid: ${info.isValid ? 'YES ✓' : 'NO ✗'}`);
    
    // Validate values
    if (info.audioFormat !== 1) throw new Error('Invalid audio format');
    if (info.channels !== WAV_CONFIG.CHANNELS) throw new Error('Invalid channel count');
    if (info.sampleRate !== WAV_CONFIG.SAMPLE_RATE) throw new Error('Invalid sample rate');
    if (info.bitsPerSample !== WAV_CONFIG.BITS_PER_SAMPLE) throw new Error('Invalid bits per sample');
    if (!info.isValid) throw new Error('WAV validation failed');
    
    console.log(`✅ All validations passed`);
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Test 3: Check WAV file signatures
 */
function testWavSignatures(wavBuffer) {
  console.log('\n=== Test 3: Check WAV File Signatures ===');
  
  try {
    // Check RIFF signature
    const riffsig = wavBuffer.toString('ascii', 0, 4);
    console.log(`RIFF Signature: "${riffsig}" ${riffsig === 'RIFF' ? '✓' : '✗'}`);
    
    // Check WAVE signature
    const wavesig = wavBuffer.toString('ascii', 8, 12);
    console.log(`WAVE Signature: "${wavesig}" ${wavesig === 'WAVE' ? '✓' : '✗'}`);
    
    // Find fmt chunk
    let fmtpos = -1;
    for (let i = 12; i < wavBuffer.length - 4; i++) {
      if (wavBuffer.toString('ascii', i, i + 4) === 'fmt ') {
        fmtpos = i;
        break;
      }
    }
    console.log(`fmt chunk found at offset ${fmtpos} ${fmtpos !== -1 ? '✓' : '✗'}`);
    
    // Find data chunk
    let datapos = -1;
    for (let i = fmtpos + 4; i < wavBuffer.length - 4; i++) {
      if (wavBuffer.toString('ascii', i, i + 4) === 'data') {
        datapos = i;
        break;
      }
    }
    console.log(`data chunk found at offset ${datapos} ${datapos !== -1 ? '✓' : '✗'}`);
    
    // Check file size match
    const filesize = wavBuffer.readUInt32LE(4) + 8;
    const actualsize = wavBuffer.length;
    console.log(`File size: ${filesize} (actual: ${actualsize}) ${filesize === actualsize ? '✓' : '✗'}`);
    
    if (riffsig !== 'RIFF' || wavesig !== 'WAVE' || fmtpos === -1 || datapos === -1) {
      throw new Error('Invalid WAV signatures');
    }
    
    console.log(`✅ All signatures valid`);
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Test 4: Format audio info
 */
function testFormatAudioInfo(wavBuffer) {
  console.log('\n=== Test 4: Format Audio Information ===');
  
  try {
    const info = parseWavHeader(wavBuffer);
    const formatted = formatAudioInfo(
      info.sampleRate,
      info.channels,
      info.bitsPerSample,
      wavBuffer.length
    );
    
    console.log(`✅ Formatted: ${formatted}`);
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Test 5: Test with different chunk sizes
 */
function testDifferentChunkSizes() {
  console.log('\n=== Test 5: Different Chunk Sizes ===');
  
  try {
    const testSizes = [
      { chunks: 1, size: 8192 },
      { chunks: 3, size: 10240 },
      { chunks: 5, size: 10240 },
      { chunks: 10, size: 5120 },
    ];
    
    for (const test of testSizes) {
      const chunks = createDummyChunks(test.chunks, test.size);
      const wavBuffer = combineChunksToWav(chunks);
      const info = parseWavHeader(wavBuffer);
      
      console.log(`${test.chunks} × ${test.size}B = ${wavBuffer.length}B total (${info.duration.toFixed(3)}s)`);
    }
    
    console.log(`✅ All chunk size tests passed`);
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Test 6: Error handling
 */
function testErrorHandling() {
  console.log('\n=== Test 6: Error Handling ===');
  
  try {
    // Test empty chunks
    const emptyResult = combineChunksToWav([]);
    if (emptyResult !== null) {
      throw new Error('Should return null for empty chunks');
    }
    console.log(`✓ Empty chunks handled correctly`);
    
    // Test null input
    const nullResult = combineChunksToWav(null);
    if (nullResult !== null) {
      throw new Error('Should return null for null input');
    }
    console.log(`✓ Null input handled correctly`);
    
    // Test invalid buffer in parseWavHeader
    const smallBuffer = Buffer.alloc(20);
    try {
      parseWavHeader(smallBuffer);
      throw new Error('Should throw error for small buffer');
    } catch (err) {
      if (err.message.includes('header too small')) {
        console.log(`✓ Small buffer error handled correctly`);
      } else {
        throw err;
      }
    }
    
    console.log(`✅ All error handling tests passed`);
  } catch (err) {
    console.error(`❌ Test failed: ${err.message}`);
    process.exit(1);
  }
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('========================================');
  console.log('WAV File Creation Test Suite');
  console.log('========================================');
  
  try {
    const wavBuffer = testCreateWav();
    testValidateWav(wavBuffer);
    testWavSignatures(wavBuffer);
    testFormatAudioInfo(wavBuffer);
    testDifferentChunkSizes();
    testErrorHandling();
    
    console.log('\n========================================');
    console.log('✅ ALL TESTS PASSED');
    console.log('========================================\n');
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { createDummyChunks, createDummyAudioChunk };
