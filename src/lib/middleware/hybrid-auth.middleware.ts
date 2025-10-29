import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { hybridAuthService } from '@/lib/services/hybrid-auth.service'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email?: string
    name?: string
    role: string
    isGuest: boolean
    authMethod: 'wallet' | 'email'
    wallets?: Array<{
      address: string
      isPrimary: boolean
    }>
  }
}

/**
 * Middleware to authenticate requests using both NextAuth and JWT tokens
 */
export async function authenticateRequest(req: NextRequest): Promise<NextResponse | null> {
  try {
    // First try NextAuth session
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === 'production'
    })

    if (token && token.id) {
      // Valid NextAuth session found
      const response = NextResponse.next()
      response.headers.set('x-user-id', token.id as string)
      response.headers.set('x-user-role', token.role as string)
      response.headers.set('x-auth-method', token.authMethod as string || 'email')
      return response
    }

    // Try custom JWT token from Authorization header
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7)
      const user = await hybridAuthService.verifyToken(jwtToken)
      
      if (user) {
        const response = NextResponse.next()
        response.headers.set('x-user-id', user.id)
        response.headers.set('x-user-role', user.role)
        response.headers.set('x-auth-method', user.authMethod)
        response.headers.set('x-user-guest', user.isGuest.toString())
        return response
      }
    }

    // No valid authentication found
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )

  } catch (error) {
    console.error('Authentication middleware error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(requiredRole: string) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const authResult = await authenticateRequest(req)
    
    if (authResult && authResult.status === 401) {
      return authResult
    }

    const userRole = req.headers.get('x-user-role')
    
    if (!userRole || userRole !== requiredRole) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Middleware to check if user is not a guest
 */
export function requireNonGuest() {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const authResult = await authenticateRequest(req)
    
    if (authResult && authResult.status === 401) {
      return authResult
    }

    const isGuest = req.headers.get('x-user-guest') === 'true'
    
    if (isGuest) {
      return NextResponse.json(
        { error: 'Guest users cannot perform this action. Please link an email account.' },
        { status: 403 }
      )
    }

    return null
  }
}

/**
 * Get user from request (for use in API routes)
 */
export async function getUserFromRequest(req: NextRequest) {
  try {
    // Try NextAuth token first
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (token && token.id) {
      return {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        role: token.role as string,
        isGuest: token.isGuest as boolean,
        authMethod: (token.authMethod as string) || 'email'
      }
    }

    // Try custom JWT token
    const authHeader = req.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const jwtToken = authHeader.substring(7)
      const user = await hybridAuthService.verifyToken(jwtToken)
      
      if (user) {
        return user
      }
    }

    return null

  } catch (error) {
    console.error('Get user from request error:', error)
    return null
  }
}

/**
 * Rate limiting middleware for authentication endpoints
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimitAuth(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) {
  return (req: NextRequest): NextResponse | null => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const record = rateLimitMap.get(ip)
    
    if (!record || now > record.resetTime) {
      // New window or expired window
      rateLimitMap.set(ip, {
        count: 1,
        resetTime: now + windowMs
      })
      return null
    }
    
    if (record.count >= maxAttempts) {
      return NextResponse.json(
        { error: 'Too many authentication attempts. Please try again later.' },
        { status: 429 }
      )
    }
    
    record.count++
    return null
  }
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.etherscan.io https://eth-mainnet.g.alchemy.com"
  )
  
  return response
}