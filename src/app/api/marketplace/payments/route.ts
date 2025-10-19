import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const processors = await db.paymentProcessor.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ processors })
  } catch (error) {
    console.error('Error fetching payment processors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment processors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      campaignId,
      participantId,
      processorId,
      amount,
      currency,
      paymentMethod,
      paymentAddress
    } = body

    // Validate required fields
    if (!campaignId || !participantId || !amount || !paymentMethod) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get payment processor details
    const processor = await db.paymentProcessor.findUnique({
      where: { id: processorId }
    })

    if (!processor) {
      return NextResponse.json(
        { error: 'Payment processor not found' },
        { status: 404 }
      )
    }

    // Calculate fees
    const processingFee = amount * (processor.processingFee / 100)
    const platformFee = amount * 0.05 // 5% platform fee
    const fixedFee = processor.fixedFee || 0
    const totalFees = processingFee + platformFee + fixedFee
    const netAmount = amount - totalFees

    // Create payment record
    const payment = await db.shillingPayment.create({
      data: {
        campaignId,
        participantId,
        processorId,
        amount,
        currency: currency || 'USD',
        status: 'pending',
        paymentMethod,
        paymentAddress,
        processingFee,
        platformFee,
        netAmount,
        metadata: JSON.stringify({
          processorName: processor.name,
          processorType: processor.type,
          createdAt: new Date().toISOString()
        })
      }
    })

    // Initiate payment based on processor type
    let paymentResult
    switch (processor.type) {
      case 'crypto':
        paymentResult = await initiateCryptoPayment(payment, processor)
        break
      case 'fiat':
        paymentResult = await initiateFiatPayment(payment, processor)
        break
      case 'platform_token':
        paymentResult = await initiateTokenPayment(payment, processor)
        break
      default:
        throw new Error('Unsupported payment method')
    }

    // Update payment with transaction details
    await db.shillingPayment.update({
      where: { id: payment.id },
      data: {
        status: paymentResult.status,
        transactionHash: paymentResult.transactionHash,
        metadata: JSON.stringify({
          ...JSON.parse(payment.metadata as string),
          ...paymentResult.metadata
        })
      }
    })

    // Track revenue
    await db.revenueTracking.create({
      data: {
        source: 'campaign',
        sourceId: campaignId,
        type: 'commission',
        amount: platformFee,
        currency: currency || 'USD',
        status: 'pending',
        relatedPaymentId: payment.id,
        commissionRate: 0.05,
        commissionAmount: platformFee,
        netAmount: netAmount,
        description: `Platform fee for campaign payment: ${campaignId}`
      }
    })

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        netAmount: payment.netAmount,
        transactionHash: payment.transactionHash,
        paymentDetails: paymentResult.paymentDetails
      }
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

async function initiateCryptoPayment(payment: any, processor: any) {
  // Simulate crypto payment processing
  // In production, this would integrate with actual crypto payment processors
  
  const cryptoAddress = generateCryptoAddress(processor.type)
  const expirationTime = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
  
  return {
    status: 'pending',
    transactionHash: null,
    paymentDetails: {
      address: cryptoAddress,
      amount: payment.amount,
      currency: payment.currency,
      expirationTime,
      qrCode: `crypto:${cryptoAddress}?amount=${payment.amount}`,
      instructions: `Send ${payment.amount} ${payment.currency} to ${cryptoAddress}`
    },
    metadata: {
      cryptoAddress,
      expirationTime
    }
  }
}

async function initiateFiatPayment(payment: any, processor: any) {
  // Simulate fiat payment processing (Stripe, PayPal, etc.)
  // In production, this would integrate with actual payment gateways
  
  const paymentIntent = {
    id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    client_secret: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
    amount: Math.round(payment.amount * 100), // Convert to cents
    currency: payment.currency.toLowerCase(),
    status: 'requires_payment_method'
  }
  
  return {
    status: 'processing',
    transactionHash: paymentIntent.id,
    paymentDetails: {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethods: ['card', 'bank_transfer']
    },
    metadata: {
      paymentIntentId: paymentIntent.id,
      gateway: processor.name
    }
  }
}

async function initiateTokenPayment(payment: any, processor: any) {
  // Simulate platform token payment
  const tokenAddress = '0x1234567890123456789012345678901234567890' // Platform token contract
  
  return {
    status: 'pending',
    transactionHash: null,
    paymentDetails: {
      tokenAddress,
      amount: payment.amount,
      tokenSymbol: 'DROP',
      decimals: 18,
      instructions: `Approve and transfer ${payment.amount} DROP tokens`
    },
    metadata: {
      tokenAddress,
      tokenSymbol: 'DROP'
    }
  }
}

function generateCryptoAddress(type: string): string {
  // Generate mock crypto addresses based on type
  const prefixes = {
    'bitcoin': '1',
    'ethereum': '0x',
    'polygon': '0x',
    'binance': '0x'
  }
  
  const prefix = prefixes[type as keyof typeof prefixes] || '0x'
  const length = type === 'bitcoin' ? 34 : 42
  const chars = '0123456789abcdef'
  
  let address = prefix
  for (let i = prefix.length; i < length; i++) {
    address += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return address
}