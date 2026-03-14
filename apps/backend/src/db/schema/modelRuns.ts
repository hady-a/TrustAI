import { pgTable, uuid, varchar, integer, numeric, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { analyses } from './analyses';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export interface ModelExplanation {
    features: string[];
    reasoning: string;
    [key: string]: any;
}

export const modelRuns = pgTable('model_runs', {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'cascade' }).notNull(),
    modelName: varchar('model_name', { length: 255 }).notNull(),
    modelVersion: varchar('model_version', { length: 255 }).notNull(),
    riskScore: integer('risk_score'),
    confidence: numeric('confidence', { precision: 3, scale: 2 }),
    explanation: jsonb('explanation').$type<ModelExplanation>(),
    processingTimeMs: integer('processing_time_ms'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    analysisIdIdx: index('model_runs_analysis_id_idx').on(table.analysisId),
}));

export type ModelRun = InferSelectModel<typeof modelRuns>;
export type NewModelRun = InferInsertModel<typeof modelRuns>;
