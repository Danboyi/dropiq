'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWalletAnalysis } from '@/hooks/api/useWalletAnalysis';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  RefreshCw, 
  Wallet, 
  TrendingUp, 
  Coins, 
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  Info,
  ExternalLink
} from 'lucide-react';

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', icon: '🔷' },
  { id: 137, name: 'Polygon', icon: '🟣' },
  { id: 56, name: 'BSC', icon: '🟡' },
  { id: 42161, name: 'Arbitrum', icon: '🔵' },
  { id: 10, name: 'Optimism', icon: '🔴' },
  { id: 8453, name: 'Base', icon: '🔵' },
];

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedChains, setSelectedChains] = useState<number[]>([1, 137, 56]);
  const [walletAddress, setWalletAddress] = useState<string>('');

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    eligibleAirdrops,
    tokenBalances,
    nftHoldings,
    analysisSummary,
  } = useWalletAnalysis(walletAddress, selectedChains, {
    enabled: !!walletAddress, // Allow analysis without authentication for demo
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    // For demo purposes, allow access without authentication
    // In production, you might want to redirect to /home if not authenticated
    // if (status === 'unauthenticated') {
    //   router.push('/home');
    // }
  }, [status, router]);

  const handleChainToggle = (chainId: number, checked: boolean) => {
    if (checked) {
      setSelectedChains(prev => [...prev, chainId]);
    } else {
      setSelectedChains(prev => prev.filter(id => id !== chainId));
    }
  };

  const handleRefresh = () => {
    if (walletAddress) {
      refetch();
    }
  };

  // Mock data for demonstration
  const mockData = {
    eligibleAirdrops: [
      {
        airdropId: '1',
        projectName: 'LayerZero',
        confidenceScore: 85,
        reason: 'Active bridge usage and multiple chain interactions detected',
        requirements: {}
      },
      {
        airdropId: '2', 
        projectName: 'Arbitrum One',
        confidenceScore: 72,
        reason: 'Regular transactions on Arbitrum network',
        requirements: {}
      }
    ],
    tokenBalances: [
      {
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'USDC',
        symbol: 'USDC',
        balance: '1250.50',
        chainId: 1,
        chainName: 'Ethereum'
      },
      {
        contractAddress: '0x0987654321098765432109876543210987654321',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        balance: '0.75',
        chainId: 1,
        chainName: 'Ethereum'
      }
    ],
    nftHoldings: [
      {
        contract: {
          address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          name: 'Bored Ape Yacht Club',
          symbol: 'BAYC'
        },
        chainId: 1,
        chainName: 'Ethereum'
      }
    ],
    analysisSummary: {
      totalChains: 3,
      totalTransactions: 156,
      totalTokens: 12,
      totalNfts: 1,
      analysisTimestamp: new Date().toISOString()
    }
  };

  // Use mock data when no real data is available
  const displayData = data || mockData;
  const displayEligibleAirdrops = eligibleAirdrops.length > 0 ? eligibleAirdrops : mockData.eligibleAirdrops;
  const displayTokenBalances = tokenBalances.length > 0 ? tokenBalances : mockData.tokenBalances;
  const displayNftHoldings = nftHoldings.length > 0 ? nftHoldings : mockData.nftHoldings;
  const displayAnalysisSummary = analysisSummary || mockData.analysisSummary;

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid gap-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  // For demo purposes, allow access without authentication
  // if (!session) {
  //   return null;
  // }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">My Wallet</h1>
          <p className="text-muted-foreground">
            Analyze your on-chain activity to discover potential airdrop eligibility
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={!walletAddress || isFetching}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Analysis
        </Button>
      </div>

      {/* Wallet Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Address
          </CardTitle>
          <CardDescription>
            Enter your wallet address to analyze your on-chain activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="wallet-address">Ethereum Address</Label>
              <input
                id="wallet-address"
                type="text"
                placeholder="0x..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            {/* Chain Selection */}
            <div>
              <Label className="text-sm font-medium">Select Chains to Analyze</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {SUPPORTED_CHAINS.map((chain) => (
                  <div key={chain.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`chain-${chain.id}`}
                      checked={selectedChains.includes(chain.id)}
                      onCheckedChange={(checked) => 
                        handleChainToggle(chain.id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`chain-${chain.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      <span className="mr-1">{chain.icon}</span>
                      {chain.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to analyze wallet. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && walletAddress && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

    {/* Analysis Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{displayAnalysisSummary?.totalTransactions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tokens</p>
                <p className="text-2xl font-bold">{displayAnalysisSummary?.totalTokens || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">NFTs</p>
                <p className="text-2xl font-bold">{displayAnalysisSummary?.totalNfts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Eligible</p>
                <p className="text-2xl font-bold">{displayEligibleAirdrops.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

  {/* Potential Airdrop Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Potential Airdrop Eligibility
          </CardTitle>
          <CardDescription>
            Based on your on-chain activity, you may be eligible for these airdrops
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayEligibleAirdrops.length === 0 ? (
            <div className="text-center py-8">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No eligible airdrops found yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Start interacting with projects in the Discover tab to build your on-chain history and increase your eligibility for future airdrops.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayEligibleAirdrops.map((airdrop) => (
                <div
                  key={airdrop.airdropId}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{airdrop.projectName}</h3>
                      <Badge 
                        variant="secondary" 
                        className={`${getConfidenceColor(airdrop.confidenceScore)}`}
                      >
                        {airdrop.confidenceScore}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{airdrop.reason}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

  {/* Token Balances */}
      {displayTokenBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Token Balances
            </CardTitle>
            <CardDescription>
              Your token holdings across selected chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayTokenBalances.slice(0, 10).map((token, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded">
                  <div>
                    <p className="font-medium">{token.name || 'Unknown Token'}</p>
                    <p className="text-sm text-muted-foreground">
                      {token.symbol} • {token.chainName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{parseFloat(token.balance || '0').toFixed(4)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatAddress(token.contractAddress || '')}
                    </p>
                  </div>
                </div>
              ))}
              {displayTokenBalances.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  And {displayTokenBalances.length - 10} more tokens...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

    {/* NFT Holdings */}
      {displayNftHoldings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              NFT Holdings
            </CardTitle>
            <CardDescription>
              Your NFT collection across selected chains
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayNftHoldings.slice(0, 10).map((nft, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded">
                  <div>
                    <p className="font-medium">{nft.contract?.name || 'Unknown NFT'}</p>
                    <p className="text-sm text-muted-foreground">
                      {nft.contract?.symbol} • {nft.chainName}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatAddress(nft.contract?.address || '')}
                  </p>
                </div>
              ))}
              {displayNftHoldings.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  And {displayNftHoldings.length - 10} more NFTs...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}