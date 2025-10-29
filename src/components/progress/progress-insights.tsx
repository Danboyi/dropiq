"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Target, DollarSign, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface ProgressData {
  id: string;
  status: string;
  potentialValue?: number;
  lastActivity?: string;
  notes?: string;
  airdrop: {
    id: string;
    name: string;
    description: string;
    logoUrl?: string;
    riskScore: number;
    category: string;
    endDate?: string;
  };
}

interface ProgressInsightsProps {
  progressData: ProgressData[];
  isLoading: boolean;
}

export function ProgressInsights({ progressData, isLoading }: ProgressInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="bg-surface border-border">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedProjects = progressData.filter(p => p.status === 'completed').length;
  const inProgressProjects = progressData.filter(p => p.status === 'in_progress').length;
  const claimedProjects = progressData.filter(p => p.status === 'claimed').length;
  
  const totalPotentialValue = progressData.reduce((sum, p) => sum + (p.potentialValue || 0), 0);
  const averageRiskScore = progressData.length > 0 
    ? progressData.reduce((sum, p) => sum + p.airdrop.riskScore, 0) / progressData.length 
    : 0;

  const categoryStats = progressData.reduce((acc, item) => {
    const category = item.airdrop.category;
    if (!acc[category]) {
      acc[category] = { count: 0, completed: 0, totalValue: 0 };
    }
    acc[category].count++;
    if (item.status === 'completed' || item.status === 'claimed') {
      acc[category].completed++;
    }
    acc[category].totalValue += item.potentialValue || 0;
    return acc;
  }, {} as Record<string, { count: number; completed: number; totalValue: number }>);

  const recentActivity = progressData
    .filter(p => p.lastActivity)
    .sort((a, b) => new Date(b.lastActivity!).getTime() - new Date(a.lastActivity!).getTime())
    .slice(0, 5);

  const upcomingDeadlines = progressData
    .filter(p => p.airdrop.endDate)
    .filter(p => new Date(p.airdrop.endDate!) > new Date())
    .sort((a, b) => new Date(a.airdrop.endDate!).getTime() - new Date(b.airdrop.endDate!).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-surface border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {progressData.length > 0 
                    ? Math.round(((completedProjects + claimedProjects) / progressData.length) * 100) 
                    : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalPotentialValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {averageRiskScore.toFixed(1)}/10
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold text-foreground">
                  {inProgressProjects}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{category}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {stats.count} projects
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      ${stats.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(stats.completed / stats.count) * 100} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground">
                  {stats.completed} of {stats.count} completed
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.airdrop.logoUrl && (
                      <img 
                        src={item.airdrop.logoUrl} 
                        alt={item.airdrop.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.airdrop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.lastActivity!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <Card className="bg-surface border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingDeadlines.map((item) => {
              const daysUntil = Math.ceil(
                (new Date(item.airdrop.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );
              
              return (
                <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.airdrop.logoUrl && (
                      <img 
                        src={item.airdrop.logoUrl} 
                        alt={item.airdrop.name}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.airdrop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Ends {new Date(item.airdrop.endDate!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {daysUntil <= 7 && (
                      <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    )}
                    <Badge variant={daysUntil <= 7 ? "destructive" : "outline"} className="text-xs">
                      {daysUntil} days
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}