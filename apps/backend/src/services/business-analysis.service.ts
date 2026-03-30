import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../lib/logger';
import { AppError } from '../lib/AppError';

/**
 * Business Analysis Service
 * Handles integration with Flask AI API for business analysis endpoint
 * Specifically connects to http://localhost:8000/analyze/business
 */

export interface BusinessAnalysisRequest {
  audioFile?: Express.Multer.File;
  imageFile?: Express.Multer.File;
  text?: string;
}

export interface BusinessAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class BusinessAnalysisService {
  private client: AxiosInstance;
  private flaskBaseURL: string;
  private timeout: number;

  constructor() {
    // Use AI_SERVICE_URL from .env (http://localhost:8000)
    this.flaskBaseURL =
      process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 60000; // 60 seconds timeout for processing

    this.client = axios.create({
      baseURL: this.flaskBaseURL,
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
          '[Flask Business Analysis] Request started'
        );
        return config;
      },
      (error) => {
        logger.error(
          { error: (error as Error).message },
          '[Flask Business Analysis] Request error'
        );
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
            dataSize: JSON.stringify(response.data).length,
          },
          '[Flask Business Analysis] Response received'
        );
        return response;
      },
      (error) => {
        const axiosError = error as AxiosError;
        logger.error(
          {
            status: axiosError.response?.status,
            url: axiosError.config?.url,
            message: axiosError.message,
            data: axiosError.response?.data,
          },
          '[Flask Business Analysis] Response error'
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check Flask API health
   * Verifies that the Flask service is running and responsive
   */
  async healthCheck(): Promise<boolean> {
    try {
      logger.debug(
        { url: `${this.flaskBaseURL}/health` },
        'Checking Flask API health'
      );
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.warn(
        { error: (error as Error).message },
        'Flask API health check failed'
      );
      return false;
    }
  }

  /**
   * Analyze business data using Flask AI
   * Accepts audio, image, and text inputs
   * Returns AI analysis results
   */
  async analyzeBusiness(
    request: BusinessAnalysisRequest
  ): Promise<BusinessAnalysisResponse> {
    const startTime = Date.now();

    try {
      logger.info(
        {
          hasAudio: !!request.audioFile,
          hasImage: !!request.imageFile,
          hasText: !!request.text,
        },
        '[Flask Business Analysis] Starting business analysis'
      );

      // Validate that at least audio is provided
      if (!request.audioFile) {
        throw new AppError(
          'Audio file is required for analysis',
          400,
          'MISSING_AUDIO'
        );
      }

      // Create FormData for multipart/form-data request
      const formData = new FormData();

      // Add audio file (REQUIRED)
      logger.debug(
        { filename: request.audioFile.originalname, size: request.audioFile.size },
        'Adding audio file to form'
      );
      formData.append('audio', request.audioFile.buffer, {
        filename: request.audioFile.originalname,
      });

      // Add image file if provided (OPTIONAL)
      if (request.imageFile) {
        logger.debug(
          { filename: request.imageFile.originalname, size: request.imageFile.size },
          'Adding image file to form'
        );
        formData.append('image', request.imageFile.buffer, {
          filename: request.imageFile.originalname,
        });
      }

      // Add text input if provided (OPTIONAL)
      if (request.text) {
        logger.debug(
          { textLength: request.text.length },
          'Adding text input to form'
        );
        formData.append('text', request.text);
      }

      // Send POST request to Flask API
      logger.info(
        { endpoint: '/analyze/business', timeout: this.timeout },
        '[Flask Business Analysis] Sending request to Flask'
      );

      const response = await this.client.post<any>(
        '/analyze/business',
        formData,
        {
          headers: formData.getHeaders(),
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      const processingTime = Date.now() - startTime;

      logger.info(
        {
          processingTime,
          statusCode: response.status,
          success: response.data.success,
        },
        '[Flask Business Analysis] Analysis completed successfully'
      );

      return {
        success: true,
        data: response.data.data || response.data,
      };
    } catch (error) {
      const err = error as Error;
      const processingTime = Date.now() - startTime;

      // Handle specific error types
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Timeout error
        if (axiosError.code === 'ECONNABORTED') {
          logger.error(
            { processingTime, timeout: this.timeout },
            '[Flask Business Analysis] Request timeout'
          );
          return {
            success: false,
            error: `Analysis timeout (exceeded ${this.timeout / 1000}s)`,
          };
        }

        // Connection refused
        if (
          axiosError.code === 'ECONNREFUSED' ||
          axiosError.message.includes('ECONNREFUSED')
        ) {
          logger.error(
            { baseURL: this.flaskBaseURL, processingTime },
            '[Flask Business Analysis] Cannot connect to Flask API'
          );
          return {
            success: false,
            error: `Cannot connect to Flask API at ${this.flaskBaseURL}`,
          };
        }

        // HTTP error response
        if (axiosError.response) {
          const status = axiosError.response.status;
          const data = axiosError.response.data as any;

          logger.error(
            {
              status,
              responseData: data,
              processingTime,
            },
            '[Flask Business Analysis] Flask API returned error'
          );

          return {
            success: false,
            error:
              data.error ||
              data.message ||
              `Flask API error: ${status}`,
          };
        }
      }

      // General error
      logger.error(
        { error: err.message, stack: err.stack, processingTime },
        '[Flask Business Analysis] Unexpected error during analysis'
      );

      return {
        success: false,
        error: `Analysis failed: ${err.message}`,
      };
    }
  }
}

// Export singleton instance
export const businessAnalysisService = new BusinessAnalysisService();
