import { pgEnum } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['ADMIN', 'USER']);
export const analysisStatusEnum = pgEnum('status', [
  'PENDING',  // Legacy status (kept for backward compatibility)
  'UPLOADED',
  'QUEUED',
  'PROCESSING',
  'AI_ANALYZED',
  'COMPLETED',
  'FAILED'
]);
export const fileTypeEnum = pgEnum('file_type', ['VIDEO', 'AUDIO', 'TEXT']);
export const auditActionEnum = pgEnum('audit_action', [
  'LOGIN',
  'CREATE_ANALYSIS',
  'DELETE_ANALYSIS',
  'ADMIN_ACTION',
  'STATUS_CHANGE',
  'FILE_UPLOADED'
]);
