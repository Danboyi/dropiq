import { useMutation, useQueryClient } from '@tanstack/react-query';

// API functions
const followUser = async (data: { followerId: string; followingId: string }): Promise<void> => {
  const response = await fetch('/api/user/follow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to follow user');
  }
};

const unfollowUser = async (data: { followerId: string; followingId: string }): Promise<void> => {
  const response = await fetch(`/api/user/follow?followerId=${data.followerId}&followingId=${data.followingId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to unfollow user');
  }
};

// Hooks
export const useFollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: followUser,
    onSuccess: (_, variables) => {
      // Invalidate both users' profiles to update follower/following counts
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.followerId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.followingId] });
    },
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: unfollowUser,
    onSuccess: (_, variables) => {
      // Invalidate both users' profiles to update follower/following counts
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.followerId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.followingId] });
    },
  });
};