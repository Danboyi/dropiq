import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '@/lib/logger';
import { ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ConflictError, RateLimitError } from '@/lib/errors';

export interface ErrorResponse {
  error: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
  requestId: string;
  stack?: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  const timestamp = new Date().toISOString();
  const path = req.path;

  // Log the error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    requestId,
    path,
    method: req.method,
    userId: (req as any).user?.id,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Determine error type and status code
  let statusCode = 500;
  let errorType = 'Internal Server Error';
  let message = 'An unexpected error occurred';
  let details: any = undefined;

  if (error instanceof ValidationError) {
    statusCode = 400;
    errorType = 'Validation Error';
    message = error.message;
    details = error.details;
  } else if (error instanceof AuthenticationError) {
    statusCode = 401;
    errorType = 'Authentication Error';
    message = error.message;
  } else if (error instanceof AuthorizationError) {
    statusCode = 403;
    errorType = 'Authorization Error';
    message = error.message;
  } else if (error instanceof NotFoundError) {
    statusCode = 404;
    errorType = 'Not Found';
    message = error.message;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
    errorType = 'Conflict';
    message = error.message;
  } else if (error instanceof RateLimitError) {
    statusCode = 429;
    errorType = 'Rate Limit Exceeded';
    message = error.message;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    errorType = 'Validation Error';
    message = 'Invalid request data';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  } else if (error.name === 'CastError') {
    statusCode = 400;
    errorType = 'Invalid ID';
    message = 'Invalid resource ID format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorType = 'Invalid Token';
    message = 'Invalid authentication token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorType = 'Token Expired';
    message = 'Authentication token has expired';
  } else if (error.name === 'MulterError') {
    statusCode = 400;
    errorType = 'Upload Error';
    message = 'File upload failed';
    if (error.message.includes('File too large')) {
      message = 'File size exceeds maximum allowed limit';
    }
  }

  // Build error response
  const errorResponse: ErrorResponse = {
    error: errorType,
    message,
    timestamp,
    path,
    requestId
  };

  // Include details if available
  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// 404 handler for undefined routes
export const notFoundHandler = (req: Request, res: Response): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  
  logger.warn('Route not found', {
    path: req.path,
    method: req.method,
    requestId,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });

  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId
  });
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request ID generation
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = req.headers['x-request-id'] as string || generateRequestId();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};