/**
 * Sentry Configuration for Railway
 * Error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export interface SentryConfig {
  dsn: string;
  environment: string;
  serviceName: string;
  release?: string;
}

class SentryManager {
  private isInitialized = false;

  initialize(config: SentryConfig) {
    if (this.isInitialized || !config.dsn) {
      return;
    }

    try {
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        serviceName: config.serviceName,
        release: config.release,
        integrations: [
          // Enable Node.js profiling
          nodeProfilingIntegration(),
          // Add HTTP tracing
          new Sentry.Integrations.Http({ tracing: true }),
          // Add Express integration if available
          ...(typeof window === 'undefined' ? [new Sentry.Integrations.Express({ app: null })] : []),
        ],
        // Performance monitoring
        tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
        // Session replay
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        // Before sending events
        beforeSend(event) {
          // Filter out sensitive data
          if (event.request) {
            // Remove headers that might contain sensitive information
            if (event.request.headers) {
              delete event.request.headers.authorization;
              delete event.request.headers.cookie;
              delete event.request.headers['x-api-key'];
            }
          }
          return event;
        },
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  // Capture exceptions
  captureException(error: Error, context?: Record<string, any>) {
    if (this.isInitialized) {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
    }
  }

  // Capture messages
  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (this.isInitialized) {
      Sentry.captureMessage(message, level, {
        contexts: { custom: context },
      });
    }
  }

  // Set user context
  setUser(user: { id: string; email?: string; username?: string }) {
    if (this.isInitialized) {
      Sentry.setUser(user);
    }
  }

  // Clear user context
  clearUser() {
    if (this.isInitialized) {
      Sentry.setUser(null);
    }
  }

  // Add breadcrumb
  addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
    if (this.isInitialized) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  }

  // Start transaction for performance monitoring
  startTransaction(name: string, op: string = 'custom') {
    if (this.isInitialized) {
      return Sentry.startTransaction({
        name,
        op,
      });
    }
    return null;
  }

  // Get initialization status
  isActive() {
    return this.isInitialized;
  }
}

// Export singleton instance
export const sentry = new SentryManager();

// Auto-initialize if environment variables are available
const dsn = process.env.SENTRY_DSN;
if (dsn) {
  sentry.initialize({
    dsn,
    environment: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    serviceName: process.env.RAILWAY_SERVICE_NAME || 'dropiq',
    release: process.env.RAILWAY_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  });
}

// Express middleware for error handling
export const sentryErrorHandler = () => {
  return (error: Error, req: any, res: any, next: any) => {
    // Add request context to Sentry
    sentry.addBreadcrumb({
      category: 'express',
      message: `${req.method} ${req.url}`,
      level: 'info',
      data: {
        method: req.method,
        url: req.url,
        headers: req.headers,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
      },
    });

    // Capture the exception
    sentry.captureException(error, {
      requestId: req.requestId,
      userId: req.user?.id,
      method: req.method,
      url: req.url,
    });

    // Pass error to next middleware
    next(error);
  };
};

// Request handler for Express
export const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

// Performance monitoring middleware
export const performanceMiddleware = () => {
  return (req: any, res: any, next: any) => {
    const transaction = sentry.startTransaction(`${req.method} ${req.url}`, 'http.server');
    
    if (transaction) {
      // Set transaction on request for later access
      req.sentryTransaction = transaction;
      
      // Finish transaction when response ends
      res.on('finish', () => {
        transaction.setHttpStatus(res.statusCode);
        transaction.finish();
      });
    }
    
    next();
  };
};