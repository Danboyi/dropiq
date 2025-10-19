import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface SentimentData {
  source: string;
  sentiment: number; // -100 to 100
  confidence: number; // 0-100
  volume: number;
  engagement: number;
  timestamp: Date;
  metadata: any;
}

export interface SentimentAnalysis {
  airdropId?: string;
  projectId?: string;
  overallSentiment: number;
  confidence: number;
  sources: SentimentSource[];
  trends: SentimentTrend[];
  keywords: SentimentKeyword[];
  demographics: SentimentDemographics;
  predictions: SentimentPrediction[];
  recommendations: string[];
  lastUpdated: Date;
}

export interface SentimentSource {
  name: string;
  type: 'twitter' | 'reddit' | 'discord' | 'telegram' | 'news' | 'github';
  sentiment: number;
  confidence: number;
  volume: number;
  engagement: number;
  sampleSize: number;
  timeframe: string;
}

export interface SentimentTrend {
  period: string;
  sentiment: number;
  volume: number;
  change: number;
  events: string[];
}

export interface SentimentKeyword {
  keyword: string;
  sentiment: number;
  frequency: number;
  context: string[];
  trend: 'rising' | 'falling' | 'stable';
}

export interface SentimentDemographics {
  byRegion: Record<string, number>;
  byLanguage: Record<string, number>;
  byPlatform: Record<string, number>;
  byUserType: Record<string, number>;
}

export interface SentimentPrediction {
  timeframe: string;
  predictedSentiment: number;
  confidence: number;
  factors: string[];
  risks: string[];
}

export class MarketSentimentAnalyzer {
  private zai: ZAI;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.zai = new ZAI();
  }

  async analyzeSentiment(airdropId?: string, projectId?: string): Promise<SentimentAnalysis> {
    try {
      const target = airdropId || projectId;
      if (!target) {
        throw new Error('Either airdropId or projectId must be provided');
      }

      logger.info(`Analyzing market sentiment for ${airdropId ? 'airdrop' : 'project'} ${target}`);

      // Get entity information
      const entity = airdropId 
        ? await this.getAirdrop(airdropId)
        : await this.getProject(projectId);

      if (!entity) {
        throw new Error('Entity not found');
      }

      // Gather sentiment data from multiple sources
      const sentimentData = await this.gatherSentimentData(entity);
      
      // Analyze sentiment from each source
      const sources = await this.analyzeSentimentSources(entity, sentimentData);
      
      // Calculate overall sentiment
      const overallSentiment = this.calculateOverallSentiment(sources);
      
      // Analyze trends
      const trends = await this.analyzeSentimentTrends(entity, sentimentData);
      
      // Extract keywords
      const keywords = await this.extractSentimentKeywords(entity, sentimentData);
      
      // Analyze demographics
      const demographics = await this.analyzeSentimentDemographics(sentimentData);
      
      // Generate predictions
      const predictions = await this.generateSentimentPredictions(entity, sources, trends);
      
      // Generate recommendations
      const recommendations = await this.generateSentimentRecommendations(entity, overallSentiment, trends);

      const analysis: SentimentAnalysis = {
        airdropId,
        projectId,
        overallSentiment,
        confidence: this.calculateConfidence(sources),
        sources,
        trends,
        keywords,
        demographics,
        predictions,
        recommendations,
        lastUpdated: new Date()
      };

      // Store analysis
      await this.storeSentimentAnalysis(analysis);

      logger.info(`Sentiment analysis completed: ${overallSentiment.toFixed(1)}% for ${target}`);
      return analysis;
    } catch (error) {
      logger.error('Failed to analyze sentiment:', error);
      throw error;
    }
  }

  async getRealTimeSentiment(airdropId?: string, projectId?: string): Promise<SentimentAnalysis> {
    try {
      const cacheKey = `sentiment_${airdropId || projectId}_${airdropId ? 'airdrop' : 'project'}`;
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Perform real-time analysis
      const analysis = await this.analyzeSentiment(airdropId, projectId);
      
      // Cache the result
      this.setCache(cacheKey, analysis);

      return analysis;
    } catch (error) {
      logger.error('Failed to get real-time sentiment:', error);
      throw error;
    }
  }

  private async getAirdrop(airdropId: string): Promise<any> {
    return await db.airdrop.findUnique({
      where: { id: airdropId },
      include: {
        project: true,
        token: true
      }
    });
  }

  private async getProject(projectId: string): Promise<any> {
    return await db.project.findUnique({
      where: { id: projectId },
      include: {
        tokens: true
      }
    });
  }

  private async gatherSentimentData(entity: any): Promise<SentimentData[]> {
    const data: SentimentData[] = [];

    // Gather from Twitter
    data.push(...await this.gatherTwitterSentiment(entity));
    
    // Gather from Reddit
    data.push(...await this.gatherRedditSentiment(entity));
    
    // Gather from Discord
    data.push(...await this.gatherDiscordSentiment(entity));
    
    // Gather from Telegram
    data.push(...await this.gatherTelegramSentiment(entity));
    
    // Gather from News
    data.push(...await this.gatherNewsSentiment(entity));
    
    // Gather from GitHub
    data.push(...await this.gatherGithubSentiment(entity));

    return data;
  }

  private async gatherTwitterSentiment(entity: any): Promise<SentimentData[]> {
    try {
      const searchQuery = `${entity.name || entity.title} ${entity.project?.name || ''}`;
      
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: `site:twitter.com ${searchQuery}`,
        num: 20
      });

      const sentiments: SentimentData[] = [];
      
      for (const result of searchResults) {
        const sentiment = await this.analyzeTextSentiment(result.snippet);
        
        sentiments.push({
          source: 'twitter',
          sentiment: sentiment.score,
          confidence: sentiment.confidence,
          volume: 1, // Each result represents one mention
          engagement: Math.floor(Math.random() * 100), // Simulated engagement
          timestamp: result.date ? new Date(result.date) : new Date(),
          metadata: {
            url: result.url,
            author: this.extractTwitterAuthor(result.name),
            snippet: result.snippet
          }
        });
      }

      return sentiments;
    } catch (error) {
      logger.error('Failed to gather Twitter sentiment:', error);
      return [];
    }
  }

  private async gatherRedditSentiment(entity: any): Promise<SentimentData[]> {
    try {
      const searchQuery = `${entity.name || entity.title} ${entity.project?.name || ''}`;
      
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: `site:reddit.com ${searchQuery}`,
        num: 15
      });

      const sentiments: SentimentData[] = [];
      
      for (const result of searchResults) {
        const sentiment = await this.analyzeTextSentiment(result.snippet);
        
        sentiments.push({
          source: 'reddit',
          sentiment: sentiment.score,
          confidence: sentiment.confidence,
          volume: 1,
          engagement: Math.floor(Math.random() * 50),
          timestamp: result.date ? new Date(result.date) : new Date(),
          metadata: {
            url: result.url,
            subreddit: this.extractSubreddit(result.url),
            snippet: result.snippet
          }
        });
      }

      return sentiments;
    } catch (error) {
      logger.error('Failed to gather Reddit sentiment:', error);
      return [];
    }
  }

  private async gatherDiscordSentiment(entity: any): Promise<SentimentData[]> {
    try {
      // Simulated Discord sentiment gathering
      const sentiments: SentimentData[] = [];
      
      // In a real implementation, this would use Discord API
      for (let i = 0; i < 5; i++) {
        const sentiment = await this.analyzeTextSentiment(`Discussion about ${entity.name || entity.title}`);
        
        sentiments.push({
          source: 'discord',
          sentiment: sentiment.score,
          confidence: sentiment.confidence,
          volume: Math.floor(Math.random() * 10) + 1,
          engagement: Math.floor(Math.random() * 80) + 20,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          metadata: {
            channel: 'general',
            server: 'community'
          }
        });
      }

      return sentiments;
    } catch (error) {
      logger.error('Failed to gather Discord sentiment:', error);
      return [];
    }
  }

  private async gatherTelegramSentiment(entity: any): Promise<SentimentData[]> {
    try {
      // Simulated Telegram sentiment gathering
      const sentiments: SentimentData[] = [];
      
      for (let i = 0; i < 3; i++) {
        const sentiment = await this.analyzeTextSentiment(`Chat about ${entity.name || entity.title}`);
        
        sentiments.push({
          source: 'telegram',
          sentiment: sentiment.score,
          confidence: sentiment.confidence,
          volume: Math.floor(Math.random() * 8) + 1,
          engagement: Math.floor(Math.random() * 60) + 10,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          metadata: {
            group: 'community',
            members: Math.floor(Math.random() * 1000) + 100
          }
        });
      }

      return sentiments;
    } catch (error) {
      logger.error('Failed to gather Telegram sentiment:', error);
      return [];
    }
  }

  private async gatherNewsSentiment(entity: any): Promise<SentimentData[]> {
    try {
      const searchQuery = `${entity.name || entity.title} ${entity.project?.name || ''} crypto news`;
      
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 10
      });

      const sentiments: SentimentData[] = [];
      
      for (const result of searchResults) {
        const sentiment = await this.analyzeTextSentiment(result.snippet);
        
        sentiments.push({
          source: 'news',
          sentiment: sentiment.score,
          confidence: sentiment.confidence,
          volume: 1,
          engagement: Math.floor(Math.random() * 200) + 50, // News typically has higher engagement
          timestamp: result.date ? new Date(result.date) : new Date(),
          metadata: {
            url: result.url,
            source: result.host_name,
            title: result.name
          }
        });
      }

      return sentiments;
    } catch (error) {
      logger.error('Failed to gather news sentiment:', error);
      return [];
    }
  }

  private async gatherGithubSentiment(entity: any): Promise<SentimentData[]> {
    try {
      // Simulated GitHub sentiment gathering based on repository activity
      const sentiments: SentimentData[] = [];
      
      if (entity.project?.github) {
        const sentiment = await this.analyzeTextSentiment(`GitHub activity for ${entity.name || entity.title}`);
        
        sentiments.push({
          source: 'github',
          sentiment: sentiment.score,
          confidence: sentiment.confidence,
          volume: Math.floor(Math.random() * 5) + 1,
          engagement: Math.floor(Math.random() * 30) + 5,
          timestamp: new Date(),
          metadata: {
            repository: entity.project.github,
            stars: Math.floor(Math.random() * 1000) + 50,
            forks: Math.floor(Math.random() * 200) + 10
          }
        });
      }

      return sentiments;
    } catch (error) {
      logger.error('Failed to gather GitHub sentiment:', error);
      return [];
    }
  }

  private async analyzeTextSentiment(text: string): Promise<{ score: number; confidence: number }> {
    try {
      const prompt = `
        Analyze the sentiment of this text and provide a JSON response:
        
        Text: "${text}"
        
        Respond with:
        {
          "score": -100 to 100 (negative to positive),
          "confidence": 0 to 100,
          "reasoning": "brief explanation"
        }
        
        Consider:
        - Positive words (good, great, excellent, amazing, etc.)
        - Negative words (bad, terrible, awful, scam, etc.)
        - Neutral language
        - Context and nuance
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert sentiment analyzer for cryptocurrency and blockchain content.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(response || '{}');
        return {
          score: Math.max(-100, Math.min(100, parsed.score || 0)),
          confidence: Math.max(0, Math.min(100, parsed.confidence || 50))
        };
      } catch {
        // Fallback to simple keyword-based analysis
        return this.simpleSentimentAnalysis(text);
      }
    } catch (error) {
      logger.error('Failed to analyze text sentiment:', error);
      return this.simpleSentimentAnalysis(text);
    }
  }

  private simpleSentimentAnalysis(text: string): { score: number; confidence: number } {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'perfect', 'brilliant'];
    const negativeWords = ['bad', 'terrible', 'awful', 'scam', 'hate', 'worst', 'horrible', 'disaster', 'fail', 'poor'];
    
    const lowerText = text.toLowerCase();
    let score = 0;
    let matches = 0;

    for (const word of positiveWords) {
      if (lowerText.includes(word)) {
        score += 20;
        matches++;
      }
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) {
        score -= 20;
        matches++;
      }
    }

    return {
      score: Math.max(-100, Math.min(100, score)),
      confidence: matches > 0 ? Math.min(100, matches * 20) : 50
    };
  }

  private async analyzeSentimentSources(entity: any, sentimentData: SentimentData[]): Promise<SentimentSource[]> {
    const sources: Map<string, SentimentData[]> = new Map();

    // Group data by source
    for (const data of sentimentData) {
      if (!sources.has(data.source)) {
        sources.set(data.source, []);
      }
      sources.get(data.source)!.push(data);
    }

    const analyzedSources: SentimentSource[] = [];

    for (const [sourceName, data] of sources) {
      const avgSentiment = data.reduce((sum, d) => sum + d.sentiment, 0) / data.length;
      const avgConfidence = data.reduce((sum, d) => sum + d.confidence, 0) / data.length;
      const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
      const totalEngagement = data.reduce((sum, d) => sum + d.engagement, 0);

      analyzedSources.push({
        name: sourceName,
        type: this.getSourceType(sourceName),
        sentiment: avgSentiment,
        confidence: avgConfidence,
        volume: totalVolume,
        engagement: totalEngagement,
        sampleSize: data.length,
        timeframe: '7d'
      });
    }

    return analyzedSources.sort((a, b) => b.volume - a.volume);
  }

  private getSourceType(sourceName: string): 'twitter' | 'reddit' | 'discord' | 'telegram' | 'news' | 'github' {
    const typeMap: Record<string, 'twitter' | 'reddit' | 'discord' | 'telegram' | 'news' | 'github'> = {
      'twitter': 'twitter',
      'reddit': 'reddit',
      'discord': 'discord',
      'telegram': 'telegram',
      'news': 'news',
      'github': 'github'
    };
    
    return typeMap[sourceName] || 'twitter';
  }

  private calculateOverallSentiment(sources: SentimentSource[]): number {
    if (sources.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const source of sources) {
      const weight = source.volume * source.confidence / 100;
      weightedSum += source.sentiment * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private calculateConfidence(sources: SentimentSource[]): number {
    if (sources.length === 0) return 0;

    const avgConfidence = sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
    const totalVolume = sources.reduce((sum, s) => sum + s.volume, 0);
    
    // Higher confidence with more data sources and higher volume
    const volumeBonus = Math.min(50, totalVolume / 10);
    
    return Math.min(100, avgConfidence + volumeBonus);
  }

  private async analyzeSentimentTrends(entity: any, sentimentData: SentimentData[]): Promise<SentimentTrend[]> {
    try {
      const trends: SentimentTrend[] = [];
      
      // Group data by day
      const dailyData: Map<string, SentimentData[]> = new Map();
      
      for (const data of sentimentData) {
        const day = data.timestamp.toISOString().split('T')[0];
        if (!dailyData.has(day)) {
          dailyData.set(day, []);
        }
        dailyData.get(day)!.push(data);
      }

      // Calculate trends for each day
      for (const [period, data] of dailyData) {
        const avgSentiment = data.reduce((sum, d) => sum + d.sentiment, 0) / data.length;
        const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
        
        // Calculate change from previous day
        const periods = Array.from(dailyData.keys()).sort();
        const currentIndex = periods.indexOf(period);
        let change = 0;
        
        if (currentIndex > 0) {
          const prevPeriod = periods[currentIndex - 1];
          const prevData = dailyData.get(prevPeriod)!;
          const prevSentiment = prevData.reduce((sum, d) => sum + d.sentiment, 0) / prevData.length;
          change = avgSentiment - prevSentiment;
        }

        trends.push({
          period,
          sentiment: avgSentiment,
          volume: totalVolume,
          change,
          events: [] // Would be populated with actual events
        });
      }

      return trends.sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      logger.error('Failed to analyze sentiment trends:', error);
      return [];
    }
  }

  private async extractSentimentKeywords(entity: any, sentimentData: SentimentData[]): Promise<SentimentKeyword[]> {
    try {
      // Combine all text content
      const allText = sentimentData.map(d => d.metadata?.snippet || '').join(' ');
      
      // Extract keywords using AI
      const prompt = `
        Extract sentiment keywords from this text about ${entity.name || entity.title}:
        
        Text: "${allText}"
        
        Provide JSON response:
        {
          "keywords": [
            {
              "keyword": "word",
              "sentiment": -100 to 100,
              "frequency": number,
              "context": ["example1", "example2"],
              "trend": "rising" | "falling" | "stable"
            }
          ]
        }
        
        Focus on:
        - Project-related terms
        - Emotional words
        - Technical terms
        - Community sentiment indicators
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at extracting sentiment keywords from crypto discussions.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      
      try {
        const parsed = JSON.parse(response || '{}');
        return parsed.keywords || [];
      } catch {
        // Fallback keyword extraction
        return this.extractKeywordsSimple(allText);
      }
    } catch (error) {
      logger.error('Failed to extract sentiment keywords:', error);
      return [];
    }
  }

  private extractKeywordsSimple(text: string): SentimentKeyword[] {
    const keywords: SentimentKeyword[] = [];
    const commonWords = ['airdrop', 'crypto', 'token', 'blockchain', 'defi', 'nft', 'project', 'team', 'community'];
    
    for (const word of commonWords) {
      if (text.toLowerCase().includes(word)) {
        const frequency = (text.toLowerCase().match(new RegExp(word, 'g')) || []).length;
        keywords.push({
          keyword: word,
          sentiment: Math.random() * 40 - 20, // -20 to 20
          frequency,
          context: [],
          trend: 'stable'
        });
      }
    }

    return keywords;
  }

  private async analyzeSentimentDemographics(sentimentData: SentimentData[]): Promise<SentimentDemographics> {
    try {
      // Simulated demographic analysis
      return {
        byRegion: {
          'North America': 35,
          'Europe': 30,
          'Asia': 25,
          'Other': 10
        },
        byLanguage: {
          'English': 60,
          'Chinese': 15,
          'Japanese': 10,
          'Other': 15
        },
        byPlatform: {
          'Twitter': 40,
          'Reddit': 25,
          'Discord': 20,
          'Telegram': 15
        },
        byUserType: {
          'Investors': 35,
          'Traders': 25,
          'Developers': 20,
          'Community': 20
        }
      };
    } catch (error) {
      logger.error('Failed to analyze sentiment demographics:', error);
      return {
        byRegion: {},
        byLanguage: {},
        byPlatform: {},
        byUserType: {}
      };
    }
  }

  private async generateSentimentPredictions(entity: any, sources: SentimentSource[], trends: SentimentTrend[]): Promise<SentimentPrediction[]> {
    try {
      const predictions: SentimentPrediction[] = [];
      
      // 7-day prediction
      predictions.push(await this.predictSentiment(entity, sources, trends, '7d'));
      
      // 30-day prediction
      predictions.push(await this.predictSentiment(entity, sources, trends, '30d'));
      
      // 90-day prediction
      predictions.push(await this.predictSentiment(entity, sources, trends, '90d'));

      return predictions;
    } catch (error) {
      logger.error('Failed to generate sentiment predictions:', error);
      return [];
    }
  }

  private async predictSentiment(entity: any, sources: SentimentSource[], trends: SentimentTrend[], timeframe: string): Promise<SentimentPrediction> {
    try {
      const currentSentiment = this.calculateOverallSentiment(sources);
      const recentTrend = trends.slice(-3); // Last 3 days
      
      // Calculate trend direction
      const avgChange = recentTrend.reduce((sum, t) => sum + t.change, 0) / recentTrend.length;
      
      // Predict future sentiment based on trend
      let predictedSentiment = currentSentiment;
      let confidence = 70;
      
      if (timeframe === '7d') {
        predictedSentiment = currentSentiment + (avgChange * 2);
        confidence = 80;
      } else if (timeframe === '30d') {
        predictedSentiment = currentSentiment + (avgChange * 5);
        confidence = 60;
      } else if (timeframe === '90d') {
        predictedSentiment = currentSentiment + (avgChange * 10);
        confidence = 40;
      }

      // Generate factors and risks
      const factors = [
        `Current sentiment: ${currentSentiment.toFixed(1)}`,
        `Recent trend: ${avgChange > 0 ? 'positive' : avgChange < 0 ? 'negative' : 'neutral'}`,
        `Source diversity: ${sources.length} platforms`
      ];

      const risks = [
        'Market volatility may affect sentiment',
        'News events could change perception',
        'Community dynamics may shift'
      ];

      return {
        timeframe,
        predictedSentiment: Math.max(-100, Math.min(100, predictedSentiment)),
        confidence,
        factors,
        risks
      };
    } catch (error) {
      logger.error('Failed to predict sentiment:', error);
      return {
        timeframe,
        predictedSentiment: 0,
        confidence: 0,
        factors: [],
        risks: ['Prediction failed']
      };
    }
  }

  private async generateSentimentRecommendations(entity: any, overallSentiment: number, trends: SentimentTrend[]): Promise<string[]> {
    try {
      const prompt = `
        Based on this sentiment analysis, provide actionable recommendations:

        Entity: ${entity.name || entity.title}
        Overall Sentiment: ${overallSentiment.toFixed(1)}%
        Recent Trend: ${trends.length > 0 ? (trends[trends.length - 1].change > 0 ? 'improving' : 'declining') : 'stable'}

        Provide JSON response:
        {
          "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
          "priorityActions": ["action1", "action2"],
          "monitoring": ["monitor1", "monitor2"]
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert community manager providing sentiment-based recommendations.'
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
        return [
          ...parsed.recommendations || [],
          ...parsed.priorityActions || [],
          ...parsed.monitoring || []
        ];
      } catch {
        return this.generateDefaultRecommendations(overallSentiment, trends);
      }
    } catch (error) {
      logger.error('Failed to generate sentiment recommendations:', error);
      return this.generateDefaultRecommendations(overallSentiment, trends);
    }
  }

  private generateDefaultRecommendations(overallSentiment: number, trends: SentimentTrend[]): string[] {
    const recommendations: string[] = [];

    if (overallSentiment > 50) {
      recommendations.push('Leverage positive sentiment in marketing campaigns');
      recommendations.push('Engage with community supporters to maintain momentum');
    } else if (overallSentiment < -20) {
      recommendations.push('Address negative sentiment promptly and transparently');
      recommendations.push('Focus on improving project fundamentals and communication');
    } else {
      recommendations.push('Continue monitoring sentiment for changes');
      recommendations.push('Engage with neutral community members to build support');
    }

    const recentTrend = trends.slice(-3);
    const avgChange = recentTrend.reduce((sum, t) => sum + t.change, 0) / recentTrend.length;
    
    if (avgChange > 10) {
      recommendations.push('Capitalize on improving sentiment trend');
    } else if (avgChange < -10) {
      recommendations.push('Investigate causes of declining sentiment');
    }

    return recommendations.slice(0, 5);
  }

  private async storeSentimentAnalysis(analysis: SentimentAnalysis): Promise<void> {
    try {
      // Store in market_sentiments table
      await db.marketSentiment.create({
        data: {
          airdropId: analysis.airdropId,
          projectId: analysis.projectId,
          sentiment: analysis.overallSentiment,
          confidence: analysis.confidence,
          volume: analysis.sources.reduce((sum, s) => sum + s.volume, 0),
          engagement: analysis.sources.reduce((sum, s) => sum + s.engagement, 0),
          keywords: analysis.keywords.map(k => k.keyword),
          topics: analysis.keywords.map(k => k.keyword),
          samplePosts: analysis.sources.map(s => s.name),
          analysis: {
            sources: analysis.sources,
            trends: analysis.trends,
            demographics: analysis.demographics,
            predictions: analysis.predictions,
            recommendations: analysis.recommendations
          },
          timestamp: new Date()
        }
      });

      logger.info(`Stored sentiment analysis for ${analysis.airdropId || analysis.projectId}`);
    } catch (error) {
      logger.error('Failed to store sentiment analysis:', error);
    }
  }

  // Helper methods
  private extractTwitterAuthor(title: string): string {
    const match = title.match(/@\w+/);
    return match ? match[0] : '';
  }

  private extractSubreddit(url: string): string {
    const match = url.match(/reddit\.com\/r\/([^\/]+)/);
    return match ? match[1] : '';
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getSentimentHistory(airdropId?: string, projectId?: string, days: number = 30): Promise<any[]> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      const sentiments = await db.marketSentiment.findMany({
        where: {
          airdropId: airdropId || undefined,
          projectId: projectId || undefined,
          timestamp: {
            gte: cutoffDate
          }
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      return sentiments;
    } catch (error) {
      logger.error('Failed to get sentiment history:', error);
      return [];
    }
  }

  async getTopSentimentProjects(limit: number = 20): Promise<any[]> {
    try {
      return await db.marketSentiment.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: {
          sentiment: 'desc'
        },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get top sentiment projects:', error);
      return [];
    }
  }

  async updateSentimentForAllEntities(): Promise<void> {
    try {
      logger.info('Starting sentiment update for all entities');

      // Get active airdrops and projects
      const airdrops = await db.airdrop.findMany({
        where: {
          status: {
            in: ['upcoming', 'active']
          }
        },
        take: 50 // Limit to prevent overload
      });

      const projects = await db.project.findMany({
        where: {
          isActive: true
        },
        take: 50
      });

      // Update sentiment for airdrops
      for (const airdrop of airdrops) {
        try {
          await this.analyzeSentiment(airdrop.id);
        } catch (error) {
          logger.error(`Failed to update sentiment for airdrop ${airdrop.id}:`, error);
        }
      }

      // Update sentiment for projects
      for (const project of projects) {
        try {
          await this.analyzeSentiment(undefined, project.id);
        } catch (error) {
          logger.error(`Failed to update sentiment for project ${project.id}:`, error);
        }
      }

      logger.info(`Sentiment update completed for ${airdrops.length} airdrops and ${projects.length} projects`);
    } catch (error) {
      logger.error('Failed to update sentiment for all entities:', error);
    }
  }
}

export const marketSentimentAnalyzer = new MarketSentimentAnalyzer();