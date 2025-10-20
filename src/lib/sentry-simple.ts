/**
 * Simplified Sentry Configuration for Railway
 * Basic error tracking without advanced features
 */

import * as Sentry from '@sentry/nextjs';

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
        tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Sentry:', error);
    }
  }

  captureException(error: Error, context?: Record<string, any>) {
    if (this.isInitialized) {
      Sentry.captureException(error, {
        contexts: { custom: context },
      });
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info', context?: Record<string, any>) {
    if (this.isInitialized) {
      Sentry.captureMessage(message, level, {
        contexts: { custom: context },
      });
    }
  }

  isActive() {
    return this.isInitialized;
  }
}

export const sentry = new SentryManager();

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  sentry.initialize({
    dsn,
    environment: process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    serviceName: process.env.RAILWAY_SERVICE_NAME || 'dropiq',
    release: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown',
  });
}