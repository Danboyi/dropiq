import { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from '@/lib/logger';

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://dropiq.app',
      'https://www.dropiq.app',
      'https://api.dropiq.app'
    ];

    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS violation', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Request-ID',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count',
    'X-Request-ID',
    'X-Rate-Limit-Limit',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  maxAge: 86400 // 24 hours
};

// Custom CORS middleware with additional security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.dropiq.app wss://api.dropiq.app",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);

  // API-specific headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Server-Time', new Date().toISOString());

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] as string;

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId,
    userId: (req as any).user?.id,
    apiKey: (req as any).apiKey?.id
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestId,
      userId: (req as any).user?.id,
      contentLength: res.get('Content-Length')
    });
  });

  next();
};

// Health check middleware
export const healthCheck = (req: Request, res: Response): void => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    services: {
      database: 'unknown', // Will be updated by health check service
      redis: 'unknown',
      external: 'unknown'
    }
  };

  res.status(200).json(health);
};

// API versioning middleware
export const apiVersioning = (req: Request, res: Response, next: NextFunction): void => {
  const version = req.headers['api-version'] || req.query.version || '1.0.0';
  req.headers['api-version'] = version as string;
  
  // Validate API version
  const supportedVersions = ['1.0.0'];
  if (!supportedVersions.includes(version as string)) {
    res.status(400).json({
      error: 'Unsupported API Version',
      message: `Version ${version} is not supported. Supported versions: ${supportedVersions.join(', ')}`,
      supportedVersions
    });
    return;
  }

  next();
};

// Export the main CORS middleware
export const corsMiddleware = cors(corsOptions);