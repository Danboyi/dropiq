import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'combined.log'),
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Create the logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logUserAction = (userId: string, action: string, details?: any) => {
  logger.info('User action', {
    type: 'user_action',
    userId,
    action,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logApiCall = (method: string, path: string, statusCode: number, duration: number, userId?: string) => {
  logger.info('API call', {
    type: 'api_call',
    method,
    path,
    statusCode,
    duration,
    userId,
    timestamp: new Date().toISOString()
  });
};

export const logSecurityEvent = (event: string, details: any) => {
  logger.warn('Security event', {
    type: 'security_event',
    event,
    details,
    timestamp: new Date().toISOString()
  });
};

export const logDatabaseQuery = (query: string, duration: number, error?: string) => {
  const logData = {
    type: 'database_query',
    query,
    duration,
    timestamp: new Date().toISOString()
  };

  if (error) {
    logger.error('Database query failed', { ...logData, error });
  } else {
    logger.debug('Database query executed', logData);
  }
};

export const logExternalServiceCall = (service: string, endpoint: string, statusCode: number, duration: number) => {
  logger.info('External service call', {
    type: 'external_service',
    service,
    endpoint,
    statusCode,
    duration,
    timestamp: new Date().toISOString()
  });
};

// Development vs production configuration
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
} else {
  // In production, we might want to add additional transports
  // like sending logs to a service like Loggly, Papertrail, etc.
}

export default logger;