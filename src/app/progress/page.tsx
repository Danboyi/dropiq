"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle2, Clock, Zap, Shield, TrendingUp, Calendar, Filter } from 'lucide-react';
import { useUserProgress } from '@/hooks/use-user-progress';
import { useDetectActivity } from '@/hooks/use-detect-activity';
import { ProgressOverview } from '@/components/progress/progress-overview';
import { ProgressChecklist } from '@/components/progress/progress-checklist';
import { ProgressInsights } from '@/components/progress/progress-insights';

export default function ProgressPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  
  const { 
    data: progressData = [], 
    isLoading, 
    error, 
    refetch 
  } = useUserProgress();
  
  const { 
    detectActivity, 
    isDetecting 
  } = useDetectActivity({ onSuccess: refetch });

  const handleDetectActivity = async (projectId: string) => {
    try {
      await detectActivity({ projectId });
    } catch (error) {
      console.error('Activity detection failed:', error);
    }
  };

  const completedProjects = progressData.filter(p => p.status === 'completed').length;
  const inProgressProjects = progressData.filter(p => p.status === 'in_progress').length;
  const totalPotentialValue = progressData.reduce((sum, p) => sum + (p.potentialValue || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Airdrop Progress</h1>
          <p className="text-muted-foreground mt-1">Track your airdrop farming progress across all projects</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            {completedProjects} Completed
          </Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            {inProgressProjects} In Progress
          </Badge>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressData.length}</div>
            <p className="text-xs text-muted-foreground">
              Active tracking
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressData.length > 0 
                ? Math.round((completedProjects / progressData.length) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Value</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalPotentialValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated rewards
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active This Week</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {progressData.filter(p => {
                const lastActivity = p.lastActivity ? new Date(p.lastActivity) : null;
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return lastActivity && lastActivity > weekAgo;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProgressOverview 
            progressData={progressData}
            isLoading={isLoading}
            onProjectSelect={setSelectedProject}
            onDetectActivity={handleDetectActivity}
            isDetecting={isDetecting}
          />
        </TabsContent>

        <TabsContent value="checklist">
          <ProgressChecklist 
            progressData={progressData}
            isLoading={isLoading}
            onRefresh={refetch}
          />
        </TabsContent>

        <TabsContent value="insights">
          <ProgressInsights 
            progressData={progressData}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}