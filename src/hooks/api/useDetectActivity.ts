import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/stores/authStore'
import { toast } from 'sonner'

interface DetectActivityResponse {
  success: boolean
  message: string
  jobId: string
}

export function useDetectActivity() {
  const { isAuthenticated, getAuthToken } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<DetectActivityResponse> => {
      if (!isAuthenticated) {
        throw new Error('User not authenticated')
      }

      const token = getAuthToken()
      if (!token) {
        throw new Error('No authentication token')
      }

      const response = await fetch('/api/user/detect-activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 403) {
          throw new Error('This feature is only available to premium users')
        }
        
        throw new Error(errorData.error || `Failed to start activity detection: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Show success toast
      toast.success('Activity scan started', {
        description: data.message,
        duration: 5000,
      })

      // Invalidate the user progress query to refresh data
      // We'll delay this slightly to allow the backend job to process
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['user-progress'] })
      }, 2000)
    },
    onError: (error) => {
      console.error('Activity detection failed:', error)
      
      // Show error toast
      toast.error('Activity scan failed', {
        description: error.message,
        duration: 5000,
      })
    },
  })
}