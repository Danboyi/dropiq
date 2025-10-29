import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

// Types for preference data
export interface UserPreferenceProfile {
  userId: string;
  riskTolerance: string;
  chainPreferences: ChainPreference[];
  activityPatterns: ActivityPattern[];
  investmentHorizon: string;
  preferredAirdropTypes: string[];
  gasOptimizationLevel: number;
  interactionFrequency: string;
  lastUpdated: string;
  confidenceScore: number;
}

export interface ChainPreference {
  chainId: string;
  chainName: string;
  preferenceScore: number;
  interactionCount: number;
  successRate: number;
  avgGasSpent: number;
  lastInteraction: string;
}

export interface ActivityPattern {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number;
  activityFrequency: number;
  preferredActionTypes: string[];
  avgSessionDuration: number;
  conversionRate: number;
}

export interface PreferenceInsight {
  type: string;
  title: string;
  description: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  actionableRecommendation?: string;
}

export interface ActivityRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export const useUserPreferences = () => {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserPreferenceProfile | null>(null);
  const [chainPreferences, setChainPreferences] = useState<ChainPreference[]>([]);
  const [activityPattern, setActivityPattern] = useState<any>(null);
  const [insights, setInsights] = useState<PreferenceInsight[]>([]);
  const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch comprehensive user profile
  const fetchProfile = useCallback(async (refresh = false) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/preferences/profile${refresh ? '?refresh=true' : ''}`);
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
      } else {
        setError(data.error || 'Failed to fetch profile');
      }
    } catch (err) {
      setError('Network error while fetching profile');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Fetch chain preferences
  const fetchChainPreferences = useCallback(async (refresh = false) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/preferences/chains${refresh ? '?refresh=true' : ''}`);
      const data = await response.json();

      if (data.success) {
        setChainPreferences(data.chainPreferences);
      } else {
        setError(data.error || 'Failed to fetch chain preferences');
      }
    } catch (err) {
      setError('Network error while fetching chain preferences');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Fetch activity patterns
  const fetchActivityPatterns = useCallback(async (refresh = false) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/preferences/activity${refresh ? '?refresh=true' : ''}`);
      const data = await response.json();

      if (data.success) {
        setActivityPattern(data.activityPattern);
      } else {
        setError(data.error || 'Failed to fetch activity patterns');
      }
    } catch (err) {
      setError('Network error while fetching activity patterns');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Fetch activity insights
  const fetchInsights = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/preferences/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_insights' })
      });
      const data = await response.json();

      if (data.success) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
    }
  }, [session?.user?.id]);

  // Fetch activity recommendations
  const fetchRecommendations = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/preferences/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_recommendations' })
      });
      const data = await response.json();

      if (data.success) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    }
  }, [session?.user?.id]);

  // Update risk tolerance
  const updateRiskTolerance = useCallback(async (riskData: any) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_risk_tolerance',
          preferences: riskData
        })
      });
      const data = await response.json();

      if (data.success) {
        // Refresh profile to get updated data
        await fetchProfile();
        return true;
      } else {
        setError(data.error || 'Failed to update risk tolerance');
        return false;
      }
    } catch (err) {
      setError('Network error while updating risk tolerance');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, fetchProfile]);

  // Update chain preferences
  const updateChainPreferences = useCallback(async (chainData: ChainPreference[]) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_chain_preferences',
          preferences: chainData
        })
      });
      const data = await response.json();

      if (data.success) {
        await fetchChainPreferences();
        return true;
      } else {
        setError(data.error || 'Failed to update chain preferences');
        return false;
      }
    } catch (err) {
      setError('Network error while updating chain preferences');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, fetchChainPreferences]);

  // Update activity preferences
  const updateActivityPreferences = useCallback(async (activityData: any) => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_activity_preferences',
          preferences: activityData
        })
      });
      const data = await response.json();

      if (data.success) {
        await fetchActivityPatterns();
        return true;
      } else {
        setError(data.error || 'Failed to update activity preferences');
        return false;
      }
    } catch (err) {
      setError('Network error while updating activity preferences');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, fetchActivityPatterns]);

  // Record chain interaction
  const recordChainInteraction = useCallback(async (chainId: string, interactionData: any) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/preferences/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId,
          action: 'manual_interaction',
          data: interactionData
        })
      });
      const data = await response.json();

      if (data.success) {
        await fetchChainPreferences();
      }
    } catch (err) {
      console.error('Error recording chain interaction:', err);
    }
  }, [session?.user?.id, fetchChainPreferences]);

  // Record activity session
  const recordActivitySession = useCallback(async (sessionData: any) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/preferences/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_activity',
          data: sessionData
        })
      });
      const data = await response.json();

      if (data.success) {
        await fetchActivityPatterns();
      }
    } catch (err) {
      console.error('Error recording activity session:', err);
    }
  }, [session?.user?.id, fetchActivityPatterns]);

  // Generate new profile
  const generateNewProfile = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/preferences/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_new_profile'
        })
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        return true;
      } else {
        setError(data.error || 'Failed to generate new profile');
        return false;
      }
    } catch (err) {
      setError('Network error while generating new profile');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Get chain recommendations
  const getChainRecommendations = useCallback(async () => {
    if (!session?.user?.id) return [];

    try {
      const response = await fetch('/api/preferences/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recommendations'
        })
      });
      const data = await response.json();

      return data.success ? data.recommendations : [];
    } catch (err) {
      console.error('Error getting chain recommendations:', err);
      return [];
    }
  }, [session?.user?.id]);

  // Initialize data on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchChainPreferences();
      fetchActivityPatterns();
      fetchInsights();
      fetchRecommendations();
    }
  }, [session?.user?.id, fetchProfile, fetchChainPreferences, fetchActivityPatterns, fetchInsights, fetchRecommendations]);

  // Auto-refresh profile every 7 days
  useEffect(() => {
    if (!profile?.lastUpdated) return;

    const lastUpdated = new Date(profile.lastUpdated);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    if (lastUpdated < sevenDaysAgo) {
      fetchProfile(true);
    }
  }, [profile?.lastUpdated, fetchProfile]);

  return {
    // Data
    profile,
    chainPreferences,
    activityPattern,
    insights,
    recommendations,
    
    // State
    loading,
    error,
    
    // Actions
    fetchProfile,
    fetchChainPreferences,
    fetchActivityPatterns,
    fetchInsights,
    fetchRecommendations,
    updateRiskTolerance,
    updateChainPreferences,
    updateActivityPreferences,
    recordChainInteraction,
    recordActivitySession,
    generateNewProfile,
    getChainRecommendations,
    
    // Computed values
    isProfileComplete: !!profile && profile.confidenceScore > 50,
    hasChainData: chainPreferences.length > 0,
    hasActivityData: !!activityPattern,
    riskLevel: profile?.riskTolerance || 'moderate',
    preferredChains: chainPreferences.filter(c => c.preferenceScore > 50).slice(0, 3),
    peakActivityTime: activityPattern?.preferredTimeSlots?.[0]?.period || null,
    needsProfileRefresh: !profile?.lastUpdated || 
      new Date(profile.lastUpdated) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  };
};