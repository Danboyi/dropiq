"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

interface UpdateAirdropStatusData {
  status?: "interested" | "in_progress" | "completed"
  notes?: string
}

export function useUpdateAirdropStatus(slug: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateAirdropStatusData) => {
      const response = await fetch(`/api/airdrops/${slug}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update airdrop status')
      }
      
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch the airdrop details
      queryClient.invalidateQueries({ queryKey: ['airdrop', slug] })
      // Invalidate and refetch the airdrops list
      queryClient.invalidateQueries({ queryKey: ['airdrops'] })
    },
  })
}