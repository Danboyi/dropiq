import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system is not configured' }, { status: 503 });
    }

    const body = await req.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;

      case 'checkout.session.expired':
        const expiredSession = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionExpired(expiredSession);
        break;

      // Subscription events
      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(deletedSubscription);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(failedInvoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const stripeSessionId = session.id;
    const metadata = session.metadata;

    if (!metadata?.airdropId || !metadata?.tier) {
      console.error('Missing metadata in session:', stripeSessionId);
      return;
    }

    // Update the campaign with payment information
    const campaign = await db.campaign.update({
      where: { stripeSessionId },
      data: {
        paymentStatus: 'paid',
        status: 'paid', // Move to paid status
        metadata: {
          stripeCustomerId: session.customer,
          stripePaymentIntentId: session.payment_intent,
          ...metadata,
        },
      },
      include: {
        airdrop: true,
      },
    });

    console.log(`Campaign payment completed: ${campaign.id} for airdrop ${campaign.airdrop.name}`);

    // If the airdrop is still pending, we might want to prioritize it in the vetting queue
    if (campaign.airdrop.status === 'pending') {
      console.log(`Prioritizing vetting for paid campaign: ${campaign.airdrop.slug}`);
      
      // Update airdrop to mark it as paid campaign priority
      await db.airdrop.update({
        where: { id: campaign.airdropId },
        data: {
          // Add metadata to indicate this is a paid campaign
          metadata: {
            ...(campaign.airdrop.metadata as any || {}),
            paidCampaignId: campaign.id,
            priority: 'high',
            submittedVia: 'marketplace',
          },
        },
      });
      
      // Here you could trigger a webhook or event to your vetting pipeline
      // to prioritize this airdrop for review
      // Example: await notifyVettingPipeline(campaign.airdropId, 'high_priority');
    }
  } catch (error) {
    console.error('Error handling checkout session completed:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const stripeInvoiceId = invoice.id;
    const subscription = invoice.subscription as string;

    // Update campaigns associated with this subscription
    await db.campaign.updateMany({
      where: { stripeInvoiceId },
      data: {
        paymentStatus: 'paid',
        status: 'paid',
      },
    });

    console.log(`Invoice payment succeeded: ${stripeInvoiceId}`);
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error);
  }
}

async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  try {
    const stripeSessionId = session.id;

    // Mark the campaign as failed
    await db.campaign.update({
      where: { stripeSessionId },
      data: {
        paymentStatus: 'failed',
        status: 'rejected',
        notes: 'Payment session expired',
      },
    });

    console.log(`Checkout session expired: ${stripeSessionId}`);
  } catch (error) {
    console.error('Error handling checkout session expired:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const userId = subscription.metadata?.userId;

    if (!userId) {
      // Try to find user by Stripe customer ID
      const user = await db.user.findFirst({
        where: { stripeCustomerId: customerId },
      });
      
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { role: 'premium' },
        });
        console.log(`User ${user.id} upgraded to premium (subscription: ${subscription.id})`);
      } else {
        console.error('No user found for customer ID:', customerId);
      }
    } else {
      // Update user role to premium and store customer ID
      await db.user.update({
        where: { id: userId },
        data: { 
          role: 'premium',
          stripeCustomerId: customerId,
        },
      });

      console.log(`User ${userId} upgraded to premium (subscription: ${subscription.id})`);
    }
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    const userId = subscription.metadata?.userId;

    if (!userId) {
      // Try to find user by Stripe customer ID
      const user = await db.user.findFirst({
        where: { stripeCustomerId: customerId },
      });
      
      if (user) {
        await db.user.update({
          where: { id: user.id },
          data: { role: 'user' },
        });
        console.log(`User ${user.id} downgraded to free (subscription deleted: ${subscription.id})`);
      } else {
        console.error('No user found for customer ID:', customerId);
      }
    } else {
      // Update user role back to regular user
      await db.user.update({
        where: { id: userId },
        data: { role: 'user' },
      });

      console.log(`User ${userId} downgraded to free (subscription deleted: ${subscription.id})`);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const subscriptionId = invoice.subscription as string;
    
    // Log the payment failure
    console.log(`Invoice payment failed for subscription: ${subscriptionId}`);
    
    // Here you could:
    // 1. Notify the user about the payment failure
    // 2. Give them a grace period
    // 3. Eventually downgrade their account if payment continues to fail
    
    // For now, we'll just log it
  } catch (error) {
    console.error('Error handling invoice payment failed:', error);
  }
}