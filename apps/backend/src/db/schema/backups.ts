import { pgTable, text, timestamp, varchar, integer } from 'drizzle-orm/pg-core';

export const backups = pgTable('backups', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'full' | 'incremental'
  status: varchar('status', { length: 50 }).notNull(), // 'in_progress' | 'completed' | 'failed'
  size: varchar('size', { length: 50 }), // e.g., "2.4 GB"
  filePath: varchar('file_path', { length: 500 }), // path to backup file
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  retentionDays: integer('retention_days').default(30),
  errorMessage: text('error_message'),
});

export type Backup = typeof backups.$inferSelect;
export type NewBackup = typeof backups.$inferInsert;
