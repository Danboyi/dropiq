/**
 * Railway-Optimized Structured Logger
 * Provides structured logging optimized for Railway's log aggregation
 */

export interface LogContext {
  requestId?: string;
  userId?: string;
  service?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: Error;
  [key: string]: any;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

class RailwayLogger {
  private isProduction = process.env.NODE_ENV === 'production';
  private serviceName = process.env.RAILWAY_SERVICE_NAME || 'dropiq';
  private environment = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development';

  private formatMessage(level: LogLevel, message: string, context: LogContext = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      environment: this.environment,
      ...context,
    };

    // Add error details if present
    if (context.error) {
      logEntry.error = {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack,
      };
    }

    return JSON.stringify(logEntry);
  }

  error(message: string, context: LogContext = {}) {
    const formatted = this.formatMessage(LogLevel.ERROR, message, context);
    if (this.isProduction) {
      console.error(formatted);
    } else {
      console.error(`🔴 ${message}`, context);
    }
  }

  warn(message: string, context: LogContext = {}) {
    const formatted = this.formatMessage(LogLevel.WARN, message, context);
    if (this.isProduction) {
      console.warn(formatted);
    } else {
      console.warn(`🟡 ${message}`, context);
    }
  }

  info(message: string, context: LogContext = {}) {
    const formatted = this.formatMessage(LogLevel.INFO, message, context);
    if (this.isProduction) {
      console.log(formatted);
    } else {
      console.log(`🟢 ${message}`, context);
    }
  }

  debug(message: string, context: LogContext = {}) {
    if (!this.isProduction) {
      const formatted = this.formatMessage(LogLevel.DEBUG, message, context);
      console.log(`🔵 ${message}`, context);
    }
  }

  // HTTP request logging helper
  logRequest(req: any, res: any, duration: number) {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
    });
  }

  // Database operation logging
  logDatabase(operation: string, table: string, duration: number, context: LogContext = {}) {
    this.debug(`Database ${operation}`, {
      operation,
      table,
      duration,
      ...context,
    });
  }

  // Security event logging
  logSecurity(event: string, severity: 'low' | 'medium' | 'high', context: LogContext = {}) {
    this.warn(`Security Event: ${event}`, {
      securityEvent: event,
      severity,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Performance logging
  logPerformance(operation: string, duration: number, context: LogContext = {}) {
    if (duration > 1000) { // Log slow operations
      this.warn(`Slow Operation: ${operation}`, {
        operation,
        duration,
        ...context,
      });
    } else {
      this.debug(`Performance: ${operation}`, {
        operation,
        duration,
        ...context,
      });
    }
  }
}

// Export singleton instance
export const logger = new RailwayLogger();

// Request ID middleware for Express
export const requestIdMiddleware = () => {
  return (req: any, res: any, next: any) => {
    req.requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.setHeader('X-Request-ID', req.requestId);
    next();
  };
};

// Error logging utility
export const logError = (error: Error, context: LogContext = {}) => {
  logger.error('Unhandled Error', {
    error,
    ...context,
  });
};

// Performance monitoring utility
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context: LogContext = {}
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.logPerformance(operation, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`Failed Operation: ${operation}`, {
      operation,
      duration,
      error: error as Error,
      ...context,
    });
    throw error;
  }
};