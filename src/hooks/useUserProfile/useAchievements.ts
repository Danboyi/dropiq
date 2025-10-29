import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Achievement, UserAchievement } from '@/types/user-profile';

// API functions
const unlockAchievement = async (data: { userId: string; achievementId: string }): Promise<UserAchievement> => {
  const response = await fetch('/api/user/achievements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to unlock achievement');
  }
  const result = await response.json();
  return result.data;
};

const fetchAchievements = async (): Promise<Achievement[]> => {
  const response = await fetch('/api/achievements');
  if (!response.ok) {
    throw new Error('Failed to fetch achievements');
  }
  const result = await response.json();
  return result.data;
};

// Hooks
export const useUnlockAchievement = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: unlockAchievement,
    onSuccess: (newAchievement, variables) => {
      // Invalidate user profile to show new achievement
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['userStats', variables.userId] });
      
      // Show success notification (you can implement this with a toast library)
      console.log('Achievement unlocked:', newAchievement.achievement.name);
    },
  });
};

export const useAchievements = () => {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: fetchAchievements,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};