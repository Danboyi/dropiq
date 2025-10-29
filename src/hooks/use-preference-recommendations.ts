'use client';

import { useState, useEffect, useCallback } from 'react';

interface PreferenceRecommendation {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  logoUrl?: string;
  websiteUrl: string;
  riskScore: number;
  hypeScore: number;
  preferenceScore: number;
  scoreBreakdown: {
    riskMatch: number;
    chainMatch: number;
    activityMatch: number;
    categoryMatch: number;
  };
  recommendationReason: string;
  createdAt: string;
}

interface PreferenceRecommendationsResponse {
  recommendations: PreferenceRecommendation[];
  totalAnalyzed: number;
  relevantMatches: number;
  userProfile: {
    hasRiskProfile: boolean;
    hasChainPreferences: boolean;
    hasActivityPattern: boolean;
  };
}

export function usePreferenceRecommendations(userId: string, limit: number = 10) {
  const [recommendations, setRecommendations] = useState<PreferenceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PreferenceRecommendationsResponse['meta']>();

  const fetchRecommendations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/preferences/recommendations?userId=${userId}&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      if (data.success) {
        setRecommendations(data.data.recommendations);
        setMeta({
          totalAnalyzed: data.data.totalAnalyzed,
          relevantMatches: data.data.relevantMatches,
          userProfile: data.data.userProfile
        });
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, limit]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    meta,
    refetch: fetchRecommendations
  };
}