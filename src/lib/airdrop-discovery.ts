import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface AirdropDiscoveryData {
  title: string;
  description?: string;
  content?: string;
  author?: string;
  publishedAt?: Date;
  sourceUrl: string;
  sourceIdAtSource?: string;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface SourceConfig {
  name: string;
  type: 'twitter' | 'discord' | 'reddit' | 'telegram' | 'api' | 'contract_monitor' | 'community';
  baseUrl?: string;
  apiKey?: string;
  syncFrequency: number;
  config: Record<string, any>;
}

export class AirdropDiscoveryService {
  private zai: ZAI;
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initializeSources() {
    try {
      // Initialize default sources
      const defaultSources = [
        {
          name: 'Twitter Airdrop Hunter',
          type: 'twitter' as const,
          baseUrl: 'https://api.twitter.com',
          syncFrequency: 300, // 5 minutes
          config: {
            keywords: ['airdrop', 'crypto airdrop', 'token airdrop', 'free tokens'],
            accounts: ['airdrop_alert', 'crypto_airdrops', 'token_airdrops'],
            excludeKeywords: ['scam', 'fake', 'phishing']
          }
        },
        {
          name: 'Reddit Crypto Communities',
          type: 'reddit' as const,
          baseUrl: 'https://www.reddit.com',
          syncFrequency: 600, // 10 minutes
          config: {
            subreddits: ['CryptoAirdrops', 'Airdrop', 'CryptoCurrency', 'ethtrader'],
            minScore: 10,
            excludeFlairs: ['scam', 'fake']
          }
        },
        {
          name: 'Discord Airdrop Servers',
          type: 'discord' as const,
          syncFrequency: 900, // 15 minutes
          config: {
            servers: ['airdrop-hunter', 'crypto-airdrops'],
            channels: ['announcements', 'airdrops'],
            minMembers: 1000
          }
        }
      ];

      for (const source of defaultSources) {
        await this.upsertSource(source);
      }

      logger.info('Airdrop discovery sources initialized');
    } catch (error) {
      logger.error('Failed to initialize airdrop discovery sources:', error);
    }
  }

  async upsertSource(config: SourceConfig) {
    try {
      const source = await db.airdropSource.upsert({
        where: { name: config.name },
        update: {
          type: config.type,
          baseUrl: config.baseUrl,
          syncFrequency: config.syncFrequency,
          config: config.config,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          name: config.name,
          type: config.type,
          baseUrl: config.baseUrl,
          syncFrequency: config.syncFrequency,
          config: config.config,
          isActive: true,
          reliability: 50 // Default reliability
        }
      });

      // Start monitoring if not already active
      if (!this.activeMonitors.has(source.id)) {
        this.startSourceMonitoring(source.id);
      }

      return source;
    } catch (error) {
      logger.error(`Failed to upsert source ${config.name}:`, error);
      throw error;
    }
  }

  async startSourceMonitoring(sourceId: string) {
    try {
      const source = await db.airdropSource.findUnique({
        where: { id: sourceId }
      });

      if (!source || !source.isActive) {
        return;
      }

      // Clear existing monitor
      if (this.activeMonitors.has(sourceId)) {
        clearInterval(this.activeMonitors.get(sourceId));
      }

      // Start periodic monitoring
      const monitor = setInterval(async () => {
        await this.syncSource(sourceId);
      }, source.syncFrequency * 1000);

      this.activeMonitors.set(sourceId, monitor);

      // Initial sync
      await this.syncSource(sourceId);

      logger.info(`Started monitoring source: ${source.name}`);
    } catch (error) {
      logger.error(`Failed to start monitoring source ${sourceId}:`, error);
    }
  }

  async stopSourceMonitoring(sourceId: string) {
    if (this.activeMonitors.has(sourceId)) {
      clearInterval(this.activeMonitors.get(sourceId));
      this.activeMonitors.delete(sourceId);
      logger.info(`Stopped monitoring source: ${sourceId}`);
    }
  }

  async syncSource(sourceId: string) {
    try {
      const source = await db.airdropSource.findUnique({
        where: { id: sourceId }
      });

      if (!source || !source.isActive) {
        return;
      }

      let discoveries: AirdropDiscoveryData[] = [];

      switch (source.type) {
        case 'twitter':
          discoveries = await this.scrapeTwitter(source);
          break;
        case 'reddit':
          discoveries = await this.scrapeReddit(source);
          break;
        case 'discord':
          discoveries = await this.scrapeDiscord(source);
          break;
        case 'telegram':
          discoveries = await this.scrapeTelegram(source);
          break;
        default:
          logger.warn(`Unsupported source type: ${source.type}`);
          return;
      }

      // Process discoveries
      for (const discovery of discoveries) {
        await this.processDiscovery(sourceId, discovery);
      }

      // Update source sync status
      await db.airdropSource.update({
        where: { id: sourceId },
        data: {
          lastSyncAt: new Date(),
          updatedAt: new Date()
        }
      });

      logger.info(`Synced ${discoveries.length} discoveries from ${source.name}`);
    } catch (error) {
      logger.error(`Failed to sync source ${sourceId}:`, error);
    }
  }

  private async scrapeTwitter(source: any): Promise<AirdropDiscoveryData[]> {
    try {
      const config = source.config as any;
      const discoveries: AirdropDiscoveryData[] = [];

      // Use ZAI web search to find Twitter content
      for (const keyword of config.keywords) {
        const searchQuery = `site:twitter.com ${keyword} -scam -fake -phishing`;
        
        const searchResults = await this.zai.functions.invoke("web_search", {
          query: searchQuery,
          num: 10
        });

        for (const result of searchResults) {
          const discovery: AirdropDiscoveryData = {
            title: this.extractTweetTitle(result.name, result.snippet),
            description: result.snippet,
            sourceUrl: result.url,
            author: this.extractTwitterHandle(result.name),
            publishedAt: result.date ? new Date(result.date) : new Date(),
            tags: this.extractTagsFromContent(result.snippet),
            metadata: {
              searchKeyword: keyword,
              hostName: result.host_name,
              rank: result.rank
            }
          };

          discoveries.push(discovery);
        }
      }

      return discoveries;
    } catch (error) {
      logger.error('Failed to scrape Twitter:', error);
      return [];
    }
  }

  private async scrapeReddit(source: any): Promise<AirdropDiscoveryData[]> {
    try {
      const config = source.config as any;
      const discoveries: AirdropDiscoveryData[] = [];

      for (const subreddit of config.subreddits) {
        const searchQuery = `site:reddit.com/r/${subreddit} airdrop -scam -fake`;
        
        const searchResults = await this.zai.functions.invoke("web_search", {
          query: searchQuery,
          num: 15
        });

        for (const result of searchResults) {
          const discovery: AirdropDiscoveryData = {
            title: result.name,
            description: result.snippet,
            sourceUrl: result.url,
            author: this.extractRedditAuthor(result.name),
            publishedAt: result.date ? new Date(result.date) : new Date(),
            tags: ['reddit', subreddit, ...this.extractTagsFromContent(result.snippet)],
            metadata: {
              subreddit,
              hostName: result.host_name,
              rank: result.rank
            }
          };

          discoveries.push(discovery);
        }
      }

      return discoveries;
    } catch (error) {
      logger.error('Failed to scrape Reddit:', error);
      return [];
    }
  }

  private async scrapeDiscord(source: any): Promise<AirdropDiscoveryData[]> {
    try {
      const config = source.config as any;
      const discoveries: AirdropDiscoveryData[] = [];

      // Discord scraping would require Discord API integration
      // For now, we'll search for Discord-related content
      const searchQuery = 'discord airdrop announcements crypto -scam -fake';
      
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 10
      });

      for (const result of searchResults) {
        if (result.host_name.includes('discord.com') || result.host_name.includes('discord.gg')) {
          const discovery: AirdropDiscoveryData = {
            title: result.name,
            description: result.snippet,
            sourceUrl: result.url,
            publishedAt: result.date ? new Date(result.date) : new Date(),
            tags: ['discord', 'announcement', ...this.extractTagsFromContent(result.snippet)],
            metadata: {
              hostName: result.host_name,
              rank: result.rank
            }
          };

          discoveries.push(discovery);
        }
      }

      return discoveries;
    } catch (error) {
      logger.error('Failed to scrape Discord:', error);
      return [];
    }
  }

  private async scrapeTelegram(source: any): Promise<AirdropDiscoveryData[]> {
    try {
      const discoveries: AirdropDiscoveryData[] = [];

      // Telegram scraping would require Telegram Bot API integration
      // For now, we'll search for Telegram-related content
      const searchQuery = 'telegram airdrop crypto channel -scam -fake';
      
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 10
      });

      for (const result of searchResults) {
        if (result.host_name.includes('t.me')) {
          const discovery: AirdropDiscoveryData = {
            title: result.name,
            description: result.snippet,
            sourceUrl: result.url,
            publishedAt: result.date ? new Date(result.date) : new Date(),
            tags: ['telegram', 'channel', ...this.extractTagsFromContent(result.snippet)],
            metadata: {
              hostName: result.host_name,
              rank: result.rank
            }
          };

          discoveries.push(discovery);
        }
      }

      return discoveries;
    } catch (error) {
      logger.error('Failed to scrape Telegram:', error);
      return [];
    }
  }

  private async processDiscovery(sourceId: string, discovery: AirdropDiscoveryData) {
    try {
      // Check if discovery already exists
      const existingDiscovery = await db.airdropDiscovery.findFirst({
        where: {
          sourceId,
          sourceUrl: discovery.sourceUrl
        }
      });

      if (existingDiscovery) {
        return;
      }

      // Use AI to validate and score the discovery
      const validation = await this.validateDiscovery(discovery);

      // Create discovery record
      const createdDiscovery = await db.airdropDiscovery.create({
        data: {
          sourceId,
          sourceUrl: discovery.sourceUrl,
          sourceIdAtSource: discovery.sourceIdAtSource,
          title: discovery.title,
          description: discovery.description,
          content: discovery.content,
          author: discovery.author,
          publishedAt: discovery.publishedAt,
          confidence: validation.confidence,
          status: validation.confidence > 70 ? 'verified' : 'pending',
          priority: this.calculatePriority(validation),
          tags: discovery.tags,
          metadata: {
            ...discovery.metadata,
            validation: validation
          }
        }
      });

      // Create validation record
      await db.airdropValidation.create({
        data: {
          discoveryId: createdDiscovery.id,
          validationType: 'automated',
          validator: 'ai_system',
          result: validation.result,
          confidence: validation.confidence,
          riskScore: validation.riskScore,
          checks: validation.checks,
          issues: validation.issues,
          warnings: validation.warnings,
          recommendations: validation.recommendations,
          evidence: validation.evidence
        }
      });

      logger.info(`Processed new discovery: ${discovery.title}`);
    } catch (error) {
      logger.error('Failed to process discovery:', error);
    }
  }

  private async validateDiscovery(discovery: AirdropDiscoveryData) {
    try {
      const prompt = `
        Analyze this potential airdrop discovery for legitimacy and value:

        Title: ${discovery.title}
        Description: ${discovery.description}
        Source: ${discovery.sourceUrl}
        Author: ${discovery.author}

        Provide a JSON response with:
        - result: "valid", "invalid", "suspicious", or "needs_review"
        - confidence: 0-100 confidence score
        - riskScore: 0-100 risk assessment
        - checks: array of specific checks performed
        - issues: array of red flags found
        - warnings: array of cautionary notes
        - recommendations: array of recommended actions
        - evidence: supporting evidence for the assessment

        Focus on identifying:
        1. Scam indicators (requests for private keys, payments, etc.)
        2. Legitimate project signals (official website, team info, etc.)
        3. Airdrop specificity (clear requirements, timeline, etc.)
        4. Source credibility
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert airdrop validator. Analyze discoveries for legitimacy and provide detailed assessments.'
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
        return JSON.parse(response || '{}');
      } catch {
        // Fallback validation if JSON parsing fails
        return {
          result: 'needs_review',
          confidence: 50,
          riskScore: 50,
          checks: ['ai_validation_failed'],
          issues: ['ai_parsing_error'],
          warnings: ['manual_review_required'],
          recommendations: ['review_manually'],
          evidence: { rawResponse: response }
        };
      }
    } catch (error) {
      logger.error('Failed to validate discovery:', error);
      return {
        result: 'needs_review',
        confidence: 0,
        riskScore: 100,
        checks: ['validation_error'],
        issues: ['system_error'],
        warnings: ['validation_failed'],
        recommendations: ['retry_validation'],
        evidence: { error: error.message }
      };
    }
  }

  private calculatePriority(validation: any): string {
    if (validation.confidence > 80 && validation.riskScore < 20) {
      return 'high';
    } else if (validation.confidence > 60 && validation.riskScore < 40) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private extractTweetTitle(name: string, snippet: string): string {
    // Extract tweet content from title/snippet
    return name.includes(':') ? name.split(':')[1].trim() : name;
  }

  private extractTwitterHandle(name: string): string {
    const match = name.match(/@\w+/);
    return match ? match[0] : '';
  }

  private extractRedditAuthor(name: string): string {
    const match = name.match(/u\/\w+/);
    return match ? match[0] : '';
  }

  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    const keywords = ['airdrop', 'crypto', 'token', 'defi', 'nft', 'ethereum', 'bitcoin', 'blockchain'];
    
    const lowerContent = content.toLowerCase();
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }

  async getPendingDiscoveries(limit = 50) {
    return await db.airdropDiscovery.findMany({
      where: {
        status: 'pending'
      },
      include: {
        source: true,
        validations: true
      },
      orderBy: {
        discoveredAt: 'desc'
      },
      take: limit
    });
  }

  async updateDiscoveryStatus(discoveryId: string, status: string, verifiedBy?: string) {
    return await db.airdropDiscovery.update({
      where: { id: discoveryId },
      data: {
        status,
        verifiedAt: status === 'verified' ? new Date() : undefined,
        verifiedBy,
        updatedAt: new Date()
      }
    });
  }

  async getDiscoveryStats() {
    const stats = await db.airdropDiscovery.groupBy({
      by: ['status'],
      _count: {
        id: true
      }
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.id;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const airdropDiscoveryService = new AirdropDiscoveryService();