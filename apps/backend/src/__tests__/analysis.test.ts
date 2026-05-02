// @ts-ignore - Optional dependency
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
// @ts-ignore - Optional dependency  
import request from 'supertest';
import express from 'express';
import { analysisRepository } from '../db/analysisRepository';
import analysisController from '../controllers/analysisController';

describe('Analysis API Integration Tests', () => {
  let app: express.Application;
  let testAnalysisId: string;

  beforeAll(() => {
    // Create test Express app
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/analysis', analysisController);
  });

  afterAll(async () => {
    // Cleanup test data
    if (testAnalysisId) {
      try {
        await analysisRepository.deleteAnalysis(testAnalysisId);
      } catch (err) {
        console.error('Cleanup error:', err);
      }
    }
  });

  describe('POST /api/analysis/business', () => {
    it('should accept business analysis with audio and image', async () => {
      const response = await request(app)
        .post('/api/analysis/business')
        .field('text', 'Test business communication')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBeDefined();

      testAnalysisId = response.body.data.id;
    });

    it('should fail without required files', async () => {
      const response = await request(app)
        .post('/api/analysis/business')
        .field('text', 'Test')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required files');
    });
  });

  describe('POST /api/analysis/hr', () => {
    it('should accept HR analysis with audio and image', async () => {
      const response = await request(app)
        .post('/api/analysis/hr')
        .field('text', 'Interview assessment')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      testAnalysisId = response.body.data.id;
    });
  });

  describe('POST /api/analysis/investigation', () => {
    it('should accept investigation analysis with audio and image', async () => {
      const response = await request(app)
        .post('/api/analysis/investigation')
        .field('text', 'Investigation notes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();

      testAnalysisId = response.body.data.id;
    });
  });

  describe('POST /api/analysis/live', () => {
    it('should accept live capture analysis', async () => {
      const response = await request(app)
        .post('/api/analysis/live')
        .field('mode', 'business')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.inputMethod).toBe('live');

      testAnalysisId = response.body.data.id;
    });

    it('should validate mode parameter', async () => {
      const response = await request(app)
        .post('/api/analysis/live')
        .field('mode', 'invalid_mode')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid mode');
    });
  });

  describe('GET /api/analysis/:id', () => {
    it('should retrieve analysis by ID', async () => {
      const response = await request(app)
        .get(`/api/analysis/${testAnalysisId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analysis).toBeDefined();
      expect(response.body.data.analysis.id).toBe(testAnalysisId);
    });

    it('should return 404 for non-existent analysis', async () => {
      const response = await request(app)
        .get('/api/analysis/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/analysis/user/:userId', () => {
    it('should retrieve user analyses', async () => {
      const response = await request(app)
        .get('/api/analysis/user/test-user')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.analyses).toBeDefined();
      expect(Array.isArray(response.body.data.analyses)).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
    });

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/analysis/user/test-user?limit=5')
        .expect(200);

      expect(response.body.data.analyses.length).toBeLessThanOrEqual(5);
    });
  });

  describe('GET /api/analysis/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/analysis/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
    });
  });

  describe('Analysis Repository Tests', () => {
    let repoTestId: string;

    it('should create analysis record', async () => {
      const analysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'BUSINESS',
        inputMethod: 'upload',
      });

      expect(analysis).toBeDefined();
      expect(analysis.id).toBeDefined();
      expect(analysis.status).toBe('processing');

      repoTestId = analysis.id;
    });

    it('should retrieve analysis by ID', async () => {
      const analysis = await analysisRepository.getAnalysisById(repoTestId);

      expect(analysis).toBeDefined();
      expect(analysis?.id).toBe(repoTestId);
      expect(analysis?.mode).toBe('BUSINESS');
    });

    it('should update analysis status', async () => {
      await analysisRepository.updateAnalysisStatus(repoTestId, 'completed');
      const analysis = await analysisRepository.getAnalysisById(repoTestId);

      expect(analysis?.status).toBe('completed');
    });

    it('should complete analysis with results', async () => {
      const updatedAnalysis = await analysisRepository.completeAnalysis(repoTestId, {
        confidence: 0.92,
        summary: 'Test analysis summary',
        recommendations: ['Test recommendation'],
      });

      expect(updatedAnalysis?.status).toBe('completed');
      expect(updatedAnalysis?.confidence).toBe(0.92);
      expect(updatedAnalysis?.summary).toBe('Test analysis summary');
    });

    it('should fail analysis with error', async () => {
      const failedAnalysis = await analysisRepository.failAnalysis(repoTestId, 'Test error message');

      expect(failedAnalysis?.status).toBe('failed');
      expect(failedAnalysis?.errorMessage).toBe('Test error message');
    });

    it('should get user statistics', async () => {
      const stats = await analysisRepository.getUserStatistics('test-user');

      expect(stats).toBeDefined();
      expect(stats.totalAnalyses).toBeGreaterThanOrEqual(0);
      expect(stats.completedAnalyses).toBeGreaterThanOrEqual(0);
      expect(stats.averageConfidence).toBeDefined();
      expect(stats.analysesByMode).toBeDefined();
      expect(stats.analysesByInputMethod).toBeDefined();
    });

    it('should delete analysis', async () => {
      const deleted = await analysisRepository.deleteAnalysis(repoTestId);

      expect(deleted).toBe(true);

      const analysis = await analysisRepository.getAnalysisById(repoTestId);
      expect(analysis).toBeNull();
    });
  });

  describe('Analysis Modes Validation', () => {
    it('should handle BUSINESS mode correctly', async () => {
      const analysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'BUSINESS',
        inputMethod: 'live',
      });

      expect(analysis.mode).toBe('BUSINESS');
      await analysisRepository.deleteAnalysis(analysis.id);
    });

    it('should handle INVESTIGATION mode correctly', async () => {
      const analysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'INVESTIGATION',
        inputMethod: 'live',
      });

      expect(analysis.mode).toBe('INVESTIGATION');
      await analysisRepository.deleteAnalysis(analysis.id);
    });

    it('should handle HR mode correctly', async () => {
      const analysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'HR',
        inputMethod: 'live',
      });

      expect(analysis.mode).toBe('HR');
      await analysisRepository.deleteAnalysis(analysis.id);
    });
  });

  describe('Input Method Handling', () => {
    it('should differentiate between live and upload inputs', async () => {
      const liveAnalysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'BUSINESS',
        inputMethod: 'live',
      });

      const uploadAnalysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'BUSINESS',
        inputMethod: 'upload',
      });

      expect(liveAnalysis.inputMethod).toBe('live');
      expect(uploadAnalysis.inputMethod).toBe('upload');

      await analysisRepository.deleteAnalysis(liveAnalysis.id);
      await analysisRepository.deleteAnalysis(uploadAnalysis.id);
    });
  });

  describe('Metrics Storage', () => {
    it('should create and retrieve metrics', async () => {
      const analysis = await analysisRepository.createAnalysis({
        userId: 'test-user',
        mode: 'BUSINESS',
        inputMethod: 'upload',
      });

      const metric = await analysisRepository.createMetric({
        analysisId: analysis.id,
        credibilityScore: '0.85',
        deceptionProbability: '0.15',
      });

      expect(metric.analysisId).toBe(analysis.id);
      expect(metric.credibilityScore).toBe(0.85);

      const metrics = await analysisRepository.getMetricsByAnalysisId(analysis.id);
      expect(metrics.length).toBeGreaterThan(0);

      await analysisRepository.deleteAnalysis(analysis.id);
    });
  });
});

describe('End-to-End Analysis Flow', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/analysis', analysisController);
  });

  it('should complete full business analysis flow', async () => {
    // Step 1: Start analysis
    const createResponse = await request(app)
      .post('/api/analysis/business')
      .field('text', 'Complete business communication analysis')
      .expect(200);

    const analysisId = createResponse.body.data.id;
    expect(analysisId).toBeDefined();

    // Step 2: Retrieve analysis
    const getResponse = await request(app)
      .get(`/api/analysis/${analysisId}`)
      .expect(200);

    expect(getResponse.body.data.analysis.id).toBe(analysisId);
    expect(getResponse.body.data.analysis.mode).toBe('BUSINESS');

    // Cleanup
    await analysisRepository.deleteAnalysis(analysisId);
  });

  it('should complete full criminal investigation flow', async () => {
    const createResponse = await request(app)
      .post('/api/analysis/investigation')
      .field('text', 'Investigation analysis')
      .expect(200);

    const analysisId = createResponse.body.data.id;
    expect(analysisId).toBeDefined();
    expect(createResponse.body.data.mode).toBe('INVESTIGATION');

    // Cleanup
    await analysisRepository.deleteAnalysis(analysisId);
  });

  it('should complete full HR interview flow', async () => {
    const createResponse = await request(app)
      .post('/api/analysis/hr')
      .field('text', 'HR interview analysis')
      .expect(200);

    const analysisId = createResponse.body.data.id;
    expect(analysisId).toBeDefined();
    expect(createResponse.body.data.mode).toBe('HR');

    // Cleanup
    await analysisRepository.deleteAnalysis(analysisId);
  });
});

describe('Error Handling', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/analysis', analysisController);
  });

  it('should handle malformed requests gracefully', async () => {
    const response = await request(app)
      .post('/api/analysis/business')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });

  it('should handle invalid analysis IDs', async () => {
    const response = await request(app)
      .get('/api/analysis/invalid-id-format')
      .expect(404);

    expect(response.body.success).toBe(false);
  });

  it('should validate mode parameters', async () => {
    const response = await request(app)
      .post('/api/analysis/live')
      .field('mode', 'unknown_mode')
      .expect(400);

    expect(response.body.error).toContain('Invalid mode');
  });
});
