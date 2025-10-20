import { clientConfig } from './sentry.client.config';
import * as Sentry from '@sentry/nextjs';

Sentry.init(clientConfig);

// Export required Sentry hooks for Next.js
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;