'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Star, Crown, Zap, Shield, TrendingUp } from 'lucide-react';
import { useAuth } from '@/stores/authStore';
import { toast } from 'sonner';

const PREMIUM_PRICE_ID = process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_1234567890';

const features = {
  free: [
    { name: 'Basic Airdrop Discovery', included: true },
    { name: 'Standard Security Checks', included: true },
    { name: 'Community Support', included: true },
    { name: 'Single Wallet Tracking', included: true },
    { name: 'Basic Analytics', included: true },
    { name: 'Featured Opportunities', included: true, note: 'Sponsored content' },
    { name: 'Advanced Portfolio Analytics', included: false },
    { name: 'Multiple Wallet Tracking', included: false },
    { name: 'Priority Security Alerts', included: false },
    { name: 'Ad-Free Experience', included: false },
    { name: 'Priority Support', included: false },
    { name: 'Early Access to New Features', included: false },
  ],
  premium: [
    { name: 'Basic Airdrop Discovery', included: true },
    { name: 'Standard Security Checks', included: true },
    { name: 'Community Support', included: true },
    { name: 'Single Wallet Tracking', included: true },
    { name: 'Basic Analytics', included: true },
    { name: 'Featured Opportunities', included: true, note: 'Can be disabled' },
    { name: 'Advanced Portfolio Analytics', included: true },
    { name: 'Multiple Wallet Tracking', included: true, note: 'Unlimited wallets' },
    { name: 'Priority Security Alerts', included: true, note: 'Real-time notifications' },
    { name: 'Ad-Free Experience', included: true },
    { name: 'Priority Support', included: true, note: '24-48 hour response' },
    { name: 'Early Access to New Features', included: true },
  ],
};

export default function PricingPage() {
  const { user, token } = useAuth();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      toast.success('🎉 Welcome to Premium! Your subscription is now active.');
      // Refresh user data to update role
      window.location.href = '/home';
    } else if (canceled === 'true') {
      toast.info('Subscription canceled. You can try again anytime.');
    }
  }, [searchParams]);

  const handleUpgradeToPremium = async () => {
    if (!token) {
      toast.error('Please sign in to upgrade to Premium');
      return;
    }

    if (user?.role === 'premium') {
      toast.info('You are already a Premium member!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priceId: PREMIUM_PRICE_ID,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!token) {
      toast.error('Please sign in to manage your subscription');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      toast.error('Failed to open subscription portal. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isPremium = user?.role === 'premium';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-yellow-500" />
            <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Unlock the full potential of DROPIQ with our premium features. 
            Stay ahead of the competition with advanced tools and insights.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}`}>
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save 20%
              </Badge>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Free
              </CardTitle>
              <CardDescription>
                Perfect for getting started with airdrop hunting
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {features.free.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    )}
                    <div className="text-sm">
                      <span className={feature.included ? '' : 'text-muted-foreground'}>
                        {feature.name}
                      </span>
                      {feature.note && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({feature.note})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="outline" 
                className="w-full mt-6"
                disabled={isPremium}
              >
                {isPremium ? 'Current Plan' : 'Current Plan'}
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="relative border-primary shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-4 py-1">
                MOST POPULAR
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Premium
              </CardTitle>
              <CardDescription>
                Advanced tools for serious airdrop hunters
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  ${billingCycle === 'monthly' ? '15' : '12'}
                </span>
                <span className="text-muted-foreground">/month</span>
                {billingCycle === 'yearly' && (
                  <p className="text-xs text-green-600 mt-1">Billed annually ($144)</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {features.premium.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">{feature.name}</span>
                      {feature.note && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({feature.note})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {isPremium ? (
                <Button 
                  variant="outline" 
                  className="w-full mt-6"
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              ) : (
                <Button 
                  className="w-full mt-6"
                  onClick={handleUpgradeToPremium}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Deep insights into your airdrop performance and portfolio trends
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-4">
              <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold mb-2">Priority Security</h3>
            <p className="text-sm text-muted-foreground">
              Real-time security alerts and advanced threat protection
            </p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mx-auto mb-4">
              <Crown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Premium Support</h3>
            <p className="text-sm text-muted-foreground">
              Get help when you need it with priority customer support
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I change plans anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time through your account settings.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards, debit cards, and other payment methods supported by Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-sm text-muted-foreground">
                While we don't offer a free trial, you can start with our free plan and upgrade anytime to access premium features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">How does the money-back guarantee work?</h3>
              <p className="text-sm text-muted-foreground">
                If you're not satisfied with Premium, contact us within 14 days for a full refund, no questions asked.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}