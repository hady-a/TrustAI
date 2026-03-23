/**
 * AI Analysis Service
 * Service layer for communicating with the Flask AI API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import { logger } from '../lib/logger';

interface AIAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
  report_type?: string;
}

interface FaceAnalysisResult {
  success: boolean;
  age?: number;
  gender?: string;
  emotion?: string;
  race?: string;
  [key: string]: any;
}

interface VoiceAnalysisResult {
  success: boolean;
  transcription?: string;
  stress_level?: number;
  emotion?: string;
  [key: string]: any;
}

interface CredibilityResult {
  success: boolean;
  credibility_score?: number;
  lie_probability?: number;
  [key: string]: any;
}

export class AIAnalysisService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = process.env.FLASK_API_URL || 'http://localhost:5000') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 120000, // 2 minutes timeout for AI processing
    });
  }

  /**
   * Check if Flask API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      logger.info({ status: response.status }, 'Flask API health check passed');
      return response.status === 200;
    } catch (error) {
      logger.error({ error }, 'Flask API health check failed');
      return false;
    }
  }

  /**
   * Get API status and available endpoints
   */
  async getStatus() {
    try {
      const response = await this.client.get('/api/status');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Failed to get Flask API status');
      throw error;
    }
  }

  /**
   * Run complete analysis with image and/or audio
   */
  async analyzeComplete(
    imagePath?: string,
    audioPath?: string,
    reportType: string = 'general',
    videoDuration: number = 5
  ): Promise<AIAnalysisResponse> {
    try {
      const formData = new FormData();

      // Add image file if provided
      if (imagePath && fs.existsSync(imagePath)) {
        formData.append('image', fs.createReadStream(imagePath));
      }

      // Add audio file if provided
      if (audioPath && fs.existsSync(audioPath)) {
        formData.append('audio', fs.createReadStream(audioPath));
      }

      // Add parameters
      formData.append('report_type', reportType);
      formData.append('video_duration', videoDuration.toString());

      const response = await this.client.post('/api/analyze', formData, {
        headers: formData.getHeaders(),
      });

      logger.info(
        { analysisId: response.data.data?.id, reportType },
        'Complete analysis succeeded'
      );
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      logger.error(
        { error: axiosError.message, status: axiosError.status },
        'Complete analysis failed'
      );
      throw this.handleAPIError(error);
    }
  }

  /**
   * Analyze facial image only
   */
  async analyzeFace(imagePath: string): Promise<AIAnalysisResponse> {
    try {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }

      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));

      const response = await this.client.post('/api/analyze/face', formData, {
        headers: formData.getHeaders(),
      });

      logger.info({ success: response.data.success }, 'Face analysis succeeded');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Face analysis failed');
      throw this.handleAPIError(error);
    }
  }

  /**
   * Analyze voice/audio only
   */
  async analyzeVoice(audioPath: string): Promise<AIAnalysisResponse> {
    try {
      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }

      const formData = new FormData();
      formData.append('audio', fs.createReadStream(audioPath));

      const response = await this.client.post('/api/analyze/voice', formData, {
        headers: formData.getHeaders(),
      });

      logger.info({ success: response.data.success }, 'Voice analysis succeeded');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Voice analysis failed');
      throw this.handleAPIError(error);
    }
  }

  /**
   * Analyze credibility/lie detection
   */
  async analyzeCredibility(
    imagePath?: string,
    audioPath?: string,
    reportType: string = 'general'
  ): Promise<AIAnalysisResponse> {
    try {
      const formData = new FormData();

      // Add image file if provided
      if (imagePath && fs.existsSync(imagePath)) {
        formData.append('image', fs.createReadStream(imagePath));
      }

      // Add audio file if provided
      if (audioPath && fs.existsSync(audioPath)) {
        formData.append('audio', fs.createReadStream(audioPath));
      }

      formData.append('report_type', reportType);

      const response = await this.client.post('/api/analyze/credibility', formData, {
        headers: formData.getHeaders(),
      });

      logger.info({ reportType }, 'Credibility analysis succeeded');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Credibility analysis failed');
      throw this.handleAPIError(error);
    }
  }

  /**
   * Generate report from analysis data
   */
  async generateReport(
    faceData: any,
    voiceData: any,
    credibilityData: any,
    reportType: string = 'general'
  ): Promise<AIAnalysisResponse> {
    try {
      const response = await this.client.post('/api/analyze/report', {
        face_data: faceData,
        voice_data: voiceData,
        credibility_data: credibilityData,
        report_type: reportType,
      });

      logger.info({ reportType }, 'Report generation succeeded');
      return response.data;
    } catch (error) {
      logger.error({ error }, 'Report generation failed');
      throw this.handleAPIError(error);
    }
  }

  /**
   * Validate Flask API connection
   */
  async validateConnection(): Promise<boolean> {
    try {
      const isHealthy = await this.healthCheck();
      if (!isHealthy) {
        logger.error('Flask API is not healthy');
        return false;
      }

      const status = await this.getStatus();
      logger.info({ status }, 'Flask API connection validated');
      return true;
    } catch (error) {
      logger.error({ error }, 'Flask API connection validation failed');
      return false;
    }
  }

  /**
   * Handle API errors and convert to meaningful messages
   */
  private handleAPIError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.error || error.message;

      const errorMap: { [key: number]: string } = {
        400: 'Invalid request parameters',
        401: 'Unauthorized access to Flask API',
        403: 'Forbidden access to Flask API',
        404: 'Flask API endpoint not found',
        413: 'File size exceeds maximum allowed',
        500: 'Flask API internal error',
        503: 'Flask API is temporarily unavailable',
      };

      const friendlyMessage = errorMap[status || 0] || message || 'Unknown error occurred';
      return new Error(`Flask API Error: ${friendlyMessage}`);
    }

    return error instanceof Error ? error : new Error('Unknown error during AI analysis');
  }
}

// Export singleton instance
export const aiAnalysisService = new AIAnalysisService();
