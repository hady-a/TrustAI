import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';
import * as fs from 'fs';
import * as path from 'path';

export interface FormattedResults {
    mode?: string;
    insights?: any[];
    transcript?: string;
    findings?: any[];
    risks?: any;
    metrics?: any;
    audioAnalysis?: any;
    videoAnalysis?: any;
    assessment?: any;
    [key: string]: any;
}

export interface AIResponse {
    overall_risk_score: number;
    confidence_level: number;
    modality_breakdown: {
        video: number;
        audio: number;
        text: number;
    };
    detected_indicators: string[];
    explanation_summary: string;
    model_details: {
        mode?: string;
        models_used?: string[];
        raw_analysis?: any;
        formatted_results?: FormattedResults;
        analysis_data?: any;
        [key: string]: any;
    };
}

export class AIService {
    private static AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    private static TIMEOUT_MS = 300000; // 5 minutes for large files

    /**
     * Calls the external FastAPI microservice to process evidence
     * Supports both file paths (uploaded files) and URLs
     */
    static async analyze(
        userId: string,
        modes: string[],
        filePaths?: string[] | string,
        fileUrl?: string
    ): Promise<AIResponse> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

        try {
            const mode = modes[0]?.toUpperCase() || 'HR_INTERVIEW';
            logger.info(
                { userId, modes: mode, fileSource: filePaths ? 'uploaded' : 'url' },
                '🤖 Calling AI microservice...'
            );

            // Prepare request based on input type
            let payload: any = {
                user_id: userId,
                modes,
            };

            // Handle file paths (uploaded files)
            if (filePaths && typeof filePaths === 'string') {
                // Single file path
                payload.audio_file_path = filePaths;
            } else if (Array.isArray(filePaths) && filePaths.length > 0) {
                // Multiple file paths - categorize by extension
                for (const filePath of filePaths) {
                    const ext = path.extname(filePath).toLowerCase();
                    if (['.mp3', '.wav', '.m4a', '.flac'].includes(ext)) {
                        payload.audio_file_path = filePath;
                    } else if (['.mp4', '.avi', '.mov', '.mkv', '.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
                        payload.video_file_path = filePath;
                    }
                }
            }

            // Handle URL fallback
            if (fileUrl && !payload.audio_file_path && !payload.video_file_path) {
                payload.file_url = fileUrl;
            }

            logger.debug({ payload }, 'AI Service Request Payload');

            const response = await fetch(`${this.AI_URL}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeout);

            if (!response.ok) {
                const errorData = await response.text();
                logger.error(
                    { status: response.status, error: errorData },
                    'AI Service error response'
                );
                throw new AppError(
                    `AI Service returned ${response.status}: ${errorData}`,
                    response.status,
                    'AI_SERVICE_ERROR'
                );
            }

            const data = await response.json();

            // Validate against the expected structure
            this.validateAIResponse(data);

            logger.info(
                { userId, mode, riskScore: data.overall_risk_score },
                '✅ AI analysis completed successfully'
            );
            return data as AIResponse;

        } catch (error: any) {
            clearTimeout(timeout);

            if (error.name === 'AbortError') {
                logger.error({ userId }, 'AI microservice timed out');
                throw new AppError('AI processing timeout', 504, 'AI_TIMEOUT');
            }

            logger.error({ err: error, userId }, '❌ AI microservice failed');
            throw new AppError(
                error.message || 'AI processing failed',
                error.statusCode || 500,
                'AI_FAILURE'
            );
        }
    }

    /**
     * Validates the AI response strictly against expected schema structure
     */
    private static validateAIResponse(data: any): asserts data is AIResponse {
        if (typeof data?.overall_risk_score !== 'number') {
            throw new Error('Missing or invalid overall_risk_score');
        }
        if (typeof data?.confidence_level !== 'number') {
            throw new Error('Missing or invalid confidence_level');
        }
        if (!data?.modality_breakdown || typeof data.modality_breakdown !== 'object') {
            throw new Error('Missing modality_breakdown');
        }
        if (!Array.isArray(data?.detected_indicators)) {
            throw new Error('Missing detected_indicators array');
        }
        if (typeof data?.explanation_summary !== 'string') {
            throw new Error('Missing explanation_summary');
        }
    }
}
