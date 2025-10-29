'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Settings,
  Activity,
  Link2,
  BarChart3
} from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';

const UserPreferenceDashboard: React.FC = () => {
  const {
    profile,
    chainPreferences,
    activityPattern,
    insights,
    recommendations,
    loading,
    error,
    fetchProfile,
    fetchChainPreferences,
    fetchActivityPatterns,
    generateNewProfile,
    isProfileComplete,
    hasChainData,
    hasActivityData,
    riskLevel,
    preferredChains,
    peakActivityTime,
    needsProfileRefresh
  } = useUserPreferences();

  const [activeTab, setActiveTab] = useState('overview');

  const handleRefreshProfile = async () => {
    await generateNewProfile();
    await fetchChainPreferences(true);
    await fetchActivityPatterns(true);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'very_conservative': return 'bg-green-500';
      case 'conservative': return 'bg-blue-500';
      case 'moderate': return 'bg-yellow-500';
      case 'aggressive': return 'bg-orange-500';
      case 'very_aggressive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLabel = (risk: string) => {
    return risk.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`;
    return `${Math.round(minutes / 60)}h ${Math.round(minutes % 60)}m`;
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading your preference profile...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Preference Profile</h2>
          <p className="text-muted-foreground">
            AI-powered insights based on your behavior patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          {needsProfileRefresh && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <RefreshCw className="h-3 w-3 mr-1" />
              Update Available
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshProfile}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Profile Completion Status */}
      {!isProfileComplete && (
        <Alert className="border-blue-200 bg-blue-50">
          <Brain className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Your profile is still being analyzed. Complete more airdrop tasks to get personalized recommendations.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Profile</TabsTrigger>
          <TabsTrigger value="chains">Chain Preferences</TabsTrigger>
          <TabsTrigger value="activity">Activity Patterns</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Risk Tolerance Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Risk Tolerance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getRiskColor(riskLevel)}`} />
                  <span className="text-sm font-medium">
                    {getRiskLabel(riskLevel)}
                  </span>
                </div>
                {profile?.confidenceScore && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Confidence</span>
                      <span>{Math.round(profile.confidenceScore)}%</span>
                    </div>
                    <Progress value={profile.confidenceScore} className="h-1" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferred Chains Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Link2 className="h-4 w-4 mr-2" />
                  Preferred Chains
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasChainData ? (
                  <div className="space-y-1">
                    {preferredChains.slice(0, 3).map((chain, index) => (
                      <div key={chain.chainId} className="flex items-center justify-between">
                        <span className="text-sm">{chain.chainName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(chain.preferenceScore)}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Activity Pattern Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Peak Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasActivityData && peakActivityTime ? (
                  <div>
                    <p className="text-sm font-medium capitalize">{peakActivityTime}</p>
                    {activityPattern?.sessionDuration && (
                      <p className="text-xs text-muted-foreground">
                        {formatTime(activityPattern.sessionDuration)} avg session
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No data yet</p>
                )}
              </CardContent>
            </Card>

            {/* Interaction Frequency Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium capitalize">
                    {profile?.interactionFrequency || 'medium'}
                  </span>
                </div>
                {profile?.preferredAirdropTypes?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {profile.preferredAirdropTypes.length} preferred types
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Insights and Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Insights
                </CardTitle>
                <CardDescription>
                  Personalized insights based on your behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                {insights.length > 0 ? (
                  <div className="space-y-3">
                    {insights.slice(0, 3).map((insight, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{insight.title}</h4>
                          <Badge 
                            variant={insight.impactLevel === 'high' ? 'destructive' : 
                                   insight.impactLevel === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {insight.impactLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {insight.description}
                        </p>
                        {insight.actionableRecommendation && (
                          <p className="text-xs text-blue-600 mt-2">
                            💡 {insight.actionableRecommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Complete more activities to see personalized insights
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Suggestions to optimize your airdrop strategy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium">{rec.title}</h4>
                          <Badge 
                            variant={rec.priority === 'high' ? 'destructive' : 
                                   rec.priority === 'medium' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {rec.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {rec.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Continue your activities to receive personalized recommendations
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Risk Profile Tab */}
        <TabsContent value="risk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Risk Assessment
              </CardTitle>
              <CardDescription>
                Your risk tolerance and investment preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${getRiskColor(riskLevel)}`} />
                <div>
                  <h3 className="text-lg font-medium">{getRiskLabel(riskLevel)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Based on your behavior patterns and preferences
                  </p>
                </div>
              </div>

              {profile?.investmentHorizon && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Investment Horizon</p>
                    <p className="text-lg font-medium capitalize">{profile.investmentHorizon.replace('_', ' ')}</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Gas Optimization</p>
                    <p className="text-lg font-medium">{Math.round(profile.gasOptimizationLevel)}%</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Preferred Types</p>
                    <p className="text-lg font-medium">{profile.preferredAirdropTypes?.length || 0}</p>
                  </div>
                </div>
              )}

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Risk Analysis Factors</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Gas Spending Pattern</span>
                    <Badge variant="outline">Moderate</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Project Diversification</span>
                    <Badge variant="outline">Good</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Success Rate</span>
                    <Badge variant="outline">High</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chain Preferences Tab */}
        <TabsContent value="chains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Link2 className="h-5 w-5 mr-2" />
                Chain Preferences
              </CardTitle>
              <CardDescription>
                Your interaction patterns across different blockchain networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasChainData ? (
                <div className="space-y-4">
                  {chainPreferences.map((chain) => (
                    <div key={chain.chainId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Link2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{chain.chainName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {chain.interactionCount} interactions • {Math.round(chain.successRate)}% success rate
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-medium">{Math.round(chain.preferenceScore)}%</div>
                        <Progress value={chain.preferenceScore} className="w-20 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Start interacting with airdrops to see your chain preferences
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Patterns Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Activity Patterns
              </CardTitle>
              <CardDescription>
                When and how you interact with the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {hasActivityData ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Average Session Duration</p>
                      <p className="text-2xl font-medium">
                        {formatTime(activityPattern?.sessionDuration || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Tasks per Session</p>
                      <p className="text-2xl font-medium">
                        {Math.round(activityPattern?.tasksPerSession || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Weekly Active Days</p>
                      <p className="text-2xl font-medium">
                        {activityPattern?.weeklyActiveDays || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Consistency Score</p>
                      <p className="text-2xl font-medium">
                        {Math.round(activityPattern?.consistencyScore || 0)}%
                      </p>
                    </div>
                  </div>

                  {activityPattern?.preferredTimeSlots?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3">Preferred Time Slots</h4>
                      <div className="space-y-2">
                        {activityPattern.preferredTimeSlots.slice(0, 3).map((slot: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span className="capitalize font-medium">{slot.period}</span>
                            <Badge variant="secondary">{slot.frequency} activities</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Complete more activities to see your patterns
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserPreferenceDashboard;