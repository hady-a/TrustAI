/**
 * TrustAI Backend - Flask AI Service
 * Service for communicating with the Python Flask AI API
 * 
 * This service handles:
 * - File upload to Flask API
 * - Analysis request management
 * - Response parsing and caching
 * - Error handling and retries
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

export interface AnalysisResult {
  success: boolean;
  message: string;
  data: {
    mode: string;
    analysis: {
      face?: object;
      voice?: object;
      credibility?: object;
      deception?: object;
    };
    report?: object;
    errors?: string[];
  };
  timestamp: string;
}

export interface AnalysisRequest {
  audioPath: string;
  imagePath: string;
  text?: string;
}

/**
 * FlaskAIService
 * Backend service for Flask AI API communication
 */
export class FlaskAIService {
  private api: AxiosInstance;
  private baseUrl: string;
  private timeout: number;
  private cache: Map<string, AnalysisResult>;
  private maxRetries: number;

  constructor(
    flaskUrl: string = 'http://localhost:5000',
    timeout: number = 300000, // 5 minutes
    enableCache: boolean = true
  ) {
    this.baseUrl = flaskUrl;
    this.timeout = timeout;
    this.maxRetries = 3;
    this.cache = new Map();

    // Initialize axios instance
    this.api = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      response => response,
      error => {
        console.error('Flask API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check API health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/api/health');
      return response.data.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  /**
   * Get API information
   */
  async getAPIInfo(): Promise<any> {
    try {
      const response = await this.api.get('/api/info');
      return response.data;
    } catch (error) {
      console.error('Failed to get API info:', error);
      throw error;
    }
  }

  /**
   * Business Mode Analysis
   */
  async analyzeBusinessMode(request: AnalysisRequest): Promise<AnalysisResult> {
    return this._analyzeWithRetry(
      '/api/analyze/business',
      request,
      'business'
    );
  }

  /**
   * HR Interview Mode Analysis
   */
  async analyzeHRMode(request: AnalysisRequest): Promise<AnalysisResult> {
    return this._analyzeWithRetry(
      '/api/analyze/hr',
      request,
      'hr'
    );
  }

  /**
   * Investigation Mode Analysis
   */
  async analyzeInvestigationMode(request: AnalysisRequest): Promise<AnalysisResult> {
    return this._analyzeWithRetry(
      '/api/analyze/investigation',
      request,
      'investigation'
    );
  }

  /**
   * Internal: Analyze with retry logic
   */
  private async _analyzeWithRetry(
    endpoint: string,
    request: AnalysisRequest,
    mode: string,
    attempt: number = 1
  ): Promise<AnalysisResult> {
    try {
      // Check cache first
      const cacheKey = this._generateCacheKey(request);
      if (this.cache.has(cacheKey)) {
        console.log('Returning cached result:', cacheKey);
        return this.cache.get(cacheKey)!;
      }

      // Validate files exist
      if (!fs.existsSync(request.audioPath)) {
        throw new Error(`Audio file not found: ${request.audioPath}`);
      }
      if (!fs.existsSync(request.imagePath)) {
        throw new Error(`Image file not found: ${request.imagePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(request.audioPath));
      formData.append('image', fs.createReadStream(request.imagePath));
      if (request.text) {
        formData.append('text', request.text);
      }

      // Make request
      const response = await this.api.post(endpoint, formData, {
        headers: formData.getHeaders()
      });

      const result = response.data as AnalysisResult;

      // Cache the result
      if (result.success) {
        const cacheKey = this._generateCacheKey(request);
        this.cache.set(cacheKey, result);
      }

      return result;
    } catch (error: any) {
      // Retry logic
      if (attempt < this.maxRetries) {
        console.log(`Retry attempt ${attempt + 1}/${this.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return this._analyzeWithRetry(endpoint, request, mode, attempt + 1);
      }

      throw new Error(`Analysis failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  /**
   * Stream large files in chunks
   */
  async analyzeWithStreamedFiles(
    endpoint: string,
    audioPath: string,
    imagePath: string,
    text?: string,
    onProgress?: (progress: number) => void
  ): Promise<AnalysisResult> {
    try {
      const formData = new FormData();

      // Add files
      const audioStream = fs.createReadStream(audioPath);
      const imageStream = fs.createReadStream(imagePath);

      formData.append('audio', audioStream);
      formData.append('image', imageStream);
      if (text) formData.append('text', text);

      // Make request with progress tracking
      const response = await this.api.post(endpoint, formData, {
        headers: formData.getHeaders(),
        onUploadProgress: (progressEvent: any) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return response.data as AnalysisResult;
    } catch (error: any) {
      throw new Error(`Stream analysis failed: ${error.message}`);
    }
  }

  /**
   * Get cached result
   */
  getCachedResult(request: AnalysisRequest): AnalysisResult | undefined {
    const cacheKey = this._generateCacheKey(request);
    return this.cache.get(cacheKey);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Set custom timeout
   */
  setTimeout(timeout: number): void {
    this.timeout = timeout;
  }

  /**
   * Set max retries
   */
  setMaxRetries(retries: number): void {
    this.maxRetries = retries;
  }

  /**
   * Internal: Generate cache key
   */
  private _generateCacheKey(request: AnalysisRequest): string {
    const audioHash = this._hashFile(request.audioPath);
    const imageHash = this._hashFile(request.imagePath);
    const textHash = request.text ? Buffer.from(request.text).toString('base64') : '';
    return `${audioHash}-${imageHash}-${textHash}`;
  }

  /**
   * Internal: Simple file hash
   */
  private _hashFile(filePath: string): string {
    const stat = fs.statSync(filePath);
    return `${stat.size}-${stat.mtime.getTime()}`;
  }
}

/**
 * Express Middleware for Flask API health checking
 */
export function flaskHealthCheckMiddleware(flaskService: FlaskAIService) {
  return async (req: any, res: any, next: any) => {
    try {
      const isHealthy = await flaskService.healthCheck();
      res.locals.flaskAPIHealthy = isHealthy;

      if (!isHealthy) {
        console.warn('Flask API is not responding');
      }
    } catch (error) {
      console.error('Flask health check error:', error);
      res.locals.flaskAPIHealthy = false;
    }

    next();
  };
}

/**
 * Express Route Handler Example
 */
export async function handleAnalysisRequest(
  flaskService: FlaskAIService,
  mode: 'business' | 'hr' | 'investigation'
) {
  return async (req: any, res: any) => {
    try {
      const { audioPath, imagePath, text } = req.body;

      if (!audioPath || !imagePath) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: audioPath, imagePath'
        });
      }

      const result = await (
        mode === 'business' ? flaskService.analyzeBusinessMode({ audioPath, imagePath, text }) :
        mode === 'hr' ? flaskService.analyzeHRMode({ audioPath, imagePath, text }) :
        flaskService.analyzeInvestigationMode({ audioPath, imagePath, text })
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  };
}

/**
 * Export singleton instance
 */
const flaskAIService = new FlaskAIService();
export default flaskAIService;
