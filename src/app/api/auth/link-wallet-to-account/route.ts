import { NextRequest, NextResponse } from 'next/server'
import Joi from 'joi'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/jwt'
import { verifySignature, generateNonce, isValidEthereumAddress, normalizeAddress } from '@/lib/auth'

const linkWalletSchema = Joi.object({
  address: Joi.string().custom((value, helpers) => {
    if (!isValidEthereumAddress(value)) {
      return helpers.error('address.invalid')
    }
    return normalizeAddress(value)
  }).required(),
  signature: Joi.string().required(),
  message: Joi.string().required()
})

// Authentication middleware
async function authenticate(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No token provided')
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    
    // Get full user data
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      include: { wallets: true }
    })

    if (!user) {
      throw new Error('User not found')
    }

    return { user, token }
  } catch (error) {
    throw new Error('Authentication failed')
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { user } = await authenticate(req)

    // Validate request body
    const body = await req.json()
    const { error, value } = linkWalletSchema.validate(body)
    
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

    // Find the wallet record
    const wallet = await db.wallet.findUnique({
      where: { address },
      include: { user: true }
    })

    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet not found. Please connect your wallet first.' },
        { status: 404 }
      )
    }

    // Check if wallet is already linked to a different user
    if (wallet.userId && wallet.userId !== user.id) {
      return NextResponse.json(
        { error: 'This wallet is already linked to another account' },
        { status: 409 }
      )
    }

    // Check if current user already has this wallet linked
    if (wallet.userId === user.id) {
      return NextResponse.json(
        { error: 'This wallet is already linked to your account' },
        { status: 409 }
      )
    }

    // Link wallet to current user
    await db.wallet.update({
      where: { id: wallet.id },
      data: {
        userId: user.id,
        lastUsedAt: new Date(),
        nonce: generateNonce()
      }
    })

    // If the wallet was linked to a guest user, we might want to clean up
    if (wallet.user && wallet.user.isGuest && wallet.user.id !== user.id) {
      // Check if guest user has other wallets
      const guestWallets = await db.wallet.findMany({
        where: { userId: wallet.user.id }
      })

      // If no other wallets, consider cleaning up the guest user
      if (guestWallets.length === 0) {
        await db.user.delete({
          where: { id: wallet.user.id }
        })
      }
    }

    // Update user to not be a guest anymore
    await db.user.update({
      where: { id: user.id },
      data: { isGuest: false }
    })

    return NextResponse.json({
      success: true,
      message: 'Wallet successfully linked to your account!',
      wallet: {
        address: wallet.address,
        linkedAt: new Date()
      }
    })

  } catch (error) {
    console.error('Wallet linking error:', error)
    
    if (error instanceof Error && error.message === 'Authentication failed') {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to link wallet' },
      { status: 500 }
    )
  }
}