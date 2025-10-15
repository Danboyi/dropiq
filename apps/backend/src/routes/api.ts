import { Router } from 'express'
import authRoutes from './auth'
import airdropRoutes from './airdrop'
import adminRoutes from './admin'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'DropIQ API v1.0.0',
      endpoints: {
        auth: '/api/auth',
        airdrops: '/api/airdrops',
        admin: '/api/admin',
        health: '/health',
      },
    }
  })
})

// Route modules
router.use('/auth', authRoutes)
router.use('/airdrops', airdropRoutes)
router.use('/admin', adminRoutes)

export { router as apiRouter }