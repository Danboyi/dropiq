'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Brain,
  BarChart3,
  PieChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeAirdrops: number;
    totalValue: number;
    engagementRate: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
  userBehavior: {
    totalEvents: number;
    uniquePages: number;
    topEventTypes: Record<string, number>;
    engagementScore: number;
    behaviorPatterns: string[];
  };
  marketData: {
    totalTokens: number;
    avgPrice: number;
    avgVolume24h: number;
    avgChange24h: number;
    topGainers: any[];
    topLosers: any[];
    marketSentiment: string;
  };
  predictions: {
    totalPredictions: number;
    averageConfidence: number;
    accuracyByType: Record<string, any>;
    recentAccuracy: number;
  };
}

export default function AnalyticsHome() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedTimeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/home?timeRange=${selectedTimeRange}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load analytics data</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Home</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and ML-powered predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Airdrops</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.activeAirdrops}</div>
            <p className="text-xs text-muted-foreground">
              +3 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.overview.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.engagementRate.toFixed(1)}%</div>
            <Progress value={data.overview.engagementRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="market">Market Analysis</TabsTrigger>
          <TabsTrigger value="predictions">ML Predictions</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
                <CardDescription>User journey through airdrop participation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Page Views</span>
                    <Badge variant="secondary">100%</Badge>
                  </div>
                  <Progress value={100} />
                  
                  <div className="flex items-center justify-between">
                    <span>Clicks</span>
                    <Badge variant="secondary">{data.overview.engagementRate.toFixed(0)}%</Badge>
                  </div>
                  <Progress value={data.overview.engagementRate} />
                  
                  <div className="flex items-center justify-between">
                    <span>Registrations</span>
                    <Badge variant="secondary">{(data.overview.engagementRate * 0.6).toFixed(0)}%</Badge>
                  </div>
                  <Progress value={data.overview.engagementRate * 0.6} />
                  
                  <div className="flex items-center justify-between">
                    <span>Completions</span>
                    <Badge variant="outline">{data.overview.conversionRate.toFixed(0)}%</Badge>
                  </div>
                  <Progress value={data.overview.conversionRate} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
                <CardDescription>Platform performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Average Session Duration</span>
                    <span className="font-medium">{Math.floor(data.overview.avgSessionDuration / 60)}m {data.overview.avgSessionDuration % 60}s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bounce Rate</span>
                    <span className="font-medium">32%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Page Views per Session</span>
                    <span className="font-medium">4.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Return User Rate</span>
                    <span className="font-medium">68%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Types</CardTitle>
                <CardDescription>Most common user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.userBehavior.topEventTypes)
                    .slice(0, 6)
                    .map(([eventType, count]) => (
                      <div key={eventType} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{eventType.replace('_', ' ')}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Score</CardTitle>
                <CardDescription>Overall user engagement level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">
                    {data.userBehavior.engagementScore.toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">out of 100</p>
                  <Progress value={data.userBehavior.engagementScore} className="mt-4" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Behavior Patterns</CardTitle>
                <CardDescription>AI-identified user patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.userBehavior.behaviorPatterns.map((pattern, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{pattern}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Market Overview</CardTitle>
                <CardDescription>Current market conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Tokens Tracked</span>
                    <Badge variant="secondary">{data.marketData.totalTokens}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Price</span>
                    <span className="font-medium">${data.marketData.avgPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>24h Volume</span>
                    <span className="font-medium">${data.marketData.avgVolume24h.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average 24h Change</span>
                    <div className="flex items-center gap-2">
                      {data.marketData.avgChange24h >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`font-medium ${data.marketData.avgChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {data.marketData.avgChange24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Market Sentiment</span>
                    <Badge variant={data.marketData.marketSentiment === 'bullish' ? 'default' : 
                                   data.marketData.marketSentiment === 'bearish' ? 'destructive' : 'secondary'}>
                      {data.marketData.marketSentiment}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best performing tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.marketData.topGainers.slice(0, 5).map((token, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{token.symbol}</span>
                        <span className="text-sm text-muted-foreground ml-2">{token.blockchain}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-500 font-medium">+{token.change24h?.toFixed(2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ML Model Performance</CardTitle>
                <CardDescription>Machine learning model accuracy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Total Predictions</span>
                    <Badge variant="secondary">{data.predictions.totalPredictions}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average Confidence</span>
                    <span className="font-medium">{(data.predictions.averageConfidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recent Accuracy</span>
                    <span className="font-medium">{data.predictions.recentAccuracy.toFixed(1)}%</span>
                  </div>
                  <Progress value={data.predictions.recentAccuracy} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Accuracy by Type</CardTitle>
                <CardDescription>Performance across different prediction types</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(data.predictions.accuracyByType).map(([type, metrics]) => (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm capitalize">{type.replace('_', ' ')}</span>
                        <span className="text-sm font-medium">{metrics.accuracy?.toFixed(1)}%</span>
                      </div>
                      <Progress value={metrics.accuracy || 0} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analytics</CardTitle>
              <CardDescription>User portfolio performance and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Portfolio analytics coming soon</p>
                <Button className="mt-4" variant="outline">
                  Connect Wallet to View Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}