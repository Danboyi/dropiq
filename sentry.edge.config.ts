import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const edgeConfig = {
  dsn: SENTRY_DSN,
  debug: false,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Edge runtime specific configuration
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      service: 'dropiq-edge',
      runtime: 'edge'
    };
    return event;
  }
};