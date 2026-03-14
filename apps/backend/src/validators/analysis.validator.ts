import { z } from 'zod';

/**
 * Create analysis with external file URL
 */
export const createAnalysisSchema = z.object({
    body: z.object({
        modes: z.array(z.enum(['CRIMINAL', 'INTERVIEW', 'INVESTIGATION', 'BUSINESS']))
            .min(1, 'At least one mode is required'),
        fileUrl: z.string().url('A valid fileUrl is required').optional(),
        // For file-based uploads, files will be in req.files
    }),
});

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>['body'];

/**
 * Create analysis with file upload
 */
export const createAnalysisWithUploadSchema = z.object({
    body: z.object({
        modes: z.array(z.enum(['CRIMINAL', 'INTERVIEW', 'INVESTIGATION', 'BUSINESS']))
            .min(1, 'At least one mode is required'),
        fileTypes: z.array(z.enum(['VIDEO', 'AUDIO', 'TEXT']))
            .min(1, 'At least one file type is required')
            .optional(),
    }),
});

export type CreateAnalysisWithUploadInput = z.infer<typeof createAnalysisWithUploadSchema>['body'];

/**
 * Fetch analysis status history
 */
export const analysisStatusHistorySchema = z.object({
    params: z.object({
        analysisId: z.string().uuid('Invalid analysis ID'),
    }),
    query: z.object({
        limit: z.number().int().positive().default(50).optional(),
        offset: z.number().int().nonnegative().default(0).optional(),
    }),
});

/**
 * Get analysis files
 */
export const getAnalysisFilesSchema = z.object({
    params: z.object({
        analysisId: z.string().uuid('Invalid analysis ID'),
    }),
});
