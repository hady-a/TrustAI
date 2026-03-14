import { db } from '../db';
import { users } from '../db/schema/users';
import { analyses } from '../db/schema/analyses';
import { analysisStatusHistory } from '../db/schema/analysisStatusHistory';
import { auditLogs } from '../db/schema/auditLogs';
import { eq, gte, and, sql, count, avg, desc } from 'drizzle-orm';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';

export interface SystemMetrics {
  totalUsers: number;
  totalAnalyses: number;
  analysesToday: number;
  averageProcessingTimeMs: number;
  successRate: number;
  failedAnalyses: number;
  completedAnalyses: number;
  processingAnalyses: number;
  successRatePercentage: number;
}

export interface AnalysisMetrics {
  analysisId: string;
  userId: string;
  status: string;
  createdAt: Date;
  completedAt?: Date;
  processingTimeMs?: number;
  modes: string[];
}

export class MetricsService {
  /**
   * Get comprehensive system metrics
   */
  static async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get total counts
      const totalUsersResult = await db
        .select({ count: count() })
        .from(users);
      const totalUsers = totalUsersResult[0]?.count || 0;

      const totalAnalysesResult = await db
        .select({ count: count() })
        .from(analyses);
      const totalAnalyses = totalAnalysesResult[0]?.count || 0;

      // Get analyses created today
      const analysesTodayResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(gte(analyses.createdAt, today));
      const analysesToday = analysesTodayResult[0]?.count || 0;

      // Get completed analyses
      const completedResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.status, 'COMPLETED'));
      const completedAnalyses = completedResult[0]?.count || 0;

      // Get failed analyses
      const failedResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.status, 'FAILED'));
      const failedAnalyses = failedResult[0]?.count || 0;

      // Get processing analyses
      const processingResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.status, 'PROCESSING'));
      const processingAnalyses = processingResult[0]?.count || 0;

      // Calculate success rate
      const successRate = totalAnalyses > 0
        ? (completedAnalyses / totalAnalyses) * 100
        : 0;

      // Calculate average processing time
      // Simplified: using COMPLETED - UPLOADED transition
      const avgProcessingResult = await db
        .select({
          avgCount: count(),
        })
        .from(analysisStatusHistory)
        .where(eq(analysisStatusHistory.newStatus, 'COMPLETED'));

      // For now, return a default value
      // In production, track this with a dedicated column

      // Placeholder for average processing time
      const averageProcessingTimeMs = 45000;

      logger.info(
        { totalUsers, totalAnalyses, successRate, averageProcessingTimeMs },
        'System metrics calculated'
      );

      return {
        totalUsers,
        totalAnalyses,
        analysesToday,
        averageProcessingTimeMs,
        successRate,
        successRatePercentage: Math.round(successRate * 100) / 100,
        failedAnalyses,
        completedAnalyses,
        processingAnalyses,
      };
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to calculate system metrics');
      throw new AppError('Failed to fetch metrics', 500, 'METRICS_ERROR');
    }
  }

  /**
   * Get detailed metrics for a specific analysis
   */
  static async getAnalysisMetrics(analysisId: string): Promise<AnalysisMetrics> {
    try {
      const [analysis] = await db
        .select()
        .from(analyses)
        .where(eq(analyses.id, analysisId));

      if (!analysis) {
        throw new AppError('Analysis not found', 404, 'ANALYSIS_NOT_FOUND');
      }

      // Get status history to calculate processing time
      const statusHistory = await db
        .select()
        .from(analysisStatusHistory)
        .where(eq(analysisStatusHistory.analysisId, analysisId))
        .orderBy(analysisStatusHistory.changedAt);

      let processingTimeMs: number | undefined;
      let completedAt: Date | undefined;

      if (statusHistory.length > 0) {
        const firstStatus = statusHistory[0];
        const lastStatus = statusHistory[statusHistory.length - 1];

        processingTimeMs = Math.round(
          lastStatus.changedAt.getTime() - firstStatus.changedAt.getTime()
        );
        completedAt = lastStatus.changedAt;
      }

      return {
        analysisId: analysis.id,
        userId: analysis.userId,
        status: analysis.status,
        createdAt: analysis.createdAt,
        completedAt,
        processingTimeMs,
        modes: analysis.modes || [],
      };
    } catch (error: any) {
      logger.error({ err: error, analysisId }, 'Failed to fetch analysis metrics');
      throw error;
    }
  }

  /**
   * Get user-specific metrics
   */
  static async getUserMetrics(userId: string) {
    try {
      // Total analyses by user
      const userAnalysesResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(eq(analyses.userId, userId));
      const totalAnalyses = userAnalysesResult[0]?.count || 0;

      // Completed analyses by user
      const completedResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(
          and(
            eq(analyses.userId, userId),
            eq(analyses.status, 'COMPLETED')
          )
        );
      const completedAnalyses = completedResult[0]?.count || 0;

      // Failed analyses by user
      const failedResult = await db
        .select({ count: count() })
        .from(analyses)
        .where(
          and(
            eq(analyses.userId, userId),
            eq(analyses.status, 'FAILED')
          )
        );
      const failedAnalyses = failedResult[0]?.count || 0;

      const successRate = totalAnalyses > 0
        ? (completedAnalyses / totalAnalyses) * 100
        : 0;

      return {
        userId,
        totalAnalyses,
        completedAnalyses,
        failedAnalyses,
        successRate: Math.round(successRate * 100) / 100,
      };
    } catch (error: any) {
      logger.error({ err: error, userId }, 'Failed to fetch user metrics');
      throw new AppError('Failed to fetch user metrics', 500, 'METRICS_ERROR');
    }
  }

  /**
   * Get top performing analyses by mode
   */
  static async getAnalysesByMode(limit: number = 10) {
    try {
      // This is a simplified version - in production, you might want to
      // analyze mode performance and their respective success rates
      const modeAnalyses = await db
        .select({
          modes: analyses.modes,
          count: count(),
          avgScore: avg(analyses.overallRiskScore),
        })
        .from(analyses)
        .where(eq(analyses.status, 'COMPLETED'))
        .groupBy(analyses.modes)
        .orderBy(desc(count()))
        .limit(limit);

      return modeAnalyses;
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to fetch mode metrics');
      throw new AppError('Failed to fetch mode metrics', 500, 'METRICS_ERROR');
    }
  }

  /**
   * Get trend data for dashboard visualization
   */
  static async getTrendData(daysBack: number = 7) {
    try {
      const trends: any[] = [];

      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const dayEnd = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1
        );

        const dayAnalysesResult = await db
          .select({ count: count() })
          .from(analyses)
          .where(
            and(
              gte(analyses.createdAt, dayStart),
              gte(analyses.createdAt, dayEnd)
            )
          );

        trends.push({
          date: dayStart.toISOString().split('T')[0],
          analysesCreated: dayAnalysesResult[0]?.count || 0,
        });
      }

      return trends;
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to fetch trend data');
      throw new AppError('Failed to fetch trend data', 500, 'METRICS_ERROR');
    }
  }
}
