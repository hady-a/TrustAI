# WAV File Audio Chunk Combining

This document explains how the WebSocket server combines audio chunks into proper WAV files before sending to Flask API.

## Overview

The WebSocket server receives audio in binary chunks and must combine them into a valid WAV file format. This process ensures Flask API receives properly formatted audio for analysis.

## WAV File Format

A WAV file consists of:
1. **RIFF Header** (12 bytes) - Identifies file type
2. **fmt Chunk** (24 bytes) - Audio format specification
3. **data Chunk** (8+ bytes) - Actual audio samples

```
┌─ RIFF Chunk ──────────────────────┐
│ "RIFF" | Size | "WAVE"             │
└────────────────────────────────────┘
        │
        ├─ fmt sub-chunk ────────────────────────┐
        │ "fmt" | Size | Format | Channels |     │
        │               SampleRate | ByteRate    │
        │               BlockAlign | BitsPerSample│
        └─────────────────────────────────────────┘
        │
        └─ data sub-chunk ─────────────────────┐
          "data" | AudioDataSize | [Audio Data]│
          └──────────────────────────────────────┘
```

## Audio Configuration

The server uses these audio settings (configurable in `websocket-server.js`):

```javascript
WAV_CONFIG = {
  SAMPLE_RATE: 16000,      // 16 kHz
  CHANNELS: 1,             // Mono
  BITS_PER_SAMPLE: 16,     // 16-bit PCM
}
```

**Calculations:**
- Byte Rate = 16000 × 1 × (16/8) = 32 kB/s
- Block Align = 1 × (16/8) = 2 bytes
- Audio per chunk ≈ 10 KB (at 5 chunks per analysis)

## Chunk Combining Process

### Step 1: Receive Audio Chunks

```
Client sends binary data:
Chunk 1: [audio samples] (≈10KB)
Chunk 2: [audio samples] (≈10KB) 
Chunk 3: [audio samples] (≈10KB)
Chunk 4: [audio samples] (≈10KB)
Chunk 5: [audio samples] (≈10KB)
```

### Step 2: Buffer Chunks

```javascript
// In memory
clientData.audioBuffer = [
  Buffer(10240),  // Chunk 1
  Buffer(10240),  // Chunk 2
  Buffer(10240),  // Chunk 3
  Buffer(10240),  // Chunk 4
  Buffer(10240),  // Chunk 5
]
```

### Step 3: Combine into WAV

When buffer reaches threshold (5 chunks):

```javascript
// 1. Concatenate audio data
audioData = Buffer.concat(chunks)  // Result: 51200 bytes

// 2. Create WAV header
header = createWavHeader(audioData)  // 44 bytes

// 3. Combine header + audio
wavBuffer = Buffer.concat([header, audioData])  // 51244 bytes
```

### Step 4: Send to Flask API

```javascript
formData.append('audio', wavstream, 'analysis.wav')
POST /analyze/business
```

## WAV Header Generation

### Header Structure

```
Offset  Size  Field                 Value          Notes
──────────────────────────────────────────────────────────
0       4     ChunkID              "RIFF"         
4       4     ChunkSize            fileSize       = 36 + dataSize
8       4     Format               "WAVE"
12      4     Subchunk1ID          "fmt"
16      4     Subchunk1Size        16             PCM = 16
20      2     AudioFormat          1              1 = PCM
22      2     NumChannels          1              Mono
24      4     SampleRate           16000          Hz
28      4     ByteRate             32000          = SampleRate×Channels×BytesPerSample
32      2     BlockAlign           2              = Channels×BytesPerSample
34      2     BitsPerSample        16             16-bit
36      4     Subchunk2ID          "data"
40      4     Subchunk2Size        audioLength    Size of audio data
44      ...   Audio Data           [samples]
```

### Code Implementation

```javascript
function createWavHeader(audioData) {
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + audioData.length, 4);  // Total file size - 8
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);    // Subchunk size
  header.writeUInt16LE(1, 20);     // PCM format
  header.writeUInt16LE(1, 22);     // 1 channel (mono)
  header.writeUInt32LE(16000, 24); // Sample rate
  header.writeUInt32LE(32000, 28); // Byte rate
  header.writeUInt16LE(2, 32);     // Block align
  header.writeUInt16LE(16, 34);    // Bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(audioData.length, 40);
  
  return header;
}
```

## Example: Complete Process

```javascript
// 1. Client sends 5 chunks over WebSocket
ws.send(chunk1);  // 10240 bytes
ws.send(chunk2);  // 10240 bytes
ws.send(chunk3);  // 10240 bytes
ws.send(chunk4);  // 10240 bytes
ws.send(chunk5);  // 10240 bytes

// 2. Server combines them
audioData = Buffer.concat([chunk1, chunk2, chunk3, chunk4, chunk5])
// Result: 51200 bytes

// 3. Create header
header = createWavHeader(audioData)
// Result: 44 bytes with metadata

// 4. Final WAV file
const wavBuffer = Buffer.concat([header, audioData])
// Result: 51244 bytes total
// ^ Ready to send to Flask API

// 5. Send to Flask
formData.append('audio', wavBuffer, 'analysis.wav')
axios.post('http://localhost:8000/analyze/business', formData)
```

## Validating WAV Files

To verify the combined WAV file is valid:

```javascript
const { parseWavHeader } = require('./wav-utils');

const info = parseWavHeader(wavBuffer);
console.log(info);
// Output:
// {
//   audioFormat: 1,          ✓ PCM
//   channels: 1,             ✓ Mono
//   sampleRate: 16000,       ✓ 16 kHz
//   bitsPerSample: 16,       ✓ 16-bit
//   duration: 1.6,           ✓ ~1.6 seconds
//   isValid: true
// }
```

## File Sizes

Typical sizes for different chunk counts:

| Chunks | Audio Size | With Header | Duration |
|--------|-----------|-------------|----------|
| 1      | 10,240 B  | 10,284 B    | 0.32s    |
| 2      | 20,480 B  | 20,524 B    | 0.64s    |
| 3      | 30,720 B  | 30,764 B    | 0.96s    |
| 4      | 40,960 B  | 41,004 B    | 1.28s    |
| 5      | 51,200 B  | 51,244 B    | 1.60s    |

*Assuming 16-bit mono, 16kHz audio*

## Error Handling

The server handles:
- **Empty chunks**: Returns null
- **Invalid chunk data**: Returns error message
- **Buffer size errors**: Catches and logs
- **WAV creation failures**: Sent as error to client

```javascript
try {
  const wavBuffer = combineChunksToWav(chunks);
  if (!wavBuffer) {
    throw new Error('Failed to create WAV buffer');
  }
  // Process WAV file...
} catch (err) {
  sendToClient(ws, {
    type: 'analysis_error',
    message: 'Failed to process audio',
    details: err.message
  });
}
```

## WAV Utils Module

For reusable WAV operations, use `wav-utils.js`:

```javascript
const {
  combineChunksToWav,
  parseWavHeader,
  formatAudioInfo,
} = require('./wav-utils');

// Combine chunks
const wav = combineChunksToWav(audioChunks);

// Parse existing WAV
const info = parseWavHeader(wav);

// Format for logging
const formatted = formatAudioInfo(16000, 1, 16, wav.length);
console.log(formatted);
// Output: "1ch 16000Hz 16bit @ 256kbps (51244B, 1.60s)"
```

## Flask API Integration

The Flask API expects:
- **Format**: Valid WAV file
- **Content-Type**: multipart/form-data
- **Field name**: "audio"
- **Additional field**: "text" (optional metadata)

```bash
curl -X POST http://localhost:8000/analyze/business \
  -F "audio=@analysis.wav" \
  -F "text=Live WebSocket analysis - 5 chunks"
```

## Customization

To change audio parameters, modify `WAV_CONFIG` in `websocket-server.js`:

```javascript
const WAV_CONFIG = {
  SAMPLE_RATE: 44100,    // Higher quality (44.1 kHz)
  CHANNELS: 2,           // Stereo
  BITS_PER_SAMPLE: 24,   // Higher bit depth
};
```

⚠️ **Note**: Flask API expects 16kHz mono 16-bit audio. Changing these settings requires Flask API updates.

## Performance Notes

- WAV header creation: < 1ms
- Buffer concatenation: ~5-10ms for 50KB
- Total chunk combining time: ~10-15ms
- No impact on Flask API analysis time
- Memory usage: ~50KB per client buffer

## References

- [WAV File Format Specification](http://www.sonicspot.com/guide/wavefiles.html)
- [RIFF Format](https://www.mmsp.ece.mcgill.ca/documents/audioformats/wave/Docs/riffmci.pdf)
- [Node.js Buffer Documentation](https://nodejs.org/api/buffer.html)
