import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { authenticateToken } from '@/lib/middleware/authenticateToken';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResult = await authenticateToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user
    const user = await db.user.findUnique({
      where: { id: authResult.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has a Stripe customer ID
    if (!user.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 503 }
      );
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/pricing`,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Create portal session error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}