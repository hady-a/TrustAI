import { analysisQueue, AnalysisJobData } from '../config/queue';
import { logger, logJob } from '../config/logger';
import { randomUUID } from 'crypto';
import { db } from '../db/index';
import { analysisRecords } from '../schema/analysis';
import { eq } from 'drizzle-orm';

/**
 * Analysis Queue Service
 * Orchestrates job lifecycle: creation, processing, status tracking, result storage
 * Acts as the main interface between API and queue system
 */

export interface CreateAnalysisJobParams {
  userId: string;
  mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW';
  inputMethod: 'live' | 'upload';
  audioPath?: string;
  imagePath?: string;
  textInput?: string;
}

export interface JobStatus {
  jobId: string;
  analysisId: string;
  state: string;
  progress: number;
  status: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  failedReason?: string;
}

class AnalysisQueueService {
  /**
   * Create and queue a new analysis job
   * Returns immediately with jobId for polling
   */
  async createAnalysisJob(params: CreateAnalysisJobParams): Promise<{
    jobId: string;
    analysisId: string;
    estimatedWaitTime: number;
  }> {
    const analysisId = randomUUID();

    try {
      // Create analysis record in database with 'pending' status
      await db
        .update(analysisRecords)
        .set({
          status: 'processing',
          mode: params.mode,
          inputMethod: params.inputMethod,
          userId: params.userId,
          videoUrl: params.imagePath,
          audioUrl: params.audioPath,
          createdAt: new Date(),
        })
        .where(eq(analysisRecords.id, analysisId));

      // Create job data
      const jobData: AnalysisJobData = {
        analysisId,
        userId: params.userId,
        mode: params.mode,
        inputMethod: params.inputMethod,
        audioPath: params.audioPath,
        imagePath: params.imagePath,
        textInput: params.textInput,
        timestamp: Date.now(),
      };

      // Add job to queue
      const job = await analysisQueue.add(jobData, {
        jobId: analysisId,
        // Priority: 'live' mode has higher priority
        priority: params.inputMethod === 'live' ? 10 : 5,
        attempts: 3,
      });

      logJob(analysisId, 'started', {
        userId: params.userId,
        mode: params.mode,
        userId: params.inputMethod,
      });

      // Get queue status for estimated wait time
      const queueStatus = await analysisQueue.getJobCounts();
      const estimatedWaitTime = Math.max(0, (queueStatus.waiting || 0) * 15); // ~15s per job estimate

      logger.info(
        {
          analysisId,
          jobId: job.id,
          userId: params.userId,
          mode: params.mode,
          estimatedWaitTime,
        },
        'Analysis job queued'
      );

      return {
        jobId: job.id!,
        analysisId,
        estimatedWaitTime,
      };
    } catch (error) {
      logger.error(
        {
          analysisId,
          error: (error as Error).message,
          params,
        },
        'Failed to create analysis job'
      );
      throw error;
    }
  }

  /**
   * Get current status of a queued job
   * Used for polling by frontend
   */
  async getJobStatus(jobId: string): Promise<JobStatus | null> {
    try {
      const job = await analysisQueue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      const progress = job.progress() as number;

      // Map job state to readable status
      const statusMap: Record<string, string> = {
        waiting: 'queued',
        active: 'processing',
        completed: 'completed',
        failed: 'failed',
        delayed: 'scheduled',
      };

      const status = statusMap[state] || state;

      return {
        jobId,
        analysisId: job.data.analysisId,
        state,
        progress,
        status,
        createdAt: job.processedOn || job.timestamp || Date.now(),
        startedAt: job.processedOn,
        completedAt: job.finishedOn,
        failedReason: job.failedReason,
      };
    } catch (error) {
      logger.error(
        {
          jobId,
          error: (error as Error).message,
        },
        'Failed to get job status'
      );
      return null;
    }
  }

  /**
   * Get job result after completion
   */
  async getJobResult(jobId: string): Promise<any | null> {
    try {
      const job = await analysisQueue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      if (state !== 'completed') return null;

      return job.returnvalue;
    } catch (error) {
      logger.error(
        {
          jobId,
          error: (error as Error).message,
        },
        'Failed to get job result'
      );
      return null;
    }
  }

  /**
   * Get job with full details
   */
  async getJobDetails(jobId: string): Promise<any | null> {
    try {
      const job = await analysisQueue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      const progress = job.progress() as number;

      return {
        id: job.id,
        data: job.data,
        state,
        progress,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
        returnvalue: job.returnvalue,
        failedReason: job.failedReason,
        createdAt: new Date(job.timestamp).toISOString(),
        processedOn: job.processedOn ? new Date(job.processedOn).toISOString() : null,
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        delay: job.delay,
      };
    } catch (error) {
      logger.error(
        {
          jobId,
          error: (error as Error).message,
        },
        'Failed to get job details'
      );
      return null;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const job = await analysisQueue.getJob(jobId);
      if (!job) return false;

      const state = await job.getState();
      if (state !== 'failed') return false;

      await job.retry();
      logJob(jobId, 'retry', { previousState: state });

      logger.info({ jobId }, 'Job retry initiated');
      return true;
    } catch (error) {
      logger.error(
        {
          jobId,
          error: (error as Error).message,
        },
        'Failed to retry job'
      );
      return false;
    }
  }

  /**
   * Cancel a pending/delayed job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const job = await analysisQueue.getJob(jobId);
      if (!job) return false;

      const state = await job.getState();
      if (!['waiting', 'delayed'].includes(state)) {
        return false;
      }

      await job.remove();
      logJob(jobId, 'completed', { cancelled: true }); // Log as completed for tracking

      logger.info({ jobId }, 'Job cancelled');
      return true;
    } catch (error) {
      logger.error(
        {
          jobId,
          error: (error as Error).message,
        },
        'Failed to cancel job'
      );
      return false;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const counts = await analysisQueue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');

      return {
        pending: counts.wait || 0,
        processing: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
        totalJobs: (counts.wait || 0) + (counts.active || 0) + (counts.completed || 0) + (counts.failed || 0),
      };
    } catch (error) {
      logger.error(
        {
          error: (error as Error).message,
        },
        'Failed to get queue statistics'
      );
      return {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        totalJobs: 0,
      };
    }
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 20): Promise<any[]> {
    try {
      const jobs = await analysisQueue.getJobs(
        ['completed', 'failed'],
        0,
        limit
      );

      return jobs.map((job) => ({
        id: job.id,
        data: job.data,
        state: job._progress, // Will be empty for completed/failed
        createdAt: new Date(job.timestamp).toISOString(),
        finishedOn: job.finishedOn ? new Date(job.finishedOn).toISOString() : null,
        failedReason: job.failedReason,
      }));
    } catch (error) {
      logger.error(
        {
          limit,
          error: (error as Error).message,
        },
        'Failed to get recent jobs'
      );
      return [];
    }
  }
}

export const analysisQueueService = new AnalysisQueueService();

export default analysisQueueService;
