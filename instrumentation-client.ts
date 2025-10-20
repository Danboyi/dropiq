import { clientConfig } from './sentry.client.config';
import * as Sentry from '@sentry/nextjs';

Sentry.init(clientConfig);