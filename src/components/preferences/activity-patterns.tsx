'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Brain,
  RefreshCw,
  BarChart3,
  Zap,
  AlertCircle
} from 'lucide-react';

interface ActivityPattern {
  dailyActiveTime: number;
  weeklyActiveDays: number;
  preferredTimeSlots: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  sessionDuration: number;
  tasksPerSession: number;
  peakActivityHours: number[];
  consistencyScore: number;
  burstActivity: boolean;
  weekendActivity: number;
  seasonalPatterns: Array<{
    month: number;
    activityLevel: number;
  }>;
  productivityMetrics: {
    tasksPerHour: number;
    completionRate: number;
    efficiencyScore: number;
  };
  behaviorInsights: Array<{
    pattern: string;
    confidence: number;
    recommendation: string;
  }>;
}

interface ActivityPatternsProps {
  userId: string;
}

export function ActivityPatterns({ userId }: ActivityPatternsProps) {
  const [pattern, setPattern] = useState<ActivityPattern | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchActivityPattern();
  }, [userId]);

  const fetchActivityPattern = async () => {
    try {
      const response = await fetch(`/api/preferences/activity-patterns?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setPattern(data.data);
      }
    } catch (error) {
      console.error('Error fetching activity pattern:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/preferences/activity-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.success) {
        setPattern(data.data);
      }
    } catch (error) {
      console.error('Error analyzing activity pattern:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTimeSlotLabel = (slot: string) => {
    switch (slot) {
      case 'morning': return 'Morning (6AM-12PM)';
      case 'afternoon': return 'Afternoon (12PM-6PM)';
      case 'evening': return 'Evening (6PM-12AM)';
      case 'night': return 'Night (12AM-6AM)';
      default: return slot;
    }
  };

  const getConsistencyLevel = (score: number) => {
    if (score >= 80) return { label: 'Very Consistent', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Consistent', color: 'bg-blue-500' };
    if (score >= 40) return { label: 'Moderate', color: 'bg-yellow-500' };
    return { label: 'Inconsistent', color: 'bg-red-500' };
  };

  const getEfficiencyLevel = (score: number) => {
    if (score >= 80) return { label: 'Highly Efficient', color: 'text-green-600' };
    if (score >= 60) return { label: 'Efficient', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Moderate', color: 'text-yellow-600' };
    return { label: 'Needs Improvement', color: 'text-red-600' };
  };

  const formatHours = (hours: number[]) => {
    return hours.map(hour => {
      if (hour === 0) return '12AM';
      if (hour < 12) return `${hour}AM`;
      if (hour === 12) return '12PM';
      return `${hour - 12}PM`;
    }).join(', ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Patterns
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

  if (!pattern) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="font-medium">No Activity Data Yet</h3>
              <p className="text-sm text-muted-foreground">
                Start using the platform to build your activity pattern profile.
              </p>
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              Analyze Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const consistencyLevel = getConsistencyLevel(pattern.consistencyScore);
  const efficiencyLevel = getEfficiencyLevel(pattern.productivityMetrics.efficiencyScore);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Patterns
              </CardTitle>
              <CardDescription>
                Your behavioral patterns and productivity insights
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
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Daily Active Time
              </div>
              <div className="text-2xl font-bold">{pattern.dailyActiveTime}m</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Weekly Active Days
              </div>
              <div className="text-2xl font-bold">{pattern.weeklyActiveDays}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="h-4 w-4" />
                Tasks/Session
              </div>
              <div className="text-2xl font-bold">{pattern.tasksPerSession}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Consistency
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{pattern.consistencyScore}%</div>
                <Badge className={consistencyLevel.color}>
                  {consistencyLevel.label}
                </Badge>
              </div>
            </div>
          </div>

          {/* Time Preferences */}
          <div className="space-y-4">
            <h3 className="font-medium">Time Preferences</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(pattern.preferredTimeSlots).map(([slot, minutes]) => (
                <div key={slot} className="space-y-2">
                  <div className="text-sm text-muted-foreground">
                    {getTimeSlotLabel(slot)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Activity</span>
                      <span>{minutes}m</span>
                    </div>
                    <Progress value={(minutes / Math.max(...Object.values(pattern.preferredTimeSlots))) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Peak Hours */}
          {pattern.peakActivityHours.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Peak Activity Hours</h3>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">{formatHours(pattern.peakActivityHours)}</span>
              </div>
            </div>
          )}

          {/* Productivity Metrics */}
          <div className="space-y-4">
            <h3 className="font-medium">Productivity Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Tasks per Hour</div>
                <div className="text-xl font-semibold">{pattern.productivityMetrics.tasksPerHour}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Completion Rate</div>
                <div className="text-xl font-semibold">{pattern.productivityMetrics.completionRate}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Efficiency Score</div>
                <div className={`text-xl font-semibold ${efficiencyLevel.color}`}>
                  {pattern.productivityMetrics.efficiencyScore}%
                </div>
                <div className="text-xs text-muted-foreground">{efficiencyLevel.label}</div>
              </div>
            </div>
          </div>

          {/* Behavior Insights */}
          {pattern.behaviorInsights.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium flex items-center gap-2">
                <Brain className="h-4 w-4" />
                AI Insights
              </h3>
              <div className="space-y-2">
                {pattern.behaviorInsights.map((insight, index) => (
                  <div key={index} className="bg-muted/50 rounded-lg p-3">
                    <div className="text-sm">{insight.recommendation}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Confidence: {Math.round(insight.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Patterns */}
          <div className="space-y-3">
            <h3 className="font-medium">Activity Characteristics</h3>
            <div className="flex flex-wrap gap-2">
              {pattern.burstActivity && (
                <Badge variant="outline">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Burst Activity
                </Badge>
              )}
              {pattern.weekendActivity > 1.2 && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Weekend Active
                </Badge>
              )}
              {pattern.weekendActivity < 0.8 && (
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Weekday Active
                </Badge>
              )}
              {pattern.sessionDuration > 45 && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  Long Sessions
                </Badge>
              )}
              {pattern.sessionDuration < 15 && (
                <Badge variant="outline">
                  <Zap className="h-3 w-3 mr-1" />
                  Quick Sessions
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}