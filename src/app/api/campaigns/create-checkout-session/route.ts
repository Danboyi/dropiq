import { NextRequest, NextResponse } from 'next/server';
import { stripe, CAMPAIGN_PRICING, CampaignTier } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system is not configured' },
        { status: 503 }
      );
    }

    const { airdropId, tier, submittedBy } = await req.json();

    // Validate input
    if (!airdropId || !tier) {
      return NextResponse.json(
        { error: 'Missing required fields: airdropId, tier' },
        { status: 400 }
      );
    }

    if (!Object.keys(CAMPAIGN_PRICING).includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be: basic, standard, or premium' },
        { status: 400 }
      );
    }

    // Check if airdrop exists
    const airdrop = await db.airdrop.findUnique({
      where: { id: airdropId },
    });

    if (!airdrop) {
      return NextResponse.json(
        { error: 'Airdrop not found' },
        { status: 404 }
      );
    }

    // Check if there's already an active campaign for this airdrop
    const existingCampaign = await db.campaign.findFirst({
      where: {
        airdropId,
        status: { in: ['pending', 'paid', 'approved'] },
        endDate: { gt: new Date() },
      },
    });

    if (existingCampaign) {
      return NextResponse.json(
        { error: 'This airdrop already has an active campaign' },
        { status: 409 }
      );
    }

    const pricing = CAMPAIGN_PRICING[tier as CampaignTier];
    
    // Calculate end date based on tier duration
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + pricing.duration);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pricing.name} Campaign - ${airdrop.name}`,
              description: pricing.description,
              images: airdrop.logoUrl ? [airdrop.logoUrl] : undefined,
            },
            unit_amount: pricing.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXTAUTH_URL}/promote/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/promote/cancel`,
      metadata: {
        airdropId,
        tier,
        submittedBy: submittedBy || '',
      },
      customer_email: submittedBy || undefined,
    });

    // Create campaign record in database
    const campaign = await db.campaign.create({
      data: {
        airdropId,
        tier,
        amount: pricing.amount,
        currency: 'usd',
        stripeSessionId: session.id,
        startDate,
        endDate,
        submittedBy,
        status: 'pending',
        paymentStatus: 'pending',
      },
      include: {
        airdrop: true,
      },
    });

    console.log(`Created campaign ${campaign.id} for airdrop ${airdrop.name}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      campaign: {
        id: campaign.id,
        tier: campaign.tier,
        amount: campaign.amount,
        endDate: campaign.endDate,
      },
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}