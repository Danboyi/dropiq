import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

export const serverConfig = {
  dsn: SENTRY_DSN,
  debug: false,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: true }),
  ],

  // beforeSend filter
  beforeSend(event) {
    // Add custom context
    event.tags = {
      ...event.tags,
      service: 'dropiq-backend',
      runtime: 'node'
    };

    // Filter out certain errors
    if (event.exception) {
      const error = event.exception.values?.[0];
      if (error?.value?.includes('Non-Error promise rejection')) {
        return null;
      }
    }

    return event;
  },

  // Custom context for all events
  beforeBreadcrumb(breadcrumb) {
    // Filter out sensitive breadcrumbs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
      // Remove sensitive query parameters
      const url = new URL(breadcrumb.data.url);
      url.searchParams.delete('token');
      url.searchParams.delete('password');
      url.searchParams.delete('secret');
      breadcrumb.data.url = url.toString();
    }

    return breadcrumb;
  }
};