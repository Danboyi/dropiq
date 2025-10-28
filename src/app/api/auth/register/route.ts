import { NextRequest, NextResponse } from 'next/server'
import Joi from 'joi'
import { db } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { hashPassword } from '@/lib/auth'

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().optional()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { error, value } = registerSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.details[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = value

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: 'user',
        isGuest: false
      }
    })

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      isGuest: false
    })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isGuest: user.isGuest
      },
      message: 'Account created successfully!'
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    )
  }
}