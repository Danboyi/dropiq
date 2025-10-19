import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiting configurations for different endpoint types
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || {
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again later.`,
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: options.message || 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000),
        limit: options.max,
        windowMs: options.windowMs
      });
    }
  });
};

// Different rate limiters for different use cases
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many authentication attempts, please try again later.'
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  skipSuccessfulRequests: false
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'API rate limit exceeded'
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Upload limit exceeded, please try again later.'
});

export const sensitiveOperationRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 sensitive operations per hour
  message: 'Sensitive operation limit exceeded, please try again later.'
});

// Progressive rate limiting based on user tier
export const createUserTierRateLimiter = (userTier: string) => {
  const configs = {
    'USER': { windowMs: 15 * 60 * 1000, max: 100 },
    'VERIFIED_USER': { windowMs: 15 * 60 * 1000, max: 200 },
    'PREMIUM_USER': { windowMs: 15 * 60 * 1000, max: 500 },
    'MODERATOR': { windowMs: 15 * 60 * 1000, max: 1000 },
    'ADMIN': { windowMs: 15 * 60 * 1000, max: 2000 }
  };

  const config = configs[userTier as keyof typeof configs] || configs['USER'];
  
  return createRateLimiter(config);
};

// Dynamic rate limiting based on IP and user
export const createDynamicRateLimiter = () => {
  const userLimits = new Map();
  
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req: Request) => {
      const user = (req as any).user;
      if (user) {
        // Higher limits for authenticated users
        const tierLimits = {
          'USER': 100,
          'VERIFIED_USER': 200,
          'PREMIUM_USER': 500,
          'MODERATOR': 1000,
          'ADMIN': 2000
        };
        return tierLimits[user.role as keyof typeof tierLimits] || 100;
      }
      return 50; // Lower limit for unauthenticated requests
    },
    keyGenerator: (req: Request) => {
      const user = (req as any).user;
      return user ? `user:${user.id}` : `ip:${req.ip}`;
    }
  });
};