import pino from 'pino';
import * as Sentry from '@sentry/nextjs';

// Configure Pino logger for structured logging
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
    log: (object) => {
      // Add timestamp and environment to all logs
      return {
        ...object,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        service: 'dropiq-app',
        version: process.env.npm_package_version || '1.0.0'
      };
    }
  },
  // Pretty print in development, JSON in production
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined
});

// Enhanced logging functions with Sentry integration
export const structuredLogger = {
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(meta, message);
  },

  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(meta, message);
    // Send warnings to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureMessage(message, 'warning');
    }
  },

  error: (message: string, error?: Error | Record<string, any>, meta?: Record<string, any>) => {
    const errorMeta = {
      ...meta,
      ...(error instanceof Error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      } : { error })
    };

    logger.error(errorMeta, message);
    
    // Send errors to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      if (error instanceof Error) {
        Sentry.captureException(error);
      } else {
        Sentry.captureMessage(message, 'error');
      }
    }
  },

  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(meta, message);
  },

  // User action logging for analytics
  userAction: (userId: string, action: string, meta?: Record<string, any>) => {
    logger.info({
      userId,
      action,
      category: 'user_action',
      ...meta
    }, `User action: ${action}`);
  },

  // API request logging
  apiRequest: (method: string, url: string, statusCode: number, responseTime: number, meta?: Record<string, any>) => {
    logger.info({
      method,
      url,
      statusCode,
      responseTime,
      category: 'api_request',
      ...meta
    }, `${method} ${url} - ${statusCode} (${responseTime}ms)`);
  },

  // Security event logging
  securityEvent: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: Record<string, any>) => {
    const securityMeta = {
      event,
      severity,
      category: 'security',
      ...meta
    };

    if (severity === 'high' || severity === 'critical') {
      logger.error(securityMeta, `Security event: ${event}`);
      // Send high severity events to Sentry
      if (process.env.NODE_ENV === 'production') {
        Sentry.captureMessage(`Security event: ${event}`, 'error');
      }
    } else {
      logger.warn(securityMeta, `Security event: ${event}`);
    }
  },

  // Performance logging
  performance: (operation: string, duration: number, meta?: Record<string, any>) => {
    logger.info({
      operation,
      duration,
      category: 'performance',
      ...meta
    }, `Performance: ${operation} took ${duration}ms`);
  },

  // Database operation logging
  database: (operation: string, table: string, duration?: number, meta?: Record<string, any>) => {
    const dbMeta = {
      operation,
      table,
      category: 'database',
      ...(duration && { duration })
    };

    logger.info(dbMeta, `Database: ${operation} on ${table}${duration ? ` (${duration}ms)` : ''}`);
  }
};

// Create a child logger with additional context
export const createChildLogger = (context: Record<string, any>) => {
  return logger.child(context);
};

// Default export for backward compatibility
export default logger;