import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface ActivityData {
  date: Date;
  activeMinutes: number;
  sessionsCount: number;
  tasksCompleted: number;
  airdropsViewed: number;
  airdropsStarted: number;
  airdropsCompleted: number;
  walletConnections: number;
  peakHour: number;
  devices: string[];
  pages: string[];
}

export interface ActivityPattern {
  dailyActiveTime: number; // minutes per day
  weeklyActiveDays: number; // days per week
  preferredTimeSlots: {
    morning: number; // 6-12
    afternoon: number; // 12-18
    evening: number; // 18-24
    night: number; // 0-6
  };
  sessionDuration: number; // average session in minutes
  tasksPerSession: number; // average tasks completed per session
  peakActivityHours: number[]; // hours when user is most active
  consistencyScore: number; // 0-100 how consistent user activity is
  burstActivity: boolean; // whether user has burst patterns
  weekendActivity: number; // weekend vs weekday activity ratio
  seasonalPatterns: {
    month: number;
    activityLevel: number;
  }[];
  productivityMetrics: {
    tasksPerHour: number;
    completionRate: number;
    efficiencyScore: number;
  };
  behaviorInsights: {
    pattern: string;
    confidence: number;
    recommendation: string;
  }[];
}

export class ActivityPatternAnalyzer {
  private zai: ZAI;

  constructor() {
    this.zai = new ZAI();
  }

  /**
   * Analyze user's activity patterns from their behavior history
   */
  async analyzeActivityPatterns(userId: string): Promise<ActivityPattern> {
    // Get user's behavior data for the last 90 days
    const behaviorData = await this.getUserBehaviorData(userId, 90);
    
    if (behaviorData.length === 0) {
      return this.getDefaultActivityPattern();
    }

    // Analyze different aspects of activity
    const dailyStats = this.analyzeDailyActivity(behaviorData);
    const weeklyStats = this.analyzeWeeklyActivity(behaviorData);
    const timePreferences = this.analyzeTimePreferences(behaviorData);
    const sessionStats = this.analyzeSessionPatterns(behaviorData);
    const consistencyMetrics = this.calculateConsistencyMetrics(behaviorData);
    const productivityMetrics = this.calculateProductivityMetrics(behaviorData);

    // Generate AI-powered insights
    const behaviorInsights = await this.generateBehaviorInsights(
      userId,
      dailyStats,
      weeklyStats,
      timePreferences,
      sessionStats
    );

    const pattern: ActivityPattern = {
      dailyActiveTime: dailyStats.averageDailyMinutes,
      weeklyActiveDays: weeklyStats.activeDaysPerWeek,
      preferredTimeSlots: timePreferences.timeSlots,
      sessionDuration: sessionStats.averageDuration,
      tasksPerSession: sessionStats.averageTasksPerSession,
      peakActivityHours: timePreferences.peakHours,
      consistencyScore: consistencyMetrics.score,
      burstActivity: consistencyMetrics.hasBurstPatterns,
      weekendActivity: weeklyStats.weekendRatio,
      seasonalPatterns: this.analyzeSeasonalPatterns(behaviorData),
      productivityMetrics,
      behaviorInsights
    };

    // Save to database
    await this.saveActivityPattern(userId, pattern);

    return pattern;
  }

  /**
   * Get user behavior data for analysis
   */
  private async getUserBehaviorData(
    userId: string,
    days: number
  ): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await db.userBehaviorEvent.findMany({
      where: {
        userId,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    return events;
  }

  /**
   * Analyze daily activity patterns
   */
  private analyzeDailyActivity(events: any[]): {
    averageDailyMinutes: number;
    totalActiveDays: number;
    dailyDistribution: { [key: string]: number };
  } {
    const dailyData: { [key: string]: number } = {};
    
    // Group events by date
    events.forEach(event => {
      const dateKey = event.timestamp.toISOString().split('T')[0];
      const duration = event.duration || 5; // Default 5 minutes if not specified
      
      dailyData[dateKey] = (dailyData[dateKey] || 0) + duration;
    });

    const totalActiveDays = Object.keys(dailyData).length;
    const totalMinutes = Object.values(dailyData).reduce((sum, minutes) => sum + minutes, 0);
    const averageDailyMinutes = totalActiveDays > 0 ? Math.round(totalMinutes / totalActiveDays) : 0;

    return {
      averageDailyMinutes,
      totalActiveDays,
      dailyDistribution: dailyData
    };
  }

  /**
   * Analyze weekly activity patterns
   */
  private analyzeWeeklyActivity(events: any[]): {
    activeDaysPerWeek: number;
    weekendRatio: number;
    weeklyDistribution: { [key: string]: number };
  } {
    const weeklyData: { [key: string]: Set<string> } = {};
    
    // Group by week and track active days
    events.forEach(event => {
      const date = event.timestamp;
      const weekKey = this.getWeekKey(date);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = new Set();
      }
      weeklyData[weekKey].add(dayKey);
    });

    const weeklyActiveDays = Object.values(weeklyData).map(days => days.size);
    const activeDaysPerWeek = weeklyActiveDays.length > 0 
      ? Math.round(weeklyActiveDays.reduce((sum, days) => sum + days, 0) / weeklyActiveDays.length)
      : 0;

    // Calculate weekend vs weekday ratio
    const weekendEvents = events.filter(e => {
      const day = e.timestamp.getDay();
      return day === 0 || day === 6; // Sunday or Saturday
    });
    const weekdayEvents = events.filter(e => {
      const day = e.timestamp.getDay();
      return day >= 1 && day <= 5; // Monday to Friday
    });

    const weekendRatio = weekdayEvents.length > 0 
      ? Math.round((weekendEvents.length / weekdayEvents.length) * 100) / 100
      : 0;

    return {
      activeDaysPerWeek,
      weekendRatio,
      weeklyDistribution: Object.fromEntries(
        Object.entries(weeklyData).map(([week, days]) => [week, days.size])
      )
    };
  }

  /**
   * Analyze time preferences
   */
  private analyzeTimePreferences(events: any[]): {
    timeSlots: {
      morning: number;
      afternoon: number;
      evening: number;
      night: number;
    };
    peakHours: number[];
    hourlyDistribution: { [key: number]: number };
  } {
    const hourlyActivity: { [key: number]: number } = {};
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyActivity[i] = 0;
    }

    // Count events by hour
    events.forEach(event => {
      const hour = event.timestamp.getHours();
      hourlyActivity[hour] += event.duration || 5;
    });

    // Calculate time slot preferences
    const timeSlots = {
      morning: this.sumHourlyRange(hourlyActivity, 6, 12),
      afternoon: this.sumHourlyRange(hourlyActivity, 12, 18),
      evening: this.sumHourlyRange(hourlyActivity, 18, 24),
      night: this.sumHourlyRange(hourlyActivity, 0, 6)
    };

    // Find peak hours (top 3 most active hours)
    const sortedHours = Object.entries(hourlyActivity)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    return {
      timeSlots,
      peakHours: sortedHours,
      hourlyDistribution: hourlyActivity
    };
  }

  /**
   * Analyze session patterns
   */
  private analyzeSessionPatterns(events: any[]): {
    averageDuration: number;
    averageTasksPerSession: number;
    sessionCount: number;
    totalTasks: number;
  } {
    // Group events into sessions (sessions are groups of events within 30 minutes of each other)
    const sessions = this.groupEventsIntoSessions(events);
    
    const sessionDurations = sessions.map(session => {
      if (session.length === 0) return 0;
      const start = session[0].timestamp;
      const end = session[session.length - 1].timestamp;
      return (end.getTime() - start.getTime()) / (1000 * 60); // Convert to minutes
    });

    const tasksPerSession = sessions.map(session => 
      session.filter(e => e.eventType === 'task_complete').length
    );

    const averageDuration = sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((sum, duration) => sum + duration, 0) / sessionDurations.length)
      : 0;

    const averageTasksPerSession = tasksPerSession.length > 0
      ? Math.round((tasksPerSession.reduce((sum, tasks) => sum + tasks, 0) / tasksPerSession.length) * 10) / 10
      : 0;

    return {
      averageDuration,
      averageTasksPerSession,
      sessionCount: sessions.length,
      totalTasks: tasksPerSession.reduce((sum, tasks) => sum + tasks, 0)
    };
  }

  /**
   * Calculate consistency metrics
   */
  private calculateConsistencyMetrics(events: any[]): {
    score: number;
    hasBurstPatterns: boolean;
    variance: number;
    regularityIndex: number;
  } {
    const dailyData = this.analyzeDailyActivity(events).dailyDistribution;
    const dailyMinutes = Object.values(dailyData);
    
    if (dailyMinutes.length === 0) {
      return { score: 0, hasBurstPatterns: false, variance: 0, regularityIndex: 0 };
    }

    // Calculate variance
    const mean = dailyMinutes.reduce((sum, minutes) => sum + minutes, 0) / dailyMinutes.length;
    const variance = dailyMinutes.reduce((sum, minutes) => sum + Math.pow(minutes - mean, 2), 0) / dailyMinutes.length;
    
    // Calculate regularity index (how predictable the pattern is)
    const regularityIndex = Math.max(0, 100 - (Math.sqrt(variance) / mean) * 100);
    
    // Detect burst patterns (high variance with some very high activity days)
    const maxActivity = Math.max(...dailyMinutes);
    const hasBurstPatterns = maxActivity > mean * 3 && variance > mean * mean;
    
    // Consistency score combines regularity with activity frequency
    const consistencyScore = Math.min(100, (regularityIndex + (dailyMinutes.length / 90) * 100) / 2);

    return {
      score: Math.round(consistencyScore),
      hasBurstPatterns,
      variance: Math.round(variance),
      regularityIndex: Math.round(regularityIndex)
    };
  }

  /**
   * Calculate productivity metrics
   */
  private calculateProductivityMetrics(events: any[]): {
    tasksPerHour: number;
    completionRate: number;
    efficiencyScore: number;
  } {
    const totalMinutes = events.reduce((sum, e) => sum + (e.duration || 5), 0);
    const totalHours = totalMinutes / 60;
    
    const tasksCompleted = events.filter(e => e.eventType === 'task_complete').length;
    const tasksStarted = events.filter(e => e.eventType === 'task_start').length;
    const airdropsCompleted = events.filter(e => 
      e.eventType === 'airdrop_interact' && 
      e.eventData?.status === 'completed'
    ).length;
    const airdropsStarted = events.filter(e => 
      e.eventType === 'airdrop_interact' && 
      ['started', 'in_progress'].includes(e.eventData?.status)
    ).length;

    const tasksPerHour = totalHours > 0 ? Math.round((tasksCompleted / totalHours) * 10) / 10 : 0;
    
    const taskCompletionRate = tasksStarted > 0 
      ? Math.round((tasksCompleted / tasksStarted) * 100) 
      : 0;
    
    const airdropCompletionRate = airdropsStarted > 0 
      ? Math.round((airdropsCompleted / airdropsStarted) * 100) 
      : 0;
    
    const overallCompletionRate = (taskCompletionRate + airdropCompletionRate) / 2;
    
    // Efficiency score combines completion rate with task speed
    const efficiencyScore = Math.min(100, (overallCompletionRate + Math.min(100, tasksPerHour * 20)) / 2);

    return {
      tasksPerHour,
      completionRate: Math.round(overallCompletionRate),
      efficiencyScore: Math.round(efficiencyScore)
    };
  }

  /**
   * Analyze seasonal patterns
   */
  private analyzeSeasonalPatterns(events: any[]): {
    month: number;
    activityLevel: number;
  }[] {
    const monthlyData: { [key: number]: number } = {};
    
    // Initialize all months
    for (let i = 0; i < 12; i++) {
      monthlyData[i] = 0;
    }

    // Count events by month
    events.forEach(event => {
      const month = event.timestamp.getMonth();
      monthlyData[month] += event.duration || 5;
    });

    return Object.entries(monthlyData).map(([month, activityLevel]) => ({
      month: parseInt(month),
      activityLevel
    }));
  }

  /**
   * Generate AI-powered behavior insights
   */
  private async generateBehaviorInsights(
    userId: string,
    dailyStats: any,
    weeklyStats: any,
    timePreferences: any,
    sessionStats: any
  ): Promise<any[]> {
    try {
      const prompt = `
        Analyze this user's activity pattern and provide 3 concise insights:
        
        Daily Activity: ${dailyStats.averageDailyMinutes} minutes/day, ${dailyStats.totalActiveDays} active days
        Weekly Activity: ${weeklyStats.activeDaysPerWeek} days/week, weekend ratio: ${weeklyStats.weekendRatio}
        Peak Hours: ${timePreferences.peakHours.join(', ')}
        Sessions: ${sessionStats.sessionCount} sessions, avg ${sessionStats.averageDuration} minutes each
        Tasks per session: ${sessionStats.averageTasksPerSession}
        
        Focus on productivity, consistency, and optimization opportunities.
        Keep each insight under 100 characters.
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an activity pattern analyst providing concise, actionable insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content || '';
      const insights = content.split('\n').filter(line => line.trim().length > 0);

      return insights.slice(0, 3).map((insight, index) => ({
        pattern: `insight_${index + 1}`,
        confidence: 0.8,
        recommendation: insight.trim()
      }));
    } catch (error) {
      console.error('Error generating behavior insights:', error);
      return this.getDefaultBehaviorInsights(dailyStats, sessionStats);
    }
  }

  /**
   * Get default behavior insights
   */
  private getDefaultBehaviorInsights(dailyStats: any, sessionStats: any): any[] {
    const insights = [];

    if (dailyStats.averageDailyMinutes < 10) {
      insights.push({
        pattern: 'low_activity',
        confidence: 0.9,
        recommendation: 'Try to spend at least 15 minutes daily for better results.'
      });
    }

    if (sessionStats.averageTasksPerSession < 1) {
      insights.push({
        pattern: 'low_task_completion',
        confidence: 0.8,
        recommendation: 'Focus on completing at least one task per session.'
      });
    }

    if (sessionStats.averageDuration > 60) {
      insights.push({
        pattern: 'long_sessions',
        confidence: 0.7,
        recommendation: 'Consider breaking long sessions into shorter, focused ones.'
      });
    }

    return insights.slice(0, 3);
  }

  /**
   * Save activity pattern to database
   */
  private async saveActivityPattern(userId: string, pattern: ActivityPattern): Promise<void> {
    const existingPattern = await db.activityPattern.findUnique({
      where: { userId }
    });

    // Save evolution if pattern exists
    if (existingPattern) {
      await db.preferenceEvolution.create({
        data: {
          userId,
          category: 'activity',
          oldValue: {
            dailyActiveTime: existingPattern.dailyActiveTime,
            weeklyActiveDays: existingPattern.weeklyActiveDays,
            sessionDuration: existingPattern.sessionDuration,
            consistencyScore: existingPattern.consistencyScore
          },
          newValue: {
            dailyActiveTime: pattern.dailyActiveTime,
            weeklyActiveDays: pattern.weeklyActiveDays,
            sessionDuration: pattern.sessionDuration,
            consistencyScore: pattern.consistencyScore
          },
          changeReason: 'pattern_update',
          changeTrigger: 'activity_analysis'
        }
      });
    }

    // Update or create activity pattern
    await db.activityPattern.upsert({
      where: { userId },
      update: {
        dailyActiveTime: pattern.dailyActiveTime,
        weeklyActiveDays: pattern.weeklyActiveDays,
        preferredTimeSlots: pattern.preferredTimeSlots,
        sessionDuration: pattern.sessionDuration,
        tasksPerSession: pattern.tasksPerSession,
        peakActivityHours: pattern.peakActivityHours,
        consistencyScore: pattern.consistencyScore,
        burstActivity: pattern.burstActivity,
        weekendActivity: pattern.weekendActivity,
        seasonalPatterns: pattern.seasonalPatterns,
        lastAnalyzedAt: new Date()
      },
      create: {
        userId,
        dailyActiveTime: pattern.dailyActiveTime,
        weeklyActiveDays: pattern.weeklyActiveDays,
        preferredTimeSlots: pattern.preferredTimeSlots,
        sessionDuration: pattern.sessionDuration,
        tasksPerSession: pattern.tasksPerSession,
        peakActivityHours: pattern.peakActivityHours,
        consistencyScore: pattern.consistencyScore,
        burstActivity: pattern.burstActivity,
        weekendActivity: pattern.weekendActivity,
        seasonalPatterns: pattern.seasonalPatterns
      }
    });

    // Generate insights
    await this.generateActivityInsights(userId, pattern);
  }

  /**
   * Generate activity-based insights
   */
  private async generateActivityInsights(userId: string, pattern: ActivityPattern): Promise<void> {
    const insights = [];

    // Low consistency
    if (pattern.consistencyScore < 30) {
      insights.push({
        insightType: 'activity_insight',
        insightTitle: 'Inconsistent Activity Pattern',
        insightDescription: 'Your activity patterns are quite variable. Establishing a routine could improve your results.',
        confidenceScore: 0.8,
        impactLevel: 'medium',
        actionableRecommendation: 'Try to maintain a consistent daily schedule for better airdrop opportunities.'
      });
    }

    // Peak time optimization
    if (pattern.peakActivityHours.length > 0) {
      const peakHour = pattern.peakActivityHours[0];
      insights.push({
        insightType: 'activity_insight',
        insightTitle: 'Peak Activity Time Identified',
        insightDescription: `You're most active around ${peakHour}:00. Plan important tasks during this time.`,
        confidenceScore: 0.9,
        impactLevel: 'low',
        actionableRecommendation: `Schedule your airdrop tasks around ${peakHour}:00 for maximum efficiency.`
      });
    }

    // Session optimization
    if (pattern.sessionDuration > 45) {
      insights.push({
        insightType: 'activity_insight',
        insightTitle: 'Long Session Duration',
        insightDescription: 'Your sessions tend to be quite long. Consider taking breaks to maintain focus.',
        confidenceScore: 0.7,
        impactLevel: 'low',
        actionableRecommendation: 'Try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break.'
      });
    }

    // Save insights
    for (const insight of insights) {
      await db.preferenceInsight.create({
        data: {
          userId,
          ...insight,
          supportingData: {
            dailyActiveTime: pattern.dailyActiveTime,
            consistencyScore: pattern.consistencyScore,
            sessionDuration: pattern.sessionDuration,
            peakHours: pattern.peakActivityHours
          },
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });
    }
  }

  /**
   * Helper methods
   */
  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const weekDay = date.getDay();
    const weekStart = new Date(year, month, day - weekDay);
    return `${year}-${weekStart.getMonth() + 1}-W${Math.ceil(weekStart.getDate() / 7)}`;
  }

  private sumHourlyRange(hourlyData: { [key: number]: number }, start: number, end: number): number {
    let sum = 0;
    for (let i = start; i < end; i++) {
      sum += hourlyData[i] || 0;
    }
    return sum;
  }

  private groupEventsIntoSessions(events: any[]): any[][] {
    if (events.length === 0) return [];

    const sessions = [];
    let currentSession = [events[0]];

    for (let i = 1; i < events.length; i++) {
      const currentEvent = events[i];
      const lastEvent = currentSession[currentSession.length - 1];
      
      const timeDiff = currentEvent.timestamp.getTime() - lastEvent.timestamp.getTime();
      const thirtyMinutes = 30 * 60 * 1000;

      if (timeDiff <= thirtyMinutes) {
        currentSession.push(currentEvent);
      } else {
        sessions.push(currentSession);
        currentSession = [currentEvent];
      }
    }

    sessions.push(currentSession);
    return sessions;
  }

  private getDefaultActivityPattern(): ActivityPattern {
    return {
      dailyActiveTime: 0,
      weeklyActiveDays: 0,
      preferredTimeSlots: {
        morning: 0,
        afternoon: 0,
        evening: 0,
        night: 0
      },
      sessionDuration: 0,
      tasksPerSession: 0,
      peakActivityHours: [],
      consistencyScore: 0,
      burstActivity: false,
      weekendActivity: 0,
      seasonalPatterns: [],
      productivityMetrics: {
        tasksPerHour: 0,
        completionRate: 0,
        efficiencyScore: 0
      },
      behaviorInsights: []
    };
  }

  /**
   * Get user's activity pattern
   */
  async getActivityPattern(userId: string): Promise<ActivityPattern | null> {
    const pattern = await db.activityPattern.findUnique({
      where: { userId }
    });

    if (!pattern) return null;

    return {
      dailyActiveTime: pattern.dailyActiveTime,
      weeklyActiveDays: pattern.weeklyActiveDays,
      preferredTimeSlots: pattern.preferredTimeSlots as any,
      sessionDuration: pattern.sessionDuration,
      tasksPerSession: pattern.tasksPerSession,
      peakActivityHours: pattern.peakActivityHours as number[],
      consistencyScore: pattern.consistencyScore,
      burstActivity: pattern.burstActivity,
      weekendActivity: pattern.weekendActivity,
      seasonalPatterns: pattern.seasonalPatterns as any[],
      productivityMetrics: {
        tasksPerHour: 0, // Would need to be calculated or stored separately
        completionRate: 0,
        efficiencyScore: 0
      },
      behaviorInsights: [] // Would need to be fetched from insights table
    };
  }
}