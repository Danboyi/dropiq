import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/jwt'
import { db } from '@/lib/db'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email?: string
    name?: string
    role: string
    isGuest: boolean
    wallets?: Array<{
      id: string
      address: string
      lastUsedAt: Date
    }>
  }
}

export async function authenticateToken(req: NextRequest): Promise<AuthenticatedRequest> {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided')
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    // Get full user data from database
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            lastUsedAt: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Attach user to request object
    const authenticatedReq = req as AuthenticatedRequest
    authenticatedReq.user = {
      id: user.id,
      email: user.email || undefined,
      name: user.name || undefined,
      role: user.role,
      isGuest: user.isGuest,
      wallets: user.wallets
    }

    return authenticatedReq

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Authentication failed: ${error.message}`)
    }
    throw new Error('Authentication failed')
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest): boolean => {
    if (!req.user) {
      return false
    }

    return allowedRoles.includes(req.user.role)
  }
}

export function requireAuthenticated(req: AuthenticatedRequest): boolean {
  return !!req.user
}

export function requireNonGuest(req: AuthenticatedRequest): boolean {
  return !!(req.user && !req.user.isGuest)
}