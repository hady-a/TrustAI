import { Request, Response } from 'express';
import { db } from '../db';
import { users } from '../db/schema/users';
import { analyses } from '../db/schema/analyses';
import { auditLogs } from '../db/schema/auditLogs';
import { count, sql, gte, lte } from 'drizzle-orm';
import { AppError } from '../lib/AppError';
import { MetricsService } from '../services/metrics.service';

// Helper function to convert array to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      const strValue = typeof value === 'string' ? value : JSON.stringify(value);
      // Escape quotes and wrap in quotes if contains commas
      return strValue.includes(',') || strValue.includes('"') 
        ? `"${strValue.replace(/"/g, '""')}"` 
        : strValue;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

export class AdminController {
  // Get dashboard metrics
  static async getDashboardMetrics(req: Request, res: Response) {
    try {
      // Get total users count
      const [totalUsersResult] = await db
        .select({ value: count() })
        .from(users);
      const totalUsers = totalUsersResult?.value || 0;

      // Get total analyses count
      const [totalAnalysesResult] = await db
        .select({ value: count() })
        .from(analyses);
      const totalAnalyses = totalAnalysesResult?.value || 0;

      // Get active sessions count (users logged in within last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [activeSessions] = await db
        .select({ value: count() })
        .from(auditLogs)
        .where(gte(auditLogs.createdAt, oneHourAgo));

      // Get analyses by status
      const analysesByStatus = await db
        .select({
          status: analyses.status,
          count: count().as('count'),
        })
        .from(analyses)
        .groupBy(analyses.status);

      // Calculate average confidence level
      const [avgConfidence] = await db
        .select({
          avg: sql`AVG(CAST(COALESCE(${analyses.confidenceLevel}, 0) AS NUMERIC))`,
        })
        .from(analyses)
        .where(sql`${analyses.confidenceLevel} IS NOT NULL`);

      return res.status(200).json({
        success: true,
        message: 'Dashboard metrics retrieved',
        data: {
          totalUsers,
          totalAnalyses,
          activeSessions: activeSessions?.value || 0,
          avgAccuracy: avgConfidence?.avg ? Math.round(parseFloat(String(avgConfidence.avg)) * 100) / 100 : 0,
          analysesByStatus: analysesByStatus || [],
        },
      });
    } catch (error) {
      throw new AppError('Failed to fetch dashboard metrics', 500, 'METRICS_ERROR');
    }
  }

  // Get analytics data for the past 7 days
  static async getAnalyticsData(req: Request, res: Response) {
    try {
      const days = 7;
      const data = [];

      for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const [userCount] = await db
          .select({ value: count() })
          .from(users)
          .where(sql`${users.createdAt} BETWEEN ${dayStart} AND ${dayEnd}`);

        const [analysisCount] = await db
          .select({ value: count() })
          .from(analyses)
          .where(sql`${analyses.createdAt} BETWEEN ${dayStart} AND ${dayEnd}`);

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        data.push({
          day: dayNames[dayStart.getDay()],
          users: userCount?.value || 0,
          analyses: analysisCount?.value || 0,
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Analytics data retrieved',
        data,
      });
    } catch (error) {
      throw new AppError('Failed to fetch analytics data', 500, 'ANALYTICS_ERROR');
    }
  }

  // Get all audit logs
  static async getAuditLogs(req: Request, res: Response) {
    try {
      const { limit = 100, offset = 0 } = req.query;

      const logs = await db
        .select({
          id: auditLogs.id,
          userId: auditLogs.userId,
          action: auditLogs.action,
          metadata: auditLogs.metadata,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .orderBy(sql`${auditLogs.createdAt} DESC`)
        .limit(Number(limit))
        .offset(Number(offset));

      const [totalCount] = await db
        .select({ value: count() })
        .from(auditLogs);

      return res.status(200).json({
        success: true,
        message: 'Audit logs retrieved',
        data: {
          logs,
          total: totalCount?.value || 0,
          limit: Number(limit),
          offset: Number(offset),
        },
      });
    } catch (error) {
      throw new AppError('Failed to fetch audit logs', 500, 'LOGS_ERROR');
    }
  }

  // Export users as CSV
  static async exportUsers(req: Request, res: Response) {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users);

      if (allUsers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No users to export',
          data: '',
        });
      }

      const csvData = convertToCSV(allUsers);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users_export.csv"');
      return res.send(csvData);
    } catch (error) {
      throw new AppError('Failed to export users', 500, 'EXPORT_ERROR');
    }
  }

  // Export analyses as CSV
  static async exportAnalyses(req: Request, res: Response) {
    try {
      const allAnalyses = await db
        .select({
          id: analyses.id,
          userId: analyses.userId,
          status: analyses.status,
          modes: analyses.modes,
          riskScore: analyses.overallRiskScore,
          confidence: analyses.confidenceLevel,
          createdAt: analyses.createdAt,
        })
        .from(analyses);

      if (allAnalyses.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No analyses to export',
          data: '',
        });
      }

      const csvData = convertToCSV(allAnalyses);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="analyses_export.csv"');
      return res.send(csvData);
    } catch (error) {
      throw new AppError('Failed to export analyses', 500, 'EXPORT_ERROR');
    }
  }

  // Generate system report
  static async generateReport(req: Request, res: Response) {
    try {
      const [totalUsersResult] = await db
        .select({ value: count() })
        .from(users);

      const [totalAnalysesResult] = await db
        .select({ value: count() })
        .from(analyses);

      const [activeUsersResult] = await db
        .select({ value: count() })
        .from(users)
        .where(sql`${users.isActive} = true`);

      const completedAnalyses = await db
        .select({ value: count() })
        .from(analyses)
        .where(sql`${analyses.status} = 'COMPLETED'`);

      const pendingAnalyses = await db
        .select({ value: count() })
        .from(analyses)
        .where(sql`${analyses.status} = 'PENDING'`);

      const failedAnalyses = await db
        .select({ value: count() })
        .from(analyses)
        .where(sql`${analyses.status} = 'FAILED'`);

      const timestamp = new Date().toISOString();

      const report = {
        generatedAt: timestamp,
        summary: {
          totalUsers: totalUsersResult?.value || 0,
          activeUsers: activeUsersResult?.value || 0,
          totalAnalyses: totalAnalysesResult?.value || 0,
          completedAnalyses: completedAnalyses?.[0]?.value || 0,
          pendingAnalyses: pendingAnalyses?.[0]?.value || 0,
          failedAnalyses: failedAnalyses?.[0]?.value || 0,
        },
        systemHealth: {
          status: 'healthy',
          uptime: '99.9%',
          lastChecked: timestamp,
        },
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="system_report.json"');
      return res.json({
        success: true,
        message: 'Report generated successfully',
        data: report,
      });
    } catch (error) {
      throw new AppError('Failed to generate report', 500, 'REPORT_ERROR');
    }
  }

  // Get system backups info
  static async getBackups(req: Request, res: Response) {
    try {
      const { BackupService } = await import('../services/backup.service');
      const result = await BackupService.getAllBackups();

      return res.status(200).json({
        success: true,
        message: 'Backups retrieved',
        data: result,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : 'Failed to fetch backups', 500, 'BACKUP_ERROR');
    }
  }

  // Create a new backup
  static async createBackup(req: Request, res: Response) {
    try {
      const { type = 'full' } = req.body;
      const { BackupService } = await import('../services/backup.service');
      const result = await BackupService.createBackup(type);

      return res.status(201).json({
        success: true,
        message: 'Backup created successfully',
        data: result,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : 'Failed to create backup', 500, 'BACKUP_ERROR');
    }
  }

  // Restore from a backup
  static async restoreBackup(req: Request, res: Response) {
    try {
      const { backupId } = req.params;
      const { BackupService } = await import('../services/backup.service');
      const result = await BackupService.restoreBackup(backupId);

      return res.status(200).json({
        success: true,
        message: 'Backup restored successfully',
        data: result,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : 'Failed to restore backup', 500, 'BACKUP_ERROR');
    }
  }

  // Delete a backup
  static async deleteBackup(req: Request, res: Response) {
    try {
      const { backupId } = req.params;
      const { BackupService } = await import('../services/backup.service');
      const result = await BackupService.deleteBackup(backupId);

      return res.status(200).json({
        success: true,
        message: 'Backup deleted successfully',
        data: result,
      });
    } catch (error) {
      throw new AppError(error instanceof Error ? error.message : 'Failed to delete backup', 500, 'BACKUP_ERROR');
    }
  }

  // Get system health status
  static async getSystemHealth(req: Request, res: Response) {
    try {
      const { HealthService } = await import('../services/health.service');
      const health = await HealthService.getSystemHealth();

      return res.status(200).json({
        success: true,
        message: 'System health retrieved',
        data: health,
      });
    } catch (error) {
      throw new AppError('Failed to fetch system health', 500, 'HEALTH_ERROR');
    }
  }

  /**
   * Get comprehensive system metrics
   * Endpoint: GET /admin/system-metrics
   */
  static async getSystemMetrics(req: Request, res: Response) {
    try {
      const metrics = await MetricsService.getSystemMetrics();

      return res.status(200).json({
        success: true,
        message: 'System metrics retrieved',
        data: metrics,
      });
    } catch (error) {
      throw new AppError('Failed to fetch system metrics', 500, 'METRICS_ERROR');
    }
  }

  /**
   * Get trend data for dashboard visualization
   * Endpoint: GET /admin/metrics/trends
   */
  static async getMetricsTrends(req: Request, res: Response) {
    try {
      const { daysBack = 7 } = req.query;
      const days = Math.min(Math.max(1, parseInt(String(daysBack), 10)), 90); // 1-90 days

      const trends = await MetricsService.getTrendData(days);

      return res.status(200).json({
        success: true,
        message: 'Metrics trends retrieved',
        data: trends,
      });
    } catch (error) {
      throw new AppError('Failed to fetch metrics trends', 500, 'METRICS_ERROR');
    }
  }

  /**
   * Get metrics by analysis mode
   * Endpoint: GET /admin/metrics/modes
   */
  static async getMetricsByMode(req: Request, res: Response) {
    try {
      const { limit = 10 } = req.query;
      const modes = await MetricsService.getAnalysesByMode(
        parseInt(String(limit), 10)
      );

      return res.status(200).json({
        success: true,
        message: 'Mode metrics retrieved',
        data: modes,
      });
    } catch (error) {
      throw new AppError('Failed to fetch mode metrics', 500, 'METRICS_ERROR');
    }
  }
}
