import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  AutomatedTask, 
  TaskExecution,
  TaskType,
  TaskStatus,
  ExecutionMode 
} from '@/types/automation';

// API functions
const fetchTasks = async (userId: string, filters?: {
  status?: TaskStatus;
  taskType?: TaskType;
  executionMode?: ExecutionMode;
  limit?: number;
  offset?: number;
}): Promise<{ tasks: AutomatedTask[]; total: number }> => {
  const params = new URLSearchParams();
  params.append('userId', userId);
  
  if (filters?.status) params.append('status', filters.status);
  if (filters?.taskType) params.append('taskType', filters.taskType);
  if (filters?.executionMode) params.append('executionMode', filters.executionMode);
  if (filters?.limit) params.append('limit', filters.limit.toString());
  if (filters?.offset) params.append('offset', filters.offset.toString());
  
  const response = await fetch(`/api/automation/tasks?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  const result = await response.json();
  return {
    tasks: result.data,
    total: result.total
  };
};

export const useTasks = (userId: string, filters?: {
  status?: TaskStatus;
  taskType?: TaskType;
  executionMode?: ExecutionMode;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['automation-tasks', userId, filters],
    queryFn: () => fetchTasks(userId, filters),
    staleTime: 30 * 1000, // 30 seconds
  });
};
