import { NextRequest, NextResponse } from 'next/server'
import { twoFactorAuthService } from '@/lib/services/2fa.service'
import { hybridAuthService } from '@/lib/services/hybrid-auth.service'
import { rateLimitAuth } from '@/lib/middleware/hybrid-auth.middleware'

const rateLimiter = rateLimitAuth(3, 15 * 60 * 1000) // 3 attempts per 15 minutes

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimiter(req)
    if (rateLimitResult) {
      return rateLimitResult
    }

    const body = await req.json()
    const { tempToken, code, backupCode } = body

    if (!tempToken || (!code && !backupCode)) {
      return NextResponse.json(
        { error: 'Temporary token and either code or backup code are required' },
        { status: 400 }
      )
    }

    // Verify temporary token and get user info
    const tempUser = await hybridAuthService.verifyToken(tempToken)
    
    if (!tempUser) {
      return NextResponse.json(
        { error: 'Invalid or expired temporary token' },
        { status: 401 }
      )
    }

    // Verify 2FA
    const result = await twoFactorAuthService.verifyTwoFactorLogin(
      tempUser.id,
      code,
      backupCode
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Get full user profile
    const userProfile = await hybridAuthService.getUserProfile(tempUser.id)

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate final authentication token
    const finalToken = await hybridAuthService.verifyToken(tempToken)
    
    // Set HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role,
        isGuest: userProfile.isGuest,
        authMethod: finalToken?.authMethod || 'email',
        wallets: userProfile.wallets.map(w => ({
          address: w.address,
          isPrimary: w.isPrimary
        }))
      },
      message: 'Authentication successful!'
    })

    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response

  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json(
      { error: '2FA verification failed' },
      { status: 500 }
    )
  }
}