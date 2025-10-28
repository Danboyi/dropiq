import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { 
  getAlchemyClient, 
  getTransactionHistory, 
  getTokenBalances, 
  getNftHoldings,
  isValidEthereumAddress,
  getChainName
} from '@/lib/alchemy';

interface WalletAnalysisRequest {
  address: string;
  chainIds: number[];
}

interface EligibilityResult {
  airdropId: string;
  projectName: string;
  confidenceScore: number;
  reason: string;
  requirements: any;
}

interface WalletAnalysisResponse {
  eligibleAirdrops: EligibilityResult[];
  tokenBalances: any[];
  nftHoldings: any[];
  analysisSummary: {
    totalChains: number;
    totalTransactions: number;
    totalTokens: number;
    totalNfts: number;
    analysisTimestamp: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body: WalletAnalysisRequest = await request.json();
    const { address, chainIds } = body;

    // Validate input
    if (!address || !chainIds || !Array.isArray(chainIds)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (!isValidEthereumAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // Initialize analysis results
    const eligibleAirdrops: EligibilityResult[] = [];
    let totalTransactions = 0;
    let totalTokens = 0;
    let totalNfts = 0;
    const allTokenBalances: any[] = [];
    const allNftHoldings: any[] = [];

    // Get all vetted airdrops for cross-referencing
    const vettedAirdrops = await db.airdrop.findMany({
      where: {
        status: 'VETTED',
        requirements: {
          not: null
        }
      },
      select: {
        id: true,
        projectName: true,
        requirements: true,
        riskScore: true,
      }
    });

    // Analyze each chain
    for (const chainId of chainIds) {
      const client = getAlchemyClient(chainId);
      if (!client) {
        console.warn(`Skipping chain ${chainId} - no Alchemy client available`);
        continue;
      }

      try {
        // Fetch on-chain data
        const [txHistory, tokenBalances, nftHoldings] = await Promise.all([
          getTransactionHistory(client, address),
          getTokenBalances(client, address),
          getNftHoldings(client, address)
        ]);

        // Accumulate totals
        totalTransactions += txHistory.totalCount;
        totalTokens += tokenBalances.totalCount;
        totalNfts += nftHoldings.totalCount;

        // Store chain-specific data
        allTokenBalances.push(...tokenBalances.tokens.map(token => ({
          ...token,
          chainId,
          chainName: getChainName(chainId)
        })));

        allNftHoldings.push(...nftHoldings.nfts.map(nft => ({
          ...nft,
          chainId,
          chainName: getChainName(chainId)
        })));

        // Check eligibility against airdrops
        for (const airdrop of vettedAirdrops) {
          const eligibility = checkEligibility(
            airdrop,
            txHistory.transactions,
            tokenBalances.tokens,
            nftHoldings.nfts,
            chainId
          );

          if (eligibility.isEligible) {
            eligibleAirdrops.push({
              airdropId: airdrop.id,
              projectName: airdrop.projectName,
              confidenceScore: eligibility.confidenceScore,
              reason: eligibility.reason,
              requirements: airdrop.requirements
            });
          }
        }
      } catch (error) {
        console.error(`Error analyzing chain ${chainId}:`, error);
        // Continue with other chains even if one fails
      }
    }

    // Remove duplicate eligible airdrops and sort by confidence score
    const uniqueEligibleAirdrops = eligibleAirdrops
      .filter((airdrop, index, self) => 
        index === self.findIndex(a => a.airdropId === airdrop.airdropId)
      )
      .sort((a, b) => b.confidenceScore - a.confidenceScore);

    const response: WalletAnalysisResponse = {
      eligibleAirdrops: uniqueEligibleAirdrops,
      tokenBalances: allTokenBalances,
      nftHoldings: allNftHoldings,
      analysisSummary: {
        totalChains: chainIds.length,
        totalTransactions,
        totalTokens,
        totalNfts,
        analysisTimestamp: new Date().toISOString(),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Wallet analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error during wallet analysis' },
      { status: 500 }
    );
  }
}

/**
 * Check if user is eligible for an airdrop based on on-chain data
 */
function checkEligibility(
  airdrop: any,
  transactions: any[],
  tokenBalances: any[],
  nftHoldings: any[],
  chainId: number
): { isEligible: boolean; confidenceScore: number; reason: string } {
  const requirements = airdrop.requirements;
  if (!requirements) {
    return { isEligible: false, confidenceScore: 0, reason: 'No requirements defined' };
  }

  let confidenceScore = 0;
  const reasons: string[] = [];

  // Check contract interactions
  if (requirements.contracts && Array.isArray(requirements.contracts)) {
    const hasInteractions = transactions.some(tx => 
      requirements.contracts.includes(tx.to?.toLowerCase() || tx.from?.toLowerCase())
    );
    
    if (hasInteractions) {
      confidenceScore += 40;
      reasons.push('Interacted with required contracts');
    }
  }

  // Check minimum token balance
  if (requirements.minBalance) {
    const { token, amount } = requirements.minBalance;
    const tokenBalance = tokenBalances.find(t => 
      t.contractAddress?.toLowerCase() === token?.toLowerCase()
    );
    
    if (tokenBalance && parseFloat(tokenBalance.balance || '0') >= parseFloat(amount)) {
      confidenceScore += 30;
      reasons.push(`Holds required token balance`);
    }
  }

  // Check NFT collection holdings
  if (requirements.nftCollection) {
    const hasNft = nftHoldings.some(nft => 
      nft.contract?.address?.toLowerCase() === requirements.nftCollection?.toLowerCase()
    );
    
    if (hasNft) {
      confidenceScore += 30;
      reasons.push('Holds required NFT collection');
    }
  }

  // Check minimum transaction count
  if (requirements.minTransactions) {
    const txCount = transactions.length;
    if (txCount >= requirements.minTransactions) {
      confidenceScore += 20;
      reasons.push(`Sufficient transaction activity (${txCount} transactions)`);
    }
  }

  // Check specific DEX usage
  if (requirements.dexUsage && Array.isArray(requirements.dexUsage)) {
    const hasDexUsage = transactions.some(tx =>
      requirements.dexUsage.includes(tx.to?.toLowerCase())
    );
    
    if (hasDexUsage) {
      confidenceScore += 25;
      reasons.push('Used required DEX protocols');
    }
  }

  // Check bridge usage
  if (requirements.bridgeUsage && Array.isArray(requirements.bridgeUsage)) {
    const hasBridgeUsage = transactions.some(tx =>
      requirements.bridgeUsage.includes(tx.to?.toLowerCase())
    );
    
    if (hasBridgeUsage) {
      confidenceScore += 25;
      reasons.push('Used required bridge protocols');
    }
  }

  const isEligible = confidenceScore >= 30; // Minimum threshold
  const reason = reasons.length > 0 ? reasons.join(', ') : 'No matching requirements found';

  return {
    isEligible,
    confidenceScore: Math.min(confidenceScore, 100),
    reason
  };
}