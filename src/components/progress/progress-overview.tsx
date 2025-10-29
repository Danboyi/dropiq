"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, Target, Zap, AlertCircle, CheckCircle } from 'lucide-react';

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

interface ProgressOverviewProps {
  progressData: ProgressData[];
  isLoading: boolean;
  onProjectSelect: (projectId: string) => void;
  onDetectActivity: (projectId: string) => void;
  isDetecting: boolean;
}

export function ProgressOverview({ 
  progressData, 
  isLoading, 
  onProjectSelect, 
  onDetectActivity, 
  isDetecting 
}: ProgressOverviewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-surface border-border">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (progressData.length === 0) {
    return (
      <Card className="bg-surface border-border">
        <CardContent className="p-12 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Progress Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your airdrop progress by marking projects as interested.
          </p>
          <Button onClick={() => window.location.href = '/home'}>
            Discover Airdrops
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'claimed':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Zap className="h-4 w-4" />;
      case 'claimed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {progressData.map((item) => (
        <Card key={item.id} className="bg-surface border-border hover:border-border/80 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {item.airdrop.logoUrl && (
                  <img 
                    src={item.airdrop.logoUrl} 
                    alt={item.airdrop.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                )}
                <div>
                  <CardTitle className="text-lg text-foreground">{item.airdrop.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{item.airdrop.category}</p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusColor(item.status)}>
                {getStatusIcon(item.status)}
                <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.airdrop.description}
            </p>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Risk: {item.airdrop.riskScore}/10</span>
                </div>
                {item.potentialValue && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">${item.potentialValue}</span>
                  </div>
                )}
              </div>
              {item.lastActivity && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {new Date(item.lastActivity).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {item.notes && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onProjectSelect(item.id)}
              >
                View Details
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => onDetectActivity(item.id)}
                disabled={isDetecting}
              >
                {isDetecting ? 'Detecting...' : 'Detect Activity'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}