import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface ChainData {
  chainId: string;
  chainName: string;
  gasCost: number;
  transactionSpeed: number;
  securityLevel: number;
  ecosystemMaturity: number;
  airdropFrequency: number;
  averageReward: number;
  difficulty: number;
}

export interface ChainInteractionData {
  chainId: string;
  interactionType: 'view' | 'click' | 'connect' | 'transaction' | 'task_complete';
  gasSpent: number;
  success: boolean;
  timeSpent: number; // minutes
  timestamp: Date;
  airdropId?: string;
}

export interface ChainPreferenceScore {
  chainId: string;
  chainName: string;
  preferenceScore: number; // 0-100
  usageFrequency: number;
  totalGasSpent: number;
  successRate: number;
  avgGasCost: number;
  lastUsedAt: Date;
  preferenceFactors: {
    factor: string;
    weight: number;
    score: number;
  }[];
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendation: string;
}

export class ChainPreferenceAnalyzer {
  private zai: ZAI;
  private chainData: Map<string, ChainData>;

  constructor() {
    this.zai = new ZAI();
    this.chainData = this.initializeChainData();
  }

  /**
   * Initialize known blockchain data
   */
  private initializeChainData(): Map<string, ChainData> {
    const chains = new Map<string, ChainData>();

    // Ethereum Mainnet
    chains.set('eth', {
      chainId: 'eth',
      chainName: 'Ethereum',
      gasCost: 9,
      transactionSpeed: 3,
      securityLevel: 10,
      ecosystemMaturity: 10,
      airdropFrequency: 8,
      averageReward: 9,
      difficulty: 7
    });

    // Polygon
    chains.set('polygon', {
      chainId: 'polygon',
      chainName: 'Polygon',
      gasCost: 3,
      transactionSpeed: 8,
      securityLevel: 8,
      ecosystemMaturity: 8,
      airdropFrequency: 9,
      averageReward: 6,
      difficulty: 4
    });

    // BSC
    chains.set('bsc', {
      chainId: 'bsc',
      chainName: 'Binance Smart Chain',
      gasCost: 2,
      transactionSpeed: 9,
      securityLevel: 7,
      ecosystemMaturity: 7,
      airdropFrequency: 8,
      averageReward: 5,
      difficulty: 3
    });

    // Arbitrum
    chains.set('arbitrum', {
      chainId: 'arbitrum',
      chainName: 'Arbitrum',
      gasCost: 4,
      transactionSpeed: 8,
      securityLevel: 9,
      ecosystemMaturity: 6,
      airdropFrequency: 7,
      averageReward: 8,
      difficulty: 6
    });

    // Optimism
    chains.set('optimism', {
      chainId: 'optimism',
      chainName: 'Optimism',
      gasCost: 4,
      transactionSpeed: 8,
      securityLevel: 9,
      ecosystemMaturity: 6,
      airdropFrequency: 7,
      averageReward: 8,
      difficulty: 6
    });

    // Avalanche
    chains.set('avalanche', {
      chainId: 'avalanche',
      chainName: 'Avalanche',
      gasCost: 3,
      transactionSpeed: 9,
      securityLevel: 8,
      ecosystemMaturity: 5,
      airdropFrequency: 6,
      averageReward: 6,
      difficulty: 5
    });

    // Base
    chains.set('base', {
      chainId: 'base',
      chainName: 'Base',
      gasCost: 3,
      transactionSpeed: 8,
      securityLevel: 8,
      ecosystemMaturity: 4,
      airdropFrequency: 6,
      averageReward: 7,
      difficulty: 4
    });

    // zkSync
    chains.set('zksync', {
      chainId: 'zksync',
      chainName: 'zkSync',
      gasCost: 2,
      transactionSpeed: 9,
      securityLevel: 8,
      ecosystemMaturity: 4,
      airdropFrequency: 8,
      averageReward: 8,
      difficulty: 5
    });

    return chains;
  }

  /**
   * Analyze user's chain preferences based on interaction history
   */
  async analyzeChainPreferences(userId: string): Promise<ChainPreferenceScore[]> {
    // Get user's interaction history
    const interactions = await this.getUserInteractions(userId);
    
    // Get user's risk profile
    const riskProfile = await db.riskProfile.findUnique({
      where: { userId }
    });

    // Calculate preferences for each chain
    const preferences: ChainPreferenceScore[] = [];

    for (const [chainId, chainData] of this.chainData.entries()) {
      const chainInteractions = interactions.filter(i => i.chainId === chainId);
      const preference = await this.calculateChainPreference(
        userId,
        chainId,
        chainData,
        chainInteractions,
        riskProfile
      );
      
      if (preference.preferenceScore > 0) {
        preferences.push(preference);
      }
    }

    // Sort by preference score
    preferences.sort((a, b) => b.preferenceScore - a.preferenceScore);

    // Save to database
    await this.saveChainPreferences(userId, preferences);

    return preferences;
  }

  /**
   * Calculate preference score for a specific chain
   */
  private async calculateChainPreference(
    userId: string,
    chainId: string,
    chainData: ChainData,
    interactions: ChainInteractionData[],
    riskProfile: any
  ): Promise<ChainPreferenceScore> {
    const factors = [];

    // Usage frequency factor (30% weight)
    const usageFrequency = interactions.length;
    const usageScore = Math.min(100, usageFrequency * 10);
    factors.push({
      factor: 'usage_frequency',
      weight: 30,
      score: usageScore
    });

    // Success rate factor (25% weight)
    const successfulInteractions = interactions.filter(i => i.success).length;
    const successRate = interactions.length > 0 ? (successfulInteractions / interactions.length) * 100 : 0;
    factors.push({
      factor: 'success_rate',
      weight: 25,
      score: successRate
    });

    // Gas efficiency factor (20% weight)
    const avgGasSpent = interactions.length > 0 
      ? interactions.reduce((sum, i) => sum + i.gasSpent, 0) / interactions.length 
      : chainData.gasCost * 10;
    const gasEfficiencyScore = Math.max(0, 100 - (avgGasSpent / 2));
    factors.push({
      factor: 'gas_efficiency',
      weight: 20,
      score: gasEfficiencyScore
    });

    // Chain characteristics factor (15% weight)
    const characteristicScore = this.calculateChainCharacteristicScore(
      chainData,
      riskProfile
    );
    factors.push({
      factor: 'chain_characteristics',
      weight: 15,
      score: characteristicScore
    });

    // Time-based recency factor (10% weight)
    const lastUsed = interactions.length > 0 
      ? new Date(Math.max(...interactions.map(i => i.timestamp.getTime())))
      : new Date(0);
    const daysSinceLastUse = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));
    const recencyScore = Math.max(0, 100 - (daysSinceLastUse * 2));
    factors.push({
      factor: 'recency',
      weight: 10,
      score: recencyScore
    });

    // Calculate weighted total score
    const preferenceScore = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

    // Determine trend
    const trend = this.calculateTrend(interactions);

    // Generate AI recommendation
    const recommendation = await this.generateChainRecommendation(
      chainData,
      preferenceScore,
      riskProfile,
      interactions
    );

    return {
      chainId,
      chainName: chainData.chainName,
      preferenceScore: Math.round(preferenceScore),
      usageFrequency,
      totalGasSpent: interactions.reduce((sum, i) => sum + i.gasSpent, 0),
      successRate,
      avgGasCost: avgGasSpent,
      lastUsedAt: lastUsed,
      preferenceFactors: factors,
      trend,
      recommendation
    };
  }

  /**
   * Calculate chain characteristic score based on user profile
   */
  private calculateChainCharacteristicScore(
    chainData: ChainData,
    riskProfile: any
  ): number {
    let score = 50; // Base score

    if (!riskProfile) return score;

    // Adjust based on risk tolerance
    if (riskProfile.riskToleranceScore > 70) {
      // High risk tolerance users prefer newer, potentially more rewarding chains
      score += (10 - chainData.ecosystemMaturity) * 3;
      score += chainData.difficulty * 2;
    } else {
      // Low risk tolerance users prefer established, secure chains
      score += chainData.securityLevel * 3;
      score += chainData.ecosystemMaturity * 2;
    }

    // Adjust based on financial capacity
    if (riskProfile.financialCapacity === 'low') {
      // Low capacity users prefer low gas costs
      score += (10 - chainData.gasCost) * 4;
    }

    // Adjust based on technical knowledge
    if (riskProfile.technicalKnowledge < 5) {
      // Less technical users prefer easier chains
      score += (10 - chainData.difficulty) * 3;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate trend based on interaction history
   */
  private calculateTrend(interactions: ChainInteractionData[]): 'increasing' | 'decreasing' | 'stable' {
    if (interactions.length < 3) return 'stable';

    const sortedInteractions = interactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const recentInteractions = sortedInteractions.slice(-3);
    const olderInteractions = sortedInteractions.slice(-6, -3);

    if (olderInteractions.length === 0) return 'increasing';

    const recentFrequency = recentInteractions.length;
    const olderFrequency = olderInteractions.length;

    if (recentFrequency > olderFrequency * 1.5) return 'increasing';
    if (recentFrequency < olderFrequency * 0.5) return 'decreasing';
    return 'stable';
  }

  /**
   * Generate AI-powered chain recommendation
   */
  private async generateChainRecommendation(
    chainData: ChainData,
    preferenceScore: number,
    riskProfile: any,
    interactions: ChainInteractionData[]
  ): Promise<string> {
    try {
      const prompt = `
        Provide a brief recommendation for ${chainData.chainName} blockchain based on:
        - User's preference score: ${preferenceScore}/100
        - Chain characteristics: Gas cost ${chainData.gasCost}/10, Security ${chainData.securityLevel}/10
        - User has ${interactions.length} previous interactions
        - User risk profile: ${riskProfile?.riskToleranceScore || 50}/100 risk tolerance
        
        Keep it under 100 characters and make it personalized.
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a blockchain advisor providing concise, personalized recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      return completion.choices[0]?.message?.content || 
        this.getDefaultChainRecommendation(chainData, preferenceScore);
    } catch (error) {
      console.error('Error generating chain recommendation:', error);
      return this.getDefaultChainRecommendation(chainData, preferenceScore);
    }
  }

  /**
   * Get default chain recommendation
   */
  private getDefaultChainRecommendation(
    chainData: ChainData,
    preferenceScore: number
  ): string {
    if (preferenceScore > 80) {
      return `Excellent match! ${chainData.chainName} suits your profile perfectly.`;
    } else if (preferenceScore > 60) {
      return `Good choice! ${chainData.chainName} aligns well with your preferences.`;
    } else if (preferenceScore > 40) {
      return `Consider ${chainData.chainName} if you want to explore new options.`;
    } else {
      return `${chainData.chainName} may not be the best fit for your current profile.`;
    }
  }

  /**
   * Get user's interaction history
   */
  private async getUserInteractions(userId: string): Promise<ChainInteractionData[]> {
    const interactions = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        OR: [
          { eventType: 'airdrop_interact' },
          { eventType: 'wallet_connect' },
          { eventType: 'task_complete' }
        ]
      },
      orderBy: { timestamp: 'desc' }
    });

    return interactions.map(interaction => {
      const eventData = interaction.eventData as any;
      return {
        chainId: eventData?.chainId || 'eth',
        interactionType: interaction.eventType as any,
        gasSpent: eventData?.gasSpent || 0,
        success: eventData?.success !== false,
        timeSpent: eventData?.timeSpent || 0,
        timestamp: interaction.timestamp,
        airdropId: eventData?.airdropId
      };
    });
  }

  /**
   * Save chain preferences to database
   */
  private async saveChainPreferences(
    userId: string,
    preferences: ChainPreferenceScore[]
  ): Promise<void> {
    for (const pref of preferences) {
      await db.chainPreference.upsert({
        where: {
          userId_chainId: {
            userId,
            chainId: pref.chainId
          }
        },
        update: {
          preferenceScore: pref.preferenceScore,
          usageFrequency: pref.usageFrequency,
          totalGasSpent: pref.totalGasSpent,
          successRate: pref.successRate,
          avgGasCost: pref.avgGasCost,
          lastUsedAt: pref.lastUsedAt,
          preferenceFactors: {
            factors: pref.preferenceFactors,
            trend: pref.trend,
            recommendation: pref.recommendation
          }
        },
        create: {
          userId,
          chainId: pref.chainId,
          chainName: pref.chainName,
          preferenceScore: pref.preferenceScore,
          usageFrequency: pref.usageFrequency,
          totalGasSpent: pref.totalGasSpent,
          successRate: pref.successRate,
          avgGasCost: pref.avgGasCost,
          lastUsedAt: pref.lastUsedAt,
          preferenceFactors: {
            factors: pref.preferenceFactors,
            trend: pref.trend,
            recommendation: pref.recommendation
          }
        }
      });
    }

    // Generate insights
    await this.generateChainInsights(userId, preferences);
  }

  /**
   * Generate insights based on chain preferences
   */
  private async generateChainInsights(
    userId: string,
    preferences: ChainPreferenceScore[]
  ): Promise<void> {
    const insights = [];

    // High gas cost preference
    const highGasChains = preferences.filter(p => p.avgGasCost > 50 && p.preferenceScore > 70);
    if (highGasChains.length > 0) {
      insights.push({
        insightType: 'chain_behavior',
        insightTitle: 'High Gas Cost Preference',
        insightDescription: `You frequently use ${highGasChains.map(c => c.chainName).join(', ')} despite high gas costs. Consider optimizing for efficiency.`,
        confidenceScore: 0.8,
        impactLevel: 'medium',
        actionableRecommendation: 'Explore Layer 2 alternatives for similar opportunities with lower costs.'
      });
    }

    // Chain diversity
    if (preferences.length < 3) {
      insights.push({
        insightType: 'chain_behavior',
        insightTitle: 'Limited Chain Diversity',
        insightDescription: 'You primarily use one or two blockchains. Diversifying could expose you to more opportunities.',
        confidenceScore: 0.9,
        impactLevel: 'medium',
        actionableRecommendation: 'Explore airdrops on other compatible chains to maximize your opportunities.'
      });
    }

    // Success rate issues
    const lowSuccessChains = preferences.filter(p => p.successRate < 50 && p.usageFrequency > 5);
    if (lowSuccessChains.length > 0) {
      insights.push({
        insightType: 'chain_behavior',
        insightTitle: 'Low Success Rate Detected',
        insightDescription: `Your success rate on ${lowSuccessChains.map(c => c.chainName).join(', ')} is below 50%.`,
        confidenceScore: 0.8,
        impactLevel: 'high',
        actionableRecommendation: 'Review your approach on these chains or focus on ones where you have better success.'
      });
    }

    // Save insights
    for (const insight of insights) {
      await db.preferenceInsight.create({
        data: {
          userId,
          ...insight,
          supportingData: {
            chainPreferences: preferences.map(p => ({
              chainId: p.chainId,
              preferenceScore: p.preferenceScore,
              successRate: p.successRate
            }))
          },
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
        }
      });
    }
  }

  /**
   * Get user's chain preferences
   */
  async getChainPreferences(userId: string): Promise<ChainPreferenceScore[]> {
    const preferences = await db.chainPreference.findMany({
      where: { userId },
      orderBy: { preferenceScore: 'desc' }
    });

    return preferences.map(pref => ({
      chainId: pref.chainId,
      chainName: pref.chainName,
      preferenceScore: pref.preferenceScore,
      usageFrequency: pref.usageFrequency,
      totalGasSpent: pref.totalGasSpent,
      successRate: pref.successRate,
      avgGasCost: pref.avgGasCost,
      lastUsedAt: pref.lastUsedAt,
      preferenceFactors: pref.preferenceFactors?.factors || [],
      trend: pref.preferenceFactors?.trend || 'stable',
      recommendation: pref.preferenceFactors?.recommendation || ''
    }));
  }

  /**
   * Track chain interaction
   */
  async trackChainInteraction(
    userId: string,
    chainId: string,
    interactionType: ChainInteractionData['interactionType'],
    data: {
      gasSpent?: number;
      success?: boolean;
      timeSpent?: number;
      airdropId?: string;
    }
  ): Promise<void> {
    // This would typically be called by the behavior tracking system
    // The actual tracking is handled by the existing UserBehaviorEvent system
    // This method is for explicit chain-specific tracking if needed
    
    await db.userBehaviorEvent.create({
      data: {
        userId,
        eventType: 'chain_interaction',
        eventName: `chain_${interactionType}`,
        eventData: {
          chainId,
          interactionType,
          ...data
        },
        timestamp: new Date()
      }
    });
  }
}