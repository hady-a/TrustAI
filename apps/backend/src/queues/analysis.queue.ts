import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../lib/logger';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
    logger.error({ err }, 'Redis connection error for Queue');
});

export const ANALYSIS_QUEUE_NAME = 'analysis-jobs';

export const analysisQueue = new Queue(ANALYSIS_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
    },
});

export interface AnalysisJobPayload {
    analysisId: string;
    userId: string;
    modes: string[];
    fileUrl?: string;  // For URL-based uploads
    fileIds?: string[]; // For uploaded file IDs
    filePaths?: string[]; // For local file paths
}

/**
 * Add analysis job to processing queue
 */
export const addAnalysisJob = async (payload: AnalysisJobPayload) => {
    try {
        logger.info(
            {
                analysisId: payload.analysisId,
                userId: payload.userId,
                modes: payload.modes,
                isDirect: !!payload.fileUrl,
                fileCount: payload.fileIds?.length || 0,
            },
            'Adding analysis job to queue'
        );

        const job = await analysisQueue.add('analyze', payload, {
            // Prevent duplicate jobs for same analysis
            jobId: payload.analysisId,
        });

        logger.info({ jobId: job.id, analysisId: payload.analysisId }, 'Job added successfully');
        return job;
    } catch (error: any) {
        logger.error({ err: error, analysisId: payload.analysisId }, 'Failed to add job to queue');
        throw error;
    }
};

