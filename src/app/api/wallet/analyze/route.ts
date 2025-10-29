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
    // For demo purposes, allow analysis without authentication
    // In production, uncomment the authentication check
    /*
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    */

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

    // For demo purposes, return mock data instead of making actual API calls
    // In production, replace this with the actual blockchain analysis
    const mockEligibleAirdrops: EligibilityResult[] = [
      {
        airdropId: '1',
        projectName: 'LayerZero',
        confidenceScore: 85,
        reason: 'Active bridge usage and multiple chain interactions detected',
        requirements: {}
      },
      {
        airdropId: '2', 
        projectName: 'Arbitrum One',
        confidenceScore: 72,
        reason: 'Regular transactions on Arbitrum network',
        requirements: {}
      },
      {
        airdropId: '3',
        projectName: 'Base',
        confidenceScore: 68,
        reason: 'DeFi activity on Base network detected',
        requirements: {}
      }
    ];

    const mockTokenBalances = [
      {
        contractAddress: '0xA0b86a33E6441E6C8D09A9E0b6F4E0E7E3F8D9A1',
        name: 'USDC',
        symbol: 'USDC',
        balance: '1250.50',
        chainId: 1,
        chainName: 'Ethereum'
      },
      {
        contractAddress: '0x1234567890123456789012345678901234567890',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        balance: '0.75',
        chainId: 1,
        chainName: 'Ethereum'
      },
      {
        contractAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        name: 'Matic Token',
        symbol: 'MATIC',
        balance: '500.25',
        chainId: 137,
        chainName: 'Polygon'
      }
    ];

    const mockNftHoldings = [
      {
        contract: {
          address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
          name: 'Bored Ape Yacht Club',
          symbol: 'BAYC'
        },
        chainId: 1,
        chainName: 'Ethereum'
      }
    ];

    const response: WalletAnalysisResponse = {
      eligibleAirdrops: mockEligibleAirdrops,
      tokenBalances: mockTokenBalances,
      nftHoldings: mockNftHoldings,
      analysisSummary: {
        totalChains: chainIds.length,
        totalTransactions: Math.floor(Math.random() * 500) + 100,
        totalTokens: mockTokenBalances.length,
        totalNfts: mockNftHoldings.length,
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