import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/stores/authStore'

interface UserProgressItem {
  id: string
  status: 'in_progress' | 'completed' | 'claimed'
  notes: string | null
  startedAt: string | null
  completedAt: string | null
  claimedAt: string | null
  updatedAt: string
  airdrop: {
    id: string
    name: string
    description: string
    logoUrl: string | null
    requirements: string
    riskScore: number
    category: string
    endDate: string | null
    project: {
      id: string
      name: string
      logoUrl: string | null
      website: string | null
      twitter: string | null
      discord: string | null
    }
  }
  wallet: {
    id: string
    address: string
    chain: string
    isPrimary: boolean
  }
}

interface UserProgressResponse {
  success: boolean
  data: UserProgressItem[]
}

export function useUserProgress() {
  const { isAuthenticated, getAuthToken } = useAuth()

  return useQuery({
    queryKey: ['user-progress'],
    queryFn: async (): Promise<UserProgressResponse> => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated')
      }

      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch('/api/user/progress', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch user progress: ${response.statusText}`)
      }

      return response.json()
    },
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useActiveTasks() {
  const { data: userProgress, ...rest } = useUserProgress()
  
  const activeTasks = userProgress?.data?.filter(item => item.status === 'in_progress') || []
  
  return {
    data: activeTasks,
    totalCount: activeTasks.length,
    ...rest
  }
}

export function useCompletedTasks() {
  const { data: userProgress, ...rest } = useUserProgress()
  
  const completedTasks = userProgress?.data?.filter(item => 
    item.status === 'completed' || item.status === 'claimed'
  ) || []
  
  return {
    data: completedTasks,
    totalCount: completedTasks.length,
    ...rest
  }
}