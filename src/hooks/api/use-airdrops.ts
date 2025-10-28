"use client"

import { useQuery } from "@tanstack/react-query"

interface Airdrop {
  id: string
  name: string
  slug: string
  description: string
  category: string
  logoUrl: string | null
  websiteUrl: string
  twitterUrl: string | null
  discordUrl: string | null
  telegramUrl: string | null
  riskScore: number
  hypeScore: number
  status: "pending" | "approved" | "rejected"
  requirements: any
  notes: string | null
  userStatus: "interested" | "in_progress" | "completed" | null
  userNotes: string | null
  createdAt: string
  updatedAt: string
}

interface AirdropsResponse {
  airdrops: Airdrop[]
  total: number
  page: number
  limit: number
}

interface UseAirdropsParams {
  page?: number
  limit?: number
  category?: string
  status?: string
  search?: string
}

export function useAirdrops(params: UseAirdropsParams = {}) {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', params.page.toString())
  if (params.limit) queryParams.append('limit', params.limit.toString())
  if (params.category) queryParams.append('category', params.category)
  if (params.status) queryParams.append('status', params.status)
  if (params.search) queryParams.append('search', params.search)

  return useQuery({
    queryKey: ['airdrops', params],
    queryFn: async () => {
      const response = await fetch(`/api/airdrops?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch airdrops')
      }
      
      return response.json() as Promise<AirdropsResponse>
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 10, // 10 minutes
  })
}

export type { Airdrop, AirdropsResponse, UseAirdropsParams }