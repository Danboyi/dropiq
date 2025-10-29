'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Zap,
  DollarSign,
  Shield,
  BarChart3,
  RefreshCw,
  Info
} from 'lucide-react';

interface ChainPreference {
  chainId: string;
  chainName: string;
  preferenceScore: number;
  usageFrequency: number;
  totalGasSpent: number;
  successRate: number;
  avgGasCost: number;
  lastUsedAt: string;
  preferenceFactors: Array<{
    factor: string;
    weight: number;
    score: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

interface ChainPreferencesProps {
  userId: string;
}

export function ChainPreferences({ userId }: ChainPreferencesProps) {
  const [preferences, setPreferences] = useState<ChainPreference[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchChainPreferences();
  }, [userId]);

  const fetchChainPreferences = async () => {
    try {
      const response = await fetch(`/api/preferences/chain-preferences?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Error fetching chain preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/preferences/chain-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Error analyzing chain preferences:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decreasing': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Chain Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Chain Preferences
              </CardTitle>
              <CardDescription>
                Your blockchain preferences based on usage patterns and success rates
              </CardDescription>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {preferences.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="font-medium">No Chain Data Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Start interacting with airdrops to build your chain preference profile.
                </p>
              </div>
              <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                Analyze Activity
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {preferences.map((chain, index) => (
                <div key={chain.chainId} className="border rounded-lg p-4 space-y-4">
                  {/* Chain Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-semibold">{chain.chainName}</div>
                      <Badge variant="outline" className="capitalize">
                        {chain.chainId}
                      </Badge>
                      {getTrendIcon(chain.trend)}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(chain.preferenceScore)}`}>
                        {chain.preferenceScore}
                      </div>
                      <div className="text-xs text-muted-foreground">Preference Score</div>
                    </div>
                  </div>

                  {/* Preference Score Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Preference</span>
                      <span>{chain.preferenceScore}/100</span>
                    </div>
                    <Progress value={chain.preferenceScore} className="h-2" />
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        Usage
                      </div>
                      <div className="font-medium">{chain.usageFrequency} times</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <DollarSign className="h-3 w-3" />
                        Avg Gas
                      </div>
                      <div className="font-medium">${chain.avgGasCost.toFixed(2)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Shield className="h-3 w-3" />
                        Success Rate
                      </div>
                      <div className="font-medium">{Math.round(chain.successRate)}%</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Info className="h-3 w-3" />
                        Last Used
                      </div>
                      <div className="font-medium">{formatDate(chain.lastUsedAt)}</div>
                    </div>
                  </div>

                  {/* Recommendation */}
                  {chain.recommendation && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <div className="text-sm">
                        <span className="font-medium">AI Recommendation: </span>
                        {chain.recommendation}
                      </div>
                    </div>
                  )}

                  {/* Preference Factors */}
                  {chain.preferenceFactors && chain.preferenceFactors.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Contributing Factors</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chain.preferenceFactors.slice(0, 4).map((factor, factorIndex) => (
                          <div key={factorIndex} className="flex items-center justify-between text-sm">
                            <span className="capitalize text-muted-foreground">
                              {factor.factor.replace(/_/g, ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <Progress value={factor.score} className="w-16 h-1.5" />
                              <span className="w-8 text-right">{factor.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}