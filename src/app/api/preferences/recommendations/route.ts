import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { RiskToleranceAssessment } from '@/lib/risk-assessment';
import { ChainPreferenceAnalyzer } from '@/lib/chain-preference';
import { ActivityPatternAnalyzer } from '@/lib/activity-pattern';

const riskAssessment = new RiskToleranceAssessment();
const chainAnalyzer = new ChainPreferenceAnalyzer();
const activityAnalyzer = new ActivityPatternAnalyzer();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // Get user's preference profile
    const [riskProfile, chainPreferences, activityPattern] = await Promise.all([
      riskAssessment.getRiskProfile(userId),
      chainAnalyzer.getChainPreferences(userId),
      activityAnalyzer.getActivityPattern(userId)
    ]);

    // Get all airdrops
    const airdrops = await db.airdrop.findMany({
      where: { status: 'approved' },
      orderBy: { createdAt: 'desc' }
    });

    // Score each airdrop based on user preferences
    const scoredAirdrops = await Promise.all(
      airdrops.map(async (airdrop) => {
        const score = await calculateAirdropScore(
          airdrop,
          riskProfile,
          chainPreferences,
          activityPattern
        );

        return {
          ...airdrop,
          preferenceScore: score.totalScore,
          scoreBreakdown: score.breakdown,
          recommendationReason: score.reason
        };
      })
    );

    // Sort by preference score and limit results
    const recommendedAirdrops = scoredAirdrops
      .filter(airdrop => airdrop.preferenceScore > 30) // Only show relevant matches
      .sort((a, b) => b.preferenceScore - a.preferenceScore)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: recommendedAirdrops,
        totalAnalyzed: airdrops.length,
        relevantMatches: recommendedAirdrops.length,
        userProfile: {
          hasRiskProfile: !!riskProfile,
          hasChainPreferences: chainPreferences.length > 0,
          hasActivityPattern: !!activityPattern
        }
      }
    });
  } catch (error) {
    console.error('Error generating preference-based recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateAirdropScore(
  airdrop: any,
  riskProfile: any,
  chainPreferences: any[],
  activityPattern: any
): Promise<{
  totalScore: number;
  breakdown: {
    riskMatch: number;
    chainMatch: number;
    activityMatch: number;
    categoryMatch: number;
  };
  reason: string;
}> {
  let totalScore = 0;
  const breakdown = {
    riskMatch: 0,
    chainMatch: 0,
    activityMatch: 0,
    categoryMatch: 0
  };

  // Risk compatibility scoring (40% weight)
  if (riskProfile) {
    const riskScore = calculateRiskCompatibility(airdrop, riskProfile);
    breakdown.riskMatch = riskScore;
    totalScore += riskScore * 0.4;
  }

  // Chain preference scoring (30% weight)
  if (chainPreferences.length > 0) {
    const chainScore = calculateChainCompatibility(airdrop, chainPreferences);
    breakdown.chainMatch = chainScore;
    totalScore += chainScore * 0.3;
  }

  // Activity pattern scoring (20% weight)
  if (activityPattern) {
    const activityScore = calculateActivityCompatibility(airdrop, activityPattern);
    breakdown.activityMatch = activityScore;
    totalScore += activityScore * 0.2;
  }

  // Category preference scoring (10% weight)
  const categoryScore = calculateCategoryCompatibility(airdrop);
  breakdown.categoryMatch = categoryScore;
  totalScore += categoryScore * 0.1;

  // Generate recommendation reason
  const reason = generateRecommendationReason(breakdown, airdrop);

  return {
    totalScore: Math.round(totalScore),
    breakdown,
    reason
  };
}

function calculateRiskCompatibility(airdrop: any, riskProfile: any): number {
  let score = 50; // Base score

  // Risk score alignment
  const airdropRisk = airdrop.riskScore || 50;
  const userRiskTolerance = riskProfile.riskToleranceScore;

  // Perfect alignment gets 100 points, deviation reduces score
  const riskAlignment = 100 - Math.abs(airdropRisk - userRiskTolerance);
  score = (score + riskAlignment) / 2;

  // Adjust based on risk category
  if (riskProfile.riskCategory === 'conservative' && airdropRisk > 70) {
    score -= 30; // Penalize high risk for conservative users
  } else if (riskProfile.riskCategory === 'aggressive' && airdropRisk < 30) {
    score -= 20; // Penalize low risk for aggressive users
  }

  // Consider financial capacity
  if (riskProfile.financialCapacity === 'low' && airdropRisk > 60) {
    score -= 15;
  }

  // Consider experience level
  if (riskProfile.experienceLevel === 'beginner' && airdropRisk > 50) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateChainCompatibility(airdrop: any, chainPreferences: any[]): number {
  if (chainPreferences.length === 0) return 50;

  // Extract chain information from airdrop
  const airdropChains = extractChainsFromAirdrop(airdrop);
  
  if (airdropChains.length === 0) return 50;

  // Find the best matching chain
  let bestScore = 0;
  for (const chain of airdropChains) {
    const chainPref = chainPreferences.find(cp => 
      cp.chainId === chain || cp.chainName.toLowerCase().includes(chain.toLowerCase())
    );
    
    if (chainPref) {
      bestScore = Math.max(bestScore, chainPref.preferenceScore);
    }
  }

  // If no direct match, give moderate score
  if (bestScore === 0) {
    bestScore = 40;
  }

  return bestScore;
}

function calculateActivityCompatibility(airdrop: any, activityPattern: any): number {
  let score = 50; // Base score

  // Time commitment compatibility
  const estimatedTime = estimateAirdropTimeCommitment(airdrop);
  const userDailyTime = activityPattern.dailyActiveTime;

  if (estimatedTime <= userDailyTime * 0.3) {
    score += 20; // Fits well within daily activity
  } else if (estimatedTime > userDailyTime) {
    score -= 20; // Requires more time than user typically spends
  }

  // Complexity based on user's technical knowledge
  const complexity = estimateAirdropComplexity(airdrop);
  const userTechLevel = activityPattern.productivityMetrics?.efficiencyScore || 50;

  if (complexity <= userTechLevel) {
    score += 15;
  } else {
    score -= 15;
  }

  // Session length compatibility
  const avgSessionTime = activityPattern.sessionDuration;
  if (estimatedTime <= avgSessionTime * 1.5) {
    score += 10;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateCategoryCompatibility(airdrop: any): number {
  // This would be enhanced with user's explicit category preferences
  // For now, use basic category popularity
  const categoryPopularity: { [key: string]: number } = {
    'defi': 90,
    'gaming': 85,
    'nft': 75,
    'infrastructure': 80,
    'social': 70,
    'exchange': 85,
    'lending': 80,
    'yield': 75
  };

  const category = airdrop.category?.toLowerCase() || 'other';
  return categoryPopularity[category] || 50;
}

function generateRecommendationReason(breakdown: any, airdrop: any): string {
  const reasons = [];

  if (breakdown.riskMatch > 70) {
    reasons.push('matches your risk tolerance');
  }
  if (breakdown.chainMatch > 70) {
    reasons.push('uses your preferred blockchains');
  }
  if (breakdown.activityMatch > 70) {
    reasons.push('fits your activity patterns');
  }
  if (breakdown.categoryMatch > 70) {
    reasons.push('in a popular category');
  }

  if (reasons.length === 0) {
    return 'May be worth exploring based on your profile';
  }

  if (reasons.length === 1) {
    return `Highly recommended because it ${reasons[0]}`;
  }

  if (reasons.length === 2) {
    return `Great match because it ${reasons[0]} and ${reasons[1]}`;
  }

  return `Excellent fit because it ${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}`;
}

function extractChainsFromAirdrop(airdrop: any): string[] {
  const chains = [];
  
  // Extract from requirements
  if (airdrop.requirements) {
    const requirements = typeof airdrop.requirements === 'string' 
      ? JSON.parse(airdrop.requirements) 
      : airdrop.requirements;
    
    if (requirements.chains) {
      chains.push(...requirements.chains);
    }
  }

  // Extract from metadata
  if (airdrop.metadata) {
    const metadata = typeof airdrop.metadata === 'string' 
      ? JSON.parse(airdrop.metadata) 
      : airdrop.metadata;
    
    if (metadata.chain) {
      chains.push(metadata.chain);
    }
    if (metadata.network) {
      chains.push(metadata.network);
    }
  }

  // Extract from description (simple keyword matching)
  const description = airdrop.description?.toLowerCase() || '';
  const chainKeywords = {
    'ethereum': 'eth',
    'polygon': 'polygon',
    'bnb': 'bsc',
    'binance': 'bsc',
    'arbitrum': 'arbitrum',
    'optimism': 'optimism',
    'avalanche': 'avalanche',
    'base': 'base',
    'zksync': 'zksync'
  };

  for (const [keyword, chainId] of Object.entries(chainKeywords)) {
    if (description.includes(keyword) && !chains.includes(chainId)) {
      chains.push(chainId);
    }
  }

  return chains.length > 0 ? chains : ['eth']; // Default to Ethereum
}

function estimateAirdropTimeCommitment(airdrop: any): number {
  // Estimate time in minutes based on airdrop characteristics
  let baseTime = 30; // Default 30 minutes

  // Adjust based on requirements
  if (airdrop.requirements) {
    const requirements = typeof airdrop.requirements === 'string' 
      ? JSON.parse(airdrop.requirements) 
      : airdrop.requirements;

    if (requirements.tasks) {
      baseTime = requirements.tasks.length * 15; // 15 minutes per task
    }

    if (requirements.difficulty === 'easy') {
      baseTime *= 0.5;
    } else if (requirements.difficulty === 'hard') {
      baseTime *= 2;
    }
  }

  // Adjust based on risk score (higher risk often means more complex)
  if (airdrop.riskScore > 70) {
    baseTime *= 1.5;
  }

  return Math.round(baseTime);
}

function estimateAirdropComplexity(airdrop: any): number {
  let complexity = 50; // Base complexity

  // Adjust based on risk score
  complexity += (airdrop.riskScore - 50) * 0.5;

  // Adjust based on category
  const categoryComplexity: { [key: string]: number } = {
    'defi': 70,
    'infrastructure': 80,
    'gaming': 40,
    'nft': 50,
    'social': 30,
    'exchange': 60
  };

  const category = airdrop.category?.toLowerCase();
  if (category && categoryComplexity[category]) {
    complexity = (complexity + categoryComplexity[category]) / 2;
  }

  return Math.max(0, Math.min(100, complexity));
}