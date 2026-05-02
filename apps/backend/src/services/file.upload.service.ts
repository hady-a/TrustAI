import fs from 'fs-extra';
import path from 'path';
import { logger, logError } from '../config/logger';

/**
 * File Upload Service
 * Handles file validation, storage, cleanup, and temporary file management
 */

export interface FileValidationConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}

// Configuration for different file types
const fileConfigs: Record<string, FileValidationConfig> = {
  audio: {
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      'audio/wav',
      'audio/mpeg',
      'audio/webm',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
    ],
    allowedExtensions: ['.wav', '.mp3', '.webm', '.ogg', '.m4a', '.aac'],
  },
  image: {
    maxSizeBytes: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.bmp'],
  },
};

class FileUploadService {
  private uploadDir: string;
  private tempDir: string;

  constructor() {
    // Use environment variable or default to /tmp for uploads
    const baseDir = process.env.UPLOAD_DIR || '/tmp/trustai-uploads';
    this.uploadDir = path.join(baseDir, 'uploads');
    this.tempDir = path.join(baseDir, 'temp');

    this.ensureDirectories();
  }

  /**
   * Ensure upload directories exist
   */
  private ensureDirectories() {
    try {
      fs.ensureDirSync(this.uploadDir);
      fs.ensureDirSync(this.tempDir);
      logger.debug(
        { uploadDir: this.uploadDir, tempDir: this.tempDir },
        'Upload directories ready'
      );
    } catch (error) {
      logError(error as Error, {
        context: 'FileUploadService.ensureDirectories',
      });
      throw error;
    }
  }

  /**
   * Validate file for upload
   * Checks size, mime type, extension
   */
  validateFile(
    fileBuffer: Buffer,
    fileType: 'audio' | 'image',
    mimeType: string,
    originalName: string
  ): {
    valid: boolean;
    error?: string;
  } {
    const config = fileConfigs[fileType];

    if (!config) {
      return { valid: false, error: `Unknown file type: ${fileType}` };
    }

    // Check size
    if (fileBuffer.length > config.maxSizeBytes) {
      const maxMB = config.maxSizeBytes / (1024 * 1024);
      return {
        valid: false,
        error: `File exceeds maximum size of ${maxMB}MB`,
      };
    }

    // Check mime type
    if (!config.allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid file type: ${mimeType}. Allowed: ${config.allowedMimeTypes.join(', ')}`,
      };
    }

    // Check extension
    const ext = path.extname(originalName).toLowerCase();
    if (!config.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension: ${ext}. Allowed: ${config.allowedExtensions.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Save uploaded file to temp storage
   * Returns file path for processing
   */
  async saveUploadedFile(
    fileBuffer: Buffer,
    fileType: 'audio' | 'image',
    fileId: string,
    originalName: string
  ): Promise<string> {
    try {
      const ext = path.extname(originalName);
      const fileName = `${fileId}${ext}`;
      const filePath = path.join(this.tempDir, fileName);

      await fs.writeFile(filePath, fileBuffer);

      logger.debug(
        {
          fileType,
          fileId,
          size: fileBuffer.length,
          path: filePath,
        },
        'File saved to temp storage'
      );

      return filePath;
    } catch (error) {
      logError(error as Error, {
        context: 'FileUploadService.saveUploadedFile',
        fileType,
        fileId,
      });
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  }

  /**
   * Save file to permanent storage (for results/archive)
   */
  async saveToStorage(
    fileBuffer: Buffer,
    fileType: string,
    analysisId: string,
    originalName: string
  ): Promise<string> {
    try {
      const ext = path.extname(originalName);
      const fileName = `${analysisId}${ext}`;
      const filePath = path.join(this.uploadDir, fileName);

      await fs.writeFile(filePath, fileBuffer);

      logger.debug(
        {
          fileType,
          analysisId,
          size: fileBuffer.length,
          path: filePath,
        },
        'File saved to permanent storage'
      );

      return filePath;
    } catch (error) {
      logError(error as Error, {
        context: 'FileUploadService.saveToStorage',
        fileType,
        analysisId,
      });
      throw new Error(`Failed to save file: ${(error as Error).message}`);
    }
  }

  /**
   * Delete file after processing
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (!filePath) return;

      const exists = await fs.pathExists(filePath);
      if (!exists) return;

      await fs.remove(filePath);
      logger.debug({ filePath }, 'File deleted');
    } catch (error) {
      logger.warn(
        { filePath, error: (error as Error).message },
        'Failed to delete file'
      );
      // Don't throw - this is cleanup, not critical
    }
  }

  /**
   * Cleanup temp files older than specified age
   * Run periodically to prevent storage bloat
   */
  async cleanupOldTempFiles(ageHours: number = 24): Promise<number> {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = ageHours * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = await fs.stat(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          await fs.remove(filePath);
          deletedCount++;
        }
      }

      logger.info(
        { deletedCount, ageHours },
        'Cleaned up old temp files'
      );

      return deletedCount;
    } catch (error) {
      logError(error as Error, {
        context: 'FileUploadService.cleanupOldTempFiles',
      });
      return 0;
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(filePath: string): Promise<{
    exists: boolean;
    size: number;
    created: Date | null;
    modified: Date | null;
  } | null> {
    try {
      const exists = await fs.pathExists(filePath);
      if (!exists) {
        return {
          exists: false,
          size: 0,
          created: null,
          modified: null,
        };
      }

      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
      };
    } catch (error) {
      logger.warn(
        { filePath, error: (error as Error).message },
        'Failed to get file info'
      );
      return null;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    tempDir: {
      count: number;
      totalSize: number;
    };
    uploadDir: {
      count: number;
      totalSize: number;
    };
  }> {
    try {
      const tempStats = await this.getDirStats(this.tempDir);
      const uploadStats = await this.getDirStats(this.uploadDir);

      return {
        tempDir: tempStats,
        uploadDir: uploadStats,
      };
    } catch (error) {
      logger.error(
        { error: (error as Error).message },
        'Failed to get storage stats'
      );
      return {
        tempDir: { count: 0, totalSize: 0 },
        uploadDir: { count: 0, totalSize: 0 },
      };
    }
  }

  /**
   * Helper: Get directory statistics
   */
  private async getDirStats(
    dirPath: string
  ): Promise<{ count: number; totalSize: number }> {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return { count: files.length, totalSize };
    } catch (error) {
      return { count: 0, totalSize: 0 };
    }
  }

  /**
   * Get directory path
   */
  getUploadDir(): string {
    return this.uploadDir;
  }

  getTempDir(): string {
    return this.tempDir;
  }
}

export const fileUploadService = new FileUploadService();

export default fileUploadService;
