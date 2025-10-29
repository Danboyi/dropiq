import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { rejectedBy, notes, refund } = await req.json();

    if (!rejectedBy) {
      return NextResponse.json(
        { error: 'rejectedBy is required' },
        { status: 400 }
      );
    }

    // Get the campaign first
    const campaign = await db.campaign.findUnique({
      where: { id },
      include: { airdrop: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Process refund if requested and payment was made
    let refundResult = null;
    if (refund && campaign.paymentStatus === 'paid' && campaign.stripeSessionId && stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(campaign.stripeSessionId);
        if (session.payment_intent) {
          refundResult = await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
            reason: 'requested_by_customer',
          });
          console.log(`Refund processed for campaign ${id}: ${refundResult.id}`);
        }
      } catch (refundError) {
        console.error('Error processing refund:', refundError);
        // Continue with rejection even if refund fails
      }
    }

    // Update campaign status to rejected
    const updatedCampaign = await db.campaign.update({
      where: { id },
      data: {
        status: 'rejected',
        paymentStatus: refund && refundResult ? 'refunded' : campaign.paymentStatus,
        rejectedAt: new Date(),
        rejectedBy,
        notes: notes || undefined,
        metadata: {
          ...campaign.metadata,
          refundId: refundResult?.id,
          refundAmount: refundResult?.amount,
        },
      },
      include: {
        airdrop: true,
      },
    });

    console.log(`Campaign ${id} rejected by ${rejectedBy}`);

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
      refund: refundResult ? {
        id: refundResult.id,
        amount: refundResult.amount,
        status: refundResult.status,
      } : null,
    });
  } catch (error) {
    console.error('Error rejecting campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}