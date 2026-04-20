import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs-extra';
import { logger } from '../config/logger';

const execAsync = promisify(exec);

/**
 * Check if ffmpeg is available on the system
 */
async function isFFmpegAvailable(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect audio file format by extension and MIME type
 */
function detectAudioFormat(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.wav': 'wav',
    '.mp3': 'mp3',
    '.webm': 'webm',
    '.ogg': 'ogg',
    '.m4a': 'm4a',
    '.aac': 'aac',
    '.flac': 'flac',
  };
  return mimeMap[ext] || 'unknown';
}

/**
 * Convert audio file to WAV format if needed
 * Falls back to original file if ffmpeg is not available
 *
 * @param inputPath - Path to input audio file
 * @returns Path to WAV file (either converted or original if already WAV)
 */
export async function ensureWAVFormat(inputPath: string): Promise<string> {
  try {
    const format = detectAudioFormat(inputPath);

    // Already WAV, no conversion needed
    if (format === 'wav') {
      logger.debug({ inputPath }, '📁 Audio already in WAV format, skipping conversion');
      return inputPath;
    }

    // Check if ffmpeg is available
    const ffmpegAvailable = await isFFmpegAvailable();
    if (!ffmpegAvailable) {
      logger.warn(
        { format, inputPath },
        '⚠️  ffmpeg not available, using audio as-is (Flask may convert if needed)'
      );
      return inputPath;
    }

    // Convert to WAV
    const outputPath = inputPath.replace(path.extname(inputPath), '.wav');
    const command = `ffmpeg -i "${inputPath}" -c:a pcm_s16le -ar 16000 "${outputPath}" -y`;

    logger.info({ inputPath, outputPath, format }, '🔄 Converting audio to WAV format');

    await execAsync(command, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large files
    });

    // Delete original if it's different from output
    if (inputPath !== outputPath && (await fs.pathExists(inputPath))) {
      await fs.remove(inputPath);
    }

    logger.info({ outputPath }, '✅ Audio conversion to WAV complete');
    return outputPath;
  } catch (error) {
    const err = error as Error;
    logger.error(
      { error: err.message, inputPath },
      '⚠️  Audio conversion failed, using original file'
    );
    // Fail gracefully - return original file
    return inputPath;
  }
}

/**
 * Get audio file info (duration, format, sample rate)
 */
export async function getAudioInfo(filePath: string): Promise<{
  duration: number;
  format: string;
  sampleRate?: number;
} | null> {
  try {
    const ffmpegAvailable = await isFFmpegAvailable();
    if (!ffmpegAvailable) {
      return null;
    }

    const command = `ffprobe -v error -show_format -show_streams -print_format json "${filePath}"`;
    const { stdout } = await execAsync(command);

    const info = JSON.parse(stdout);
    const format = info.format?.format_name?.split(',')[0] || 'unknown';
    const duration = parseFloat(info.format?.duration) || 0;
    const sampleRate = info.streams?.[0]?.sample_rate
      ? parseInt(info.streams[0].sample_rate)
      : undefined;

    return { duration, format, sampleRate };
  } catch (error) {
    logger.warn({ error }, '⚠️  Could not extract audio info');
    return null;
  }
}

/**
 * Validate audio file is actually audio
 */
export async function isValidAudioFile(filePath: string): Promise<boolean> {
  try {
    const info = await getAudioInfo(filePath);
    return info !== null && info.duration > 0;
  } catch {
    // Fallback: check if file has audio-like extension
    const format = detectAudioFormat(filePath);
    return format !== 'unknown';
  }
}

/**
 * Get optimal audio parameters for analysis
 */
export function getAudioParameters(
  format: string
): { codec: string; sampleRate: number; channels: number } {
  // WebM/Opus from browser → convert to 16kHz PCM WAV
  return {
    codec: 'pcm_s16le', // 16-bit signed PCM
    sampleRate: 16000, // 16kHz (good for speech analysis)
    channels: 1, // Mono
  };
}
