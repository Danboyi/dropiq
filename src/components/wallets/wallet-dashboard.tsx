'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { useWalletStore } from '@/lib/store/wallet';
import { WalletConnectModal } from '@/components/wallets/wallet-connect-modal';
import { ProtectedRoute } from '@/components/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Shield, 
  TrendingUp, 
  Gift, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';

interface WalletDashboardProps {
  address: string;
}

export function WalletDashboard({ address }: WalletDashboardProps) {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [securityScan, setSecurityScan] = useState<any>(null);
  const [airdropEligibility, setAirdropEligibility] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  const { user, isGuest } = useAuthStore();
  const { connection, balance, tokens, refreshBalance } = useWalletStore();

  useEffect(() => {
    if (address) {
      scanWallet();
    }
  }, [address]);

  const scanWallet = async () => {
    setIsScanning(true);
    try {
      // Perform security scan
      const securityResponse = await fetch('/api/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (securityResponse.ok) {
        const securityData = await securityResponse.json();
        setSecurityScan(securityData.scan);
      }

      // Get airdrop eligibility
      const eligibilityResponse = await fetch('/api/wallets/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });

      if (eligibilityResponse.ok) {
        const eligibilityData = await eligibilityResponse.json();
        setAirdropEligibility(eligibilityData.eligibility);
      }
    } catch (error) {
      console.error('Wallet scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const eth = parseFloat(balance) / 1e18;
    return `${eth.toFixed(4)} ETH`;
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskLevelBadge = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!connection) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-medium">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Connect a wallet to view your dashboard and airdrop eligibility
              </p>
            </div>
            <Button onClick={() => setShowWalletModal(true)}>
              <Wallet className="h-4 w-4 mr-2" />
              Connect Wallet
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Wallet Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {formatAddress(connection.address)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(connection.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {connection.provider} • Chain ID: {connection.chainId}
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refreshBalance}
                  disabled={isScanning}
                >
                  <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowBalance(!showBalance)}
                >
                  {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold">
                  {showBalance ? formatBalance(balance) : '•••••• ETH'}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="text-2xl font-bold">{tokens.length}</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Security Score</p>
                <p className={`text-2xl font-bold ${getRiskLevelColor(securityScan?.riskLevel || 'low')}`}>
                  {securityScan ? (
                    <span className="flex items-center gap-2">
                      {securityScan.riskLevel === 'low' && 'Excellent'}
                      {securityScan.riskLevel === 'medium' && 'Good'}
                      {securityScan.riskLevel === 'high' && 'Fair'}
                      {securityScan.riskLevel === 'critical' && 'Poor'}
                    </span>
                  ) : (
                    'Scanning...'
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest Mode Banner */}
        {isGuest && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                You're viewing limited data in guest mode. Upgrade to a full account for detailed analytics and saved progress.
              </span>
              <Button size="sm" variant="outline">
                Upgrade Now
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="airdrops">Airdrops</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Portfolio Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Value</span>
                    <span className="font-medium">
                      {showBalance ? formatBalance(balance) : '•••••• ETH'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Token Types</span>
                    <span className="font-medium">{tokens.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Network</span>
                    <Badge variant="outline">Ethereum</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Airdrop Potential */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Airdrop Potential
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Eligible Airdrops</span>
                    <span className="font-medium">
                      {airdropEligibility.filter(a => a.isEligible).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Estimated Value</span>
                    <span className="font-medium">
                      ${airdropEligibility.reduce((sum, a) => sum + (a.estimatedValue || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Confidence Level</span>
                    <div className="flex items-center gap-2">
                      <Progress value={75} className="w-16" />
                      <span className="text-sm">75%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            {isScanning ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Scanning wallet security...</span>
                  </div>
                </CardContent>
              </Card>
            ) : securityScan ? (
              <div className="space-y-4">
                {/* Security Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Security Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Risk Level</span>
                      <Badge className={getRiskLevelBadge(securityScan.riskLevel)}>
                        {securityScan.riskLevel.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {securityScan.threats.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Detected Threats:</p>
                        {securityScan.threats.map((threat: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{threat.type}</p>
                              <p className="text-xs text-muted-foreground">{threat.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {securityScan.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Recommendations:</p>
                        {securityScan.recommendations.map((rec: string, index: number) => (
                          <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                            <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                            <p className="text-sm">{rec}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">Security scan not available</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="airdrops" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5" />
                  Airdrop Eligibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                {airdropEligibility.length > 0 ? (
                  <div className="space-y-3">
                    {airdropEligibility.map((airdrop, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{airdrop.projectName}</p>
                          <p className="text-sm text-muted-foreground">
                            {airdrop.requirements.filter((r: any) => r.isMet).length}/{airdrop.requirements.length} requirements met
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={airdrop.isEligible ? "default" : "secondary"}>
                            {airdrop.isEligible ? "Eligible" : "Not Eligible"}
                          </Badge>
                          {airdrop.estimatedValue && (
                            <p className="text-sm text-muted-foreground mt-1">
                              ~${airdrop.estimatedValue}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No airdrop data available</p>
                    <Button size="sm" className="mt-2" onClick={scanWallet}>
                      Refresh Data
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground">Activity tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <WalletConnectModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
}