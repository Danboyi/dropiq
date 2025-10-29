import { useQuery } from '@tanstack/react-query';

interface FeaturedAirdrop {
  id: string;
  tier: string;
  endDate: string;
  airdrop: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    logoUrl?: string;
    websiteUrl: string;
    twitterUrl?: string;
    discordUrl?: string;
    telegramUrl?: string;
    riskScore: number;
    hypeScore: number;
    status: string;
    requirements?: any;
    notes?: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface FeaturedAirdropsResponse {
  campaigns: FeaturedAirdrop[];
  total: number;
}

export function useFeaturedAirdrops() {
  return useQuery<FeaturedAirdropsResponse>({
    queryKey: ['featured-airdrops'],
    queryFn: async () => {
      const response = await fetch('/api/campaigns/featured');
      if (!response.ok) {
        throw new Error('Failed to fetch featured airdrops');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
}