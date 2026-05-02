import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const FLASK_API_URL = process.env.FLASK_URL || 'http://localhost:8000';

interface AnalysisRequest {
  mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW' | 'INVESTIGATION';
  audioPath?: string;
  videoPath?: string;
  videoBlob?: Buffer;
  audioBlob?: Buffer;
}

interface AnalysisResponse {
  id: string;
  mode: string;
  confidence: number;
  summary: string;
  faceAnalysis?: Record<string, any>;
  voiceAnalysis?: Record<string, any>;
  credibilityAnalysis?: Record<string, any>;
  recommendations?: string[];
  timestamp: string;
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

export class AnalysisService {
  /**
   * Send blobs to Flask for analysis
   */
  async analyzeFromBlobs(
    mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW' | 'INVESTIGATION',
    videoBlob: Buffer,
    audioBlob: Buffer
  ): Promise<AnalysisResponse> {
    try {
      const endpoint = getFlaskEndpointForMode(mode);
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('video', videoBlob, 'recording.webm');
      formData.append('audio', audioBlob, 'audio.wav');

      const response = await axios.post(
        `${FLASK_API_URL}${endpoint}`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000, // 5 minutes
        }
      );

      return response.data.data;
    } catch (error) {
      throw new Error(`Blob analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send file path to Flask for analysis
   */
  async analyzeFromFile(
    mode: 'BUSINESS' | 'CRIMINAL' | 'INTERVIEW' | 'INVESTIGATION',
    filePath: string
  ): Promise<AnalysisResponse> {
    try {
      const endpoint = getFlaskEndpointForMode(mode);
      const formData = new FormData();
      formData.append('mode', mode);
      formData.append('audio', fs.createReadStream(filePath), path.basename(filePath));

      const response = await axios.post(
        `${FLASK_API_URL}${endpoint}`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 300000, // 5 minutes
        }
      );

      return response.data.data;
    } catch (error) {
      throw new Error(`File analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze business mode
   */
  async analyzeBusiness(videoBlob: Buffer, audioBlob: Buffer): Promise<AnalysisResponse> {
    return this.analyzeFromBlobs('BUSINESS', videoBlob, audioBlob);
  }

  /**
   * Analyze criminal mode
   */
  async analyzeCriminal(videoBlob: Buffer, audioBlob: Buffer): Promise<AnalysisResponse> {
    return this.analyzeFromBlobs('CRIMINAL', videoBlob, audioBlob);
  }

  /**
   * Analyze interview mode
   */
  async analyzeInterview(videoBlob: Buffer, audioBlob: Buffer): Promise<AnalysisResponse> {
    return this.analyzeFromBlobs('INTERVIEW', videoBlob, audioBlob);
  }

  /**
   * Check Flask API health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${FLASK_API_URL}/health`, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export default new AnalysisService();
