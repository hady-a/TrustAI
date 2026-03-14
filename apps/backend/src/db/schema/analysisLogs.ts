import { pgTable, uuid, text, timestamp, index, jsonb } from 'drizzle-orm/pg-core';
import { analyses } from './analyses';
import { users } from './users';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const analysisLogs = pgTable('analysis_logs', {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    logLevel: text('log_level').notNull(), // INFO, WARNING, ERROR, DEBUG
    message: text('message').notNull(),
    details: jsonb('details'), // Additional context data
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    analysisIdIdx: index('analysis_logs_analysis_id_idx').on(table.analysisId),
    userIdIdx: index('analysis_logs_user_id_idx').on(table.userId),
    logLevelIdx: index('analysis_logs_log_level_idx').on(table.logLevel),
    timestampIdx: index('analysis_logs_timestamp_idx').on(table.timestamp),
}));

export type AnalysisLog = InferSelectModel<typeof analysisLogs>;
export type NewAnalysisLog = InferInsertModel<typeof analysisLogs>;
