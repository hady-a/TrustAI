import { db } from '../db';
import { auditLogs } from '../db/schema/auditLogs';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';

export type AuditActionType = 'LOGIN' | 'CREATE_ANALYSIS' | 'DELETE_ANALYSIS' | 'ADMIN_ACTION' | 'STATUS_CHANGE';

export class AuditService {
  /**
   * Log an action to the audit_logs table
   */
  static async log(userId: string, action: AuditActionType, metadata?: any) {
    try {
      await db.insert(auditLogs).values({
        userId,
        action,
        metadata: metadata ? metadata : null,
      });
      logger.info({ userId, action }, `Audit Log: ${action}`);
    } catch (error) {
      logger.error({ err: error, userId, action }, 'Failed to write audit log');
      // We do not throw here to prevent audit logging failures from crashing main business transactions,
      // but we log it heavily.
    }
  }
}
