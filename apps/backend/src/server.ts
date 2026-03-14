import 'express-async-errors'; // Must be at the very top
import dotenv from "dotenv";

// Load environment variables IMMEDIATELY
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
  console.error('Make sure your .env file exists with all required variables');
  process.exit(1);
}

import express, { Express, Request, Response } from "express";
import cors from "cors";
import pinoHttp from 'pino-http';
import { logger } from './lib/logger';
import { errorHandler } from './middleware/errorHandler';
import { setupSwagger } from './lib/swagger';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import authRoutes from './routes/auth.routes';
import analysisRoutes from './routes/analysis.routes';
import userRoutes from './routes/user.routes';
import adminRoutes from './routes/admin.routes';
import systemSettingsRoutes from './routes/systemSettings.routes';
import { pool, checkDatabaseConnection, db } from './db';
import { users } from './db/schema/users';
import { eq } from 'drizzle-orm';

const app: Express = express();
const PORT: string | number = process.env.PORT || 9999;

// ============================================================================
// CORS CONFIGURATION
// ============================================================================

const corsOptions = {
  origin: function (origin: any, callback: any) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
      'http://127.0.0.1:3000',
    ];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️  CORS request from blocked origin: ${origin}`);
      callback(null, true); // Allow for development
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(pinoHttp({ logger }));

// Apply general rate limiting to all API routes
app.use('/api/', generalLimiter);

// ============================================================================
// HEALTH & DIAGNOSTIC ENDPOINTS
// ============================================================================

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "TrustAI Backend Running 🚀" });
});

app.get("/api/health", async (req: Request, res: Response) => {
  // Quick health check without blocking
  res.json({ 
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      configured: !!process.env.DATABASE_URL,
    },
    auth: {
      jwtConfigured: !!process.env.JWT_SECRET,
      googleConfigured: !!process.env.GOOGLE_CLIENT_ID,
    },
  });
});

app.get("/api/health/ready", async (req: Request, res: Response) => {
  // Readiness check - includes database connectivity
  const dbReady = await checkDatabaseConnection(1);
  
  if (!dbReady) {
    return res.status(503).json({
      status: "not_ready",
      reason: "database_unavailable",
    });
  }
  
  res.json({ status: "ready" });
});

// ============================================================================
// TEST ENDPOINTS (for debugging)
// ============================================================================

// Test endpoint to verify API connectivity and response format
app.get("/api/test/login-response", (req: Request, res: Response) => {
  console.log('[Test] Returning mock login response for debugging');
  res.json({
    success: true,
    message: 'Test login response',
    data: {
      user: {
        id: 'test-user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InRlc3QtdXNlci0xMjMiLCJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsImlhdCI6MTcwOTY1OTIwMH0.test-signature',
    },
  });
});

// Debug endpoint: Check if a user exists and has a password
app.post("/api/test/check-user", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    const foundUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));

    if (foundUsers.length === 0) {
      return res.json({
        exists: false,
        message: `User ${email} does not exist in database`,
      });
    }

    const user = foundUsers[0];
    res.json({
      exists: true,
      email: user.email,
      name: user.name,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0,
      message: user.password ? 'User has a password hash' : 'User has NO password (OAuth only)',
    });
  } catch (error) {
    console.error('[Test] Error in check-user:', error);
    res.status(500).json({ error: String(error) });
  }
});

// ============================================================================
// API ROUTES
// ============================================================================

app.use('/api/auth', authRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', systemSettingsRoutes);

// Setup Swagger documentation
setupSwagger(app);

// ============================================================================
// ERROR HANDLING (must be last)
// ============================================================================

app.use(errorHandler);

// ============================================================================
// SERVER STARTUP & SHUTDOWN
// ============================================================================

let isShuttingDown = false;

async function startServer() {
  try {
    console.log('\n🚀 Starting TrustAI Backend Server...\n');
    
    // Verify database connection before starting
    console.log('📊 Verifying database connection...');
    const dbConnected = await checkDatabaseConnection(5);
    
    if (!dbConnected) {
      console.error('\n❌ Database connection failed. Server startup aborted.');
      console.error('   Make sure:');
      console.error('   1. PostgreSQL is running: brew services list | grep postgres');
      console.error('   2. Database exists: createdb trustai');
      console.error('   3. DATABASE_URL in .env is correct');
      console.error('   4. Migrations are applied: npm run db:push\n');
      process.exit(1);
    }

    // Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`✅ Server running on http://localhost:${PORT}`);
      logger.info(`🔐 JWT_SECRET is ${process.env.JWT_SECRET ? 'set' : 'NOT SET'}`);
      logger.info(`📊 Database: ${process.env.DATABASE_URL ? 'configured' : 'NOT configured'}`);
      logger.info(`🔑 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'configured' : 'NOT configured'}`);
      logger.info('\n✨ Server ready to accept requests\n');
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN HANDLER
    // ========================================================================
    
    const gracefulShutdown = async (signal: NodeJS.Signals) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(`\n${signal} received. Initiating graceful shutdown...\n`);

      // Stop accepting new requests
      server.close(async () => {
        console.log('✅ HTTP server closed');
        
        try {
          // Close database pool
          await pool.end();
          console.log('✅ Database pool closed gracefully');
        } catch (err) {
          console.error('❌ Error closing database pool:', err);
        }

        console.log('✨ Shutdown complete\n');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('\n⏱️  Forced shutdown - graceful shutdown exceeded timeout');
        process.exit(1);
      }, 30000);
    };

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// ============================================================================
// START SERVER
// ============================================================================

startServer();

