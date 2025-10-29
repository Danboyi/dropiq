import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'
import { 
  AirdropCategory, 
  AirdropDifficulty, 
  AirdropRiskLevel, 
  AirdropStatus,
  type Airdrop,
  type AirdropDiscoveryFilters,
  type AirdropWithScore,
  type AIInsight,
  type RiskBehaviorMetrics,
  type EligibilityCriteria,
  type TimeEstimate
} from '@/types/airdrop'

export class AirdropDiscoveryService {
  private readonly zai: ZAI

  constructor() {
    this.zai = new ZAI({
      apiKey: process.env.ZAI_API_KEY || '',
      baseURL: process.env.ZAI_API_BASE_URL
    })
  }

  /**
   * Discover airdrops based on filters with AI-powered recommendations
   */
  async discoverAirdrops(filters: AirdropDiscoveryFilters): Promise<AirdropWithScore[]> {
    try {
      // Build where clause for database query
      const whereClause: any = {
        status: AirdropStatus.ACTIVE
      }

      if (filters.categories && filters.categories.length > 0) {
        whereClause.category = { in: filters.categories }
      }

      if (filters.riskLevels && filters.riskLevels.length > 0) {
        whereClause.riskLevel = { in: filters.riskLevels }
      }

      if (filters.difficulties && filters.difficulties.length > 0) {
        whereClause.difficulty = { in: filters.difficulties }
      }

      if (filters.minTrendingScore !== undefined) {
        whereClause.trendingScore = { gte: filters.minTrendingScore }
      }

      if (filters.hasTestnet !== undefined) {
        whereClause.hasTestnet = filters.hasTestnet
      }

      if (filters.minPotentialReward !== undefined) {
        whereClause.potentialReward = { gte: filters.minPotentialReward }
      }

      // Fetch airdrops from database
      const airdrops = await db.airdrop.findMany({
        where: whereClause,
        orderBy: [
          { trendingScore: 'desc' },
          { potentialReward: 'desc' },
          { createdAt: 'desc' }
        ],
        take: filters.limit || 50
      })

      // Get AI insights and calculate scores
      const airdropsWithScores = await Promise.all(
        airdrops.map(async (airdrop) => {
          const insights = await this.getAIInsights(airdrop)
          const score = this.calculateAirdropScore(airdrop, insights, filters)
          
          return {
            ...airdrop,
            recommendationScore: score,
            aiInsight: insights,
            recommendationReason: this.generateRecommendationReason(airdrop, insights, score)
          }
        })
      )

      // Sort by recommendation score
      return airdropsWithScores.sort((a, b) => b.recommendationScore - a.recommendationScore)

    } catch (error) {
      console.error('Error discovering airdrops:', error)
      throw new Error('Failed to discover airdrops')
    }
  }

  /**
   * Get AI-powered insights for a specific airdrop
   */
  async getAIInsights(airdrop: Airdrop): Promise<AIInsight> {
    try {
      const prompt = `
        Analyze this cryptocurrency airdrop and provide detailed insights:
        
        Project: ${airdrop.name}
        Category: ${airdrop.category}
        Risk Level: ${airdrop.riskLevel}
        Potential Reward: $${airdrop.potentialReward.toLocaleString()}
        Description: ${airdrop.description}
        Requirements: ${airdrop.requirements?.join(', ') || 'None specified'}
        
        Please provide:
        1. A brief summary of the project
        2. Key risk factors
        3. Potential benefits
        4. Strategic recommendations
        5. Confidence score (0-100)
        
        Format as JSON with keys: summary, riskFactors, benefits, recommendations, confidenceScore
      `

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert cryptocurrency analyst specializing in airdrop opportunities. Provide objective, data-driven insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const content = completion.choices[0]?.message?.content || '{}'
      
      try {
        const insights = JSON.parse(content)
        return {
          summary: insights.summary || 'No summary available',
          riskFactors: Array.isArray(insights.riskFactors) ? insights.riskFactors : [],
          benefits: Array.isArray(insights.benefits) ? insights.benefits : [],
          recommendations: Array.isArray(insights.recommendations) ? insights.recommendations : [],
          confidenceScore: typeof insights.confidenceScore === 'number' ? insights.confidenceScore : 50,
          lastAnalyzed: new Date()
        }
      } catch (parseError) {
        console.error('Failed to parse AI insights:', parseError)
        return this.getDefaultInsights()
      }

    } catch (error) {
      console.error('Error getting AI insights:', error)
      return this.getDefaultInsights()
    }
  }

  /**
   * Calculate recommendation score for an airdrop
   */
  private calculateAirdropScore(
    airdrop: Airdrop, 
    insights: AIInsight, 
    filters: AirdropDiscoveryFilters
  ): number {
    let score = 0

    // Base score from potential reward (30% weight)
    score += Math.min(airdrop.potentialReward / 10000, 100) * 0.3

    // Risk score adjustment (25% weight)
    const riskScores = {
      [AirdropRiskLevel.LOW]: 100,
      [AirdropRiskLevel.MEDIUM]: 70,
      [AirdropRiskLevel.HIGH]: 40,
      [AirdropRiskLevel.EXTREME]: 20
    }
    score += riskScores[airdrop.riskLevel] * 0.25

    // Trending score (20% weight)
    score += (airdrop.trendingScore || 0) * 0.2

    // AI confidence score (15% weight)
    score += insights.confidenceScore * 0.15

    // Difficulty bonus (10% weight)
    const difficultyBonus = {
      [AirdropDifficulty.BEGINNER]: 100,
      [AirdropDifficulty.INTERMEDIATE]: 80,
      [AirdropDifficulty.ADVANCED]: 60,
      [AirdropDifficulty.EXPERT]: 40
    }
    score += difficultyBonus[airdrop.difficulty] * 0.1

    return Math.round(Math.min(score, 100))
  }

  /**
   * Generate human-readable recommendation reason
   */
  private generateRecommendationReason(
    airdrop: Airdrop, 
    insights: AIInsight, 
    score: number
  ): string {
    if (score >= 80) {
      return `Highly recommended: Strong potential reward ($${airdrop.potentialReward.toLocaleString()}) with ${airdrop.riskLevel.toLowerCase()} risk. ${insights.summary}`
    } else if (score >= 60) {
      return `Good opportunity: Moderate potential with ${airdrop.riskLevel.toLowerCase()} risk level. ${insights.summary}`
    } else if (score >= 40) {
      return `Consider with caution: Higher risk profile requiring careful evaluation. ${insights.summary}`
    } else {
      return `High risk approach: Only for experienced users with high risk tolerance. ${insights.summary}`
    }
  }

  /**
   * Get default insights when AI fails
   */
  private getDefaultInsights(): AIInsight {
    return {
      summary: 'Analysis temporarily unavailable',
      riskFactors: ['Unable to perform AI analysis'],
      benefits: ['Manual review recommended'],
      recommendations: ['Proceed with caution', 'Do thorough research'],
      confidenceScore: 30,
      lastAnalyzed: new Date()
    }
  }

  /**
   * Get trending airdrops
   */
  async getTrendingAirdrops(limit: number = 10): Promise<AirdropWithScore[]> {
    return this.discoverAirdrops({
      minTrendingScore: 70,
      limit,
      categories: [],
      riskLevels: [],
      difficulties: []
    })
  }

  /**
   * Get airdrops by category
   */
  async getAirdropsByCategory(category: AirdropCategory, limit: number = 20): Promise<AirdropWithScore[]> {
    return this.discoverAirdrops({
      categories: [category],
      limit,
      riskLevels: [],
      difficulties: []
    })
  }

  /**
   * Get low-risk airdrops for conservative users
   */
  async getLowRiskAirdrops(limit: number = 15): Promise<AirdropWithScore[]> {
    return this.discoverAirdrops({
      riskLevels: [AirdropRiskLevel.LOW, AirdropRiskLevel.MEDIUM],
      limit,
      categories: [],
      difficulties: []
    })
  }

  /**
   * Get high-reward airdrops for aggressive users
   */
  async getHighRewardAirdrops(minReward: number = 5000, limit: number = 15): Promise<AirdropWithScore[]> {
    return this.discoverAirdrops({
      minPotentialReward: minReward,
      limit,
      categories: [],
      riskLevels: [],
      difficulties: []
    })
  }

  /**
   * Search airdrops by text query
   */
  async searchAirdrops(query: string, limit: number = 20): Promise<AirdropWithScore[]> {
    try {
      const airdrops = await db.airdrop.findMany({
        where: {
          AND: [
            { status: AirdropStatus.ACTIVE },
            {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { tags: { hasSome: [query] } }
              ]
            }
          ]
        },
        orderBy: { trendingScore: 'desc' },
        take: limit
      })

      const airdropsWithScores = await Promise.all(
        airdrops.map(async (airdrop) => {
          const insights = await this.getAIInsights(airdrop)
          const score = this.calculateAirdropScore(airdrop, insights, {})
          
          return {
            ...airdrop,
            recommendationScore: score,
            aiInsight: insights,
            recommendationReason: this.generateRecommendationReason(airdrop, insights, score)
          }
        })
      )

      return airdropsWithScores.sort((a, b) => b.recommendationScore - a.recommendationScore)

    } catch (error) {
      console.error('Error searching airdrops:', error)
      throw new Error('Failed to search airdrops')
    }
  }

  /**
   * Get personalized recommendations based on user preferences
   */
  async getPersonalizedRecommendations(
    userId: string, 
    limit: number = 20
  ): Promise<AirdropWithScore[]> {
    try {
      // Get user's risk preferences from profile
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { 
          riskTolerance: true,
          preferredCategories: true,
          experienceLevel: true
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Build filters based on user preferences
      const filters: AirdropDiscoveryFilters = {
        limit,
        categories: user.preferredCategories as AirdropCategory[] || [],
        riskLevels: this.getRiskLevelsFromTolerance(user.riskTolerance),
        difficulties: this.getDifficultiesFromExperience(user.experienceLevel)
      }

      return this.discoverAirdrops(filters)

    } catch (error) {
      console.error('Error getting personalized recommendations:', error)
      throw new Error('Failed to get personalized recommendations')
    }
  }

  /**
   * Convert risk tolerance to risk levels
   */
  private getRiskLevelsFromTolerance(tolerance: string): AirdropRiskLevel[] {
    switch (tolerance) {
      case 'CONSERVATIVE':
        return [AirdropRiskLevel.LOW]
      case 'MODERATE':
        return [AirdropRiskLevel.LOW, AirdropRiskLevel.MEDIUM]
      case 'AGGRESSIVE':
        return [AirdropRiskLevel.MEDIUM, AirdropRiskLevel.HIGH]
      case 'VERY_AGGRESSIVE':
        return [AirdropRiskLevel.HIGH, AirdropRiskLevel.EXTREME]
      default:
        return [AirdropRiskLevel.LOW, AirdropRiskLevel.MEDIUM]
    }
  }

  /**
   * Convert experience level to difficulties
   */
  private getDifficultiesFromExperience(experience: string): AirdropDifficulty[] {
    switch (experience) {
      case 'BEGINNER':
        return [AirdropDifficulty.BEGINNER]
      case 'INTERMEDIATE':
        return [AirdropDifficulty.BEGINNER, AirdropDifficulty.INTERMEDIATE]
      case 'ADVANCED':
        return [AirdropDifficulty.INTERMEDIATE, AirdropDifficulty.ADVANCED]
      case 'EXPERT':
        return [AirdropDifficulty.ADVANCED, AirdropDifficulty.EXPERT]
      default:
        return [AirdropDifficulty.BEGINNER, AirdropDifficulty.INTERMEDIATE]
    }
  }

  /**
   * Get risk behavior metrics for analytics
   */
  async getRiskBehaviorMetrics(): Promise<RiskBehaviorMetrics> {
    try {
      const totalAirdrops = await db.airdrop.count({
        where: { status: AirdropStatus.ACTIVE }
      })

      const riskDistribution = await db.airdrop.groupBy({
        by: ['riskLevel'],
        where: { status: AirdropStatus.ACTIVE },
        _count: true
      })

      const categoryDistribution = await db.airdrop.groupBy({
        by: ['category'],
        where: { status: AirdropStatus.ACTIVE },
        _count: true
      })

      const avgPotentialReward = await db.airdrop.aggregate({
        where: { status: AirdropStatus.ACTIVE },
        _avg: { potentialReward: true }
      })

      return {
        totalAirdrops,
        riskDistribution: riskDistribution.reduce((acc, item) => {
          acc[item.riskLevel] = item._count
          return acc
        }, {} as Record<string, number>),
        categoryDistribution: categoryDistribution.reduce((acc, item) => {
          acc[item.category] = item._count
          return acc
        }, {} as Record<string, number>),
        averagePotentialReward: avgPotentialReward._avg.potentialReward || 0,
        lastUpdated: new Date()
      }

    } catch (error) {
      console.error('Error getting risk behavior metrics:', error)
      throw new Error('Failed to get risk behavior metrics')
    }
  }

  /**
   * Get eligibility criteria for an airdrop
   */
  async getEligibilityCriteria(airdropId: string): Promise<EligibilityCriteria | null> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        select: {
          requirements: true,
          difficulty: true,
          hasTestnet: true,
          minHoldings: true,
          regions: true
        }
      })

      if (!airdrop) {
        return null
      }

      return {
        requirements: airdrop.requirements || [],
        difficulty: airdrop.difficulty,
        hasTestnet: airdrop.hasTestnet || false,
        minHoldings: airdrop.minHoldings || 0,
        restrictedRegions: airdrop.regions || [],
        estimatedTime: this.estimateTimeRequired(airdrop.difficulty, airdrop.requirements?.length || 0)
      }

    } catch (error) {
      console.error('Error getting eligibility criteria:', error)
      throw new Error('Failed to get eligibility criteria')
    }
  }

  /**
   * Estimate time required for airdrop completion
   */
  private estimateTimeRequired(difficulty: AirdropDifficulty, requirementCount: number): TimeEstimate {
    const baseTimes = {
      [AirdropDifficulty.BEGINNER]: { min: 15, max: 30 },
      [AirdropDifficulty.INTERMEDIATE]: { min: 30, max: 60 },
      [AirdropDifficulty.ADVANCED]: { min: 60, max: 120 },
      [AirdropDifficulty.EXPERT]: { min: 120, max: 240 }
    }

    const baseTime = baseTimes[difficulty]
    const multiplier = Math.max(1, requirementCount / 3)

    return {
      minMinutes: Math.round(baseTime.min * multiplier),
      maxMinutes: Math.round(baseTime.max * multiplier),
      complexity: difficulty
    }
  }
}

// Export singleton instance
export const airdropDiscoveryService = new AirdropDiscoveryService()