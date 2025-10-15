import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'DropIQ API v1.0.0',
      endpoints: {
        auth: '/api/auth',
        health: '/health',
        airdrops: '/api/airdrops',
        users: '/api/users',
      },
    }
  })
})

// Placeholder routes for future implementation
router.get('/airdrops', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Airdrops endpoint - to be implemented',
      data: [],
    }
  })
})

router.get('/users', (req, res) => {
  res.json({
    success: true,
    data: {
      message: 'Users endpoint - to be implemented',
      data: {},
    }
  })
})

export { router as apiRouter }