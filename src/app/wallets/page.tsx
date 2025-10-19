'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Plus, 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  Copy,
  ExternalLink,
  TrendingUp,
  DollarSign,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardWallets() {
  const [loading, setLoading] = useState(true);
  const [wallets, setWallets] = useState<any[]>([]);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    // Simulate loading wallets data
    const loadWallets = async () => {
      setLoading(true);
      
      // Mock data
      const mockWallets = [
        {
          id: 1,
          name: 'Main Wallet',
          address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
          blockchain: 'Ethereum',
          balance: 2847.50,
          balanceChange: 12.5,
          status: 'connected',
          securityScore: 95,
          lastActivity: '2 hours ago',
          transactions: 47,
          secured: true,
          tags: ['main', 'trading']
        },
        {
          id: 2,
          name: 'Airdrop Wallet',
          address: '0x8ba1f109551bD432803012645Hac136c',
          blockchain: 'Polygon',
          balance: 1250.75,
          balanceChange: -3.2,
          status: 'connected',
          securityScore: 88,
          lastActivity: '1 day ago',
          transactions: 23,
          secured: true,
          tags: ['airdrops', 'testnet']
        },
        {
          id: 3,
          name: 'DeFi Wallet',
          address: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
          blockchain: 'BSC',
          balance: 847.25,
          balanceChange: 8.7,
          status: 'connected',
          securityScore: 76,
          lastActivity: '3 days ago',
          transactions: 15,
          secured: false,
          tags: ['defi', 'yield']
        },
        {
          id: 4,
          name: 'Gaming Wallet',
          address: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
          blockchain: 'Arbitrum',
          balance: 475.25,
          balanceChange: 0.0,
          status: 'disconnected',
          securityScore: 0,
          lastActivity: '1 week ago',
          transactions: 8,
          secured: false,
          tags: ['gaming', 'nft']
        }
      ];

      setTimeout(() => {
        setWallets(mockWallets);
        setLoading(false);
      }, 1000);
    };

    loadWallets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSecurityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score > 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const connectedWallets = wallets.filter(w => w.status === 'connected').length;
  const securedWallets = wallets.filter(w => w.secured).length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Wallets</h1>
            <p className="text-muted-foreground">
              Manage and monitor your cryptocurrency wallets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowBalances(!showBalances)}>
              {showBalances ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showBalances ? 'Hide' : 'Show'} Balances
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Wallet
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {showBalances ? `$${totalBalance.toFixed(2)}` : '****'}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all wallets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{connectedWallets}</div>
              <p className="text-xs text-muted-foreground">
                of {wallets.length} wallets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Secured</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securedWallets}</div>
              <p className="text-xs text-muted-foreground">
                with 2FA enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">24h Change</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">+5.8%</div>
              <p className="text-xs text-muted-foreground">
                Portfolio performance
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Wallets List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {wallets.map((wallet) => (
            <Card key={wallet.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{wallet.name}</CardTitle>
                      <Badge className={getStatusColor(wallet.status)}>
                        {wallet.status}
                      </Badge>
                      {wallet.secured && (
                        <Shield className="h-4 w-4 text-green-600" title="Secured" />
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-2">
                      <span>{wallet.blockchain}</span>
                      <span>•</span>
                      <span className="font-mono text-xs">
                        {formatAddress(wallet.address)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-0"
                        onClick={() => copyToClipboard(wallet.address)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Balance */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">
                        {showBalances ? `$${wallet.balance.toFixed(2)}` : '****'}
                      </div>
                      <div className={`text-sm ${wallet.balanceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {wallet.balanceChange >= 0 ? '+' : ''}{wallet.balanceChange}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Transactions</div>
                      <div className="text-lg font-medium">{wallet.transactions}</div>
                    </div>
                  </div>

                  {/* Security Score */}
                  {wallet.status === 'connected' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Security Score</span>
                        <span className={`text-sm font-medium ${getSecurityColor(wallet.securityScore)}`}>
                          {wallet.securityScore}%
                        </span>
                      </div>
                      <Progress value={wallet.securityScore} className="h-2" />
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {wallet.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Last Activity */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Last activity: {wallet.lastActivity}</span>
                    {wallet.status === 'connected' ? (
                      <Button size="sm" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    ) : (
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Reconnect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Recommendations
            </CardTitle>
            <CardDescription>
              Improve your wallet security with these recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <h4 className="font-medium">Enable 2FA on DeFi Wallet</h4>
                  <p className="text-sm text-muted-foreground">
                    Add two-factor authentication for enhanced security
                  </p>
                </div>
                <Button size="sm">Enable</Button>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <h4 className="font-medium">All wallets secured</h4>
                  <p className="text-sm text-muted-foreground">
                    Your connected wallets have proper security measures
                  </p>
                </div>
                <Badge className="bg-green-100 text-green-800">Good</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}