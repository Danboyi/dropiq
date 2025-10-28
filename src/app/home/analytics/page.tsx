'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePremium } from '@/hooks/usePremium.tsx';
import { TrendingUp, BarChart3, PieChart, Activity, Crown, ArrowRight } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const { isPremium, isNotPremium, showUpgradePrompt, UpgradePromptModal } = usePremium();

  useEffect(() => {
    if (isNotPremium) {
      showUpgradePrompt('Advanced Analytics');
    }
  }, [isNotPremium, showUpgradePrompt]);

  if (isNotPremium) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Crown className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
          <p className="text-muted-foreground mb-4">
            Advanced Analytics is available for Premium members only
          </p>
          <Button onClick={() => router.push('/pricing')}>
            Upgrade to Premium
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        <UpgradePromptModal />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Deep insights into your airdrop performance and portfolio trends
          </p>
        </div>
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      </div>

      {/* Coming Soon Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <CardTitle>Portfolio Performance</CardTitle>
            </div>
            <CardDescription>
              Track your airdrop portfolio value over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Coming Soon</p>
              <p className="text-xs mt-2">Historical performance tracking and insights</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              <CardTitle>Asset Distribution</CardTitle>
            </div>
            <CardDescription>
              Visual breakdown of your airdrop holdings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Coming Soon</p>
              <p className="text-xs mt-2">Detailed allocation analysis</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              <CardTitle>Success Metrics</CardTitle>
            </div>
            <CardDescription>
              Track your airdrop success rates and patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Coming Soon</p>
              <p className="text-xs mt-2">Advanced success analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Preview */}
      <Card>
        <CardHeader>
          <CardTitle>What's Coming in Advanced Analytics</CardTitle>
          <CardDescription>
            Get ready for powerful insights to optimize your airdrop strategy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold">Performance Tracking</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Real-time portfolio valuation</li>
                <li>• Historical performance charts</li>
                <li>• Profit/loss tracking per airdrop</li>
                <li>• ROI calculations and comparisons</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Advanced Insights</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Success rate analytics</li>
                <li>• Trend identification</li>
                <li>• Risk assessment metrics</li>
                <li>• Predictive analytics</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Crown className="h-5 w-5" />
              <span className="font-medium">Premium Exclusive</span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
              These advanced analytics tools are being developed exclusively for Premium members. 
              Stay tuned for updates as we roll out these powerful features.
            </p>
          </div>
        </CardContent>
      </Card>

      <UpgradePromptModal />
    </div>
  );
}