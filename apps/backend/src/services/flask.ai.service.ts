import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';
import { logger, logError } from '../config/logger';

/**
 * Flask AI Service
 * Handles all communication with Python Flask AI API
 * Manages file uploads, error handling, retries, and timeouts
 */

export interface AIAnalysisRequest {
  audioPath?: string;
  imagePath?: string;
  textInput?: string;
  mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW' | 'INVESTIGATION';
}

export interface AIAnalysisResult {
  success: boolean;
  confidence: number;
  trustScore: number;
  agreementProbability: number;
  prediction: string;
  faceAnalysis?: {
    emotion: string;
    emotionScores: Record<string, number>;
    age: number;
    gender: string;
    confidence: number;
  };
  voiceAnalysis?: {
    transcript: string;
    emotion: string;
    emotionScores: Record<string, number>;
    stressLevel: number;
    confidence: number;
  };
  credibilityAnalysis?: {
    deceptionProbability: number;
    credibilityScore: number;
    keyIndicators: string[];
    recommendation: string;
  };
  processingTime: number;
  error?: string;
}

type FlaskRouteMode = 'business' | 'interview' | 'investigation';
type FlaskAnalyzeEndpoint = `/analyze/${FlaskRouteMode}`;

const getFlaskModeSegment = (
  mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW' | 'INVESTIGATION'
): FlaskRouteMode => {
  // Keep backward compatibility with older CRIMINAL mode naming.
  if (mode === 'CRIMINAL') return 'investigation';
  return mode.toLowerCase() as FlaskRouteMode;
};

const getFlaskEndpointForMode = (
  mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW' | 'INVESTIGATION'
): FlaskAnalyzeEndpoint => `/analyze/${getFlaskModeSegment(mode)}`;

class FlaskAIService {
  private client: AxiosInstance;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor() {
    this.baseURL = process.env.FLASK_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.FLASK_TIMEOUT || '60000'); // 60 seconds
    this.maxRetries = parseInt(process.env.FLASK_MAX_RETRIES || '3');

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'User-Agent': 'TrustAI-Backend/1.0',
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug(
          {
            method: config.method,
            url: config.url,
            timeout: config.timeout,
          },
          'Flask API Request'
        );
        return config;
      },
      (error) => {
        logError(error as Error, { context: 'Flask request interceptor' });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        logger.debug(
          {
            status: response.status,
            url: response.config.url,
            duration: `${response.headers['x-response-time'] || 'unknown'}ms`,
          },
          'Flask API Response'
        );
        return response;
      },
      (error) => {
        const axiosError = error as AxiosError;
        logError(
          new Error(`Flask API Error: ${axiosError.message}`),
          {
            status: axiosError.response?.status,
            url: axiosError.config?.url,
            responseData: axiosError.response?.data,
          }
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check Flask API health
   * Used to verify connection before processing
   */
  async healthCheck(): Promise<boolean> {
  try {
    const response = await this.client.get('/health', { timeout: 5000 });

    const isHealthy =
      response.status === 200 &&
      response.data?.success === true &&
      response.data?.data?.status === 'healthy';

    if (!isHealthy) {
      logger.warn(
        { response: response.data },
        'Flask health check returned unexpected format'
      );
    }

    return isHealthy;
  } catch (error) {
    logger.warn('Flask API health check failed');
    return false;
  }
}
  /**
   * Analyze audio, image, and text with retry logic
   * Supports exponential backoff for transient failures
   */
  async analyze(
    request: AIAnalysisRequest,
    attempt: number = 1
  ): Promise<AIAnalysisResult> {
    const startTime = Date.now();

    try {
      if (attempt === 1) {
        logger.info(
          {
            mode: request.mode,
            hasAudio: !!request.audioPath,
            hasImage: !!request.imagePath,
            hasText: !!request.textInput,
          },
          'Starting AI analysis'
        );
      }

      // Verify files exist (if provided)
      if (request.audioPath && !(await fs.pathExists(request.audioPath))) {
        throw new Error(`Audio file not found: ${request.audioPath}`);
      }
      if (request.imagePath && !(await fs.pathExists(request.imagePath))) {
        throw new Error(`Image file not found: ${request.imagePath}`);
      }

      // Create form data with files and metadata
      const formData = new FormData();

      // Add files
      if (request.audioPath) {
        const audioStream = fs.createReadStream(request.audioPath);
        formData.append('audio', audioStream, path.basename(request.audioPath));
      }

      if (request.imagePath) {
        const imageStream = fs.createReadStream(request.imagePath);
        formData.append('image', imageStream, path.basename(request.imagePath));
      }

      // Add metadata
      formData.append('mode', request.mode);
      if (request.textInput) {
        formData.append('text', request.textInput);
      }

      const endpoint = getFlaskEndpointForMode(request.mode);

      // POST to Flask API with form data
      const response = await this.client.post<AIAnalysisResult>(
        endpoint,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const processingTime = Date.now() - startTime;

      // Log raw Flask response for debugging and verification
      console.log("🔍 RAW FLASK RESPONSE:", response.data);

      logger.info(
        {
          mode: request.mode,
          processingTime,
          success: response.data.success,
          dataKeys: Object.keys(response.data),
        },
        'AI analysis completed'
      );

      // Return Flask response exactly as received (transparent proxy)
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      const processingTime = Date.now() - startTime;

      // Determine if error is retryable
      const isRetryable =
        attempt < this.maxRetries &&
        (err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'EHOSTUNREACH' ||
          (err.response?.status && err.response.status >= 500));

      if (isRetryable) {
        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(
          {
            attempt,
            maxRetries: this.maxRetries,
            delay,
            error: err.message,
          },
          'Retrying Flask API call'
        );

        await this.sleep(delay);
        return this.analyze(request, attempt + 1);
      }

      // Non-retryable error
      console.error('🔥 FULL AXIOS ERROR:', {
        message: err.message,
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
      });

      logError(error as Error, {
        context: 'FlaskAIService.analyze',
        mode: request.mode,
        processingTime,
        attempt,
      });

      // Build a descriptive error message instead of stringifying empty values.
      let errorMessage: string;
      if (
        err.code === 'ECONNREFUSED' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'EHOSTUNREACH' ||
        err.code === 'ENOTFOUND' ||
        (err as any).errors?.some?.((e: any) => e?.code === 'ECONNREFUSED')
      ) {
        errorMessage = `AI service unavailable at ${this.baseURL}. Make sure the Flask AI server is running on port 8000.`;
      } else if (err.response?.data) {
        const data: any = err.response.data;
        errorMessage =
          (typeof data === 'string' && data) ||
          data.error ||
          data.message ||
          `Flask API returned ${err.response.status}`;
      } else {
        errorMessage = err.message || 'Unknown error contacting AI service';
      }

      return {
        success: false,
        confidence: 0,
        trustScore: 0,
        agreementProbability: 0,
        prediction: 'ERROR',
        processingTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Batch analyze multiple items
   * Process multiple analyses in one API call if supported
   */
  async batchAnalyze(requests: AIAnalysisRequest[]): Promise<AIAnalysisResult[]> {
    logger.info({ count: requests.length }, 'Starting batch analysis');

    // Process sequentially to avoid overwhelming Flask
    const results: AIAnalysisResult[] = [];
    for (const request of requests) {
      const result = await this.analyze(request);
      results.push(result);
    }

    return results;
  }

  /**
   * Get analysis history from Flask
   * Useful for caching and comparison
   */
  async getAnalysisHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.client.get('/history', {
        params: { userId, limit },
        timeout: 10000,
      });
      return response.data;
    } catch (error) {
      logger.warn('Failed to fetch analysis history from Flask');
      return [];
    }
  }

  /**
   * Clean up temporary files from Flask storage
   * Called after analysis is stored in database
   */
  async cleanupAnalysis(analysisId: string): Promise<void> {
    try {
      await this.client.delete(`/analysis/${analysisId}`, {
        timeout: 10000,
      });
      logger.debug({ analysisId }, 'Cleaned up Flask analysis data');
    } catch (error) {
      logger.warn(
        { analysisId },
        'Failed to cleanup Flask analysis data'
      );
    }
  }

  /**
   * Helper: Sleep for specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get service status
   */
  async getStatus() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      healthy: await this.healthCheck(),
    };
  }
}

// Singleton instance
export const flaskAIService = new FlaskAIService();

export default flaskAIService;
