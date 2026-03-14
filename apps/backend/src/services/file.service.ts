import path from 'path';
import fs from 'fs/promises';
import { db } from '../db';
import { files } from '../db/schema/files';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';
import type { File, NewFile } from '../db/schema/files';

// Configuration for file uploads
export const FILE_CONFIG = {
  uploadDir: path.join(process.cwd(), 'uploads'),
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedMimeTypes: {
    VIDEO: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    AUDIO: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac', 'audio/flac'],
    TEXT: ['text/plain', 'application/json', 'text/csv', 'application/pdf'],
  },
};

export interface FileUploadPayload {
  analysisId: string;
  originalName: string;
  mimeType: string;
  filePath: string;
  size: number;
  fileType: 'VIDEO' | 'AUDIO' | 'TEXT';
  metadata?: Record<string, any>;
}

export class FileService {
  /**
   * Create and store file metadata in database
   */
  static async createFileRecord(payload: FileUploadPayload): Promise<File> {
    try {
      const [record] = await db
        .insert(files)
        .values({
          analysisId: payload.analysisId,
          originalName: payload.originalName,
          mimeType: payload.mimeType,
          filePath: payload.filePath,
          size: payload.size,
          fileType: payload.fileType,
          metadata: payload.metadata || null,
        })
        .returning();

      logger.info(
        { fileId: record.id, analysisId: payload.analysisId, fileName: payload.originalName },
        'File record created'
      );

      return record;
    } catch (error: any) {
      logger.error({ err: error, payload }, 'Failed to create file record');
      throw new AppError('Failed to save file metadata', 500, 'FILE_SAVE_ERROR');
    }
  }

  /**
   * Get all files for an analysis
   */
  static async getAnalysisFiles(analysisId: string): Promise<File[]> {
    try {
      const result = await db.select().from(files).where(eq(files.analysisId, analysisId));
      return result;
    } catch (error: any) {
      logger.error({ err: error, analysisId }, 'Failed to fetch analysis files');
      throw new AppError('Failed to fetch files', 500, 'FILE_FETCH_ERROR');
    }
  }

  /**
   * Get a specific file record
   */
  static async getFile(fileId: string): Promise<File | null> {
    try {
      const [result] = await db.select().from(files).where(eq(files.id, fileId));
      return result || null;
    } catch (error: any) {
      logger.error({ err: error, fileId }, 'Failed to fetch file');
      throw new AppError('Failed to fetch file', 500, 'FILE_FETCH_ERROR');
    }
  }

  /**
   * Delete a file and its record
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      const fileRecord = await this.getFile(fileId);
      if (!fileRecord) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
      }

      // Delete from filesystem
      try {
        await fs.unlink(fileRecord.filePath);
      } catch (fsError) {
        logger.warn({ err: fsError, filePath: fileRecord.filePath }, 'Could not delete file from filesystem');
      }

      // Delete record from database
      await db.delete(files).where(eq(files.id, fileId));

      logger.info({ fileId }, 'File deleted');
    } catch (error: any) {
      logger.error({ err: error, fileId }, 'Failed to delete file');
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    mimeType: string,
    size: number,
    fileType: keyof typeof FILE_CONFIG.allowedMimeTypes
  ): { valid: boolean; error?: string } {
    // Check file size
    if (size > FILE_CONFIG.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds ${FILE_CONFIG.maxFileSize / (1024 * 1024)}MB limit`,
      };
    }

    // Check MIME type
    const allowedMimes = FILE_CONFIG.allowedMimeTypes[fileType];
    if (!allowedMimes.includes(mimeType)) {
      return {
        valid: false,
        error: `Invalid MIME type for ${fileType} files. Allowed: ${allowedMimes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Ensure upload directory exists
   */
  static async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(FILE_CONFIG.uploadDir, { recursive: true });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create upload directory');
      throw new AppError('Upload directory unavailable', 500, 'UPLOAD_DIR_ERROR');
    }
  }

  /**
   * Generate secure file path
   */
  static generateFilePath(analysisId: string, originalName: string): string {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    // Sanitize filename
    const sanitized = baseName
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 50);
    const fileName = `${sanitized}_${timestamp}${ext}`;
    return path.join(FILE_CONFIG.uploadDir, analysisId, fileName);
  }

  /**
   * Save uploaded file to disk
   */
  static async saveUploadedFile(
    buffer: Buffer,
    analysisId: string,
    originalName: string
  ): Promise<string> {
    try {
      const filePath = this.generateFilePath(analysisId, originalName);
      const dir = path.dirname(filePath);

      // Create analysis-specific directory
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(filePath, buffer);

      logger.info({ filePath, originalName }, 'File saved to disk');
      return filePath;
    } catch (error: any) {
      logger.error({ err: error, analysisId, originalName }, 'Failed to save file to disk');
      throw new AppError('Failed to save uploaded file', 500, 'FILE_SAVE_ERROR');
    }
  }
}
