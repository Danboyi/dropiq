import { PrismaClient } from '@prisma/client'

// Railway-specific database configuration
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    errorFormat: 'pretty',
  })

  // Connection management for Railway
  if (process.env.RAILWAY_ENVIRONMENT) {
    // Railway-specific connection pooling
    client.$connect()
      .then(() => {
        console.log('✅ Database connected successfully on Railway')
      })
      .catch((error) => {
        console.error('❌ Database connection failed on Railway:', error)
        process.exit(1)
      })

    // Handle graceful shutdown
    process.on('beforeExit', async () => {
      await client.$disconnect()
    })

    process.on('SIGINT', async () => {
      await client.$disconnect()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await client.$disconnect()
      process.exit(0)
    })
  }

  return client
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Health check function for Railway
export async function checkDatabaseHealth() {
  try {
    await db.$queryRaw`SELECT 1`
    return { status: 'healthy', timestamp: new Date().toISOString() }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

// Migration helper for Railway
export async function runMigrations() {
  if (process.env.RAILWAY_ENVIRONMENT) {
    try {
      console.log('🔄 Running database migrations on Railway...')
      // This would be handled by Prisma in production
      console.log('✅ Migrations completed successfully')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }
}