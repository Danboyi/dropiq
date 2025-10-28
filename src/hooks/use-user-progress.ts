'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/stores/authStore'

interface UserProgress {
  id: string
  projectId: string
  projectName: string
  status: 'not_started' | 'in_progress' | 'completed'
  completionPercentage: number
  lastActivity: string | null
  potentialValue: number
  tasks: {
    id: string
    name: string
    completed: boolean
    description: string
  }[]
  notes: string
  createdAt: string
  updatedAt: string
}

export function useUserProgress() {
  const { token } = useAuth()

  return useQuery({
    queryKey: ['user-progress'],
    queryFn: async (): Promise<UserProgress[]> => {
      if (!token) {
        return []
      }

      const response = await fetch('/api/user/progress', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch user progress')
      }

      return response.json()
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}