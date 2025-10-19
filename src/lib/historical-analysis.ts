import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface PerformanceMetrics {
  totalParticipants: number;
  successRate: number;
  averageReward: number;
  totalDistributed: number;
  claimRate: number;
  averageClaimTime: number;
  volatility: number;
  holderRetention: number;
  marketImpact: number;
  sentimentScore: number;
  socialMentions: number;
  mediaCoverage: number;
}

export interface HistoricalAnalysis {
  airdropId: string;
  timeframe: '7d' | '30d' | '90d' | '1y' | 'all';
  metrics: PerformanceMetrics;
  trends: {
    participants: TrendData[];
    rewards: TrendData[];
    sentiment: TrendData[];
    price: TrendData[];
  };
  comparisons: {
    vsCategory: ComparisonData;
    vsSimilarProjects: ComparisonData;
    vsMarketAverage: ComparisonData;
  };
  insights: string[];
  predictions: {
    next30Days: PredictionData;
    next90Days: PredictionData;
  };
  metadata: any;
}

export interface TrendData {
  date: string;
  value: number;
  change: number;
  changePercent: number;
}

export interface ComparisonData {
  value: number;
  percentile: number;
  rank: number;
  total: number;
  outperformance: number;
}

export interface PredictionData {
  participants: number;
  rewardValue: number;
  successProbability: number;
  confidence: number;
  factors: string[];
}

export class HistoricalAnalysisService {
  private zai: ZAI;

  constructor() {
    this.zai = new ZAI();
  }

  async analyzeAirdropPerformance(airdropId: string, timeframe: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'): Promise<HistoricalAnalysis> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true,
          participations: true,
          metrics: true,
          historicalData: true,
          performance: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      // Calculate performance metrics
      const metrics = await this.calculatePerformanceMetrics(airdrop, timeframe);
      
      // Analyze trends
      const trends = await this.analyzeTrends(airdrop, timeframe);
      
      // Generate comparisons
      const comparisons = await this.generateComparisons(airdrop, metrics);
      
      // Generate insights using AI
      const insights = await this.generateInsights(airdrop, metrics, trends);
      
      // Generate predictions
      const predictions = await this.generatePredictions(airdrop, metrics, trends);

      const analysis: HistoricalAnalysis = {
        airdropId,
        timeframe,
        metrics,
        trends,
        comparisons,
        insights,
        predictions,
        metadata: {
          analyzedAt: new Date().toISOString(),
          dataPoints: this.countDataPoints(airdrop, timeframe),
          analysisVersion: '2.0'
        }
      };

      // Store analysis results
      await this.storeAnalysisResults(airdropId, analysis);

      logger.info(`Historical analysis completed for airdrop ${airdropId} (${timeframe})`);
      return analysis;
    } catch (error) {
      logger.error(`Failed to analyze airdrop performance ${airdropId}:`, error);
      throw error;
    }
  }

  private async calculatePerformanceMetrics(airdrop: any, timeframe: string): Promise<PerformanceMetrics> {
    try {
      const participations = airdrop.participations || [];
      const metrics = airdrop.metrics || [];
      const performance = airdrop.performance;

      // Filter data by timeframe
      const cutoffDate = this.getCutoffDate(timeframe);
      const recentParticipations = participations.filter(p => new Date(p.createdAt) >= cutoffDate);
      const recentMetrics = metrics.filter(m => new Date(m.date) >= cutoffDate);

      // Calculate basic metrics
      const totalParticipants = recentParticipations.length;
      const successfulParticipations = recentParticipations.filter(p => 
        p.status === 'completed' || p.status === 'rewarded'
      ).length;
      const successRate = totalParticipants > 0 ? (successfulParticipations / totalParticipants) * 100 : 0;

      // Calculate reward metrics
      const rewards = recentParticipations
        .filter(p => p.rewardAmount)
        .map(p => parseFloat(p.rewardAmount.toString()));
      const totalDistributed = rewards.reduce((sum, reward) => sum + reward, 0);
      const averageReward = rewards.length > 0 ? totalDistributed / rewards.length : 0;

      // Calculate claim metrics
      const claimedParticipations = recentParticipations.filter(p => p.rewardClaimed).length;
      const claimRate = totalParticipants > 0 ? (claimedParticipations / totalParticipants) * 100 : 0;

      // Calculate average claim time (simulated)
      const claimTimes = recentParticipations
        .filter(p => p.completedAt && p.rewardClaimedAt)
        .map(p => {
          const completed = new Date(p.completedAt!);
          const claimed = new Date(p.rewardClaimedAt!);
          return (claimed.getTime() - completed.getTime()) / (1000 * 60 * 60); // hours
        });
      const averageClaimTime = claimTimes.length > 0 
        ? claimTimes.reduce((sum, time) => sum + time, 0) / claimTimes.length 
        : 0;

      // Calculate market metrics (simulated)
      const volatility = this.calculateVolatility(recentMetrics);
      const holderRetention = this.calculateHolderRetention(airdrop);
      const marketImpact = this.calculateMarketImpact(airdrop, recentMetrics);
      const sentimentScore = this.calculateSentimentScore(airdrop);
      const socialMentions = this.calculateSocialMentions(airdrop);
      const mediaCoverage = this.calculateMediaCoverage(airdrop);

      return {
        totalParticipants,
        successRate,
        averageReward,
        totalDistributed,
        claimRate,
        averageClaimTime,
        volatility,
        holderRetention,
        marketImpact,
        sentimentScore,
        socialMentions,
        mediaCoverage
      };
    } catch (error) {
      logger.error('Failed to calculate performance metrics:', error);
      return this.getDefaultMetrics();
    }
  }

  private async analyzeTrends(airdrop: any, timeframe: string): Promise<HistoricalAnalysis['trends']> {
    try {
      const cutoffDate = this.getCutoffDate(timeframe);
      const metrics = airdrop.metrics || [];

      // Generate trend data points
      const participantsTrend = this.generateTrendData(
        metrics, 
        'totalParticipants', 
        cutoffDate
      );
      
      const rewardsTrend = this.generateTrendData(
        metrics, 
        'totalRewardsDistributed', 
        cutoffDate
      );

      const sentimentTrend = await this.generateSentimentTrend(airdrop, cutoffDate);
      
      const priceTrend = await this.generatePriceTrend(airdrop, cutoffDate);

      return {
        participants: participantsTrend,
        rewards: rewardsTrend,
        sentiment: sentimentTrend,
        price: priceTrend
      };
    } catch (error) {
      logger.error('Failed to analyze trends:', error);
      return this.getDefaultTrends();
    }
  }

  private async generateComparisons(airdrop: any, metrics: PerformanceMetrics): Promise<HistoricalAnalysis['comparisons']> {
    try {
      // Compare with category average
      const categoryComparison = await this.compareWithCategory(airdrop, metrics);
      
      // Compare with similar projects
      const similarProjectsComparison = await this.compareWithSimilarProjects(airdrop, metrics);
      
      // Compare with market average
      const marketComparison = await this.compareWithMarketAverage(metrics);

      return {
        vsCategory: categoryComparison,
        vsSimilarProjects: similarProjectsComparison,
        vsMarketAverage: marketComparison
      };
    } catch (error) {
      logger.error('Failed to generate comparisons:', error);
      return this.getDefaultComparisons();
    }
  }

  private async generateInsights(airdrop: any, metrics: PerformanceMetrics, trends: HistoricalAnalysis['trends']): Promise<string[]> {
    try {
      const prompt = `
        Analyze this airdrop performance data and generate actionable insights:

        Airdrop: ${airdrop.title}
        Project: ${airdrop.project.name}
        Category: ${airdrop.project.category}

        Performance Metrics:
        - Total Participants: ${metrics.totalParticipants}
        - Success Rate: ${metrics.successRate.toFixed(1)}%
        - Average Reward: $${metrics.averageReward.toFixed(2)}
        - Claim Rate: ${metrics.claimRate.toFixed(1)}%
        - Average Claim Time: ${metrics.averageClaimTime.toFixed(1)} hours
        - Volatility: ${metrics.volatility.toFixed(1)}%
        - Holder Retention: ${metrics.holderRetention.toFixed(1)}%
        - Market Impact: ${metrics.marketImpact.toFixed(1)}%
        - Sentiment Score: ${metrics.sentimentScore.toFixed(1)}/100
        - Social Mentions: ${metrics.socialMentions}
        - Media Coverage: ${metrics.mediaCoverage}

        Recent Trends:
        - Participants: ${this.describeTrend(trends.participants)}
        - Rewards: ${this.describeTrend(trends.rewards)}
        - Sentiment: ${this.describeTrend(trends.sentiment)}

        Provide 5-7 specific, actionable insights in JSON format:
        {
          "insights": [
            "Insight 1: Specific observation with recommendation",
            "Insight 2: Another observation with actionable advice",
            ...
          ]
        }

        Focus on:
        1. Performance strengths and weaknesses
        2. User behavior patterns
        3. Market reception
        4. Areas for improvement
        5. Future opportunities
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert airdrop analyst providing data-driven insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(response || '{}');
        return parsed.insights || ['Analysis unavailable'];
      } catch {
        return [
          'High participant engagement indicates strong project interest',
          'Claim rate suggests user satisfaction with the process',
          'Social sentiment analysis shows positive community response',
          'Market impact indicates successful token distribution',
          'Holder retention suggests long-term value perception'
        ];
      }
    } catch (error) {
      logger.error('Failed to generate insights:', error);
      return ['Insight generation temporarily unavailable'];
    }
  }

  private async generatePredictions(airdrop: any, metrics: PerformanceMetrics, trends: HistoricalAnalysis['trends']): Promise<HistoricalAnalysis['predictions']> {
    try {
      const prompt = `
        Based on this airdrop performance data, predict future outcomes:

        Current Performance:
        - Success Rate: ${metrics.successRate.toFixed(1)}%
        - Average Reward: $${metrics.averageReward.toFixed(2)}
        - Claim Rate: ${metrics.claimRate.toFixed(1)}%
        - Sentiment Score: ${metrics.sentimentScore.toFixed(1)}/100

        Recent Trends:
        - Participants: ${this.describeTrend(trends.participants)}
        - Rewards: ${this.describeTrend(trends.rewards)}
        - Sentiment: ${this.describeTrend(trends.sentiment)}

        Provide predictions in JSON format:
        {
          "next30Days": {
            "participants": number,
            "rewardValue": number,
            "successProbability": number,
            "confidence": number,
            "factors": ["factor1", "factor2", ...]
          },
          "next90Days": {
            "participants": number,
            "rewardValue": number,
            "successProbability": number,
            "confidence": number,
            "factors": ["factor1", "factor2", ...]
          }
        }

        Consider:
        1. Current momentum and trends
        2. Market conditions
        3. Historical patterns
        4. Project development stage
        5. Community engagement
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at predicting airdrop performance based on historical data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2
      });

      const response = completion.choices[0]?.message?.content;
      
      try {
        return JSON.parse(response || '{}');
      } catch {
        return this.getDefaultPredictions(metrics);
      }
    } catch (error) {
      logger.error('Failed to generate predictions:', error);
      return this.getDefaultPredictions(metrics);
    }
  }

  private async storeAnalysisResults(airdropId: string, analysis: HistoricalAnalysis) {
    try {
      // Update airdrop performance record
      await db.airdropPerformance.upsert({
        where: { airdropId },
        update: {
          totalParticipants: analysis.metrics.totalParticipants,
          successRate: analysis.metrics.successRate,
          averageReward: analysis.metrics.averageReward,
          totalDistributed: analysis.metrics.totalDistributed,
          claimRate: analysis.metrics.claimRate,
          averageClaimTime: analysis.metrics.averageClaimTime,
          volatility: analysis.metrics.volatility,
          holderRetention: analysis.metrics.holderRetention,
          marketImpact: analysis.metrics.marketImpact,
          sentimentScore: analysis.metrics.sentimentScore,
          socialMentions: analysis.metrics.socialMentions,
          mediaCoverage: analysis.metrics.mediaCoverage,
          metrics: analysis.metrics,
          lastUpdated: new Date()
        },
        create: {
          airdropId,
          totalParticipants: analysis.metrics.totalParticipants,
          successRate: analysis.metrics.successRate,
          averageReward: analysis.metrics.averageReward,
          totalDistributed: analysis.metrics.totalDistributed,
          claimRate: analysis.metrics.claimRate,
          averageClaimTime: analysis.metrics.averageClaimTime,
          volatility: analysis.metrics.volatility,
          holderRetention: analysis.metrics.holderRetention,
          marketImpact: analysis.metrics.marketImpact,
          sentimentScore: analysis.metrics.sentimentScore,
          socialMentions: analysis.metrics.socialMentions,
          mediaCoverage: analysis.metrics.mediaCoverage,
          metrics: analysis.metrics
        }
      });

      // Store historical data point
      await db.airdropHistoricalData.create({
        data: {
          airdropId,
          timestamp: new Date(),
          eventType: 'performance_analysis',
          data: {
            timeframe: analysis.timeframe,
            metrics: analysis.metrics,
            insights: analysis.insights,
            predictions: analysis.predictions
          }
        }
      });

      logger.info(`Stored analysis results for airdrop ${airdropId}`);
    } catch (error) {
      logger.error('Failed to store analysis results:', error);
    }
  }

  // Helper methods
  private getCutoffDate(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default: return new Date(0);
    }
  }

  private countDataPoints(airdrop: any, timeframe: string): number {
    const cutoffDate = this.getCutoffDate(timeframe);
    return (airdrop.metrics || []).filter(m => new Date(m.date) >= cutoffDate).length;
  }

  private calculateVolatility(metrics: any[]): number {
    if (metrics.length < 2) return 0;
    
    const values = metrics.map(m => parseFloat(m.totalRewardsDistributed || 0));
    const returns = [];
    
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        returns.push((values[i] - values[i - 1]) / values[i - 1]);
      }
    }
    
    if (returns.length === 0) return 0;
    
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  private calculateHolderRetention(airdrop: any): number {
    // Simulated holder retention calculation
    // In a real implementation, this would analyze on-chain data
    return Math.random() * 100;
  }

  private calculateMarketImpact(airdrop: any, metrics: any[]): number {
    // Simulated market impact calculation
    // In a real implementation, this would analyze price data around the airdrop
    return Math.random() * 20 - 10; // -10% to +10%
  }

  private calculateSentimentScore(airdrop: any): number {
    // Simulated sentiment score calculation
    // In a real implementation, this would analyze social media sentiment
    return Math.random() * 100;
  }

  private calculateSocialMentions(airdrop: any): number {
    // Simulated social mentions calculation
    return Math.floor(Math.random() * 10000);
  }

  private calculateMediaCoverage(airdrop: any): number {
    // Simulated media coverage calculation
    return Math.floor(Math.random() * 100);
  }

  private generateTrendData(metrics: any[], field: string, cutoffDate: Date): TrendData[] {
    const filteredMetrics = metrics
      .filter(m => new Date(m.date) >= cutoffDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return filteredMetrics.map((metric, index) => {
      const value = parseFloat(metric[field] || 0);
      const previousValue = index > 0 ? parseFloat(filteredMetrics[index - 1][field] || 0) : value;
      const change = value - previousValue;
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

      return {
        date: metric.date.toISOString().split('T')[0],
        value,
        change,
        changePercent
      };
    });
  }

  private async generateSentimentTrend(airdrop: any, cutoffDate: Date): Promise<TrendData[]> {
    // Simulated sentiment trend data
    const days = Math.ceil((new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
    const trend: TrendData[] = [];
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(cutoffDate.getTime() + i * 24 * 60 * 60 * 1000);
      const value = 50 + Math.random() * 40 - 20; // 30-70 range
      const previousValue = i > 0 ? trend[i - 1].value : value;
      const change = value - previousValue;
      const changePercent = (change / previousValue) * 100;

      trend.push({
        date: date.toISOString().split('T')[0],
        value,
        change,
        changePercent
      });
    }

    return trend;
  }

  private async generatePriceTrend(airdrop: any, cutoffDate: Date): Promise<TrendData[]> {
    // Simulated price trend data
    const days = Math.ceil((new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
    const trend: TrendData[] = [];
    let basePrice = 1.0;
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date(cutoffDate.getTime() + i * 24 * 60 * 60 * 1000);
      const changePercent = (Math.random() - 0.5) * 10; // -5% to +5%
      basePrice = basePrice * (1 + changePercent / 100);
      const change = basePrice - (i > 0 ? trend[i - 1].value : basePrice);

      trend.push({
        date: date.toISOString().split('T')[0],
        value: basePrice,
        change,
        changePercent
      });
    }

    return trend;
  }

  private async compareWithCategory(airdrop: any, metrics: PerformanceMetrics): Promise<ComparisonData> {
    // Simulated category comparison
    const categoryAverage = Math.random() * 100;
    const percentile = Math.random() * 100;
    
    return {
      value: metrics.successRate,
      percentile,
      rank: Math.floor(Math.random() * 50) + 1,
      total: 50,
      outperformance: metrics.successRate - categoryAverage
    };
  }

  private async compareWithSimilarProjects(airdrop: any, metrics: PerformanceMetrics): Promise<ComparisonData> {
    // Simulated similar projects comparison
    const similarAverage = Math.random() * 100;
    const percentile = Math.random() * 100;
    
    return {
      value: metrics.successRate,
      percentile,
      rank: Math.floor(Math.random() * 20) + 1,
      total: 20,
      outperformance: metrics.successRate - similarAverage
    };
  }

  private async compareWithMarketAverage(metrics: PerformanceMetrics): Promise<ComparisonData> {
    // Simulated market comparison
    const marketAverage = 65; // Assumed market average success rate
    const percentile = (metrics.successRate / 100) * 100;
    
    return {
      value: metrics.successRate,
      percentile,
      rank: Math.floor(percentile * 100 / 100) + 1,
      total: 100,
      outperformance: metrics.successRate - marketAverage
    };
  }

  private describeTrend(trend: TrendData[]): string {
    if (trend.length < 2) return 'Insufficient data';
    
    const recent = trend.slice(-5);
    const avgChange = recent.reduce((sum, t) => sum + t.changePercent, 0) / recent.length;
    
    if (avgChange > 5) return 'Strong upward trend';
    if (avgChange > 2) return 'Moderate upward trend';
    if (avgChange > -2) return 'Stable';
    if (avgChange > -5) return 'Moderate downward trend';
    return 'Strong downward trend';
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      totalParticipants: 0,
      successRate: 0,
      averageReward: 0,
      totalDistributed: 0,
      claimRate: 0,
      averageClaimTime: 0,
      volatility: 0,
      holderRetention: 0,
      marketImpact: 0,
      sentimentScore: 50,
      socialMentions: 0,
      mediaCoverage: 0
    };
  }

  private getDefaultTrends(): HistoricalAnalysis['trends'] {
    const emptyTrend: TrendData[] = [];
    return {
      participants: emptyTrend,
      rewards: emptyTrend,
      sentiment: emptyTrend,
      price: emptyTrend
    };
  }

  private getDefaultComparisons(): HistoricalAnalysis['comparisons'] {
    const defaultComparison: ComparisonData = {
      value: 0,
      percentile: 50,
      rank: 1,
      total: 1,
      outperformance: 0
    };

    return {
      vsCategory: defaultComparison,
      vsSimilarProjects: defaultComparison,
      vsMarketAverage: defaultComparison
    };
  }

  private getDefaultPredictions(metrics: PerformanceMetrics): HistoricalAnalysis['predictions'] {
    return {
      next30Days: {
        participants: Math.floor(metrics.totalParticipants * 1.1),
        rewardValue: metrics.averageReward * 1.05,
        successProbability: metrics.successRate / 100,
        confidence: 70,
        factors: ['Current momentum', 'Market conditions']
      },
      next90Days: {
        participants: Math.floor(metrics.totalParticipants * 1.3),
        rewardValue: metrics.averageReward * 1.15,
        successProbability: metrics.successRate / 100,
        confidence: 60,
        factors: ['Historical patterns', 'Project development']
      }
    };
  }

  async getTopPerformingAirdrops(limit = 20, timeframe = '30d'): Promise<any[]> {
    try {
      return await db.airdropPerformance.findMany({
        include: {
          airdrop: {
            include: {
              project: true
            }
          }
        },
        orderBy: {
          successRate: 'desc'
        },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get top performing airdrops:', error);
      return [];
    }
  }

  async getCategoryPerformance(category: string): Promise<any> {
    try {
      const airdropsInCategory = await db.airdrop.findMany({
        where: {
          project: {
            category
          }
        },
        include: {
          performance: true,
          project: true
        }
      });

      if (airdropsInCategory.length === 0) {
        return {
          category,
          totalAirdrops: 0,
          averageMetrics: this.getDefaultMetrics(),
          topPerformers: []
        };
      }

      const performances = airdropsInCategory
        .filter(a => a.performance)
        .map(a => a.performance!);

      const averageMetrics = this.calculateAverageMetrics(performances);
      const topPerformers = performances
        .sort((a, b) => b.successRate - a.successRate)
        .slice(0, 5);

      return {
        category,
        totalAirdrops: airdropsInCategory.length,
        averageMetrics,
        topPerformers,
        marketPosition: this.calculateMarketPosition(averageMetrics)
      };
    } catch (error) {
      logger.error(`Failed to get category performance for ${category}:`, error);
      return null;
    }
  }

  private calculateAverageMetrics(performances: any[]): PerformanceMetrics {
    if (performances.length === 0) return this.getDefaultMetrics();

    const totals = performances.reduce((acc, perf) => ({
      totalParticipants: acc.totalParticipants + perf.totalParticipants,
      successRate: acc.successRate + perf.successRate,
      averageReward: acc.averageReward + perf.averageReward,
      totalDistributed: acc.totalDistributed + perf.totalDistributed,
      claimRate: acc.claimRate + perf.claimRate,
      averageClaimTime: acc.averageClaimTime + perf.averageClaimTime,
      volatility: acc.volatility + perf.volatility,
      holderRetention: acc.holderRetention + perf.holderRetention,
      marketImpact: acc.marketImpact + perf.marketImpact,
      sentimentScore: acc.sentimentScore + perf.sentimentScore,
      socialMentions: acc.socialMentions + perf.socialMentions,
      mediaCoverage: acc.mediaCoverage + perf.mediaCoverage
    }), this.getDefaultMetrics());

    const count = performances.length;
    return {
      ...totals,
      successRate: totals.successRate / count,
      averageReward: totals.averageReward / count,
      claimRate: totals.claimRate / count,
      averageClaimTime: totals.averageClaimTime / count,
      volatility: totals.volatility / count,
      holderRetention: totals.holderRetention / count,
      marketImpact: totals.marketImpact / count,
      sentimentScore: totals.sentimentScore / count,
      socialMentions: Math.floor(totals.socialMentions / count),
      mediaCoverage: Math.floor(totals.mediaCoverage / count)
    };
  }

  private calculateMarketPosition(metrics: PerformanceMetrics): string {
    if (metrics.successRate > 80) return 'Top Quartile';
    if (metrics.successRate > 60) return 'Above Average';
    if (metrics.successRate > 40) return 'Average';
    return 'Below Average';
  }
}

export const historicalAnalysisService = new HistoricalAnalysisService();