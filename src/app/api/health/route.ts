import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-railway";
import { logger } from "@/lib/railway-logger";
import { sentry } from "@/lib/sentry-simple";

export async function GET() {
  const startTime = Date.now();
  const requestId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth();
    
    // Check memory usage
    const memUsage = process.memoryUsage();
    const memoryHealth = {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
    };
    
    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV,
      railwayEnvironment: process.env.RAILWAY_ENVIRONMENT,
      railwayService: process.env.RAILWAY_SERVICE_NAME,
      railwayPublicDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
    };
    
    // Check Sentry status
    const sentryStatus = {
      active: sentry.isActive(),
      dsnConfigured: !!process.env.SENTRY_DSN,
    };
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      requestId,
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        memory: memoryHealth,
        sentry: sentryStatus,
      },
      environment,
      version: process.env.npm_package_version || '1.0.0',
    };
    
    // Log health check (only in development or if there are issues)
    if (process.env.NODE_ENV !== 'production' || dbHealth.status !== 'healthy') {
      logger.info('Health Check Completed', {
        requestId,
        responseTime,
        dbStatus: dbHealth.status,
        memoryUsage: memoryHealth.heapUsed,
      });
    }
    
    // Determine HTTP status based on health
    const httpStatus = dbHealth.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthData, { 
      status: httpStatus,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log the error
    logger.error('Health Check Failed', {
      requestId,
      responseTime,
      error: error as Error,
    });
    
    // Send to Sentry
    sentry.captureException(error as Error, {
      requestId,
      checkType: 'health',
      responseTime,
    });
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      requestId,
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
      services: {
        database: { status: 'error', error: 'Connection failed' },
      },
    }, { 
      status: 503,
      headers: {
        'X-Request-ID': requestId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}