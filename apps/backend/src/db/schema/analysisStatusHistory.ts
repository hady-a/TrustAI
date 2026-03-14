import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { analyses } from './analyses';
import { analysisStatusEnum } from './enums';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const analysisStatusHistory = pgTable('analysis_status_history', {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'cascade' }).notNull(),
    oldStatus: analysisStatusEnum('old_status').notNull(),
    newStatus: analysisStatusEnum('new_status').notNull(),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    analysisIdIdx: index('ash_analysis_id_idx').on(table.analysisId),
    changedAtIdx: index('ash_changed_at_idx').on(table.changedAt),
}));

export type AnalysisStatusHistory = InferSelectModel<typeof analysisStatusHistory>;
export type NewAnalysisStatusHistory = InferInsertModel<typeof analysisStatusHistory>;
