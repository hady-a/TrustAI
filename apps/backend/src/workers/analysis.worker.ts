import { Worker } from 'bullmq';
import { redisClient, AnalysisJobData } from '../config/queue';
import { logger, logJob, logError } from '../config/logger';
import { flaskAIService } from '../services/flask.ai.service';
import { fileUploadService } from '../services/file.upload.service';
import { db } from '../db/index';
import { analysisRecords } from '../schema/analysis';
import { eq } from 'drizzle-orm';

/**
 * Analysis Processing Worker
 *
 * Processes jobs from the analysis queue asynchronously
 * Flow:
 * 1. Receive job from queue
 * 2. Call Flask AI API with files
 * 3. Store results in database
 * 4. Update analysis status
 * 5. Cleanup temporary files
 */

class AnalysisWorker {
  private worker: Worker<AnalysisJobData> | null = null;

  /**
   * Start the worker process
   * Listens for jobs and processes them
   */
  async start() {
    try {
      // Create worker instance
      this.worker = new Worker<AnalysisJobData>(
        'analysis-processing',
        async (job) => {
          return this.processJob(job);
        },
        {
          connection: redisClient,
          concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2'),
        }
      );

      // Handle worker events
      this.worker.on('completed', (job) => {
        logJob(job.id!, 'completed', {
          analysisId: job.data.analysisId,
          processingTime: job.finishedOn! - job.processedOn!,
        });
      });

      this.worker.on('failed', (job, err) => {
        logJob(job!.id!, 'failed', {
          analysisId: job!.data.analysisId,
          error: err.message,
          attempt: job!.attemptsMade,
        });
      });

      this.worker.on('error', (err) => {
        logError(err, { context: 'AnalysisWorker.error' });
      });

      logger.info(
        { concurrency: parseInt(process.env.WORKER_CONCURRENCY || '2') },
        'Analysis worker started'
      );
    } catch (error) {
      logError(error as Error, { context: 'AnalysisWorker.start' });
      throw error;
    }
  }

  /**
   * Process a single analysis job
   * This is where the main work happens
   */
  private async processJob(job: any) {
    const { analysisId, userId, mode, audioPath, imagePath, textInput } = job.data as AnalysisJobData;

    logger.info(
      {
        jobId: job.id,
        analysisId,
        mode,
      },
      'Starting job processing'
    );

    try {
      // Update status: processing
      await this.updateAnalysisStatus(analysisId, 'processing');
      await job.updateProgress(10);

      // Step 1: Verify Flask API is healthy
      logger.debug('Checking Flask API health...');
      const flaskHealthy = await flaskAIService.healthCheck();
      if (!flaskHealthy) {
        throw new Error('Flask AI API is not responding');
      }
      await job.updateProgress(20);

      // Step 2: Call Flask AI for analysis
      logger.debug({ audioPath, imagePath, textInput }, 'Calling Flask AI...');
      const analysisResult = await flaskAIService.analyze({
        audioPath,
        imagePath,
        textInput,
        mode,
      });
      await job.updateProgress(70);

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      // Step 3: Store results in database
      logger.debug('Storing results in database...');
      await db
        .update(analysisRecords)
        .set({
          status: 'completed',
          confidence: analysisResult.confidence?.toString(),
          summary: analysisResult.prediction,
          faceAnalysis: analysisResult.faceAnalysis,
          voiceAnalysis: analysisResult.voiceAnalysis,
          credibilityAnalysis: analysisResult.credibilityAnalysis,
          recommendations: analysisResult.credibilityAnalysis?.recommendation,
          processingTime: analysisResult.processingTime,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(analysisRecords.id, analysisId));

      await job.updateProgress(80);

      // Step 4: Cleanup temporary files
      logger.debug('Cleaning up temporary files...');
      if (audioPath) {
        await fileUploadService.deleteFile(audioPath);
      }
      if (imagePath) {
        await fileUploadService.deleteFile(imagePath);
      }
      await job.updateProgress(90);

      // Step 5: Cleanup Flask-side storage
      await flaskAIService.cleanupAnalysis(analysisId);
      await job.updateProgress(100);

      // Update final status
      await this.updateAnalysisStatus(analysisId, 'completed');

      logger.info(
        {
          jobId: job.id,
          analysisId,
          processingTime: analysisResult.processingTime,
          confidence: analysisResult.confidence,
        },
        'Job completed successfully'
      );

      // Return result for job completion
      return {
        success: true,
        analysisId,
        ...analysisResult,
      };
    } catch (error) {
      const err = error as Error;

      logger.error(
        {
          jobId: job.id,
          analysisId,
          error: err.message,
          stack: err.stack,
          attempt: job.attemptsMade,
          maxAttempts: job.opts.attempts,
        },
        'Job processing failed'
      );

      // Determine if this is the final attempt
      if (job.attemptsMade >= job.opts.attempts) {
        // Final failure - update status to failed
        await this.updateAnalysisStatus(analysisId, 'failed', err.message);

        // Cleanup files on final failure
        const jobData = job.data as AnalysisJobData;
        if (jobData.audioPath) {
          await fileUploadService.deleteFile(jobData.audioPath);
        }
        if (jobData.imagePath) {
          await fileUploadService.deleteFile(jobData.imagePath);
        }
      }

      // Throw error to let BullMQ handle retries
      throw error;
    }
  }

  /**
   * Update analysis status in database
   */
  private async updateAnalysisStatus(
    analysisId: string,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await db
        .update(analysisRecords)
        .set({
          status: status,
          errorMessage: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(analysisRecords.id, analysisId));

      logger.debug(
        { analysisId, status, errorMessage },
        'Updated analysis status'
      );
    } catch (error) {
      logger.error(
        { analysisId, error: (error as Error).message },
        'Failed to update analysis status'
      );
    }
  }

  /**
   * Gracefully shutdown worker
   */
  async shutdown() {
    if (this.worker) {
      logger.info('Shutting down worker...');
      await this.worker.close();
      logger.info('Worker shut down complete');
    }
  }
}

// Create and export singleton
export const analysisWorker = new AnalysisWorker();

/**
 * Start worker on import (for worker process)
 * Environment variable WORKER_MODE=true to enable
 */
if (process.env.WORKER_MODE === 'true') {
  analysisWorker
    .start()
    .then(() => {
      logger.info('Worker process initialized and ready');
    })
    .catch((error) => {
      logError(error, { context: 'AnalysisWorker initialization' });
      process.exit(1);
    });

  // Graceful shutdown on signals
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully...');
    await analysisWorker.shutdown();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received, shutting down gracefully...');
    await analysisWorker.shutdown();
    process.exit(0);
  });
}

export default analysisWorker;
