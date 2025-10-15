import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authenticateToken } from '../middleware/auth.middleware'

const router = Router()

// Wallet authentication
router.post('/connect-wallet', AuthController.connectWallet)
router.get('/nonce', AuthController.getNonce)

// Standard authentication
router.post('/register', AuthController.register)
router.post('/login', AuthController.login)
router.post('/refresh', AuthController.refreshToken)

// Protected routes
router.post('/logout', authenticateToken, AuthController.logout)
router.post('/link-wallet', authenticateToken, AuthController.linkWallet)
router.get('/me', authenticateToken, AuthController.getCurrentUser)

export { router as authRouter }