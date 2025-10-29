import { NextRequest, NextResponse } from 'next/server'
import { hybridAuthService } from '@/lib/services/hybrid-auth.service'
import { rateLimitAuth } from '@/lib/middleware/hybrid-auth.middleware'

const rateLimiter = rateLimitAuth(5, 15 * 60 * 1000) // 5 attempts per 15 minutes

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimiter(req)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await req.json()
    const { method, ...credentials } = body

    if (!method || !['wallet', 'email'].includes(method)) {
      return NextResponse.json(
        { error: 'Authentication method is required (wallet or email)' },
        { status: 400 }
      )
    }

    let result

    if (method === 'wallet') {
      const { address, signature, message } = credentials
      
      if (!address || !signature || !message) {
        return NextResponse.json(
          { error: 'Address, signature, and message are required for wallet authentication' },
          { status: 400 }
        )
      }

      result = await hybridAuthService.authenticateWithWallet(address, signature, message)

    } else if (method === 'email') {
      const { email, password } = credentials
      
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email and password are required for email authentication' },
          { status: 400 }
        )
      }

      result = await hybridAuthService.authenticateWithEmail(email, password)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Check if 2FA is required
    const { twoFactorAuthService } = await import('@/lib/services/2fa.service')
    const requires2FA = await twoFactorAuthService.requiresTwoFactor(result.user!.id)

    if (requires2FA) {
      return NextResponse.json({
        success: true,
        requiresTwoFactor: true,
        message: 'Please enter your 2FA code',
        tempToken: result.token // Temporary token for 2FA verification
      })
    }

    // Set HTTP-only cookie for better security
    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: result.message,
      isNewUser: result.isNewUser
    })

    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('Hybrid signin error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}