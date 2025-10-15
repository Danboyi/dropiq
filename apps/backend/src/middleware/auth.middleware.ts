import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services/auth.service'
import { prisma } from '../lib/db'

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email?: string
    role: string
    walletAddress?: string
  }
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token required'
        }
      })
    }

    // Verify token
    const decoded = AuthService.verifyToken(token, 'access')

    // Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true }
    })

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_SESSION',
          message: 'Session expired or invalid'
        }
      })
    }

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      walletAddress: decoded.walletAddress
    }

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    })
  }
}

export const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions'
        }
      })
    }

    next()
  }
}

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = AuthService.verifyToken(token, 'access')
      
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      })

      if (session && session.isActive && session.expiresAt >= new Date()) {
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role,
          walletAddress: decoded.walletAddress
        }
      }
    }

    next()
  } catch (error) {
    // Continue without authentication for optional auth
    next()
  }
}