/**
 * Railway Logger Enhancer
 * Enhances the existing Winston logger with Railway-specific features and Sentry integration
 */

import { logger } from './logger';
import { sentry } from './sentry';

export interface RailwayLogContext {
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

class RailwayLoggerEnhancer {
  private serviceName = process.env.RAILWAY_SERVICE_NAME || 'dropiq';
  private environment = process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development';

  // Enhanced error logging with Sentry integration
  error(message: string, context: RailwayLogContext = {}) {
    // Log to Winston
    logger.error(message, {
      service: this.serviceName,
      environment: this.environment,
      ...context,
    });

    // Send to Sentry
    if (context.error) {
      sentry.captureException(context.error, {
        logMessage: message,
        ...context,
      });
    } else {
      sentry.captureMessage(message, 'error', context);
    }
  }

  // Enhanced warning logging
  warn(message: string, context: RailwayLogContext = {}) {
    logger.warn(message, {
      service: this.serviceName,
      environment: this.environment,
      ...context,
    });

    // Send warnings to Sentry in production
    if (process.env.NODE_ENV === 'production') {
      sentry.captureMessage(message, 'warning', context);
    }
  }

  // Enhanced info logging with Sentry breadcrumbs
  info(message: string, context: RailwayLogContext = {}) {
    logger.info(message, {
      service: this.serviceName,
      environment: this.environment,
      ...context,
    });

    // Add breadcrumb to Sentry
    sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  }

  // Debug logging (only in development)
  debug(message: string, context: RailwayLogContext = {}) {
    if (process.env.NODE_ENV !== 'production') {
      logger.debug(message, {
        service: this.serviceName,
        environment: this.environment,
        ...context,
      });
    }
  }

  // HTTP request logging with performance tracking
  logHttpRequest(req: any, res: any, duration: number) {
    const context = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      requestId: req.requestId,
      userId: req.user?.id,
    };

    if (res.statusCode >= 400) {
      this.error(`HTTP ${res.statusCode}: ${req.method} ${req.url}`, context);
    } else {
      this.info(`HTTP ${res.statusCode}: ${req.method} ${req.url}`, context);
    }

    // Add performance breadcrumb
    sentry.addBreadcrumb({
      category: 'http',
      message: `${req.method} ${req.url}`,
      level: res.statusCode >= 400 ? 'error' : 'info',
      data: context,
    });
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, context: RailwayLogContext = {}) {
    const logContext = {
      operation,
      table,
      duration,
      ...context,
    };

    if (duration > 1000) {
      this.warn(`Slow Database Operation: ${operation} on ${table}`, logContext);
    } else {
      this.debug(`Database Operation: ${operation} on ${table}`, logContext);
    }
  }

  // Security event logging
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context: RailwayLogContext = {}) {
    const logContext = {
      securityEvent: event,
      severity,
      timestamp: new Date().toISOString(),
      ...context,
    };

    if (severity === 'high') {
      this.error(`Security Event: ${event}`, logContext);
      sentry.captureMessage(`Critical Security Event: ${event}`, 'error', logContext);
    } else if (severity === 'medium') {
      this.warn(`Security Event: ${event}`, logContext);
      sentry.captureMessage(`Security Event: ${event}`, 'warning', logContext);
    } else {
      this.info(`Security Event: ${event}`, logContext);
    }
  }

  // Performance monitoring
  logPerformance(operation: string, duration: number, context: RailwayLogContext = {}) {
    const logContext = {
      operation,
      duration,
      ...context,
    };

    if (duration > 5000) { // Very slow operations
      this.error(`Very Slow Operation: ${operation}`, logContext);
    } else if (duration > 1000) { // Slow operations
      this.warn(`Slow Operation: ${operation}`, logContext);
    } else {
      this.debug(`Performance: ${operation}`, logContext);
    }

    // Add performance breadcrumb
    sentry.addBreadcrumb({
      category: 'performance',
      message: operation,
      level: duration > 1000 ? 'warning' : 'info',
      data: logContext,
    });
  }

  // User action tracking
  logUserAction(action: string, userId: string, context: RailwayLogContext = {}) {
    this.info(`User Action: ${action}`, {
      userId,
      action,
      ...context,
    });
  }

  // External service call logging
  logExternalService(service: string, endpoint: string, statusCode: number, duration: number, context: RailwayLogContext = {}) {
    const logContext = {
      service,
      endpoint,
      statusCode,
      duration,
      ...context,
    };

    if (statusCode >= 400) {
      this.error(`External Service Error: ${service} ${endpoint}`, logContext);
    } else {
      this.info(`External Service Call: ${service} ${endpoint}`, logContext);
    }
  }

  // Set user context for Sentry
  setUserContext(user: { id: string; email?: string; username?: string }) {
    sentry.setUser(user);
    this.info('User session started', { userId: user.id });
  }

  // Clear user context
  clearUserContext() {
    sentry.clearUser();
    this.info('User session ended');
  }

  // Railway deployment logging
  logDeployment(deploymentInfo: { version: string; commitSha: string; branch: string }) {
    this.info('Application deployed', {
      type: 'deployment',
      ...deploymentInfo,
      timestamp: new Date().toISOString(),
    });
  }

  // Health check logging
  logHealthCheck(status: 'healthy' | 'unhealthy', details: any) {
    if (status === 'healthy') {
      this.debug('Health check passed', details);
    } else {
      this.error('Health check failed', details);
    }
  }
}

// Export singleton instance
export const railwayLogger = new RailwayLoggerEnhancer();

// Export convenience functions that match the existing logger interface
export const logUserAction = (userId: string, action: string, details?: any) => {
  railwayLogger.logUserAction(action, userId, details);
};

export const logApiCall = (method: string, path: string, statusCode: number, duration: number, userId?: string) => {
  railwayLogger.logHttpRequest(
    { method, url: path, user: userId ? { id: userId } : undefined },
    { statusCode },
    duration
  );
};

export const logSecurityEvent = (event: string, details: any) => {
  const severity = details.severity || 'medium';
  railwayLogger.logSecurityEvent(event, severity, details);
};

export const logDatabaseQuery = (query: string, duration: number, error?: string) => {
  if (error) {
    railwayLogger.error('Database query failed', { query, duration, error });
  } else {
    railwayLogger.logDatabaseOperation('query', 'unknown', duration, { query });
  }
};

export const logExternalServiceCall = (service: string, endpoint: string, statusCode: number, duration: number) => {
  railwayLogger.logExternalService(service, endpoint, statusCode, duration);
};