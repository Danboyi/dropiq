import { NextRequest, NextResponse } from 'next/server'
import Joi from 'joi'
import { db } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { verifyPassword } from '@/lib/auth'

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { error, value } = loginSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.details[0].message },
        { status: 400 }
      )
    }

    const { email, password } = value

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        wallets: true
      }
    })

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      isGuest: user.isGuest
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isGuest: user.isGuest,
        wallets: user.wallets
      },
      message: 'Login successful!'
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    )
  }
}