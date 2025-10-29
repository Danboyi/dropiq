'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Shield, 
  BarChart3, 
  Activity,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  RefreshCw,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

interface PreferenceProfile {
  riskProfile: any;
  chainPreferences: any[];
  activityPattern: any;
  insights: any[];
  evolutionHistory: any[];
  completeness: {
    score: number;
    level: 'basic' | 'intermediate' | 'advanced' | 'complete';
    missingComponents: string[];
  };
  lastUpdated: string;
}

interface PreferenceDashboardProps {
  userId: string;
}

export function PreferenceDashboard({ userId }: PreferenceDashboardProps) {
  const [profile, setProfile] = useState<PreferenceProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/preferences/profile?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setProfile(data.data);
      }
    } catch (error) {
      console.error('Error fetching preference profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComprehensiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/preferences/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'analyze_all' })
      });
      const data = await response.json();
      if (data.success) {
        await fetchProfile(); // Refresh the entire profile
      }
    } catch (error) {
      console.error('Error running comprehensive analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const markInsightAsRead = async (insightId: string) => {
    try {
      await fetch('/api/preferences/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'mark_read', insightId })
      });
      await fetchProfile(); // Refresh to update insights
    } catch (error) {
      console.error('Error marking insight as read:', error);
    }
  };

  const markAllInsightsAsRead = async () => {
    try {
      await fetch('/api/preferences/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'mark_all_read' })
      });
      await fetchProfile(); // Refresh to update insights
    } catch (error) {
      console.error('Error marking all insights as read:', error);
    }
  };

  const getCompletenessColor = (level: string) => {
    switch (level) {
      case 'complete': return 'bg-green-500';
      case 'advanced': return 'bg-blue-500';
      case 'intermediate': return 'bg-yellow-500';
      case 'basic': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'risk_pattern': return <Shield className="h-4 w-4" />;
      case 'chain_behavior': return <BarChart3 className="h-4 w-4" />;
      case 'activity_insight': return <Activity className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-blue-500 bg-blue-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Preference Profile
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
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Preference Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <User className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-medium">No Profile Data</h3>
              <p className="text-sm text-muted-foreground">
                Start building your preference profile by taking the risk assessment.
              </p>
            </div>
            <Button onClick={handleComprehensiveAnalysis} disabled={isAnalyzing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Build Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Preference Profile
              </CardTitle>
              <CardDescription>
                AI-powered insights into your airdrop participation patterns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getCompletenessColor(profile.completeness.level)} text-white`}>
                {profile.completeness.level.charAt(0).toUpperCase() + profile.completeness.level.slice(1)} Profile
              </Badge>
              <Button
                onClick={handleComprehensiveAnalysis}
                disabled={isAnalyzing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Profile Completeness */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Completeness</span>
              <span>{profile.completeness.score}%</span>
            </div>
            <Progress value={profile.completeness.score} className="h-2" />
            {profile.completeness.missingComponents.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Missing: {profile.completeness.missingComponents.join(', ').replace(/_/g, ' ')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Insights Summary */}
      {profile.insights.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Latest Insights
                <Badge variant="outline">{profile.insights.length}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setShowInsights(!showInsights)}
                  variant="ghost"
                  size="sm"
                >
                  {showInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {profile.insights.length > 1 && (
                  <Button onClick={markAllInsightsAsRead} variant="outline" size="sm">
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          {showInsights && (
            <CardContent className="space-y-3">
              {profile.insights.slice(0, 3).map((insight) => (
                <Alert 
                  key={insight.id} 
                  className={`border-l-4 ${getImpactColor(insight.impactLevel)}`}
                >
                  {getInsightIcon(insight.insightType)}
                  <AlertDescription className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium">{insight.insightTitle}</div>
                        <div className="text-sm">{insight.insightDescription}</div>
                        {insight.actionableRecommendation && (
                          <div className="text-sm mt-1 italic">
                            💡 {insight.actionableRecommendation}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => markInsightAsRead(insight.id)}
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Confidence: {Math.round(insight.confidenceScore * 100)}% • 
                      Impact: {insight.impactLevel}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </CardContent>
          )}
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Profile</TabsTrigger>
          <TabsTrigger value="chains">Chain Preferences</TabsTrigger>
          <TabsTrigger value="activity">Activity Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk Summary */}
            {profile.riskProfile && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Risk Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{profile.riskProfile.riskToleranceScore}/100</div>
                  <Badge variant="outline" className="capitalize">
                    {profile.riskProfile.riskCategory}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {profile.riskProfile.experienceLevel} • {profile.riskProfile.financialCapacity} capacity
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chain Summary */}
            {profile.chainPreferences.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Chain Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{profile.chainPreferences.length}</div>
                  <div className="text-sm text-muted-foreground">Active chains</div>
                  <div className="flex flex-wrap gap-1">
                    {profile.chainPreferences.slice(0, 3).map((chain) => (
                      <Badge key={chain.chainId} variant="outline" className="text-xs">
                        {chain.chainName}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Summary */}
            {profile.activityPattern && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Pattern
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">{profile.activityPattern.dailyActiveTime}m</div>
                  <div className="text-sm text-muted-foreground">Daily active time</div>
                  <Badge variant="outline">
                    {profile.activityPattern.weeklyActiveDays} days/week
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Recent Evolution */}
          {profile.evolutionHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Changes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.evolutionHistory.slice(0, 3).map((evolution, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium capitalize">
                          {evolution.category}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {evolution.changeReason || 'Updated'}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(evolution.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="risk">
          {profile.riskProfile ? (
            <Card>
              <CardHeader>
                <CardTitle>Risk Profile Details</CardTitle>
                <CardDescription>
                  Your comprehensive risk assessment results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Risk Assessment</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Risk Tolerance Score</span>
                        <span className="font-medium">{profile.riskProfile.riskToleranceScore}/100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Category</span>
                        <Badge variant="outline" className="capitalize">
                          {profile.riskProfile.riskCategory}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Loss Acceptance</span>
                        <span className="font-medium">{profile.riskProfile.lossAcceptance}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time Horizon</span>
                        <span className="font-medium capitalize">{profile.riskProfile.timeHorizon}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Profile Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Experience Level</span>
                        <Badge variant="outline" className="capitalize">
                          {profile.riskProfile.experienceLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Financial Capacity</span>
                        <Badge variant="outline" className="capitalize">
                          {profile.riskProfile.financialCapacity}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Technical Knowledge</span>
                        <span className="font-medium">{profile.riskProfile.technicalKnowledge}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Security Consciousness</span>
                        <span className="font-medium">{profile.riskProfile.securityConsciousness}/10</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Risk Profile</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete the risk assessment to build your profile.
                </p>
                <Button onClick={handleComprehensiveAnalysis}>
                  Take Risk Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="chains">
          {profile.chainPreferences.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Chain Preferences</CardTitle>
                <CardDescription>
                  Your blockchain usage patterns and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {profile.chainPreferences.map((chain) => (
                    <div key={chain.chainId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{chain.chainName}</div>
                        <Badge variant="outline">{chain.preferenceScore}/100</Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Usage:</span>
                          <span className="ml-1">{chain.usageFrequency} times</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Success:</span>
                          <span className="ml-1">{Math.round(chain.successRate)}%</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Avg Gas:</span>
                          <span className="ml-1">${chain.avgGasCost.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trend:</span>
                          <span className="ml-1 capitalize">{chain.trend}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Chain Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start interacting with airdrops to build your chain preferences.
                </p>
                <Button onClick={handleComprehensiveAnalysis}>
                  Analyze Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {profile.activityPattern ? (
            <Card>
              <CardHeader>
                <CardTitle>Activity Patterns</CardTitle>
                <CardDescription>
                  Your behavioral patterns and productivity insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Activity Metrics</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Daily Active Time</span>
                        <span className="font-medium">{profile.activityPattern.dailyActiveTime} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weekly Active Days</span>
                        <span className="font-medium">{profile.activityPattern.weeklyActiveDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Session Duration</span>
                        <span className="font-medium">{profile.activityPattern.sessionDuration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tasks per Session</span>
                        <span className="font-medium">{profile.activityPattern.tasksPerSession}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium">Productivity</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Consistency Score</span>
                        <span className="font-medium">{profile.activityPattern.consistencyScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completion Rate</span>
                        <span className="font-medium">{profile.activityPattern.productivityMetrics?.completionRate || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efficiency Score</span>
                        <span className="font-medium">{profile.activityPattern.productivityMetrics?.efficiencyScore || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Peak Hours</span>
                        <span className="font-medium">
                          {profile.activityPattern.peakActivityHours?.join(', ') || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No Activity Data</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start using the platform to build your activity patterns.
                </p>
                <Button onClick={handleComprehensiveAnalysis}>
                  Analyze Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}