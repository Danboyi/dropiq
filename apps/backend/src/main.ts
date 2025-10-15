import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { authRouter } from './routes/auth'
import { apiRouter } from './routes/api'
import { healthRouter } from './routes/health'
import { AirdropEngineService } from './services/airdrop-engine.service'

dotenv.config()

const app = express()
const port = process.env.PORT || 3333

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
})
app.use(limiter)

// General middleware
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api', apiRouter)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    }
  })
})

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    }
  })
})

// Initialize airdrop engine and start server
async function startServer() {
  try {
    // Initialize the airdrop engine
    console.log('Initializing airdrop engine...')
    await AirdropEngineService.initialize()
    
    app.listen(port, () => {
      console.log(`🚀 Backend application running on port ${port}`)
      console.log(`📖 API documentation available at http://localhost:${port}/api/docs`)
      console.log(`🔍 Airdrop discovery engine is running`)
    })

  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  await AirdropEngineService.shutdown()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  await AirdropEngineService.shutdown()
  process.exit(0)
})

startServer()