import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TrustAI API Documentation',
      version: '1.0.0',
      description: 'Multimodal Evidence Risk Analysis Platform API',
      contact: {
        name: 'TrustAI Support',
        email: 'support@trustai.io',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:9999',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Analysis: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            status: {
              type: 'string',
              enum: ['UPLOADED', 'QUEUED', 'PROCESSING', 'AI_ANALYZED', 'COMPLETED', 'FAILED'],
            },
            modes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['CRIMINAL', 'INTERVIEW', 'INVESTIGATION', 'BUSINESS'],
              },
            },
            overallRiskScore: { type: 'integer', minimum: 0, maximum: 100 },
            confidenceLevel: { type: 'number', format: 'float' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        File: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            analysisId: { type: 'string', format: 'uuid' },
            fileType: { type: 'string', enum: ['VIDEO', 'AUDIO', 'TEXT'] },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
            size: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        AnalysisStatusHistory: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            analysisId: { type: 'string', format: 'uuid' },
            oldStatus: { type: 'string' },
            newStatus: { type: 'string' },
            changedAt: { type: 'string', format: 'date-time' },
          },
        },
        SystemMetrics: {
          type: 'object',
          properties: {
            totalUsers: { type: 'integer' },
            totalAnalyses: { type: 'integer' },
            analysesToday: { type: 'integer' },
            averageProcessingTimeMs: { type: 'integer' },
            successRate: { type: 'number' },
            successRatePercentage: { type: 'number' },
            failedAnalyses: { type: 'integer' },
            completedAnalyses: { type: 'integer' },
            processingAnalyses: { type: 'integer' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    path.join(__dirname, '../routes/*.routes.ts'),
    path.join(__dirname, '../routes/*.routes.js'),
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api/docs', swaggerUi.serve);
  app.get(
    '/api/docs',
    swaggerUi.setup(specs, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showRequestHeaders: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui { padding-top: 20px; }
      `,
    })
  );

  // Also serve a JSON version for external tools
  app.get('/api/docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

export default specs;
