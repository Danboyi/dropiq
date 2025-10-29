'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/stores/authStore'
import { toast } from '@/hooks/use-toast'

interface DetectActivityParams {
  projectId: string
}

interface DetectActivityResponse {
  success: boolean
  message: string
  activities: {
    transactionHash: string
    type: string
    timestamp: string
    matchedTask: string
  }[]
}

export function useDetectActivity({ onSuccess }: { onSuccess?: () => void }) {
  const [isDetecting, setIsDetecting] = useState(false)
  const { token } = useAuth()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async ({ projectId }: DetectActivityParams): Promise<DetectActivityResponse> => {
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch('/api/user/detect-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ projectId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to detect activity')
      }

      return response.json()
    },
    onMutate: () => {
      setIsDetecting(true)
    },
    onSuccess: (data) => {
      setIsDetecting(false)
      toast({
        title: "Success",
        description: data.message || 'Activity detection completed',
      })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-progress'] })
      
      onSuccess?.()
    },
    onError: (error: Error) => {
      setIsDetecting(false)
      toast({
        title: "Error",
        description: error.message || 'Failed to detect activity',
        variant: "destructive",
      })
    },
  })

  return {
    detectActivity: mutation.mutate,
    isDetecting: isDetecting || mutation.isPending,
  }
}