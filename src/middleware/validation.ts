import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/lib/errors';

export const validateRequest = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        const validatedBody = schema.body.parse(req.body);
        req.body = validatedBody;
      }

      // Validate query parameters
      if (schema.query) {
        const validatedQuery = schema.query.parse(req.query);
        req.query = validatedQuery;
      }

      // Validate route parameters
      if (schema.params) {
        const validatedParams = schema.params.parse(req.params);
        req.params = validatedParams;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));

        const validationError = new ValidationError('Request validation failed', validationErrors);
        res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: validationErrors
        });
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  pagination: {
    query: ZodSchema.object({
      page: ZodSchema.string().regex(/^\d+$/).transform(Number).default('1'),
      limit: ZodSchema.string().regex(/^\d+$/).transform(Number).default('20'),
      sortBy: ZodSchema.string().optional(),
      sortOrder: ZodSchema.enum(['asc', 'desc']).default('desc')
    })
  },

  idParam: {
    params: ZodSchema.object({
      id: ZodSchema.string().uuid()
    })
  },

  dateRange: {
    query: ZodSchema.object({
      startDate: ZodSchema.string().datetime().optional(),
      endDate: ZodSchema.string().datetime().optional()
    })
  },

  walletAddress: {
    body: ZodSchema.object({
      address: ZodSchema.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
    })
  },

  email: {
    body: ZodSchema.object({
      email: ZodSchema.string().email('Invalid email format')
    })
  }
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  const sanitizeString = (str: string): string => {
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();
  };

  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize route parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Content-Type must be one of: ${allowedTypes.join(', ')}`
      });
      return;
    }

    next();
  };
};

// Request size validation
export const validateRequestSize = (maxSize: number) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      res.status(413).json({
        error: 'Payload Too Large',
        message: `Request size exceeds maximum allowed size of ${maxSize} bytes`
      });
      return;
    }

    next();
  };
};