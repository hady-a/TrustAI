import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';

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
    model_details: object;
}

export class AIService {
  private static AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  private static TIMEOUT_MS = 30000; // 30 seconds

  /**
   * Calls the external FastAPI microservice to process evidence
   */
  static async analyze(userId: string, modes: string[], fileUrl: string): Promise<AIResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      logger.info({ userId, modes, fileUrl }, 'Calling AI microservice...');

      // In a real scenario, you would send the actual payload required by your FastAPI service
      const response = await fetch(`${this.AI_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          modes,
          file_url: fileUrl,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new AppError(`AI Service returned ${response.status}`, response.status, 'AI_SERVICE_ERROR');
      }

      const data = await response.json();

      // Validate against the expected structure
      this.validateAIResponse(data);

      logger.info({ userId }, 'AI microservice analysis completed successfully');
      return data as AIResponse;

    } catch (error: any) {
      clearTimeout(timeout);

      if (error.name === 'AbortError') {
        logger.error('AI microservice timed out');
        throw new AppError('AI processing timeout', 504, 'AI_TIMEOUT');
      }

      logger.error({ err: error }, 'AI microservice failed');
      throw new AppError(error.message || 'AI processing failed', 500, 'AI_FAILURE');
    }
  }

  /**
   * Validates the AI response strictly against expected schema structure
   */
  private static validateAIResponse(data: any): asserts data is AIResponse {
    if (typeof data?.overall_risk_score !== 'number') throw new Error('Missing or invalid overall_risk_score');
    if (typeof data?.confidence_level !== 'number') throw new Error('Missing or invalid confidence_level');
    if (!data?.modality_breakdown || typeof data.modality_breakdown !== 'object') throw new Error('Missing modality_breakdown');
    if (!Array.isArray(data?.detected_indicators)) throw new Error('Missing detected_indicators array');
    if (typeof data?.explanation_summary !== 'string') throw new Error('Missing explanation_summary');
  }
}
