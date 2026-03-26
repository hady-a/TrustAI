import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger, logJob } from './logger';

/**
 * Redis Configuration
 * Single connection instance for queue and caching
 */
export const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  enableOfflineQueue: true,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redisClient.on('connect', () => {
  logger.info('Redis connected');
});

redisClient.on('error', (err) => {
  logger.error({ error: err }, 'Redis connection error');
});

/**
 * Analysis Job Types
 */
export interface AnalysisJobData {
  analysisId: string;
  userId: string;
  mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW';
  inputMethod: 'live' | 'upload';
  audioPath?: string;
  imagePath?: string;
  textInput?: string;
  timestamp: number;
}

/**
 * Analysis Processing Queue
 * Uses Redis for persistent job storage
 * Supports retries, delays, and progress tracking
 */
export const analysisQueue = new Queue<AnalysisJobData>('analysis-processing', {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 1 day
    },
  },
});

/**
 * Queue Events for real-time updates
 */
export const queueEvents = new QueueEvents('analysis-processing', {
  connection: redisClient,
});

// Monitor queue events
queueEvents.on('completed', ({ jobId }) => {
  logger.info({ jobId }, 'Job completed');
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
  logger.error(
    { jobId, failedReason },
    'Job failed'
  );
});

queueEvents.on('progress', ({ jobId, data }) => {
  logJob(jobId, 'progress', data as any);
});

/**
 * Pause/Resume queue management
 */
export const pauseQueue = async () => {
  await analysisQueue.pause();
  logger.info('Analysis queue paused');
};

export const resumeQueue = async () => {
  await analysisQueue.resume();
  logger.info('Analysis queue resumed');
};

/**
 * Queue status helper
 */
export const getQueueStatus = async () => {
  const counts = await analysisQueue.getJobCounts();
  return {
    waiting: counts.waiting,
    active: counts.active,
    completed: counts.completed,
    failed: counts.failed,
    delayed: counts.delayed,
    paused: counts.paused,
  };
};

/**
 * Get job details
 */
export const getJobStatus = async (jobId: string) => {
  const job = await analysisQueue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  const progress = job.progress();
  const attempts = job.attemptsMade;

  return {
    id: job.id,
    state,
    progress,
    attempts,
    data: job.data,
    result: job.returnvalue,
    failedReason: job.failedReason,
  };
};

// Graceful shutdown handler for queue
export const shutdownQueue = async () => {
  logger.info('Shutting down queue...');
  await analysisQueue.close();
  await queueEvents.close();
  await redisClient.quit();
  logger.info('Queue shut down complete');
};

export default analysisQueue;
