"use client"

import { useQuery } from "@tanstack/react-query"
import type { Airdrop } from "./use-airdrops"

export function useAirdrop(slug: string) {
  return useQuery({
    queryKey: ['airdrop', slug],
    queryFn: async () => {
      const response = await fetch(`/api/airdrops/${slug}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch airdrop')
      }
      
      return response.json() as Promise<Airdrop>
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}