'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Navigation } from '@/components/layout/navigation';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Shield,
  Target,
  Bell,
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

export default function Home() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Mock data for demonstration
      const mockData = {
        overview: {
          totalAirdrops: 47,
          activeAirdrops: 12,
          completedAirdrops: 35,
          totalValue: 2847.50,
          successRate: 94.7
        },
        recentActivity: [
          {
            id: 1,
            type: 'airdrop_complete',
            title: 'DeFiChain Airdrop Completed',
            description: 'Successfully received 500 DFI tokens',
            timestamp: '2 hours ago',
            status: 'success',
            value: 250.00
          },
          {
            id: 2,
            type: 'new_airdrop',
            title: 'New NFT Marketplace Airdrop',
            description: 'Limited edition NFTs available for early users',
            timestamp: '5 hours ago',
            status: 'new',
            value: null
          },
          {
            id: 3,
            type: 'security_alert',
            title: 'Security Scan Required',
            description: 'New wallet detected - run security scan',
            timestamp: '1 day ago',
            status: 'warning',
            value: null
          }
        ],
        walletStats: {
          connectedWallets: 3,
          totalBalance: 5420.75,
          securedWallets: 2,
          pendingTransactions: 1
        },
        upcomingAirdrops: [
          {
            id: 1,
            name: 'Layer 2 Testnet',
            project: 'L2Network',
            deadline: '3 days',
            estimatedValue: 200,
            difficulty: 'Easy',
            status: 'active'
          },
          {
            id: 2,
            name: 'DeFi Protocol Launch',
            project: 'DeFiProtocol',
            deadline: '5 days',
            estimatedValue: 350,
            difficulty: 'Medium',
            status: 'upcoming'
          },
          {
            id: 3,
            name: 'Gaming Platform Rewards',
            project: 'GameFi',
            deadline: '1 week',
            estimatedValue: 150,
            difficulty: 'Easy',
            status: 'upcoming'
          }
        ]
      };

      setTimeout(() => {
        setDashboardData(mockData);
        setLoading(false);
      }, 1000);
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'new': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'new': return <Bell className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-6 lg:px-8">
        <div className="space-y-6">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.username || 'User'}!</h1>
            <p className="text-muted-foreground">
              Here's your airdrop activity overview and what's coming up next.
            </p>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Airdrops</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.totalAirdrops}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.overview.activeAirdrops} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.overview.totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12.5%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.overview.successRate}%</div>
                <Progress value={dashboardData.overview.successRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${dashboardData.walletStats.totalBalance.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.walletStats.connectedWallets} wallets
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest airdrop activities and notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className={`p-2 rounded-full ${getStatusColor(activity.status)}`}>
                        {getStatusIcon(activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{activity.title}</h4>
                          {activity.value && (
                            <span className="text-sm font-medium text-green-600">
                              +${activity.value.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/analytics">
                    View All Activity
                    <Eye className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Airdrops */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Airdrops
                </CardTitle>
                <CardDescription>
                  Don't miss these upcoming opportunities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.upcomingAirdrops.map((airdrop: any) => (
                    <div key={airdrop.id} className="p-3 rounded-lg border">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{airdrop.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {airdrop.project}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {airdrop.deadline}
                            </Badge>
                            <Badge className={`text-xs ${getDifficultyColor(airdrop.difficulty)}`}>
                              {airdrop.difficulty}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            ${airdrop.estimatedValue}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            est. value
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" asChild>
                  <Link href="/airdrops">
                    View All Airdrops
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and tools to manage your airdrop activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/airdrops">
                    <Target className="h-6 w-6" />
                    <span className="text-sm">Browse Airdrops</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/wallets">
                    <Wallet className="h-6 w-6" />
                    <span className="text-sm">Manage Wallets</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/security">
                    <Shield className="h-6 w-6" />
                    <span className="text-sm">Security Scan</span>
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
                  <Link href="/analytics">
                    <TrendingUp className="h-6 w-6" />
                    <span className="text-sm">View Analytics</span>
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}