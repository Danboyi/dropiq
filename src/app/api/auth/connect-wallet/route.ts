import { NextRequest, NextResponse } from 'next/server'
import Joi from 'joi'
import { db } from '@/lib/db'
import { signToken } from '@/lib/jwt'
import { generateNonce, createSignInMessage, verifySignature, isValidEthereumAddress, normalizeAddress } from '@/lib/auth'

const connectWalletSchema = Joi.object({
  address: Joi.string().custom((value, helpers) => {
    if (!isValidEthereumAddress(value)) {
      return helpers.error('address.invalid')
    }
    return normalizeAddress(value)
  }).required(),
  signature: Joi.string().required(),
  message: Joi.string().required()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { error, value } = connectWalletSchema.validate(body)
    
    if (error) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.details[0].message },
        { status: 400 }
      )
    }

    const { address, signature, message } = value

    // Verify the signature
    if (!verifySignature(message, signature, address)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Find existing wallet or create new one
    let wallet = await db.wallet.findUnique({
      where: { address },
      include: { user: true }
    })

    let user
    let isNewUser = false

    if (wallet && wallet.user) {
      // Existing user with this wallet
      user = wallet.user
      
      // Update last used and generate new nonce
      await db.wallet.update({
        where: { id: wallet.id },
        data: {
          lastUsedAt: new Date(),
          nonce: generateNonce()
        }
      })
    } else {
      // New wallet connection - create guest user
      isNewUser = true
      user = await db.user.create({
        data: {
          isGuest: true,
          role: 'user'
        }
      })

      // Create or update wallet record
      wallet = await db.wallet.upsert({
        where: { address },
        update: {
          userId: user.id,
          lastUsedAt: new Date(),
          nonce: generateNonce()
        },
        create: {
          address,
          userId: user.id,
          nonce: generateNonce()
        }
      })
    }

    // Sign JWT token
    const token = signToken({
      userId: user.id,
      role: user.role,
      address,
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
        isGuest: user.isGuest
      },
      isNewUser,
      message: isNewUser 
        ? 'Guest account created. Connect a permanent account to save your progress.'
        : 'Welcome back!'
    })

  } catch (error) {
    console.error('Wallet connection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect wallet' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve nonce for a wallet address
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')

    if (!address || !isValidEthereumAddress(address)) {
      return NextResponse.json(
        { error: 'Valid wallet address required' },
        { status: 400 }
      )
    }

    const normalizedAddress = normalizeAddress(address)

    // Find or create wallet with nonce
    const wallet = await db.wallet.upsert({
      where: { address: normalizedAddress },
      update: { nonce: generateNonce() },
      create: {
        address: normalizedAddress,
        nonce: generateNonce()
      }
    })

    const message = createSignInMessage(wallet.nonce)

    return NextResponse.json({
      nonce: wallet.nonce,
      message
    })

  } catch (error) {
    console.error('Nonce generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate nonce' },
      { status: 500 }
    )
  }
}