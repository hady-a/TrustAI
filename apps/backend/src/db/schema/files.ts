import { pgTable, uuid, text, integer, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { fileTypeEnum } from './enums';
import { analyses } from './analyses';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export interface FileMetadata {
    durationMs?: number;
    width?: number;
    height?: number;
    codec?: string;
    [key: string]: any;
}

export const files = pgTable('files', {
    id: uuid('id').primaryKey().defaultRandom(),
    analysisId: uuid('analysis_id').references(() => analyses.id, { onDelete: 'cascade' }).notNull(),
    fileType: fileTypeEnum('file_type').notNull(),
    filePath: text('file_path').notNull(),
    originalName: text('original_name').notNull(),
    mimeType: text('mime_type').notNull(),
    size: integer('size'),
    metadata: jsonb('metadata').$type<FileMetadata>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
    analysisIdIdx: index('files_analysis_id_idx').on(table.analysisId),
    fileTypeIdx: index('files_file_type_idx').on(table.fileType),
}));

export type File = InferSelectModel<typeof files>;
export type NewFile = InferInsertModel<typeof files>;
