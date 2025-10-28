import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

interface WalletAnalysisData {
  eligibleAirdrops: Array<{
    airdropId: string;
    projectName: string;
    confidenceScore: number;
    reason: string;
    requirements: any;
  }>;
  tokenBalances: Array<{
    contractAddress: string;
    name: string;
    symbol: string;
    balance: string;
    chainId: number;
    chainName: string;
  }>;
  nftHoldings: Array<{
    contract: {
      address: string;
      name: string;
      symbol: string;
    };
    chainId: number;
    chainName: string;
  }>;
  analysisSummary: {
    totalChains: number;
    totalTransactions: number;
    totalTokens: number;
    totalNfts: number;
    analysisTimestamp: string;
  };
}

interface UseWalletAnalysisOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function useWalletAnalysis(
  address?: string,
  chainIds: number[] = [1, 137, 56, 42161, 10, 8453],
  options: UseWalletAnalysisOptions = {}
) {
  const { enabled = true, refetchInterval } = options;
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['wallet-analysis', address, chainIds],
    queryFn: async (): Promise<WalletAnalysisData> => {
      if (!address) {
        throw new Error('Wallet address is required');
      }

      const response = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address,
          chainIds,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze wallet');
      }

      return response.json();
    },
    enabled: enabled && !!address && chainIds.length > 0,
    refetchInterval,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const invalidateAnalysis = () => {
    queryClient.invalidateQueries({ queryKey: ['wallet-analysis'] });
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    invalidateAnalysis,
    eligibleAirdrops: data?.eligibleAirdrops || [],
    tokenBalances: data?.tokenBalances || [],
    nftHoldings: data?.nftHoldings || [],
    analysisSummary: data?.analysisSummary,
  };
}