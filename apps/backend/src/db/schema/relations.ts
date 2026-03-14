import { relations } from 'drizzle-orm';
import { users } from './users';
import { analyses } from './analyses';
import { files } from './files';
import { modelRuns } from './modelRuns';

export const usersRelations = relations(users, ({ many }) => ({
    analyses: many(analyses),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
    user: one(users, {
        fields: [analyses.userId],
        references: [users.id],
    }),
    files: many(files),
    modelRuns: many(modelRuns),
}));

export const filesRelations = relations(files, ({ one }) => ({
    analysis: one(analyses, {
        fields: [files.analysisId],
        references: [analyses.id],
    }),
}));

export const modelRunsRelations = relations(modelRuns, ({ one }) => ({
    analysis: one(analyses, {
        fields: [modelRuns.analysisId],
        references: [analyses.id],
    }),
}));
