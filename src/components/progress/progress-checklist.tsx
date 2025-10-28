"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, RefreshCw, Save } from 'lucide-react';

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
    requirements: string;
  };
}

interface ProgressChecklistProps {
  progressData: ProgressData[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function ProgressChecklist({ progressData, isLoading, onRefresh }: ProgressChecklistProps) {
  const [checklistData, setChecklistData] = useState<Record<string, Record<string, boolean>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const parseRequirements = (requirements: string) => {
    try {
      return JSON.parse(requirements);
    } catch {
      // If not JSON, try to parse as simple text lines
      return requirements.split('\n').filter(line => line.trim()).map((line, index) => ({
        id: `req_${index}`,
        text: line.trim(),
        completed: false
      }));
    }
  };

  const handleChecklistChange = (projectId: string, requirementId: string, checked: boolean) => {
    setChecklistData(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        [requirementId]: checked
      }
    }));
  };

  const handleNotesChange = (projectId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [projectId]: note
    }));
  };

  const saveProgress = async (projectId: string) => {
    try {
      const response = await fetch('/api/user/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          progress: checklistData[projectId] || {},
          notes: notes[projectId] || ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      // Show success message
      console.log('Progress saved successfully');
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-surface border-border">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
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
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Checklists Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start tracking your progress by adding projects to your checklist.
          </p>
          <Button onClick={() => window.location.href = '/home'}>
            Discover Airdrops
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Project Checklists</h2>
        <Button variant="outline" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {progressData.map((item) => {
        const requirements = parseRequirements(item.airdrop.requirements);
        const projectChecklist = checklistData[item.id] || {};
        const completedCount = Object.values(projectChecklist).filter(Boolean).length;
        const totalCount = requirements.length;
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

        return (
          <Card key={item.id} className="bg-surface border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {item.airdrop.logoUrl && (
                    <img 
                      src={item.airdrop.logoUrl} 
                      alt={item.airdrop.name}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <CardTitle className="text-lg text-foreground">{item.airdrop.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.airdrop.category}</p>
                  </div>
                </div>
                <Badge variant="outline">
                  {completedCount}/{totalCount} Complete
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-foreground">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {requirements.map((req: any) => (
                  <div key={req.id} className="flex items-start gap-3">
                    <button
                      onClick={() => handleChecklistChange(item.id, req.id, !projectChecklist[req.id])}
                      className="mt-1 flex-shrink-0"
                    >
                      {projectChecklist[req.id] ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <label className="text-sm text-foreground cursor-pointer flex-1">
                      {req.text || req}
                    </label>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Notes</label>
                <Textarea
                  placeholder="Add any notes about your progress..."
                  value={notes[item.id] || ''}
                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  className="bg-muted/50 border-border"
                  rows={3}
                />
              </div>

              <Button 
                onClick={() => saveProgress(item.id)}
                className="w-full"
                variant="outline"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Progress
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}