import pino from 'pino';

/**
 * Logger Configuration
 * Centralized logging using Pino for structured logging
 * Includes request/response logging and error tracking
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Request logger middleware for Express
 * Logs incoming requests and outgoing responses
 */
export const createRequestLogger = () => {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${duration}ms`,
          userId: req.user?.id || 'anonymous',
        },
        'HTTP Request'
      );
    });

    next();
  };
};

/**
 * Error logger - logs errors with full context
 */
export const logError = (error: Error, context: Record<string, any> = {}) => {
  logger.error(
    {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      ...context,
    },
    'Error occurred'
  );
};

/**
 * Job logger - logs queue job events
 */
export const logJob = (
  jobId: string,
  event: 'started' | 'completed' | 'failed' | 'retry' | 'progress',
  data: Record<string, any> = {}
) => {
  logger.info(
    {
      jobId,
      event,
      ...data,
    },
    `Job ${event}`
  );
};

export default logger;
