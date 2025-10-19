import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface UserInteraction {
  id: string;
  userId?: string;
  walletAddress?: string;
  sessionId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata: any;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  timestamp: Date;
  duration?: number;
  success: boolean;
  errorMessage?: string;
}

export interface UserBehaviorProfile {
  userId?: string;
  walletAddress?: string;
  totalInteractions: number;
  firstSeen: Date;
  lastSeen: Date;
  preferredCategories: string[];
  preferredBlockchains: string[];
  interactionPatterns: {
    hourlyActivity: number[];
    dailyActivity: number[];
    weeklyActivity: number[];
  };
  engagementMetrics: {
    avgSessionDuration: number;
    pagesPerSession: number;
    bounceRate: number;
    returnVisits: number;
  };
  airdropBehavior: {
    totalViewed: number;
    totalParticipated: number;
    successRate: number;
    avgRewardClaimed: number;
    preferredDifficulty: string;
  };
  riskProfile: {
    riskTolerance: 'low' | 'medium' | 'high';
    scamAvoidance: number;
    dueDiligence: number;
  };
}

export interface InteractionEvent {
  type: 'page_view' | 'airdrop_view' | 'airdrop_participate' | 'wallet_connect' | 'search' | 'filter' | 'sort' | 'bookmark' | 'share' | 'export';
  data: any;
}

export class UserInteractionTracker {
  private eventQueue: UserInteraction[] = [];
  private isProcessing = false;

  async trackInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const fullInteraction: UserInteraction = {
        ...interaction,
        id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      this.eventQueue.push(fullInteraction);

      // Process queue if it's getting large
      if (this.eventQueue.length >= 50) {
        await this.processEventQueue();
      }

      logger.debug(`Tracked interaction: ${interaction.action} for ${interaction.userId || interaction.walletAddress}`);
    } catch (error) {
      logger.error('Failed to track interaction:', error);
    }
  }

  async trackPageView(userId?: string, walletAddress?: string, page: string, metadata: any = {}) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'page_view',
      resource: 'page',
      resourceId: page,
      metadata: { page, ...metadata }
    });
  }

  async trackAirdropView(userId?: string, walletAddress?: string, airdropId: string, metadata: any = {}) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'airdrop_view',
      resource: 'airdrop',
      resourceId: airdropId,
      metadata
    });
  }

  async trackAirdropParticipation(userId?: string, walletAddress?: string, airdropId: string, success: boolean, metadata: any = {}) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'airdrop_participate',
      resource: 'airdrop',
      resourceId: airdropId,
      success,
      metadata
    });
  }

  async trackWalletConnect(userId?: string, walletAddress: string, walletType: string, success: boolean) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'wallet_connect',
      resource: 'wallet',
      metadata: { walletType },
      success
    });
  }

  async trackSearch(userId?: string, walletAddress?: string, query: string, resultsCount: number, filters: any = {}) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'search',
      resource: 'search',
      metadata: { query, resultsCount, filters }
    });
  }

  async trackFilter(userId?: string, walletAddress?: string, filterType: string, filterValue: any, context: any = {}) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'filter',
      resource: 'filter',
      metadata: { filterType, filterValue, context }
    });
  }

  async trackBookmark(userId?: string, walletAddress?: string, airdropId: string, action: 'add' | 'remove') {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'bookmark',
      resource: 'airdrop',
      resourceId: airdropId,
      metadata: { bookmarkAction: action }
    });
  }

  async trackShare(userId?: string, walletAddress?: string, airdropId: string, platform: string) {
    await this.trackInteraction({
      userId,
      walletAddress,
      action: 'share',
      resource: 'airdrop',
      resourceId: airdropId,
      metadata: { platform }
    });
  }

  async processEventQueue(): Promise<void> {
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const eventsToProcess = this.eventQueue.splice(0, 100); // Process in batches

    try {
      // Store events in database
      for (const event of eventsToProcess) {
        await this.storeInteraction(event);
      }

      // Update user profiles asynchronously
      this.updateUserProfiles(eventsToProcess);

      logger.info(`Processed ${eventsToProcess.length} interaction events`);
    } catch (error) {
      logger.error('Failed to process event queue:', error);
      // Re-add failed events to queue for retry
      this.eventQueue.unshift(...eventsToProcess);
    } finally {
      this.isProcessing = false;
    }
  }

  private async storeInteraction(interaction: UserInteraction): Promise<void> {
    try {
      await db.userActivityLog.create({
        data: {
          userId: interaction.userId,
          action: interaction.action,
          resource: interaction.resource,
          resourceId: interaction.resourceId,
          metadata: interaction.metadata,
          ipAddress: interaction.ipAddress,
          userAgent: interaction.userAgent,
          sessionId: interaction.sessionId,
          duration: interaction.duration,
          success: interaction.success,
          errorMessage: interaction.errorMessage
        }
      });
    } catch (error) {
      logger.error('Failed to store interaction:', error);
    }
  }

  private async updateUserProfiles(interactions: UserInteraction[]): Promise<void> {
    try {
      // Group interactions by user/wallet
      const userGroups = new Map<string, UserInteraction[]>();
      
      for (const interaction of interactions) {
        const key = interaction.userId || interaction.walletAddress || 'anonymous';
        if (!userGroups.has(key)) {
          userGroups.set(key, []);
        }
        userGroups.get(key)!.push(interaction);
      }

      // Update profile for each user
      for (const [userKey, userInteractions] of userGroups) {
        if (userKey !== 'anonymous') {
          await this.updateUserProfile(userKey, userInteractions);
        }
      }
    } catch (error) {
      logger.error('Failed to update user profiles:', error);
    }
  }

  private async updateUserProfile(userKey: string, interactions: UserInteraction[]): Promise<void> {
    try {
      // Get existing profile data
      const existingProfile = await this.getUserBehaviorProfile(userKey);
      
      // Calculate updated profile
      const updatedProfile = await this.calculateBehaviorProfile(userKey, interactions, existingProfile);
      
      // Store updated profile (in metadata for now)
      const userId = interactions[0].userId;
      const walletAddress = interactions[0].walletAddress;

      if (userId) {
        await db.user.update({
          where: { id: userId },
          data: {
            metadata: {
              behaviorProfile: updatedProfile,
              lastProfileUpdate: new Date().toISOString()
            }
          }
        });
      }
    } catch (error) {
      logger.error(`Failed to update user profile for ${userKey}:`, error);
    }
  }

  private async getUserBehaviorProfile(userKey: string): Promise<UserBehaviorProfile | null> {
    try {
      // Try to get from user metadata first
      const user = await db.user.findFirst({
        where: {
          OR: [
            { id: userKey },
            { walletAddress: userKey }
          ]
        }
      });

      if (user?.metadata?.behaviorProfile) {
        return user.metadata.behaviorProfile;
      }

      return null;
    } catch (error) {
      logger.error('Failed to get user behavior profile:', error);
      return null;
    }
  }

  private async calculateBehaviorProfile(userKey: string, newInteractions: UserInteraction[], existingProfile: UserBehaviorProfile | null): Promise<UserBehaviorProfile> {
    try {
      // Get all interactions for the user
      const allInteractions = await db.userActivityLog.findMany({
        where: {
          OR: [
            { userId: userKey },
            { walletAddress: userKey }
          ]
        },
        orderBy: { timestamp: 'asc' }
      });

      const userId = newInteractions[0].userId;
      const walletAddress = newInteractions[0].walletAddress;

      // Basic metrics
      const totalInteractions = allInteractions.length;
      const firstSeen = allInteractions[0]?.timestamp || new Date();
      const lastSeen = allInteractions[allInteractions.length - 1]?.timestamp || new Date();

      // Calculate preferred categories and blockchains
      const categoryCounts = new Map<string, number>();
      const blockchainCounts = new Map<string, number>();

      for (const interaction of allInteractions) {
        if (interaction.metadata?.category) {
          categoryCounts.set(
            interaction.metadata.category,
            (categoryCounts.get(interaction.metadata.category) || 0) + 1
          );
        }
        if (interaction.metadata?.blockchain) {
          blockchainCounts.set(
            interaction.metadata.blockchain,
            (blockchainCounts.get(interaction.metadata.blockchain) || 0) + 1
          );
        }
      }

      const preferredCategories = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category);

      const preferredBlockchains = Array.from(blockchainCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([blockchain]) => blockchain);

      // Calculate interaction patterns
      const interactionPatterns = this.calculateInteractionPatterns(allInteractions);

      // Calculate engagement metrics
      const engagementMetrics = this.calculateEngagementMetrics(allInteractions);

      // Calculate airdrop behavior
      const airdropBehavior = await this.calculateAirdropBehavior(userKey);

      // Calculate risk profile
      const riskProfile = this.calculateRiskProfile(allInteractions, airdropBehavior);

      return {
        userId,
        walletAddress,
        totalInteractions,
        firstSeen,
        lastSeen,
        preferredCategories,
        preferredBlockchains,
        interactionPatterns,
        engagementMetrics,
        airdropBehavior,
        riskProfile
      };
    } catch (error) {
      logger.error('Failed to calculate behavior profile:', error);
      return this.getDefaultProfile(userKey);
    }
  }

  private calculateInteractionPatterns(interactions: any[]): UserBehaviorProfile['interactionPatterns'] {
    const hourlyActivity = new Array(24).fill(0);
    const dailyActivity = new Array(7).fill(0);
    const weeklyActivity = new Array(52).fill(0);

    for (const interaction of interactions) {
      const date = new Date(interaction.timestamp);
      hourlyActivity[date.getHours()]++;
      dailyActivity[date.getDay()]++;
      
      const weekNumber = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      if (weekNumber >= 0 && weekNumber < 52) {
        weeklyActivity[weekNumber]++;
      }
    }

    return { hourlyActivity, dailyActivity, weeklyActivity };
  }

  private calculateEngagementMetrics(interactions: any[]): UserBehaviorProfile['engagementMetrics'] {
    // Calculate sessions (group interactions by 30-minute windows)
    const sessions = this.groupIntoSessions(interactions);
    
    const sessionDurations = sessions.map(session => {
      if (session.length < 2) return 0;
      const start = new Date(session[0].timestamp);
      const end = new Date(session[session.length - 1].timestamp);
      return (end.getTime() - start.getTime()) / 1000; // seconds
    });

    const avgSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
      : 0;

    const pagesPerSession = sessions.length > 0 
      ? interactions.length / sessions.length 
      : 0;

    const singlePageSessions = sessions.filter(session => session.length === 1).length;
    const bounceRate = sessions.length > 0 ? (singlePageSessions / sessions.length) * 100 : 0;

    // Calculate return visits (sessions on different days)
    const sessionDays = new Set(sessions.map(session => 
      new Date(session[0].timestamp).toDateString()
    ));
    const returnVisits = Math.max(0, sessionDays.size - 1);

    return {
      avgSessionDuration,
      pagesPerSession,
      bounceRate,
      returnVisits
    };
  }

  private groupIntoSessions(interactions: any[]): any[][] {
    if (interactions.length === 0) return [];

    const sessions = [];
    let currentSession = [interactions[0]];

    for (let i = 1; i < interactions.length; i++) {
      const current = new Date(interactions[i].timestamp);
      const previous = new Date(interactions[i - 1].timestamp);
      const timeDiff = (current.getTime() - previous.getTime()) / (1000 * 60); // minutes

      if (timeDiff > 30) {
        // Start new session
        sessions.push(currentSession);
        currentSession = [interactions[i]];
      } else {
        currentSession.push(interactions[i]);
      }
    }

    sessions.push(currentSession);
    return sessions;
  }

  private async calculateAirdropBehavior(userKey: string): Promise<UserBehaviorProfile['airdropBehavior']> {
    try {
      const airdropInteractions = await db.userActivityLog.findMany({
        where: {
          OR: [
            { userId: userKey },
            { walletAddress: userKey }
          ],
          resource: 'airdrop'
        }
      });

      const viewedAirdrops = airdropInteractions.filter(i => i.action === 'airdrop_view');
      const participatedAirdrops = airdropInteractions.filter(i => i.action === 'airdrop_participate');
      const successfulParticipations = participatedAirdrops.filter(i => i.success);

      // Get actual participation data
      const participations = await db.userAirdropParticipation.findMany({
        where: {
          OR: [
            { userId: userKey },
            { walletAddress: userKey }
          ]
        }
      });

      const rewards = participations
        .filter(p => p.rewardAmount)
        .map(p => parseFloat(p.rewardAmount.toString()));

      const avgRewardClaimed = rewards.length > 0 
        ? rewards.reduce((sum, reward) => sum + reward, 0) / rewards.length 
        : 0;

      // Determine preferred difficulty based on success patterns
      const preferredDifficulty = this.calculatePreferredDifficulty(participations);

      return {
        totalViewed: viewedAirdrops.length,
        totalParticipated: participatedAirdrops.length,
        successRate: participatedAirdrops.length > 0 
          ? (successfulParticipations.length / participatedAirdrops.length) * 100 
          : 0,
        avgRewardClaimed,
        preferredDifficulty
      };
    } catch (error) {
      logger.error('Failed to calculate airdrop behavior:', error);
      return {
        totalViewed: 0,
        totalParticipated: 0,
        successRate: 0,
        avgRewardClaimed: 0,
        preferredDifficulty: 'medium'
      };
    }
  }

  private calculatePreferredDifficulty(participations: any[]): string {
    if (participations.length === 0) return 'medium';

    // Analyze success rates by difficulty (simplified)
    const difficultySuccess = { easy: 0, medium: 0, hard: 0 };
    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };

    for (const participation of participations) {
      // This would need to be enhanced to get actual difficulty from airdrop data
      const difficulty = 'medium'; // Placeholder
      const success = participation.status === 'completed' || participation.status === 'rewarded';
      
      difficultyCounts[difficulty as keyof typeof difficultyCounts]++;
      if (success) {
        difficultySuccess[difficulty as keyof typeof difficultySuccess]++;
      }
    }

    let bestDifficulty = 'medium';
    let bestSuccessRate = 0;

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const successRate = difficultyCounts[difficulty] > 0 
        ? (difficultySuccess[difficulty] / difficultyCounts[difficulty]) * 100 
        : 0;
      
      if (successRate > bestSuccessRate) {
        bestSuccessRate = successRate;
        bestDifficulty = difficulty;
      }
    }

    return bestDifficulty;
  }

  private calculateRiskProfile(interactions: any[], airdropBehavior: UserBehaviorProfile['airdropBehavior']): UserBehaviorProfile['riskProfile'] {
    // Analyze risk-taking behavior
    const highRiskInteractions = interactions.filter(i => 
      i.metadata?.riskLevel === 'high' || i.metadata?.riskScore > 70
    ).length;

    const totalRelevantInteractions = interactions.filter(i => 
      i.resource === 'airdrop' && i.metadata?.riskScore !== undefined
    ).length;

    const riskTolerance = totalRelevantInteractions > 0 
      ? (highRiskInteractions / totalRelevantInteractions) * 100 
      : 50;

    let riskLevel: 'low' | 'medium' | 'high';
    if (riskTolerance > 70) riskLevel = 'high';
    else if (riskTolerance > 30) riskLevel = 'medium';
    else riskLevel = 'low';

    // Calculate scam avoidance (based on interaction with verified content)
    const verifiedInteractions = interactions.filter(i => 
      i.metadata?.verified === true || i.metadata?.trustScore > 80
    ).length;

    const scamAvoidance = interactions.length > 0 
      ? (verifiedInteractions / interactions.length) * 100 
      : 50;

    // Calculate due diligence (based on research behavior)
    const researchInteractions = interactions.filter(i => 
      ['search', 'filter_view', 'details_view'].includes(i.action)
    ).length;

    const dueDiligence = interactions.length > 0 
      ? (researchInteractions / interactions.length) * 100 
      : 50;

    return {
      riskTolerance: riskLevel,
      scamAvoidance,
      dueDiligence
    };
  }

  private getDefaultProfile(userKey: string): UserBehaviorProfile {
    return {
      totalInteractions: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      preferredCategories: [],
      preferredBlockchains: [],
      interactionPatterns: {
        hourlyActivity: new Array(24).fill(0),
        dailyActivity: new Array(7).fill(0),
        weeklyActivity: new Array(52).fill(0)
      },
      engagementMetrics: {
        avgSessionDuration: 0,
        pagesPerSession: 0,
        bounceRate: 100,
        returnVisits: 0
      },
      airdropBehavior: {
        totalViewed: 0,
        totalParticipated: 0,
        successRate: 0,
        avgRewardClaimed: 0,
        preferredDifficulty: 'medium'
      },
      riskProfile: {
        riskTolerance: 'medium',
        scamAvoidance: 50,
        dueDiligence: 50
      }
    };
  }

  async getUserBehaviorProfile(userKey: string): Promise<UserBehaviorProfile | null> {
    try {
      const user = await db.user.findFirst({
        where: {
          OR: [
            { id: userKey },
            { walletAddress: userKey }
          ]
        }
      });

      return user?.metadata?.behaviorProfile || null;
    } catch (error) {
      logger.error('Failed to get user behavior profile:', error);
      return null;
    }
  }

  async getInteractionStats(timeframe: '24h' | '7d' | '30d' = '7d'): Promise<any> {
    try {
      const cutoffDate = this.getCutoffDate(timeframe);

      const stats = await db.userActivityLog.groupBy({
        by: ['action'],
        where: {
          timestamp: {
            gte: cutoffDate
          }
        },
        _count: {
          id: true
        },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      const totalInteractions = stats.reduce((sum, stat) => sum + stat._count.id, 0);

      return {
        timeframe,
        totalInteractions,
        topActions: stats.slice(0, 10),
        uniqueUsers: await this.getUniqueUsers(cutoffDate),
        avgSessionDuration: await this.getAvgSessionDuration(cutoffDate)
      };
    } catch (error) {
      logger.error('Failed to get interaction stats:', error);
      return null;
    }
  }

  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '24h': return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  private async getUniqueUsers(cutoffDate: Date): Promise<number> {
    try {
      const users = await db.userActivityLog.findMany({
        where: {
          timestamp: {
            gte: cutoffDate
          }
        },
        select: {
          userId: true,
          walletAddress: true
        },
        distinct: ['userId', 'walletAddress']
      });

      return users.filter(u => u.userId || u.walletAddress).length;
    } catch (error) {
      logger.error('Failed to get unique users:', error);
      return 0;
    }
  }

  private async getAvgSessionDuration(cutoffDate: Date): Promise<number> {
    try {
      // This is a simplified calculation
      // In a real implementation, you'd want more sophisticated session tracking
      const interactions = await db.userActivityLog.findMany({
        where: {
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      if (interactions.length < 2) return 0;

      const sessions = this.groupIntoSessions(interactions);
      const sessionDurations = sessions.map(session => {
        if (session.length < 2) return 0;
        const start = new Date(session[0].timestamp);
        const end = new Date(session[session.length - 1].timestamp);
        return (end.getTime() - start.getTime()) / 1000;
      });

      return sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length 
        : 0;
    } catch (error) {
      logger.error('Failed to get average session duration:', error);
      return 0;
    }
  }

  // Start background processing
  startBackgroundProcessing(): void {
    // Process queue every 30 seconds
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.processEventQueue();
      }
    }, 30000);

    logger.info('User interaction tracking background processing started');
  }
}

export const userInteractionTracker = new UserInteractionTracker();