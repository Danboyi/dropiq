import Stripe from 'stripe';

// Initialize Stripe only if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  : null;

// Campaign pricing tiers
export const CAMPAIGN_PRICING = {
  basic: {
    amount: 1000, // $10.00 in cents
    name: 'Basic',
    description: '7 days featured placement',
    duration: 7, // days
  },
  standard: {
    amount: 2500, // $25.00 in cents
    name: 'Standard',
    description: '14 days featured placement + priority support',
    duration: 14, // days
  },
  premium: {
    amount: 5000, // $50.00 in cents
    name: 'Premium',
    description: '30 days featured placement + premium placement + analytics',
    duration: 30, // days
  },
} as const;

export type CampaignTier = keyof typeof CAMPAIGN_PRICING;