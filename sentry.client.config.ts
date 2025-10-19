import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const clientConfig = {
  dsn: SENTRY_DSN,
  debug: false,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/yourdomain\.com/,
      ],
    }),
  ],

  // beforeSend filter to reduce noise
  beforeSend(event) {
    // Filter out certain errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('Non-Error promise rejection')) {
        return null;
      }
    }
    return event;
  },

  // Custom tags and context
  beforeSendTransaction(transaction) {
    transaction.setTag('service', 'dropiq-frontend');
    return transaction;
  }
};