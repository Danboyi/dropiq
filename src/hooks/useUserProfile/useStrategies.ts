import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  Strategy, 
  StrategyCreateData, 
  StrategyUpdateData, 
  StrategyFilter,
  StrategyComment,
  StrategyRating
} from '@/types/user-profile';

// API functions
const fetchStrategies = async (filter: StrategyFilter = {}): Promise<{ strategies: Strategy[]; total: number }> => {
  const params = new URLSearchParams();
  
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value.toString());
    }
  });
  
  const response = await fetch(`/api/strategies?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch strategies');
  }
  const result = await response.json();
  return {
    strategies: result.data,
    total: result.total
  };
};

const fetchStrategy = async (strategyId: string): Promise<Strategy> => {
  const response = await fetch(`/api/strategies/${strategyId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch strategy');
  }
  const result = await response.json();
  return result.data;
};

const createStrategy = async (data: { authorId: string; strategyData: StrategyCreateData }): Promise<Strategy> => {
  const response = await fetch('/api/strategies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create strategy');
  }
  const result = await response.json();
  return result.data;
};

const updateStrategy = async (data: { strategyId: string; authorId: string; updateData: StrategyUpdateData }): Promise<Strategy> => {
  const response = await fetch(`/api/strategies/${data.strategyId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authorId: data.authorId,
      ...data.updateData
    }),
  });
  if (!response.ok) {
    throw new Error('Failed to update strategy');
  }
  const result = await response.json();
  return result.data;
};

const deleteStrategy = async (data: { strategyId: string; authorId: string }): Promise<void> => {
  const response = await fetch(`/api/strategies/${data.strategyId}?authorId=${data.authorId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete strategy');
  }
};

const likeStrategy = async (data: { strategyId: string; userId: string }): Promise<void> => {
  const response = await fetch(`/api/strategies/${data.strategyId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId: data.userId }),
  });
  if (!response.ok) {
    throw new Error('Failed to like strategy');
  }
};

const addComment = async (data: { strategyId: string; userId: string; content: string }): Promise<StrategyComment> => {
  const response = await fetch(`/api/strategies/${data.strategyId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to add comment');
  }
  const result = await response.json();
  return result.data;
};

const rateStrategy = async (data: { strategyId: string; userId: string; rating: number; review?: string }): Promise<StrategyRating> => {
  const response = await fetch(`/api/strategies/${data.strategyId}/rating`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to rate strategy');
  }
  const result = await response.json();
  return result.data;
};

const fetchTrendingStrategies = async (limit: number = 10): Promise<Strategy[]> => {
  const response = await fetch(`/api/strategies/trending?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch trending strategies');
  }
  const result = await response.json();
  return result.data;
};

const fetchCopiedStrategies = async (userId: string = 'user-123'): Promise<Strategy[]> => {
  const response = await fetch(`/api/strategies/copied?userId=${userId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch copied strategies');
  }
  const result = await response.json();
  return result.data;
};

// Hooks
export const useStrategies = (filter: StrategyFilter = {}) => {
  return useQuery({
    queryKey: ['strategies', filter],
    queryFn: () => fetchStrategies(filter),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useStrategy = (strategyId: string) => {
  return useQuery({
    queryKey: ['strategy', strategyId],
    queryFn: () => fetchStrategy(strategyId),
    enabled: !!strategyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createStrategy,
    onSuccess: (newStrategy, variables) => {
      // Invalidate strategies list
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      
      // Invalidate user profile to show new strategy count
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.authorId] });
      
      // Add the new strategy to the cache
      queryClient.setQueryData(['strategy', newStrategy.id], newStrategy);
    },
  });
};

export const useUpdateStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateStrategy,
    onSuccess: (updatedStrategy) => {
      // Update the strategy in cache
      queryClient.setQueryData(['strategy', updatedStrategy.id], updatedStrategy);
      
      // Invalidate strategies list
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    },
  });
};

export const useDeleteStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteStrategy,
    onSuccess: (_, variables) => {
      // Remove strategy from cache
      queryClient.removeQueries({ queryKey: ['strategy', variables.strategyId] });
      
      // Invalidate strategies list
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      
      // Invalidate user profile
      queryClient.invalidateQueries({ queryKey: ['userProfile', variables.authorId] });
    },
  });
};

export const useLikeStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: likeStrategy,
    onSuccess: (_, variables) => {
      // Invalidate the specific strategy to update like count
      queryClient.invalidateQueries({ queryKey: ['strategy', variables.strategyId] });
      
      // Invalidate strategies list
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addComment,
    onSuccess: (_, variables) => {
      // Invalidate the specific strategy to show new comment
      queryClient.invalidateQueries({ queryKey: ['strategy', variables.strategyId] });
    },
  });
};

export const useRateStrategy = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rateStrategy,
    onSuccess: (_, variables) => {
      // Invalidate the specific strategy to show new rating
      queryClient.invalidateQueries({ queryKey: ['strategy', variables.strategyId] });
    },
  });
};

export const useTrendingStrategies = (limit: number = 10) => {
  return useQuery({
    queryKey: ['trendingStrategies', limit],
    queryFn: () => fetchTrendingStrategies(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCopiedStrategies = (userId: string = 'user-123') => {
  return useQuery({
    queryKey: ['copiedStrategies', userId],
    queryFn: () => fetchCopiedStrategies(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};