import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserProfile, UserStats, LeaderboardEntry, UserProgress } from '@/types/user-profile';

// API functions
const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`/api/user/profile?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }
  const result = await response.json();
  return result.data;
};

const updateUserProfile = async (data: { userId: string; updates: Partial<UserProfile> }): Promise<UserProfile> => {
  const response = await fetch('/api/user/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update user profile');
  }
  const result = await response.json();
  return result.data;
};

const fetchUserStats = async (userId: string): Promise<UserStats> => {
  const response = await fetch(`/api/user/stats?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user stats');
  }
  const result = await response.json();
  return result.data;
};

const fetchLeaderboard = async (type: 'reputation' | 'earnings' | 'achievements' = 'reputation', limit: number = 10): Promise<LeaderboardEntry[]> => {
  const response = await fetch(`/api/user/leaderboard?type=${type}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }
  const result = await response.json();
  return result.data;
};

const fetchUserProgress = async (userId: string): Promise<UserProgress[]> => {
  const response = await fetch(`/api/user/progress?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user progress');
  }
  const result = await response.json();
  return result.data;
};

// Hooks
export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedProfile, variables) => {
      queryClient.setQueryData(['userProfile', variables.userId], updatedProfile);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
};

export const useUserStats = (userId: string) => {
  return useQuery({
    queryKey: ['userStats', userId],
    queryFn: () => fetchUserStats(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useLeaderboard = (type: 'reputation' | 'earnings' | 'achievements' = 'reputation', limit: number = 10) => {
  return useQuery({
    queryKey: ['leaderboard', type, limit],
    queryFn: () => fetchLeaderboard(type, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserProgress = (userId: string) => {
  return useQuery({
    queryKey: ['userProgress', userId],
    queryFn: () => fetchUserProgress(userId),
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
  });
};