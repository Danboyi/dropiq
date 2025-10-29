'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/stores/authStore';

interface PreferenceRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  riskScore: number;
  preferenceScore: number;
  recommendationReason: string;
  logoUrl?: string;
  websiteUrl: string;
}

export function PreferenceRecommendations() {
  const [recommendations, setRecommendations] = useState<PreferenceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchRecommendations();
    }
  }, [isAuthenticated, user]);

  const fetchRecommendations = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/preferences/recommendations?userId=${user.id}&limit=3`
      );
      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center space-y-4 mb-12">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-3xl font-bold text-primary">AI Recommendations For You</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Based on your risk profile, chain preferences, and activity patterns, 
          here are the airdrops we think you'll love.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {recommendations.map((airdrop) => (
          <Card key={airdrop.id} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {airdrop.logoUrl && (
                    <img 
                      src={airdrop.logoUrl} 
                      alt={airdrop.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <CardTitle className="text-lg">{airdrop.name}</CardTitle>
                </div>
                <Badge 
                  variant="outline" 
                  className="bg-primary/10 border-primary text-primary"
                >
                  <Star className="h-3 w-3 mr-1" />
                  {airdrop.preferenceScore}%
                </Badge>
              </div>
              <Badge variant="secondary" className="w-fit">
                {airdrop.category}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <CardDescription className="line-clamp-2">
                {airdrop.description}
              </CardDescription>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Risk Level</span>
                  <span>{airdrop.riskScore}/100</span>
                </div>
                <Progress value={airdrop.riskScore} className="h-2" />
              </div>

              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-sm font-medium mb-1">Why we recommend this:</div>
                <div className="text-xs text-muted-foreground">
                  {airdrop.recommendationReason}
                </div>
              </div>

              <Button className="w-full" asChild>
                <a href={airdrop.websiteUrl} target="_blank" rel="noopener noreferrer">
                  View Airdrop
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button variant="outline" asChild>
          <a href="/preferences">
            <Brain className="mr-2 h-4 w-4" />
            View Your Preference Profile
          </a>
        </Button>
      </div>
    </div>
  );
}