import { db } from '@/lib/db';

// Server-side ZAI import - will be loaded dynamically
let ZAI: any = null;

// ML Infrastructure Service
export class MLInfrastructure {
  private static instance: MLInfrastructure;
  private zai: ZAI | null = null;

  private constructor() {}

  static getInstance(): MLInfrastructure {
    if (!MLInfrastructure.instance) {
      MLInfrastructure.instance = new MLInfrastructure();
    }
    return MLInfrastructure.instance;
  }

  async initializeZAI(): Promise<void> {
    try {
      if (!ZAI) {
        // Try dynamic import instead of require
        try {
          const zaiModule = await import('z-ai-web-dev-sdk');
          ZAI = zaiModule.default || zaiModule.ZAI;
        } catch (importError) {
          console.warn('⚠️ ZAI SDK not available in this environment');
          return;
        }
      }
      
      if (!ZAI) {
        console.warn('⚠️ ZAI SDK not available in this environment');
        return;
      }
      
      this.zai = await ZAI.create();
      console.log('✅ ZAI ML infrastructure initialized');
    } catch (error) {
      console.error('❌ Failed to initialize ZAI:', error);
      // Don't throw error, just continue without ZAI
      this.zai = null;
    }
  }

  // User Behavior Tracking
  async trackUserBehavior(userId: string, eventData: {
    eventType: string;
    eventName: string;
    eventData?: any;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    duration?: number;
  }): Promise<void> {
    try {
      await db.userBehaviorEvent.create({
        data: {
          userId,
          eventType: eventData.eventType,
          eventName: eventData.eventName,
          eventData: eventData.eventData || {},
          sessionId: eventData.sessionId,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent,
          referrer: eventData.referrer,
          duration: eventData.duration,
          timestamp: new Date(),
        },
      });

      // Update user last active timestamp
      await this.updateUserActivity(userId);
    } catch (error) {
      console.error('❌ Failed to track user behavior:', error);
    }
  }

  // Feature Vector Generation
  async generateUserFeatureVector(userId: string): Promise<any> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          userProfile: true,
          userBehaviorEvents: {
            orderBy: { timestamp: 'desc' },
            take: 100, // Last 100 events
          },
          userAirdropStatuses: {
            include: { airdrop: true },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Behavioral features
      const recentEvents = user.userBehaviorEvents;
      const pageViews = recentEvents.filter(e => e.eventType === 'page_view').length;
      const clicks = recentEvents.filter(e => e.eventType === 'click').length;
      const taskCompletions = recentEvents.filter(e => e.eventType === 'task_complete').length;
      const avgSessionDuration = this.calculateAverageSessionDuration(recentEvents);

      // Airdrop interaction features
      const airdropInteractions = user.userAirdropStatuses.length;
      const completedAirdrops = user.userAirdropStatuses.filter(s => s.status === 'completed').length;
      const successRate = airdropInteractions > 0 ? completedAirdrops / airdropInteractions : 0;

      // Profile features
      const profile = user.userProfile;
      const riskTolerance = profile?.riskTolerance || 50;
      const experienceLevel = this.encodeExperienceLevel(profile?.experienceLevel || 'beginner');
      const investmentCapacity = this.encodeInvestmentCapacity(profile?.investmentCapacity || 'low');

      // Time-based features
      const hourOfDay = new Date().getHours();
      const dayOfWeek = new Date().getDay();
      const accountAge = this.calculateAccountAge(user.createdAt);

      const featureVector = {
        // Behavioral features
        pageViews,
        clicks,
        taskCompletions,
        avgSessionDuration,
        airdropInteractions,
        completedAirdrops,
        successRate,
        
        // Profile features
        riskTolerance,
        experienceLevel,
        investmentCapacity,
        
        // Temporal features
        hourOfDay,
        dayOfWeek,
        accountAge,
        
        // Engagement metrics
        lastActiveDays: this.calculateDaysSinceLastActive(profile?.lastActiveAt),
        tasksCompleted: profile?.tasksCompleted || 0,
        avgTaskTime: profile?.avgTaskTime || 0,
        
        // Financial metrics
        totalEarned: profile?.totalEarned || 0,
        gasSpent: profile?.gasSpent || 0,
      };

      // Store feature vector
      await this.storeFeatureVector(userId, 'user_profile', featureVector);

      return featureVector;
    } catch (error) {
      console.error('❌ Failed to generate user feature vector:', error);
      throw error;
    }
  }

  // Airdrop Feature Vector Generation
  async generateAirdropFeatureVector(airdropId: string): Promise<any> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      // Extract features from airdrop data
      const requirements = airdrop.requirements as any;
      const hasTwitter = !!airdrop.twitterUrl;
      const hasDiscord = !!airdrop.discordUrl;
      const hasTelegram = !!airdrop.telegramUrl;
      
      // Risk and hype scores
      const riskScore = airdrop.riskScore || 0;
      const hypeScore = airdrop.hypeScore || 0;
      
      // Category encoding
      const category = this.encodeCategory(airdrop.category);
      
      // Requirements complexity
      const requirementsComplexity = this.calculateRequirementsComplexity(requirements);
      
      // Time-based features
      const daysSinceCreation = this.calculateDaysSinceDate(airdrop.createdAt);
      const daysSinceUpdate = this.calculateDaysSinceDate(airdrop.updatedAt);

      const featureVector = {
        // Basic features
        hasTwitter,
        hasDiscord,
        hasTelegram,
        riskScore,
        hypeScore,
        category,
        requirementsComplexity,
        
        // Temporal features
        daysSinceCreation,
        daysSinceUpdate,
        
        // Engagement potential
        socialMediaPresence: [hasTwitter, hasDiscord, hasTelegram].filter(Boolean).length,
        descriptionLength: airdrop.description?.length || 0,
        
        // Requirements features
        hasRequirements: !!requirements,
        requiresTwitter: requirements?.twitter || false,
        requiresDiscord: requirements?.discord || false,
        requiresTransactions: requirements?.minTransactions > 0 || false,
        requiresTokens: requirements?.minBalance || false,
        requiresNFTs: requirements?.nftCollection || false,
        minTransactions: requirements?.minTransactions || 0,
        minBalanceAmount: requirements?.minBalance?.amount || 0,
      };

      return featureVector;
    } catch (error) {
      console.error('❌ Failed to generate airdrop feature vector:', error);
      throw error;
    }
  }

  // ML Prediction using ZAI
  async makePrediction(userId: string, modelType: string, inputFeatures: any): Promise<any> {
    if (!this.zai) {
      await this.initializeZAI();
    }

    // If ZAI is still not available, return a fallback prediction
    if (!this.zai) {
      console.warn('⚠️ ZAI not available, returning fallback prediction');
      return this.getFallbackPrediction(modelType, inputFeatures);
    }

    try {
      const prompt = this.buildPredictionPrompt(modelType, inputFeatures);
      
      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an ML prediction engine for crypto airdrop recommendations. Provide accurate, data-driven predictions with confidence scores.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Lower temperature for more consistent predictions
      });

      const predictionText = completion.choices[0]?.message?.content;
      const prediction = this.parsePredictionResponse(predictionText);

      // Store prediction
      await this.storePrediction(userId, modelType, inputFeatures, prediction);

      return prediction;
    } catch (error) {
      console.error('❌ Failed to make prediction:', error);
      // Return fallback prediction on error
      return this.getFallbackPrediction(modelType, inputFeatures);
    }
  }

  // Fallback prediction when ZAI is not available
  private getFallbackPrediction(modelType: string, inputFeatures: any): any {
    switch (modelType) {
      case 'airdrop_recommendation':
        return {
          recommendations: [
            { category: 'defi', confidence: 0.6, reason: 'Popular category with good returns' },
            { category: 'layer2', confidence: 0.5, reason: 'Growing ecosystem' },
            { category: 'gaming', confidence: 0.4, reason: 'High engagement potential' },
          ],
          overall_confidence: 0.5,
        };

      case 'risk_assessment':
        return {
          risk_score: 50,
          confidence: 0.5,
          risk_factors: ['unknown', 'limited_data'],
          recommendations: ['start_small', 'do_research'],
        };

      case 'success_prediction':
        return {
          success_probability: 0.5,
          confidence: 0.4,
          key_factors: ['baseline_prediction'],
          recommendations: ['verify_requirements', 'check_eligibility'],
        };

      default:
        return {
          confidence: 0.5,
          predictions: [],
          fallback: true,
        };
    }
  }

  // Store feature vector in database
  private async storeFeatureVector(userId: string, vectorType: string, features: any): Promise<void> {
    try {
      await db.featureVector.upsert({
        where: {
          userId_vectorType_version: {
            userId,
            vectorType,
            version: 'v1.0',
          },
        },
        update: {
          features,
          dimensions: Object.keys(features).length,
          updatedAt: new Date(),
        },
        create: {
          userId,
          vectorType,
          features,
          dimensions: Object.keys(features).length,
          version: 'v1.0',
        },
      });
    } catch (error) {
      console.error('❌ Failed to store feature vector:', error);
    }
  }

  // Store prediction in database
  private async storePrediction(userId: string, modelType: string, inputFeatures: any, prediction: any): Promise<void> {
    try {
      await db.mLPrediction.create({
        data: {
          userId,
          modelType,
          modelVersion: 'v1.0',
          inputFeatures,
          prediction,
          confidence: prediction.confidence || 0.5,
        },
      });
    } catch (error) {
      console.error('❌ Failed to store prediction:', error);
    }
  }

  // Helper methods
  private async updateUserActivity(userId: string): Promise<void> {
    try {
      await db.userProfile.upsert({
        where: { userId },
        update: { lastActiveAt: new Date() },
        create: {
          userId,
          riskTolerance: 50,
          experienceLevel: 'beginner',
          investmentCapacity: 'low',
          timeCommitment: 'low',
          lastActiveAt: new Date(),
        },
      });
    } catch (error) {
      console.error('❌ Failed to update user activity:', error);
    }
  }

  private calculateAverageSessionDuration(events: any[]): number {
    const sessions = this.groupEventsBySession(events);
    const durations = sessions.map(session => {
      if (session.length < 2) return 0;
      const start = new Date(session[0].timestamp).getTime();
      const end = new Date(session[session.length - 1].timestamp).getTime();
      return end - start;
    });
    return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
  }

  private groupEventsBySession(events: any[]): any[][] {
    const sessions: any[][] = [];
    let currentSession: any[] = [];
    let lastEventTime = 0;

    events.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
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

  private encodeExperienceLevel(level: string): number {
    const levels = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    return levels[level as keyof typeof levels] || 1;
  }

  private encodeInvestmentCapacity(capacity: string): number {
    const capacities = { low: 1, medium: 2, high: 3, very_high: 4 };
    return capacities[capacity as keyof typeof capacities] || 1;
  }

  private encodeCategory(category: string): number {
    const categories: { [key: string]: number } = {
      defi: 1,
      gaming: 2,
      nft: 3,
      infrastructure: 4,
      social: 5,
      exchange: 6,
      lending: 7,
      bridge: 8,
      layer2: 9,
      other: 10,
    };
    return categories[category.toLowerCase()] || 10;
  }

  private calculateRequirementsComplexity(requirements: any): number {
    if (!requirements) return 0;
    let complexity = 0;
    if (requirements.twitter) complexity += 1;
    if (requirements.discord) complexity += 1;
    if (requirements.telegram) complexity += 1;
    if (requirements.minTransactions > 0) complexity += 2;
    if (requirements.minBalance) complexity += 2;
    if (requirements.nftCollection) complexity += 3;
    if (requirements.contracts && requirements.contracts.length > 0) complexity += requirements.contracts.length;
    return complexity;
  }

  private calculateDaysSinceDate(date: Date): number {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private calculateDaysSinceLastActive(lastActive?: Date): number {
    if (!lastActive) return 999;
    return this.calculateDaysSinceDate(lastActive);
  }

  private calculateAccountAge(createdAt: Date): number {
    return this.calculateDaysSinceDate(createdAt);
  }

  private buildPredictionPrompt(modelType: string, features: any): string {
    switch (modelType) {
      case 'airdrop_recommendation':
        return `Based on the following user features, predict the top 5 airdrop categories this user would be most interested in:

User Features:
${JSON.stringify(features, null, 2)}

Provide a JSON response with:
{
  "recommendations": [
    { "category": "category_name", "confidence": 0.85, "reason": "specific reason" }
  ],
  "overall_confidence": 0.80
}`;

      case 'risk_assessment':
        return `Based on the following user profile and behavior, assess the risk tolerance for this user:

User Features:
${JSON.stringify(features, null, 2)}

Provide a JSON response with:
{
  "risk_score": 65,
  "confidence": 0.75,
  "risk_factors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

      case 'success_prediction':
        return `Based on the following user and airdrop features, predict the success probability:

User Features:
${JSON.stringify(features.user, null, 2)}

Airdrop Features:
${JSON.stringify(features.airdrop, null, 2)}

Provide a JSON response with:
{
  "success_probability": 0.72,
  "confidence": 0.68,
  "key_factors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"]
}`;

      default:
        return `Analyze the following features and provide insights:

Features:
${JSON.stringify(features, null, 2)}

Provide a JSON response with your analysis and predictions.`;
    }
  }

  private parsePredictionResponse(response: string | undefined): any {
    try {
      if (!response) {
        return { confidence: 0.5, predictions: [] };
      }
      
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if no JSON found
      return {
        confidence: 0.5,
        predictions: [],
        raw_response: response,
      };
    } catch (error) {
      console.error('❌ Failed to parse prediction response:', error);
      return { confidence: 0.5, error: 'Failed to parse response' };
    }
  }
}

// Export singleton instance
export const mlInfrastructure = MLInfrastructure.getInstance();