'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  Users, 
  DollarSign, 
  CheckCircle,
  ArrowRight,
  Star,
  Globe,
  Lock,
  BarChart3
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useAnalytics } from '@/lib/analytics/tracker';

export default function Home() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { trackEvent, trackAirdropInteraction, trackClick } = useAnalytics();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Track page view after mount
    if (mounted) {
      trackEvent({
        eventType: 'page_view',
        eventName: 'homepage_load',
        eventData: {
          page: 'home',
          timestamp: new Date().toISOString()
        }
      });
    }
  }, [mounted, trackEvent]);

  const handleAirdropClick = (airdrop: any) => {
    trackAirdropInteraction(airdrop.id, 'click', { 
      project: airdrop.project,
      value: airdrop.estimatedValue 
    });
  };

  const handleGetStarted = () => {
    trackEvent({
      eventType: 'click',
      eventName: 'get_started_cta',
      eventData: {
        source: 'hero_section',
        button_text: 'Get Started'
      }
    });
  };

  const handleViewMarketplace = () => {
    trackEvent({
      eventType: 'click',
      eventName: 'view_marketplace_cta',
      eventData: {
        source: 'hero_section',
        button_text: 'View Marketplace'
      }
    });
  };

  if (!mounted) {
    return null;
  }

  // Mock data for featured airdrops
  const featuredAirdrops = [
    {
      id: '1',
      title: 'DeFiChain Airdrop',
      project: 'DeFiChain',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      estimatedValue: 500,
      participants: 15420,
      type: 'STANDARD',
    },
    {
      id: '2',
      title: 'NFT Marketplace Launch',
      project: 'NFTMarket',
      status: 'ACTIVE',
      riskLevel: 'MEDIUM',
      estimatedValue: 300,
      participants: 8750,
      type: 'NFT',
    },
    {
      id: '3',
      title: 'Layer 2 Testnet',
      project: 'L2Network',
      status: 'UPCOMING',
      riskLevel: 'LOW',
      estimatedValue: 200,
      participants: 5230,
      type: 'TESTNET',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-sm">
              <Zap className="w-3 h-3 mr-1" />
              AI-Powered Airdrop Intelligence
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Discover & Track
              <br />
              <span className="text-primary">Valuable Airdrops</span>
              <br />
              <span className="text-2xl md:text-3xl text-muted-foreground">Monetize Your Influence</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Leverage AI-powered insights to find the most promising cryptocurrency airdrops. 
              Track participation, assess risks, and maximize your rewards with DropIQ.
              <br />
              <span className="text-base">Join our marketplace to earn rewards by promoting verified Web3 projects.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="text-base px-8" onClick={handleGetStarted}>
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button variant="outline" size="lg" className="text-base px-8" onClick={handleViewMarketplace}>
                  View Marketplace
                  <BarChart3 className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/security">
                <Button variant="outline" size="lg" className="text-base px-8">
                  Security Tools
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">$2.5M+</div>
              <div className="text-sm text-muted-foreground">Total Airdrop Value</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">150+</div>
              <div className="text-sm text-muted-foreground">Active Airdrops</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Choose DropIQ?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive tools to help you navigate the airdrop landscape safely and efficiently.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Analysis</CardTitle>
                <CardDescription>
                  Advanced algorithms analyze airdrop potential and predict value with 95% accuracy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>
                  Comprehensive security scans and scam detection to protect your assets
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Real-Time Updates</CardTitle>
                <CardDescription>
                  Instant notifications for new airdrops and deadline reminders
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Community Insights</CardTitle>
                <CardDescription>
                  Track participation trends and community sentiment for each airdrop
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Value Tracking</CardTitle>
                <CardDescription>
                  Monitor estimated and actual values of your airdrop portfolio
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Bank-level security with end-to-end encryption of your data
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Airdrops */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Airdrops</h2>
            <p className="text-muted-foreground">
              Hand-picked opportunities with high potential returns
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredAirdrops.map((airdrop) => (
              <Card key={airdrop.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{airdrop.title}</CardTitle>
                        <CardDescription>{airdrop.project}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge variant={airdrop.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {airdrop.status}
                      </Badge>
                      <Badge variant={airdrop.riskLevel === 'LOW' ? 'default' : airdrop.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}>
                        {airdrop.riskLevel}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium">${airdrop.estimatedValue}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{airdrop.participants.toLocaleString()}</span>
                      </div>
                    </div>
                    <Badge variant="outline">{airdrop.type}</Badge>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href="/auth">
                      <Button size="sm" className="flex-1" onClick={() => handleAirdropClick(airdrop)}>
                        View Details
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => trackClick(null, 'favorite_airdrop')}>
                      <Star className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/auth">
              <Button variant="outline" size="lg">
                View All Airdrops
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Maximize Your Airdrop Returns?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of users who are already using DropIQ to discover and track 
                the most valuable cryptocurrency airdrops in the market.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth">
                  <Button size="lg" className="text-base px-8">
                    Start Free Trial
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="text-base px-8">
                  Schedule Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  No credit card required
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  14-day free trial
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}