import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db';
import { analyses } from '../db/schema/analyses';
import { analysisStatusHistory } from '../db/schema/analysisStatusHistory';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { ANALYSIS_QUEUE_NAME, AnalysisJobPayload } from '../queues/analysis.queue';
import { AIService } from '../services/ai.service';
import type { analysisStatusEnum } from '../db/schema/enums';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

// Type for valid analysis statuses
type AnalysisStatus = 'UPLOADED' | 'QUEUED' | 'PROCESSING' | 'AI_ANALYZED' | 'COMPLETED' | 'FAILED';

/**
 * Utility to update analysis status with transaction
 * Records status change in history table
 */
const updateAnalysisStatus = async (
    analysisId: string,
    oldStatus: AnalysisStatus,
    newStatus: AnalysisStatus,
    results: any = null,
    riskScore?: number,
    confidenceLevel?: number
) => {
    await db.transaction(async (tx) => {
        // Update analysis record with results and scalar fields
        const updateData: any = { status: newStatus };
        
        if (results) {
            updateData.results = results;
            // Also store scalar fields from results for easier querying
            if (typeof results.overall_risk_score === 'number') {
                updateData.overallRiskScore = Math.round(results.overall_risk_score);
            }
            if (typeof results.confidence_level === 'number') {
                updateData.confidenceLevel = (results.confidence_level / 100).toString(); // Convert to 0-1 decimal
            }
        }

        if (typeof riskScore === 'number') {
            updateData.overallRiskScore = Math.round(riskScore);
        }
        if (typeof confidenceLevel === 'number') {
            updateData.confidenceLevel = (confidenceLevel / 100).toString();
        }

        await tx
            .update(analyses)
            .set(updateData)
            .where(eq(analyses.id, analysisId));

        // Insert into history for timeline tracking
        await tx.insert(analysisStatusHistory).values({
            analysisId,
            oldStatus,
            newStatus,
        });

        logger.info(
            { analysisId, oldStatus, newStatus, riskScore: updateData.overallRiskScore },
            `✅ Analysis status updated: ${oldStatus} → ${newStatus}`
        );
    });
};

/**
 * Analysis worker processes jobs from the queue
 * Implements full status pipeline with AI processing
 */
export const analysisWorker = new Worker<AnalysisJobPayload>(
    ANALYSIS_QUEUE_NAME,
    async (job: Job<AnalysisJobPayload>) => {
        const { analysisId, userId, fileUrl, filePaths, modes } = job.data;
        const startTime = Date.now();

        logger.info(
            { jobId: job.id, analysisId, userId, modes },
            '🚀 Analysis worker started'
        );

        try {
            // Stage 1: Validate and get current status
            const [currentAnalysis] = await db
                .select()
                .from(analyses)
                .where(eq(analyses.id, analysisId));

            if (!currentAnalysis) {
                throw new Error(`Analysis ${analysisId} not found`);
            }

            const currentStatus = currentAnalysis.status as AnalysisStatus;
            logger.info({ analysisId, currentStatus }, 'Current analysis status');

            // Stage 2: Mark as PROCESSING
            await updateAnalysisStatus(analysisId, currentStatus, 'PROCESSING');
            logger.info({ analysisId }, '⏳ Analysis processing started');

            // Stage 3: Call AI microservice
            // Use uploaded files or fileUrl
            const hasFiles = filePaths && filePaths.length > 0;
            const hasUrl = !!fileUrl;

            if (!hasFiles && !hasUrl) {
                throw new Error('No file input provided for analysis');
            }

            logger.info(
                { analysisId, fileCount: filePaths?.length || 0, hasUrl },
                '📤 Sending to AI service for analysis'
            );

            // Pass file paths or URL to AI service
            const aiResult = await AIService.analyze(userId, modes, hasFiles ? filePaths : undefined, fileUrl);

            // Stage 4: Mark as AI_ANALYZED
            await updateAnalysisStatus(analysisId, 'PROCESSING', 'AI_ANALYZED', aiResult);
            logger.info({ analysisId }, '🤖 AI analysis complete');

            // Stage 5: Mark as COMPLETED with results
            await updateAnalysisStatus(analysisId, 'AI_ANALYZED', 'COMPLETED', aiResult);

            const processingTime = Date.now() - startTime;
            logger.info(
                { jobId: job.id, analysisId, processingTime },
                `✅ Analysis completed in ${processingTime}ms`
            );

            return {
                success: true,
                analysisId,
                processingTime,
                result: aiResult,
            };

        } catch (error: any) {
            const errorTime = Date.now() - startTime;
            logger.error(
                { err: error, jobId: job.id, analysisId, errorTime, attempt: job.attemptsMade },
                '❌ Analysis job failed'
            );

            // Get current status for error handling
            const [failedAnalysis] = await db
                .select()
                .from(analyses)
                .where(eq(analyses.id, analysisId));

            const currentStatus = (failedAnalysis?.status || 'PROCESSING') as AnalysisStatus;

            // Only mark as FAILED if we've exhausted retry attempts
            if (job.attemptsMade >= (job.opts.attempts || 1) - 1) {
                logger.warn({ analysisId, attempts: job.attemptsMade }, 'Marking analysis as FAILED after max retries');
                await updateAnalysisStatus(
                    analysisId,
                    currentStatus,
                    'FAILED',
                    {
                        error: error.message,
                        code: error.code || 'PROCESSING_ERROR',
                        timestamp: new Date().toISOString(),
                    }
                );
            }

            throw error;
        }
    },
    {
        connection: redisConnection,
        concurrency: process.env.WORKER_CONCURRENCY
            ? parseInt(process.env.WORKER_CONCURRENCY, 10)
            : 5,
    }
);

/**
 * Worker event handlers for logging and monitoring
 */
analysisWorker.on('completed', (job: Job) => {
    logger.info(
        { jobId: job.id, analysisId: job.data.analysisId },
        '✅ Job completed successfully'
    );
});

analysisWorker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error(
        { jobId: job?.id, analysisId: job?.data.analysisId, err },
        '❌ Job failed'
    );
});

analysisWorker.on('error', (err: Error) => {
    logger.error({ err }, '⚠️  Worker error');
});

analysisWorker.on('stalled', (jobId: string) => {
    logger.warn({ jobId }, '⏸️  Job stalled');
});

