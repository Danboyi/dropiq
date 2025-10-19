import express from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// Import middleware
import { requestIdMiddleware, securityHeaders, requestLogger, healthCheck, apiVersioning } from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';
import { corsMiddleware } from '@/middleware/security';
import { generalRateLimiter } from '@/middleware/rateLimiter';
import { sanitizeInput } from '@/middleware/validation';

// Import routes
import authRoutes from '@/api/routes/auth';
import airdropRoutes from '@/api/routes/airdrops';
import walletRoutes from '@/api/routes/wallets';
import shillingRoutes from '@/api/routes/shilling';
import securityRoutes from '@/api/routes/security';
import analyticsRoutes from '@/api/routes/analytics';

// Create Express app
const app = express();

// Trust proxy for rate limiting and IP detection
app.set('trust proxy', 1);

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security and logging middleware
app.use(requestIdMiddleware);
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(sanitizeInput);
app.use(requestLogger);
app.use(apiVersioning);

// Rate limiting
app.use(generalRateLimiter);

// Health check endpoint
app.get('/health', healthCheck);

// API routes
const apiRouter = express.Router();

// API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DropIQ API',
      version: '1.0.0',
      description: 'Comprehensive RESTful API for the DropIQ cryptocurrency airdrop aggregation platform',
      contact: {
        name: 'DropIQ Team',
        email: 'api@dropiq.app',
        url: 'https://dropiq.app'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'https://api.dropiq.app/v1',
        description: 'Production server'
      },
      {
        url: 'http://localhost:3001/v1',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            fullName: { type: 'string' },
            role: { 
              type: 'string', 
              enum: ['USER', 'VERIFIED_USER', 'PREMIUM_USER', 'MODERATOR', 'ADMIN'] 
            },
            isEmailVerified: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastLoginAt: { type: 'string', format: 'date-time' }
          }
        },
        Airdrop: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['STANDARD', 'EXCLUSIVE', 'COMMUNITY', 'PARTNER'] 
            },
            totalAmount: { type: 'number' },
            tokenSymbol: { type: 'string' },
            status: { 
              type: 'string', 
              enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] 
            },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            participationCount: { type: 'number' },
            maxParticipants: { type: 'number' },
            featured: { type: 'boolean' }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            chain: { 
              type: 'string', 
              enum: ['ETHEREUM', 'POLYGON', 'BSC', 'ARBITRUM', 'OPTIMISM', 'BASE'] 
            },
            label: { type: 'string' },
            balance: { type: 'number' },
            isPrimary: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            lastAnalyzedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
            path: { type: 'string' },
            requestId: { type: 'string' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array' },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                pages: { type: 'number' }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/api/routes/*.ts',
    './src/api/controllers/*.ts'
  ]
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API documentation endpoint
apiRouter.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'DropIQ API Documentation'
}));

apiRouter.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Mount API routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/airdrops', airdropRoutes);
apiRouter.use('/wallets', walletRoutes);
apiRouter.use('/shilling', shillingRoutes);
apiRouter.use('/security', securityRoutes);
apiRouter.use('/analytics', analyticsRoutes);

// API info endpoint
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'DropIQ API',
    version: '1.0.0',
    description: 'Comprehensive RESTful API for the DropIQ cryptocurrency airdrop aggregation platform',
    endpoints: {
      auth: '/auth',
      airdrops: '/airdrops',
      wallets: '/wallets',
      shilling: '/shilling',
      security: '/security',
      analytics: '/analytics',
      documentation: '/docs'
    },
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Mount API router
app.use('/v1', apiRouter);

// Root redirect to API
app.get('/', (req, res) => {
  res.redirect('/v1');
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Test database connection
    await db.$connect();
    logger.info('Database connected successfully');

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation: http://localhost:${PORT}/v1/docs`);
      logger.info(`Health Check: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await db.$disconnect();
          logger.info('Database disconnected');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
export { startServer };