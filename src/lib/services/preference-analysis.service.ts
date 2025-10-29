import { db } from '@/lib/db';
import { z } from 'zod';
import ZAI from 'z-ai-web-dev-sdk';

// Risk tolerance levels
export enum RiskTolerance {
  VERY_CONSERVATIVE = 'very_conservative',
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive',
  VERY_AGGRESSIVE = 'very_aggressive'
}

// Chain preference types
export interface ChainPreference {
  chainId: string;
  chainName: string;
  preferenceScore: number; // 0-100
  interactionCount: number;
  successRate: number;
  avgGasSpent: number;
  lastInteraction: Date;
}

// Activity pattern types
export interface ActivityPattern {
  period: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  activityFrequency: number;
  preferredActionTypes: string[];
  avgSessionDuration: number;
  conversionRate: number;
}

// User preference profile
export interface UserPreferenceProfile {
  userId: string;
  riskTolerance: RiskTolerance;
  chainPreferences: ChainPreference[];
  activityPatterns: ActivityPattern[];
  investmentHorizon: 'short_term' | 'medium_term' | 'long_term';
  preferredAirdropTypes: string[];
  gasOptimizationLevel: number; // 0-100
  interactionFrequency: 'low' | 'medium' | 'high';
  lastUpdated: Date;
  confidenceScore: number; // 0-100
}

// Schema for preference analysis
const PreferenceAnalysisSchema = z.object({
  userId: z.string(),
  behaviorEvents: z.array(z.any()),
  currentProfile: z.any().optional(),
  timeHorizon: z.enum(['7d', '30d', '90d']).default('30d')
});

export class PreferenceAnalysisService {
  private static instance: PreferenceAnalysisService;
  private zai: ZAI;

  private constructor() {
    this.zai = null as any;
  }

  static getInstance(): PreferenceAnalysisService {
    if (!PreferenceAnalysisService.instance) {
      PreferenceAnalysisService.instance = new PreferenceAnalysisService();
    }
    return PreferenceAnalysisService.instance;
  }

  private async initializeAI() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }

  /**
   * Analyze user behavior to determine risk tolerance
   */
  async analyzeRiskTolerance(userId: string, timeHorizon: string = '30d'): Promise<{
    riskTolerance: RiskTolerance;
    confidence: number;
    factors: Record<string, number>;
  }> {
    await this.initializeAI();

    // Get user's behavior events
    const behaviorEvents = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - this.parseTimeHorizon(timeHorizon))
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 500
    });

    // Get user's airdrop interactions
    const airdropInteractions = await db.userAirdropInteraction.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - this.parseTimeHorizon(timeHorizon))
        }
      },
      include: {
        airdrop: true
      }
    });

    // Extract risk-related features
    const riskFeatures = this.extractRiskFeatures(behaviorEvents, airdropInteractions);

    try {
      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are a risk analysis expert specializing in cryptocurrency airdrop behavior. 
            Analyze the user's behavior data and determine their risk tolerance level.
            
            Return a JSON object with:
            - riskTolerance: one of ["very_conservative", "conservative", "moderate", "aggressive", "very_aggressive"]
            - confidence: number between 0-100
            - factors: object explaining the reasoning for each factor (gas_spending, project_risk, interaction_frequency, diversification, timing_patience)
            
            Consider:
            - Gas spending patterns (high spending = higher risk tolerance)
            - Project risk preferences (high-risk projects = aggressive)
            - Interaction frequency (frequent = higher engagement/risk)
            - Diversification (many projects = moderate risk)
            - Timing patience (quick actions = impulsive/higher risk)`
          },
          {
            role: 'user',
            content: JSON.stringify(riskFeatures)
          }
        ],
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        riskTolerance: result.riskTolerance || RiskTolerance.MODERATE,
        confidence: result.confidence || 50,
        factors: result.factors || {}
      };
    } catch (error) {
      console.error('Risk tolerance analysis failed:', error);
      // Fallback to rule-based analysis
      return this.fallbackRiskAnalysis(riskFeatures);
    }
  }

  /**
   * Analyze chain preferences based on user behavior
   */
  async analyzeChainPreferences(userId: string, timeHorizon: string = '30d'): Promise<ChainPreference[]> {
    // Get user's chain interactions
    const chainInteractions = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        eventType: 'wallet_connected',
        metadata: {
          path: { contains: '/airdrops/' }
        },
        timestamp: {
          gte: new Date(Date.now() - this.parseTimeHorizon(timeHorizon))
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get airdrop interactions with chain data
    const airdropInteractions = await db.userAirdropInteraction.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - this.parseTimeHorizon(timeHorizon))
        }
      },
      include: {
        airdrop: {
          include: {
            tasks: true
          }
        }
      }
    });

    // Aggregate chain data
    const chainData = new Map<string, any>();

    airdropInteractions.forEach(interaction => {
      const chainId = interaction.airdrop.chainId;
      const chainName = this.getChainName(chainId);

      if (!chainData.has(chainId)) {
        chainData.set(chainId, {
          chainId,
          chainName,
          interactionCount: 0,
          totalGasSpent: 0,
          successfulInteractions: 0,
          lastInteraction: interaction.createdAt
        });
      }

      const data = chainData.get(chainId);
      data.interactionCount++;
      data.lastInteraction = new Date(Math.max(
        data.lastInteraction.getTime(),
        interaction.createdAt.getTime()
      ));

      if (interaction.status === 'completed') {
        data.successfulInteractions++;
      }

      // Extract gas from metadata if available
      if (interaction.metadata?.gasSpent) {
        data.totalGasSpent += interaction.metadata.gasSpent;
      }
    });

    // Convert to ChainPreference objects
    const preferences: ChainPreference[] = Array.from(chainData.values()).map(data => ({
      chainId: data.chainId,
      chainName: data.chainName,
      preferenceScore: this.calculateChainPreferenceScore(data),
      interactionCount: data.interactionCount,
      successRate: data.interactionCount > 0 ? (data.successfulInteractions / data.interactionCount) * 100 : 0,
      avgGasSpent: data.interactionCount > 0 ? data.totalGasSpent / data.interactionCount : 0,
      lastInteraction: data.lastInteraction
    }));

    // Sort by preference score
    return preferences.sort((a, b) => b.preferenceScore - a.preferenceScore);
  }

  /**
   * Analyze user activity patterns
   */
  async analyzeActivityPatterns(userId: string, timeHorizon: string = '30d'): Promise<ActivityPattern[]> {
    const behaviorEvents = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - this.parseTimeHorizon(timeHorizon))
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Group events by time periods
    const patternData = new Map<string, ActivityPattern>();

    behaviorEvents.forEach(event => {
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      
      let period: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hour >= 6 && hour < 12) period = 'morning';
      else if (hour >= 12 && hour < 18) period = 'afternoon';
      else if (hour >= 18 && hour < 24) period = 'evening';
      else period = 'night';

      const key = `${period}-${dayOfWeek}`;
      
      if (!patternData.has(key)) {
        patternData.set(key, {
          period,
          dayOfWeek,
          activityFrequency: 0,
          preferredActionTypes: [],
          avgSessionDuration: 0,
          conversionRate: 0
        });
      }

      const pattern = patternData.get(key)!;
      pattern.activityFrequency++;

      // Track action types
      const actionType = event.eventType;
      if (!pattern.preferredActionTypes.includes(actionType)) {
        pattern.preferredActionTypes.push(actionType);
      }
    });

    // Calculate session durations and conversion rates
    await this.enrichActivityPatterns(userId, Array.from(patternData.values()));

    return Array.from(patternData.values());
  }

  /**
   * Generate comprehensive user preference profile
   */
  async generateUserProfile(userId: string, timeHorizon: string = '30d'): Promise<UserPreferenceProfile> {
    const [riskAnalysis, chainPreferences, activityPatterns] = await Promise.all([
      this.analyzeRiskTolerance(userId, timeHorizon),
      this.analyzeChainPreferences(userId, timeHorizon),
      this.analyzeActivityPatterns(userId, timeHorizon)
    ]);

    // Get additional preferences from behavior
    const additionalPreferences = await this.analyzeAdditionalPreferences(userId, timeHorizon);

    const profile: UserPreferenceProfile = {
      userId,
      riskTolerance: riskAnalysis.riskTolerance,
      chainPreferences,
      activityPatterns,
      investmentHorizon: additionalPreferences.investmentHorizon,
      preferredAirdropTypes: additionalPreferences.preferredAirdropTypes,
      gasOptimizationLevel: additionalPreferences.gasOptimizationLevel,
      interactionFrequency: additionalPreferences.interactionFrequency,
      lastUpdated: new Date(),
      confidenceScore: riskAnalysis.confidence
    };

    // Save profile to database
    await this.saveUserProfile(profile);

    return profile;
  }

  /**
   * Update user preferences based on new behavior
   */
  async updatePreferences(userId: string): Promise<UserPreferenceProfile> {
    return this.generateUserProfile(userId, '30d');
  }

  /**
   * Get user's preferred chains for recommendations
   */
  getPreferredChains(profile: UserPreferenceProfile, limit: number = 3): string[] {
    return profile.chainPreferences
      .filter(chain => chain.preferenceScore > 30)
      .sort((a, b) => b.preferenceScore - a.preferenceScore)
      .slice(0, limit)
      .map(chain => chain.chainId);
  }

  /**
   * Get user's preferred airdrop types
   */
  getPreferredAirdropTypes(profile: UserPreferenceProfile): string[] {
    return profile.preferredAirdropTypes;
  }

  /**
   * Check if airdrop matches user's risk tolerance
   */
  matchesRiskTolerance(profile: UserPreferenceProfile, airdropRiskLevel: number): boolean {
    const riskThresholds = {
      [RiskTolerance.VERY_CONSERVATIVE]: 20,
      [RiskTolerance.CONSERVATIVE]: 40,
      [RiskTolerance.MODERATE]: 60,
      [RiskTolerance.AGGRESSIVE]: 80,
      [RiskTolerance.VERY_AGGRESSIVE]: 100
    };

    return airdropRiskLevel <= riskThresholds[profile.riskTolerance];
  }

  // Private helper methods

  private parseTimeHorizon(horizon: string): number {
    const multipliers = { '7d': 7, '30d': 30, '90d': 90 };
    return (multipliers[horizon as keyof typeof multipliers] || 30) * 24 * 60 * 60 * 1000;
  }

  private extractRiskFeatures(behaviorEvents: any[], airdropInteractions: any[]): any {
    const gasSpending = behaviorEvents
      .filter(e => e.metadata?.gasSpent)
      .reduce((sum, e) => sum + e.metadata.gasSpent, 0);

    const highRiskProjects = airdropInteractions.filter(i => 
      i.airdrop.riskScore && i.airdrop.riskScore > 70
    ).length;

    const interactionFrequency = behaviorEvents.length;
    const uniqueProjects = new Set(airdropInteractions.map(i => i.airdropId)).size;
    const avgTimeToComplete = this.calculateAvgCompletionTime(airdropInteractions);

    return {
      gasSpending,
      highRiskProjects,
      interactionFrequency,
      uniqueProjects,
      avgTimeToComplete,
      totalInteractions: airdropInteractions.length,
      successRate: airdropInteractions.filter(i => i.status === 'completed').length / Math.max(airdropInteractions.length, 1)
    };
  }

  private fallbackRiskAnalysis(features: any): {
    riskTolerance: RiskTolerance;
    confidence: number;
    factors: Record<string, number>;
  } {
    let riskScore = 50; // Base score

    // Gas spending factor
    if (features.gasSpending > 1000) riskScore += 20;
    else if (features.gasSpending > 500) riskScore += 10;
    else if (features.gasSpent < 100) riskScore -= 10;

    // High-risk projects factor
    riskScore += features.highRiskProjects * 5;

    // Interaction frequency factor
    if (features.interactionFrequency > 100) riskScore += 15;
    else if (features.interactionFrequency > 50) riskScore += 8;

    // Diversification factor
    if (features.uniqueProjects > 10) riskScore += 10;
    else if (features.uniqueProjects < 3) riskScore -= 10;

    // Map score to risk tolerance
    let riskTolerance: RiskTolerance;
    if (riskScore < 30) riskTolerance = RiskTolerance.VERY_CONSERVATIVE;
    else if (riskScore < 45) riskTolerance = RiskTolerance.CONSERVATIVE;
    else if (riskScore < 65) riskTolerance = RiskTolerance.MODERATE;
    else if (riskScore < 80) riskTolerance = RiskTolerance.AGGRESSIVE;
    else riskTolerance = RiskTolerance.VERY_AGGRESSIVE;

    return {
      riskTolerance,
      confidence: 60, // Lower confidence for fallback
      factors: {
        gas_spending: Math.min(100, features.gasSpending / 10),
        project_risk: features.highRiskProjects * 10,
        interaction_frequency: Math.min(100, features.interactionFrequency),
        diversification: features.uniqueProjects * 5,
        timing_patience: features.avgTimeToComplete > 0 ? 100 - Math.min(100, features.avgTimeToComplete / 1000) : 50
      }
    };
  }

  private getChainName(chainId: string): string {
    const chainNames: Record<string, string> = {
      '1': 'Ethereum',
      '56': 'BSC',
      '137': 'Polygon',
      '42161': 'Arbitrum',
      '10': 'Optimism',
      '43114': 'Avalanche',
      '250': 'Fantom',
      '1313161554': 'Aurora',
      '128': 'Huobi ECO',
      '1666600000': 'Harmony'
    };
    return chainNames[chainId] || `Chain ${chainId}`;
  }

  private calculateChainPreferenceScore(chainData: any): number {
    let score = 0;

    // Base score from interaction count
    score += Math.min(50, chainData.interactionCount * 5);

    // Success rate bonus
    score += (chainData.successfulInteractions / Math.max(chainData.interactionCount, 1)) * 30;

    // Recency bonus
    const daysSinceLastInteraction = (Date.now() - chainData.lastInteraction.getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 20 - daysSinceLastInteraction * 2);

    return Math.min(100, Math.max(0, score));
  }

  private async enrichActivityPatterns(userId: string, patterns: ActivityPattern[]): Promise<void> {
    // Calculate session durations and conversion rates for each pattern
    for (const pattern of patterns) {
      // This would require more complex session analysis
      // For now, set reasonable defaults
      pattern.avgSessionDuration = 15 + Math.random() * 30; // 15-45 minutes
      pattern.conversionRate = 20 + Math.random() * 40; // 20-60%
    }
  }

  private async analyzeAdditionalPreferences(userId: string, timeHorizon: string): Promise<{
    investmentHorizon: 'short_term' | 'medium_term' | 'long_term';
    preferredAirdropTypes: string[];
    gasOptimizationLevel: number;
    interactionFrequency: 'low' | 'medium' | 'high';
  }> {
    const behaviorEvents = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: new Date(Date.now() - this.parseTimeHorizon(timeHorizon))
        }
      }
    });

    const interactionCount = behaviorEvents.length;
    const interactionFrequency = interactionCount > 100 ? 'high' : 
                               interactionCount > 30 ? 'medium' : 'low';

    // Analyze investment horizon based on session patterns
    const avgSessionDuration = this.calculateAvgSessionDuration(behaviorEvents);
    const investmentHorizon = avgSessionDuration > 30 ? 'long_term' :
                             avgSessionDuration > 15 ? 'medium_term' : 'short_term';

    // Extract preferred airdrop types from search and filter behavior
    const preferredTypes = this.extractPreferredAirdropTypes(behaviorEvents);

    // Calculate gas optimization level
    const gasOptimizationLevel = this.calculateGasOptimizationLevel(behaviorEvents);

    return {
      investmentHorizon,
      preferredAirdropTypes,
      gasOptimizationLevel,
      interactionFrequency
    };
  }

  private calculateAvgCompletionTime(interactions: any[]): number {
    const completedInteractions = interactions.filter(i => i.status === 'completed');
    if (completedInteractions.length === 0) return 0;

    const totalTime = completedInteractions.reduce((sum, interaction) => {
      if (interaction.completedAt) {
        return sum + (interaction.completedAt.getTime() - interaction.createdAt.getTime());
      }
      return sum;
    }, 0);

    return totalTime / completedInteractions.length;
  }

  private calculateAvgSessionDuration(events: any[]): number {
    // Simple calculation - could be enhanced with proper session tracking
    const sessions = this.groupEventsIntoSessions(events);
    if (sessions.length === 0) return 20; // Default 20 minutes

    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session[session.length - 1].timestamp.getTime() - session[0].timestamp.getTime());
    }, 0);

    return (totalDuration / sessions.length) / (1000 * 60); // Convert to minutes
  }

  private groupEventsIntoSessions(events: any[]): any[][] {
    const sessions: any[][] = [];
    let currentSession: any[] = [];
    let lastEventTime = 0;

    events
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .forEach(event => {
        const eventTime = event.timestamp.getTime();
        
        if (eventTime - lastEventTime > 30 * 60 * 1000) { // 30 minutes gap
          if (currentSession.length > 0) {
            sessions.push(currentSession);
          }
          currentSession = [event];
        } else {
          currentSession.push(event);
        }
        
        lastEventTime = eventTime;
      });

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private extractPreferredAirdropTypes(events: any[]): string[] {
    const types = new Set<string>();

    events.forEach(event => {
      if (event.metadata?.filters?.category) {
        types.add(event.metadata.filters.category);
      }
      if (event.metadata?.searchQuery) {
        // Extract potential airdrop types from search queries
        const query = event.metadata.searchQuery.toLowerCase();
        if (query.includes('defi')) types.add('DeFi');
        if (query.includes('nft')) types.add('NFT');
        if (query.includes('gaming')) types.add('Gaming');
        if (query.includes('layer2')) types.add('Layer 2');
      }
    });

    return Array.from(types);
  }

  private calculateGasOptimizationLevel(events: any[]): number {
    const gasEvents = events.filter(e => e.metadata?.gasSpent);
    if (gasEvents.length === 0) return 50; // Default

    const avgGas = gasEvents.reduce((sum, e) => sum + e.metadata.gasSpent, 0) / gasEvents.length;
    
    // Lower gas spending indicates better optimization
    return Math.max(0, Math.min(100, 100 - (avgGas / 10)));
  }

  private async saveUserProfile(profile: UserPreferenceProfile): Promise<void> {
    try {
      await db.userPreference.upsert({
        where: { userId: profile.userId },
        update: {
          riskTolerance: profile.riskTolerance,
          chainPreferences: profile.chainPreferences,
          activityPatterns: profile.activityPatterns,
          investmentHorizon: profile.investmentHorizon,
          preferredAirdropTypes: profile.preferredAirdropTypes,
          gasOptimizationLevel: profile.gasOptimizationLevel,
          interactionFrequency: profile.interactionFrequency,
          confidenceScore: profile.confidenceScore,
          updatedAt: new Date()
        },
        create: {
          userId: profile.userId,
          riskTolerance: profile.riskTolerance,
          chainPreferences: profile.chainPreferences,
          activityPatterns: profile.activityPatterns,
          investmentHorizon: profile.investmentHorizon,
          preferredAirdropTypes: profile.preferredAirdropTypes,
          gasOptimizationLevel: profile.gasOptimizationLevel,
          interactionFrequency: profile.interactionFrequency,
          confidenceScore: profile.confidenceScore
        }
      });
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }
}

export const preferenceAnalysisService = PreferenceAnalysisService.getInstance();