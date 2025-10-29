import { db } from '@/lib/db'
import { type User, type UserBehavior, type UIPreference } from '@/types/adaptive-ui'

export interface UserBehaviorPattern {
  userId: string
  lastActive: Date
  sessionDuration: number
  clickPatterns: Record<string, number>
  viewPatterns: Record<string, number>
  timeSpentOnSections: Record<string, number>
  preferredAirdropTypes: string[]
  riskToleranceScore: number
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  successPatterns: {
    completedTasks: number
    successfulAirdrops: number
    averageTimeToComplete: number
  }
  deviceUsage: {
    mobile: number
    desktop: number
    tablet: number
  }
  featureUsage: Record<string, number>
}

export interface UIAdaptationConfig {
  layoutDensity: 'COMPACT' | 'COMFORTABLE' | 'SPACIOUS'
  colorScheme: 'DEFAULT' | 'HIGH_CONTRAST' | 'DARK' | 'LIGHT'
  featurePrioritization: string[]
  notificationLevel: 'MINIMAL' | 'NORMAL' | 'VERBOSE'
  automationLevel: 'MANUAL' | 'ASSISTED' | 'AUTOMATED'
  contentFocus: 'SECURITY' | 'EFFICIENCY' | 'DISCOVERY' | 'ANALYTICS'
  widgetConfiguration: Record<string, boolean>
  shortcutPreferences: Record<string, string>
}

export interface AdaptiveUIInsight {
  userId: string
  adaptationType: string
  reason: string
  confidence: number
  timestamp: Date
  changes: Partial<UIAdaptationConfig>
}

export class AdaptiveUIService {
  private readonly BEHAVIOR_WEIGHTS = {
    clickPattern: 0.3,
    viewPattern: 0.25,
    timeSpent: 0.2,
    taskCompletion: 0.15,
    deviceUsage: 0.1
  }

  private readonly ADAPTATION_THRESHOLDS = {
    minSessions: 5,
    minTotalTime: 1800000, // 30 minutes in ms
    confidenceThreshold: 0.7,
    behaviorChangeThreshold: 0.3
  }

  /**
   * Track user behavior for UI adaptation
   */
  async trackUserBehavior(
    userId: string,
    behavior: Omit<UserBehavior, 'id' | 'timestamp'>
  ): Promise<void> {
    try {
      await db.userBehavior.create({
        data: {
          userId,
          action: behavior.action,
          element: behavior.element,
          section: behavior.section,
          duration: behavior.duration,
          metadata: behavior.metadata,
          timestamp: new Date()
        }
      })

      // Trigger adaptation analysis every 10 behaviors
      const behaviorCount = await db.userBehavior.count({
        where: { userId }
      })

      if (behaviorCount % 10 === 0) {
        await this.analyzeAndAdaptUI(userId)
      }
    } catch (error) {
      console.error('Error tracking user behavior:', error)
    }
  }

  /**
   * Analyze user behavior patterns and generate insights
   */
  async analyzeUserBehavior(userId: string): Promise<UserBehaviorPattern> {
    try {
      const behaviors = await db.userBehavior.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 500 // Last 500 behaviors
      })

      const user = await db.user.findUnique({
        where: { id: userId },
        select: { 
          createdAt: true,
          preferences: true,
          riskTolerance: true
        }
      })

      if (!user || behaviors.length < this.ADAPTATION_THRESHOLDS.minSessions) {
        return this.getDefaultBehaviorPattern(userId)
      }

      // Analyze patterns
      const clickPatterns = this.analyzeClickPatterns(behaviors)
      const viewPatterns = this.analyzeViewPatterns(behaviors)
      const timeSpentOnSections = this.analyzeTimeSpent(behaviors)
      const deviceUsage = this.analyzeDeviceUsage(behaviors)
      const featureUsage = this.analyzeFeatureUsage(behaviors)
      const activityLevel = this.calculateActivityLevel(behaviors)
      const successPatterns = await this.analyzeSuccessPatterns(userId, behaviors)

      return {
        userId,
        lastActive: new Date(),
        sessionDuration: this.calculateAverageSessionDuration(behaviors),
        clickPatterns,
        viewPatterns,
        timeSpentOnSections,
        preferredAirdropTypes: this.extractPreferredAirdropTypes(behaviors),
        riskToleranceScore: this.calculateRiskToleranceScore(user.riskTolerance, behaviors),
        activityLevel,
        successPatterns,
        deviceUsage,
        featureUsage
      }
    } catch (error) {
      console.error('Error analyzing user behavior:', error)
      return this.getDefaultBehaviorPattern(userId)
    }
  }

  /**
   * Generate UI adaptations based on behavior patterns
   */
  async generateUIAdaptations(pattern: UserBehaviorPattern): Promise<UIAdaptationConfig> {
    const adaptations: Partial<UIAdaptationConfig> = {}

    // Layout density based on activity level and device usage
    adaptations.layoutDensity = this.determineLayoutDensity(pattern)

    // Color scheme based on time of day and usage patterns
    adaptations.colorScheme = this.determineColorScheme(pattern)

    // Feature prioritization based on usage patterns
    adaptations.featurePrioritization = this.prioritizeFeatures(pattern)

    // Notification level based on activity and success rate
    adaptations.notificationLevel = this.determineNotificationLevel(pattern)

    // Automation level based on user expertise and success
    adaptations.automationLevel = this.determineAutomationLevel(pattern)

    // Content focus based on user interests
    adaptations.contentFocus = this.determineContentFocus(pattern)

    // Widget configuration based on feature usage
    adaptations.widgetConfiguration = this.configureWidgets(pattern)

    // Shortcut preferences based on frequent actions
    adaptations.shortcutPreferences = this.generateShortcuts(pattern)

    return adaptations as UIAdaptationConfig
  }

  /**
   * Apply UI adaptations and store them
   */
  async applyUIAdaptations(
    userId: string,
    adaptations: UIAdaptationConfig,
    insight: AdaptiveUIInsight
  ): Promise<void> {
    try {
      // Store the adaptation
      await db.uIPreference.upsert({
        where: { userId },
        update: {
          config: adaptations,
          lastUpdated: new Date(),
          adaptationHistory: {
            push: insight
          }
        },
        create: {
          userId,
          config: adaptations,
          adaptationHistory: [insight]
        }
      })

      // Log the adaptation for analytics
      console.log(`UI adapted for user ${userId}:`, {
        adaptationType: insight.adaptationType,
        confidence: insight.confidence,
        changes: Object.keys(adaptations)
      })
    } catch (error) {
      console.error('Error applying UI adaptations:', error)
    }
  }

  /**
   * Get current UI preferences for a user
   */
  async getUIPreferences(userId: string): Promise<UIAdaptationConfig | null> {
    try {
      const preference = await db.uIPreference.findUnique({
        where: { userId }
      })

      return preference?.config as UIAdaptationConfig || null
    } catch (error) {
      console.error('Error getting UI preferences:', error)
      return null
    }
  }

  /**
   * Analyze behavior and trigger adaptations
   */
  private async analyzeAndAdaptUI(userId: string): Promise<void> {
    try {
      const pattern = await this.analyzeUserBehavior(userId)
      const adaptations = await this.generateUIAdaptations(pattern)
      
      const insight: AdaptiveUIInsight = {
        userId,
        adaptationType: 'BEHAVIOR_DRIVEN',
        reason: this.generateAdaptationReason(pattern, adaptations),
        confidence: this.calculateAdaptationConfidence(pattern),
        timestamp: new Date(),
        changes: adaptations
      }

      // Only apply if confidence is above threshold
      if (insight.confidence >= this.ADAPTATION_THRESHOLDS.confidenceThreshold) {
        await this.applyUIAdaptations(userId, adaptations, insight)
      }
    } catch (error) {
      console.error('Error in analyzeAndAdaptUI:', error)
    }
  }

  /**
   * Analyze click patterns from behaviors
   */
  private analyzeClickPatterns(behaviors: any[]): Record<string, number> {
    const clicks = behaviors.filter(b => b.action === 'click')
    const patterns: Record<string, number> = {}

    clicks.forEach(click => {
      const key = `${click.section}_${click.element}`
      patterns[key] = (patterns[key] || 0) + 1
    })

    return patterns
  }

  /**
   * Analyze view patterns from behaviors
   */
  private analyzeViewPatterns(behaviors: any[]): Record<string, number> {
    const views = behaviors.filter(b => b.action === 'view')
    const patterns: Record<string, number> = {}

    views.forEach(view => {
      const key = view.section || 'unknown'
      patterns[key] = (patterns[key] || 0) + 1
    })

    return patterns
  }

  /**
   * Analyze time spent on different sections
   */
  private analyzeTimeSpent(behaviors: any[]): Record<string, number> {
    const timeSpent: Record<string, number> = {}

    behaviors.forEach(behavior => {
      if (behavior.duration && behavior.section) {
        timeSpent[behavior.section] = (timeSpent[behavior.section] || 0) + behavior.duration
      }
    })

    return timeSpent
  }

  /**
   * Analyze device usage patterns
   */
  private analyzeDeviceUsage(behaviors: any[]): { mobile: number; desktop: number; tablet: number } {
    const usage = { mobile: 0, desktop: 0, tablet: 0 }

    behaviors.forEach(behavior => {
      const device = behavior.metadata?.device || 'desktop'
      if (device in usage) {
        usage[device as keyof typeof usage]++
      }
    })

    return usage
  }

  /**
   * Analyze feature usage patterns
   */
  private analyzeFeatureUsage(behaviors: any[]): Record<string, number> {
    const usage: Record<string, number> = {}

    behaviors.forEach(behavior => {
      const feature = behavior.metadata?.feature || behavior.element
      if (feature) {
        usage[feature] = (usage[feature] || 0) + 1
      }
    })

    return usage
  }

  /**
   * Calculate user activity level
   */
  private calculateActivityLevel(behaviors: any[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
    const recentBehaviors = behaviors.filter(b => 
      new Date().getTime() - new Date(b.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    )

    const behaviorCount = recentBehaviors.length

    if (behaviorCount < 10) return 'LOW'
    if (behaviorCount < 25) return 'MEDIUM'
    if (behaviorCount < 50) return 'HIGH'
    return 'VERY_HIGH'
  }

  /**
   * Analyze user success patterns
   */
  private async analyzeSuccessPatterns(userId: string, behaviors: any[]): Promise<any> {
    try {
      const userProgress = await db.userProgress.findMany({
        where: { userId }
      })

      const completedTasks = userProgress.filter(p => p.status === 'COMPLETED').length
      const totalTasks = userProgress.length
      const successfulAirdrops = userProgress.filter(p => 
        p.status === 'COMPLETED' && p.airdropId
      ).length

      return {
        completedTasks,
        successfulAirdrops,
        averageTimeToComplete: this.calculateAverageCompletionTime(userProgress),
        successRate: totalTasks > 0 ? completedTasks / totalTasks : 0
      }
    } catch (error) {
      return {
        completedTasks: 0,
        successfulAirdrops: 0,
        averageTimeToComplete: 0,
        successRate: 0
      }
    }
  }

  /**
   * Determine optimal layout density
   */
  private determineLayoutDensity(pattern: UserBehaviorPattern): 'COMPACT' | 'COMFORTABLE' | 'SPACIOUS' {
    const { deviceUsage, activityLevel, featureUsage } = pattern

    // Mobile users prefer more compact layouts
    if (deviceUsage.mobile > deviceUsage.desktop) {
      return 'COMPACT'
    }

    // High activity users prefer efficient layouts
    if (activityLevel === 'HIGH' || activityLevel === 'VERY_HIGH') {
      return 'COMPACT'
    }

    // Power users with many features prefer comfortable layouts
    const featureCount = Object.keys(featureUsage).length
    if (featureCount > 10) {
      return 'COMFORTABLE'
    }

    return 'SPACIOUS'
  }

  /**
   * Determine optimal color scheme
   */
  private determineColorScheme(pattern: UserBehaviorPattern): 'DEFAULT' | 'HIGH_CONTRAST' | 'DARK' | 'LIGHT' {
    const hour = new Date().getHours()
    
    // Dark mode for evening/night usage
    if (hour >= 20 || hour <= 6) {
      return 'DARK'
    }

    // High contrast for accessibility needs
    if (pattern.featureUsage['accessibility'] > 0) {
      return 'HIGH_CONTRAST'
    }

    // Light mode for daytime usage
    if (hour >= 7 && hour <= 18) {
      return 'LIGHT'
    }

    return 'DEFAULT'
  }

  /**
   * Prioritize features based on usage
   */
  private prioritizeFeatures(pattern: UserBehaviorPattern): string[] {
    const { featureUsage, timeSpentOnSections } = pattern

    // Combine feature usage and time spent to determine priority
    const featureScores: Record<string, number> = {}

    // Add feature usage scores
    Object.entries(featureUsage).forEach(([feature, count]) => {
      featureScores[feature] = (featureScores[feature] || 0) + count * 2
    })

    // Add time spent scores
    Object.entries(timeSpentOnSections).forEach(([section, time]) => {
      featureScores[section] = (featureScores[section] || 0) + time / 60000 // Convert to minutes
    })

    // Sort by score and return top features
    return Object.entries(featureScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([feature]) => feature)
  }

  /**
   * Determine notification level
   */
  private determineNotificationLevel(pattern: UserBehaviorPattern): 'MINIMAL' | 'NORMAL' | 'VERBOSE' {
    const { activityLevel, successPatterns } = pattern

    // High success rate users prefer fewer notifications
    if (successPatterns.successRate > 0.8) {
      return 'MINIMAL'
    }

    // Low activity users need more guidance
    if (activityLevel === 'LOW') {
      return 'VERBOSE'
    }

    return 'NORMAL'
  }

  /**
   * Determine automation level
   */
  private determineAutomationLevel(pattern: UserBehaviorPattern): 'MANUAL' | 'ASSISTED' | 'AUTOMATED' {
    const { successPatterns, activityLevel, riskToleranceScore } = pattern

    // High success rate and activity users can handle automation
    if (successPatterns.successRate > 0.7 && activityLevel === 'VERY_HIGH') {
      return 'AUTOMATED'
    }

    // Moderate success users get assistance
    if (successPatterns.successRate > 0.5 && activityLevel !== 'LOW') {
      return 'ASSISTED'
    }

    // New or struggling users get manual control
    return 'MANUAL'
  }

  /**
   * Determine content focus
   */
  private determineContentFocus(pattern: UserBehaviorPattern): 'SECURITY' | 'EFFICIENCY' | 'DISCOVERY' | 'ANALYTICS' {
    const { featureUsage, riskToleranceScore } = pattern

    // Low risk tolerance users focus on security
    if (riskToleranceScore < 0.3) {
      return 'SECURITY'
    }

    // High activity users focus on efficiency
    if (pattern.activityLevel === 'VERY_HIGH') {
      return 'EFFICIENCY'
    }

    // Users who explore many features focus on discovery
    if (Object.keys(featureUsage).length > 15) {
      return 'DISCOVERY'
    }

    // Analytical users focus on analytics
    if (featureUsage['analytics'] > 0 || featureUsage['insights'] > 0) {
      return 'ANALYTICS'
    }

    return 'DISCOVERY'
  }

  /**
   * Configure widgets based on usage
   */
  private configureWidgets(pattern: UserBehaviorPattern): Record<string, boolean> {
    const { featureUsage, timeSpentOnSections } = pattern
    const widgets: Record<string, boolean> = {}

    // Enable widgets for frequently used features
    const frequentFeatures = Object.entries(featureUsage)
      .filter(([, count]) => count > 3)
      .map(([feature]) => feature)

    // Default widget configuration
    const defaultWidgets = {
      trendingAirdrops: true,
      quickActions: true,
      progressOverview: true,
      securityAlerts: true,
      recommendations: true,
      analytics: false,
      socialFeed: false,
      newsFeed: false
    }

    // Enable widgets based on usage
    Object.keys(defaultWidgets).forEach(widget => {
      widgets[widget] = defaultWidgets[widget as keyof typeof defaultWidgets]
    })

    // Enable analytics widget for analytical users
    if (frequentFeatures.includes('analytics') || timeSpentOnSections['analytics'] > 300000) {
      widgets.analytics = true
    }

    // Enable social feed for social users
    if (frequentFeatures.includes('social') || frequentFeatures.includes('sharing')) {
      widgets.socialFeed = true
    }

    return widgets
  }

  /**
   * Generate keyboard shortcuts
   */
  private generateShortcuts(pattern: UserBehaviorPattern): Record<string, string> {
    const { featureUsage } = pattern
    const shortcuts: Record<string, string> = {}

    // Default shortcuts
    const defaultShortcuts = {
      search: 'Ctrl+K',
      wallet: 'Ctrl+W',
      settings: 'Ctrl+,',
      notifications: 'Ctrl+N',
      refresh: 'Ctrl+R'
    }

    // Customize based on frequently used features
    const topFeatures = Object.entries(featureUsage)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([feature]) => feature)

    // Assign shortcuts to top features
    const availableKeys = ['Ctrl+1', 'Ctrl+2', 'Ctrl+3', 'Ctrl+4', 'Ctrl+5']
    topFeatures.forEach((feature, index) => {
      if (index < availableKeys.length) {
        shortcuts[feature] = availableKeys[index]
      }
    })

    return { ...defaultShortcuts, ...shortcuts }
  }

  /**
   * Helper methods for pattern analysis
   */
  private getDefaultBehaviorPattern(userId: string): UserBehaviorPattern {
    return {
      userId,
      lastActive: new Date(),
      sessionDuration: 0,
      clickPatterns: {},
      viewPatterns: {},
      timeSpentOnSections: {},
      preferredAirdropTypes: [],
      riskToleranceScore: 0.5,
      activityLevel: 'LOW',
      successPatterns: {
        completedTasks: 0,
        successfulAirdrops: 0,
        averageTimeToComplete: 0
      },
      deviceUsage: { mobile: 0, desktop: 1, tablet: 0 },
      featureUsage: {}
    }
  }

  private calculateAverageSessionDuration(behaviors: any[]): number {
    // Group behaviors by session (simplified - assumes 30min gap = new session)
    const sessions: any[][] = []
    let currentSession: any[] = []

    behaviors.forEach(behavior => {
      if (currentSession.length === 0) {
        currentSession.push(behavior)
      } else {
        const timeDiff = new Date(behavior.timestamp).getTime() - 
                         new Date(currentSession[currentSession.length - 1].timestamp).getTime()
        if (timeDiff > 30 * 60 * 1000) { // 30 minutes
          sessions.push(currentSession)
          currentSession = [behavior]
        } else {
          currentSession.push(behavior)
        }
      }
    })

    if (currentSession.length > 0) {
      sessions.push(currentSession)
    }

    if (sessions.length === 0) return 0

    const totalDuration = sessions.reduce((sum, session) => {
      if (session.length < 2) return sum
      const start = new Date(session[0].timestamp).getTime()
      const end = new Date(session[session.length - 1].timestamp).getTime()
      return sum + (end - start)
    }, 0)

    return totalDuration / sessions.length
  }

  private extractPreferredAirdropTypes(behaviors: any[]): string[] {
    const types: Record<string, number> = {}

    behaviors.forEach(behavior => {
      const airdropType = behavior.metadata?.airdropType
      if (airdropType) {
        types[airdropType] = (types[airdropType] || 0) + 1
      }
    })

    return Object.entries(types)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)
  }

  private calculateRiskToleranceScore(userRiskTolerance: string | null, behaviors: any[]): number {
    // Base score from user profile
    let score = 0.5
    if (userRiskTolerance) {
      switch (userRiskTolerance) {
        case 'CONSERVATIVE': score = 0.2; break
        case 'MODERATE': score = 0.4; break
        case 'AGGRESSIVE': score = 0.7; break
        case 'VERY_AGGRESSIVE': score = 0.9; break
      }
    }

    // Adjust based on behavior
    const highRiskInteractions = behaviors.filter(b => 
      b.metadata?.riskLevel === 'HIGH' || b.metadata?.riskLevel === 'EXTREME'
    ).length

    const behaviorAdjustment = Math.min(highRiskInteractions * 0.02, 0.3)
    return Math.min(score + behaviorAdjustment, 1.0)
  }

  private calculateAverageCompletionTime(userProgress: any[]): number {
    const completedProgress = userProgress.filter(p => 
      p.status === 'COMPLETED' && p.startedAt && p.completedAt
    )

    if (completedProgress.length === 0) return 0

    const totalTime = completedProgress.reduce((sum, progress) => {
      const start = new Date(progress.startedAt).getTime()
      const end = new Date(progress.completedAt).getTime()
      return sum + (end - start)
    }, 0)

    return totalTime / completedProgress.length
  }

  private generateAdaptationReason(pattern: UserBehaviorPattern, adaptations: UIAdaptationConfig): string {
    const reasons: string[] = []

    if (adaptations.layoutDensity === 'COMPACT') {
      reasons.push('High activity level detected - optimizing for efficiency')
    }

    if (adaptations.automationLevel === 'AUTOMATED') {
      reasons.push('High success rate - enabling advanced automation')
    }

    if (adaptations.contentFocus === 'SECURITY') {
      reasons.push('Risk-averse behavior detected - prioritizing security features')
    }

    if (adaptations.notificationLevel === 'MINIMAL') {
      reasons.push('Experienced user - reducing notification noise')
    }

    return reasons.join('. ') || 'UI adapted based on usage patterns'
  }

  private calculateAdaptationConfidence(pattern: UserBehaviorPattern): number {
    let confidence = 0.5 // Base confidence

    // More data = higher confidence
    const totalBehaviors = Object.values(pattern.clickPatterns).reduce((sum, count) => sum + count, 0)
    confidence += Math.min(totalBehaviors / 100, 0.3)

    // Consistent patterns = higher confidence
    const featureVariance = Object.values(pattern.featureUsage).length
    confidence += Math.min(featureVariance / 20, 0.2)

    return Math.min(confidence, 1.0)
  }
}

// Export singleton instance
export const adaptiveUIService = new AdaptiveUIService()