import { db } from '../db';
import { analysisLogs } from '../db/schema/analysisLogs';
import { logger } from '../lib/logger';
import { desc, eq } from 'drizzle-orm';

export type LogLevel = 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';

interface LogEntry {
    analysisId: string;
    userId: string;
    logLevel: LogLevel;
    message: string;
    details?: Record<string, any>;
}

export class AnalysisLogService {
    /**
     * Log an analysis event to the database
     */
    static async log(entry: LogEntry): Promise<void> {
        try {
            const { analysisId, userId, logLevel, message, details } = entry;

            await db.insert(analysisLogs).values({
                analysisId,
                userId,
                logLevel,
                message,
                details: details || null,
            });

            // Also log to application logger
            const logContext = { analysisId, userId, details };
            const logMessage = `[Analysis ${analysisId}] ${message}`;
            
            switch (logLevel) {
                case 'INFO':
                    logger.info(logContext, logMessage);
                    break;
                case 'WARNING':
                    logger.warn(logContext, logMessage);
                    break;
                case 'ERROR':
                    logger.error(logContext, logMessage);
                    break;
                case 'DEBUG':
                    logger.debug(logContext, logMessage);
                    break;
            }
        } catch (error: any) {
            logger.error(
                { err: error, analysisId: entry.analysisId },
                'Failed to write analysis log to database'
            );
            // Don't throw - logging failure shouldn't break analysis
        }
    }

    /**
     * Log info level message
     */
    static async info(analysisId: string, userId: string, message: string, details?: Record<string, any>): Promise<void> {
        await this.log({
            analysisId,
            userId,
            logLevel: 'INFO',
            message,
            details,
        });
    }

    /**
     * Log warning level message
     */
    static async warn(analysisId: string, userId: string, message: string, details?: Record<string, any>): Promise<void> {
        await this.log({
            analysisId,
            userId,
            logLevel: 'WARNING',
            message,
            details,
        });
    }

    /**
     * Log error level message
     */
    static async error(analysisId: string, userId: string, message: string, details?: Record<string, any>): Promise<void> {
        await this.log({
            analysisId,
            userId,
            logLevel: 'ERROR',
            message,
            details,
        });
    }

    /**
     * Log debug level message
     */
    static async debug(analysisId: string, userId: string, message: string, details?: Record<string, any>): Promise<void> {
        await this.log({
            analysisId,
            userId,
            logLevel: 'DEBUG',
            message,
            details,
        });
    }

    /**
     * Get all logs for an analysis
     */
    static async getAnalysisLogs(analysisId: string, limit: number = 100) {
        try {
            const logs = await db
                .select()
                .from(analysisLogs)
                .where(eq(analysisLogs.analysisId, analysisId))
                .orderBy(desc(analysisLogs.timestamp))
                .limit(limit);

            return logs;
        } catch (error: any) {
            logger.error({ err: error, analysisId }, 'Failed to retrieve analysis logs');
            throw error;
        }
    }

    /**
     * Delete old logs (for cleanup)
     */
    static async deleteOldLogs(analysisId: string): Promise<number> {
        try {
            const result = await db
                .delete(analysisLogs)
                .where(eq(analysisLogs.analysisId, analysisId));

            return result.rowCount || 0;
        } catch (error: any) {
            logger.error({ err: error, analysisId }, 'Failed to delete analysis logs');
            throw error;
        }
    }

    /**
     * Get logs by level
     */
    static async getLogsByLevel(analysisId: string, logLevel: LogLevel, limit: number = 50) {
        try {
            const logs = await db
                .select()
                .from(analysisLogs)
                .where((t) => eq(t.analysisId, analysisId) && eq(t.logLevel, logLevel))
                .orderBy(desc(analysisLogs.timestamp))
                .limit(limit);

            return logs;
        } catch (error: any) {
            logger.error({ err: error, analysisId, logLevel }, 'Failed to retrieve logs by level');
            throw error;
        }
    }
}
