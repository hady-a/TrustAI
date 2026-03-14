import { pgTable, uuid, integer, numeric, jsonb, timestamp, index, text } from 'drizzle-orm/pg-core';
import { analysisStatusEnum } from './enums';
import { users } from './users';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export interface AnalysisResult {
    summary?: string;
    flags?: Array<{ type: string; description: string; score: number }>;
    metadata?: Record<string, any>;
    [key: string]: any;
}

export const analyses = pgTable('analyses', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    status: analysisStatusEnum('status').default('PENDING').notNull(),
    modes: text('modes').array().notNull(), // CRIMINAL | INTERVIEW | INVESTIGATION | BUSINESS
    overallRiskScore: integer('overall_risk_score'),
    confidenceLevel: numeric('confidence_level', { precision: 3, scale: 2 }),
    results: jsonb('results').$type<AnalysisResult>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index('analyses_user_id_idx').on(table.userId),
    statusIdx: index('analyses_status_idx').on(table.status),
    createdAtIdx: index('analyses_created_at_idx').on(table.createdAt),
}));

export type Analysis = InferSelectModel<typeof analyses>;
export type NewAnalysis = InferInsertModel<typeof analyses>;
