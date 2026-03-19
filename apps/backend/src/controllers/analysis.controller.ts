import { Request, Response } from 'express';
import {
  createAnalysisSchema,
  createAnalysisWithUploadSchema,
  analysisStatusHistorySchema,
  getAnalysisFilesSchema,
} from '../validators/analysis.validator';
import { AuditService } from '../services/audit.service';
import { FileService } from '../services/file.service';
import { AnalysisLogService } from '../services/analysisLogging.service';
import { db } from '../db';
import { analyses } from '../db/schema/analyses';
import { analysisStatusHistory } from '../db/schema/analysisStatusHistory';
import { files } from '../db/schema/files';
import { eq } from 'drizzle-orm';
import { AppError } from '../lib/AppError';
import { logger } from '../lib/logger';

export class AnalysisController {
  /**
   * Create analysis with external file URL
   */
  static async createAnalysis(req: Request, res: Response) {
    // Validate request body
    const parsed = createAnalysisSchema.parse(req);
    const { modes, fileUrl } = parsed.body;

    // Ensure user is authenticated
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!fileUrl) {
      throw new AppError('fileUrl is required', 400, 'MISSING_FILE_URL');
    }

    // Insert new analysis record as UPLOADED
    const [newAnalysis] = await db
      .insert(analyses)
      .values({
        userId,
        modes,
        status: 'UPLOADED',
      })
      .returning();

    // Log analysis creation
    await AnalysisLogService.info(newAnalysis.id, userId, 'Analysis created', {
      modes,
      source: 'URL',
    });

    // Record status transition
    await db.insert(analysisStatusHistory).values({
      analysisId: newAnalysis.id,
      oldStatus: 'UPLOADED',
      newStatus: 'QUEUED',
    });

    // Log status transition
    await AnalysisLogService.info(newAnalysis.id, userId, 'Analysis status changed', {
      from: 'UPLOADED',
      to: 'QUEUED',
    });

    // Update analysis to QUEUED
    await db
      .update(analyses)
      .set({ status: 'QUEUED' })
      .where(eq(analyses.id, newAnalysis.id));

    // Log the action
    await AuditService.log(userId, 'CREATE_ANALYSIS', {
      analysisId: newAnalysis.id,
      modes,
      fileUrl,
    });

    logger.info({ analysisId: newAnalysis.id, userId }, 'Analysis created from URL');

    return res.status(201).json({
      success: true,
      message: 'Analysis queued successfully',
      data: newAnalysis,
    });
  }

  /**
   * Create analysis with file uploads
   * Expects multipart/form-data with files
   */
  static async createAnalysisWithUpload(req: any, res: Response) {
    try {
      const parsed = createAnalysisWithUploadSchema.parse(req);
      const { modes } = parsed.body;

      // Ensure user is authenticated
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
      }

      if (!req.files || req.files.length === 0) {
        throw new AppError('No files uploaded', 400, 'NO_FILES');
      }

      // Ensure uploads directory exists
      await FileService.ensureUploadDir();

      // Insert new analysis record
      const [newAnalysis] = await db
        .insert(analyses)
        .values({
          userId,
          modes,
          status: 'UPLOADED',
        })
        .returning();

      // Log analysis creation
      await AnalysisLogService.info(newAnalysis.id, userId, 'Analysis created with uploads', {
        fileCount: req.files.length,
        modes,
        source: 'FILE_UPLOAD',
      });

      // Record initial status
      await db.insert(analysisStatusHistory).values({
        analysisId: newAnalysis.id,
        oldStatus: 'UPLOADED',
        newStatus: 'UPLOADED',
      });

      // Process uploaded files
      const uploadedFiles = [];
      for (const file of req.files) {
        try {
          // Validate file
          const validation = FileService.validateFile(
            file.mimetype,
            file.size,
            file.fieldname as 'VIDEO' | 'AUDIO' | 'TEXT'
          );

          if (!validation.valid) {
            await AnalysisLogService.warn(newAnalysis.id, userId, 'Invalid file validation', {
              fileName: file.originalname,
              error: validation.error,
            });
            throw new AppError(validation.error || 'Invalid file', 400, 'INVALID_FILE');
          }

          // Save file to disk
          const filePath = await FileService.saveUploadedFile(
            file.buffer,
            newAnalysis.id,
            file.originalname
          );

          // Create file record in database
          const fileRecord = await FileService.createFileRecord({
            analysisId: newAnalysis.id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            filePath,
            size: file.size,
            fileType: file.fieldname as 'VIDEO' | 'AUDIO' | 'TEXT',
            metadata: {
              uploadedAt: new Date().toISOString(),
            },
          });

          await AnalysisLogService.info(newAnalysis.id, userId, 'File uploaded', {
            fileName: file.originalname,
            fileId: fileRecord.id,
            fileType: file.fieldname,
            size: file.size,
          });

          uploadedFiles.push(fileRecord);
        } catch (error: any) {
          await AnalysisLogService.error(newAnalysis.id, userId, 'File upload failed', {
            fileName: file.originalname,
            error: error.message,
          });
          logger.error({ err: error, fileName: file.originalname }, 'File upload failed');
          throw error;
        }
      }

      // Update analysis to QUEUED
      await db
        .update(analyses)
        .set({ status: 'QUEUED' })
        .where(eq(analyses.id, newAnalysis.id));

      await db.insert(analysisStatusHistory).values({
        analysisId: newAnalysis.id,
        oldStatus: 'UPLOADED',
        newStatus: 'QUEUED',
      });

      // Log status transition
      await AnalysisLogService.info(newAnalysis.id, userId, 'Analysis status changed', {
        from: 'UPLOADED',
        to: 'QUEUED',
        fileCount: uploadedFiles.length,
      });

      // Log the action
      await AuditService.log(userId, 'CREATE_ANALYSIS', {
        analysisId: newAnalysis.id,
        modes,
        fileCount: uploadedFiles.length,
        fileIds: uploadedFiles.map((f) => f.id),
      });

      logger.info(
        { analysisId: newAnalysis.id, userId, fileCount: uploadedFiles.length },
        'Analysis created with file uploads'
      );

      return res.status(201).json({
        success: true,
        message: 'Analysis created with files queued for processing',
        data: {
          analysis: newAnalysis,
          files: uploadedFiles,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Analysis with upload failed');
      throw error;
    }
  }

  /**
   * Get full analysis result by ID
   */
  static async getAnalysis(req: Request, res: Response) {
    try {
      const { analysisId } = req.params;
      const userId = req.user?.id;

      // Verify analysis exists
      const [analysis] = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, analysisId));

      if (!analysis) {
        throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
      }

      // Verify user has access to this analysis
      if (analysis.userId !== userId) {
        throw new AppError('Access denied', 403, 'FORBIDDEN');
      }

      // Get associated files
      const analysisFiles = await db
        .select()
        .from(files)
        .where(eq(files.analysisId, analysisId));

      // Extract results data with proper structure
      const resultData = analysis.results as any || {};
      
      // Build response with all relevant fields
      const responseData = {
        id: analysis.id,
        userId: analysis.userId,
        status: analysis.status,
        modes: analysis.modes,
        overallRiskScore: analysis.overallRiskScore ? parseFloat(String(analysis.overallRiskScore)) : resultData.overall_risk_score,
        confidenceLevel: analysis.confidenceLevel ? parseFloat(String(analysis.confidenceLevel)) : resultData.confidence_level,
        results: resultData,
        files: analysisFiles,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        // Flatten important fields for easier frontend access
        explanation: resultData.explanation_summary,
        indicators: resultData.detected_indicators,
        modalityBreakdown: resultData.modality_breakdown,
        modelDetails: resultData.model_details,
      };

      logger.info({ analysisId, status: analysis.status }, '✅ Analysis retrieved successfully');

      return res.status(200).json({
        success: true,
        data: responseData,
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to fetch analysis');
      throw error;
    }
  }

  /**
   * Get analysis status history timeline
   */
  static async getAnalysisStatusHistory(req: Request, res: Response) {
    try {
      const { analysisId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Verify analysis exists
      const [analysis] = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, analysisId));

      if (!analysis) {
        throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
      }

      // Fetch status history
      const history = await db
        .select()
        .from(analysisStatusHistory)
        .where(eq(analysisStatusHistory.analysisId, analysisId))
        .orderBy(analysisStatusHistory.changedAt)
        .limit(parseInt(String(limit), 10))
        .offset(parseInt(String(offset), 10));

      logger.info({ analysisId }, 'Status history retrieved');

      return res.status(200).json({
        success: true,
        message: 'Analysis status history retrieved',
        data: {
          analysisId,
          history,
          count: history.length,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to fetch status history');
      throw error;
    }
  }

  /**
   * Get files associated with an analysis
   */
  static async getAnalysisFiles(req: Request, res: Response) {
    try {
      const { analysisId } = req.params;

      // Verify analysis exists
      const [analysis] = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, analysisId));

      if (!analysis) {
        throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
      }

      // Fetch files
      const analysisFiles = await FileService.getAnalysisFiles(analysisId);

      logger.info({ analysisId, fileCount: analysisFiles.length }, 'Analysis files retrieved');

      return res.status(200).json({
        success: true,
        message: 'Analysis files retrieved',
        data: {
          analysisId,
          files: analysisFiles,
          count: analysisFiles.length,
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to fetch analysis files');
      throw error;
    }
  }

  /**
   * Delete a file from an analysis
   */
  static async deleteAnalysisFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      // Check file exists
      const fileRecord = await FileService.getFile(fileId);
      if (!fileRecord) {
        throw new AppError('File not found', 404, 'FILE_NOT_FOUND');
      }

      // Delete file
      await FileService.deleteFile(fileId);

      // Log the action
      const userId = req.user?.id;
      if (userId) {
        await AuditService.log(userId, 'STATUS_CHANGE', {
          fileId,
          action: 'FILE_DELETED',
        });
      }

      logger.info({ fileId }, 'File deleted');

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        data: { fileId },
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to delete file');
      throw error;
    }
  }

  /**
   * Get analysis logs from database
   */
  static async getAnalysisLogs(req: Request, res: Response) {
    try {
      const { analysisId } = req.params;
      const { limit = 100, logLevel } = req.query;

      // Verify analysis exists
      const [analysis] = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, analysisId));

      if (!analysis) {
        throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
      }

      // Fetch logs based on filter
      let logs;
      if (logLevel && ['INFO', 'WARNING', 'ERROR', 'DEBUG'].includes(String(logLevel))) {
        logs = await AnalysisLogService.getLogsByLevel(
          analysisId,
          String(logLevel) as 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG',
          parseInt(String(limit), 10)
        );
      } else {
        logs = await AnalysisLogService.getAnalysisLogs(
          analysisId,
          parseInt(String(limit), 10)
        );
      }

      logger.info({ analysisId, logCount: logs.length }, 'Analysis logs retrieved');

      return res.status(200).json({
        success: true,
        message: 'Analysis logs retrieved',
        data: {
          analysisId,
          logs,
          count: logs.length,
          filter: logLevel || 'ALL',
        },
      });
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to fetch analysis logs');
      throw error;
    }
  }
}
