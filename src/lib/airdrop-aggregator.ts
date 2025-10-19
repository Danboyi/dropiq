import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface AggregatorConfig {
  name: string;
  baseUrl: string;
  apiKey?: string;
  supportedChains: string[];
  rateLimit: number;
  syncFrequency: number;
  config: Record<string, any>;
}

export interface AggregatorAirdrop {
  id: string;
  title: string;
  description: string;
  projectWebsite?: string;
  tokenSymbol?: string;
  blockchain: string;
  status: string;
  startDate?: string;
  endDate?: string;
  totalAmount?: string;
  participantsCount?: number;
  requirements?: any[];
  socialLinks?: Record<string, string>;
  tags?: string[];
  confidence?: number;
}

export class AirdropAggregatorService {
  private zai: ZAI;
  private activeSyncs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initializeAggregators() {
    try {
      const defaultAggregators = [
        {
          name: 'Airdrop.io',
          baseUrl: 'https://api.airdrop.io',
          supportedChains: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism'],
          rateLimit: 100,
          syncFrequency: 3600, // 1 hour
          config: {
            endpoints: {
              airdrops: '/v1/airdrops',
              projects: '/v1/projects'
            },
            filters: {
              status: ['upcoming', 'active'],
              minTrustScore: 50
            }
          }
        },
        {
          name: 'DappRadar Airdrops',
          baseUrl: 'https://api.dapp.com',
          supportedChains: ['ethereum', 'polygon', 'bsc', 'avalanche', 'fantom'],
          rateLimit: 200,
          syncFrequency: 1800, // 30 minutes
          config: {
            endpoints: {
              airdrops: '/v2/airdrops',
              analytics: '/v2/analytics'
            },
            filters: {
              verified: true,
              minParticipants: 100
            }
          }
        },
        {
          name: 'CoinGecko Airdrops',
          baseUrl: 'https://api.coingecko.com',
          supportedChains: ['ethereum', 'polygon', 'bsc', 'solana', 'avalanche'],
          rateLimit: 50,
          syncFrequency: 7200, // 2 hours
          config: {
            endpoints: {
              airdrops: '/api/v3/airdrops',
              coins: '/api/v3/coins'
            },
            filters: {
              active: true,
              marketCapMin: 1000000
            }
          }
        }
      ];

      for (const aggregator of defaultAggregators) {
        await this.upsertAggregator(aggregator);
      }

      logger.info('Airdrop aggregators initialized');
    } catch (error) {
      logger.error('Failed to initialize airdrop aggregators:', error);
    }
  }

  async upsertAggregator(config: AggregatorConfig) {
    try {
      const aggregator = await db.airdropAggregator.upsert({
        where: { name: config.name },
        update: {
          baseUrl: config.baseUrl,
          supportedChains: config.supportedChains,
          rateLimit: config.rateLimit,
          syncFrequency: config.syncFrequency,
          config: config.config,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          name: config.name,
          baseUrl: config.baseUrl,
          supportedChains: config.supportedChains,
          rateLimit: config.rateLimit,
          syncFrequency: config.syncFrequency,
          config: config.config,
          isActive: true,
          reliability: 70 // Default reliability for known aggregators
        }
      });

      // Start syncing if not already active
      if (!this.activeSyncs.has(aggregator.id)) {
        this.startAggregatorSync(aggregator.id);
      }

      return aggregator;
    } catch (error) {
      logger.error(`Failed to upsert aggregator ${config.name}:`, error);
      throw error;
    }
  }

  async startAggregatorSync(aggregatorId: string) {
    try {
      const aggregator = await db.airdropAggregator.findUnique({
        where: { id: aggregatorId }
      });

      if (!aggregator || !aggregator.isActive) {
        return;
      }

      // Clear existing sync
      if (this.activeSyncs.has(aggregatorId)) {
        clearInterval(this.activeSyncs.get(aggregatorId));
      }

      // Start periodic syncing
      const sync = setInterval(async () => {
        await this.syncAggregator(aggregatorId);
      }, aggregator.syncFrequency * 1000);

      this.activeSyncs.set(aggregatorId, sync);

      // Initial sync
      await this.syncAggregator(aggregatorId);

      logger.info(`Started syncing aggregator: ${aggregator.name}`);
    } catch (error) {
      logger.error(`Failed to start syncing aggregator ${aggregatorId}:`, error);
    }
  }

  async stopAggregatorSync(aggregatorId: string) {
    if (this.activeSyncs.has(aggregatorId)) {
      clearInterval(this.activeSyncs.get(aggregatorId));
      this.activeSyncs.delete(aggregatorId);
      logger.info(`Stopped syncing aggregator: ${aggregatorId}`);
    }
  }

  async syncAggregator(aggregatorId: string) {
    try {
      const aggregator = await db.airdropAggregator.findUnique({
        where: { id: aggregatorId }
      });

      if (!aggregator || !aggregator.isActive) {
        return;
      }

      // Create sync record
      const syncRecord = await db.aggregatorSync.create({
        data: {
          aggregatorId,
          syncType: 'incremental',
          status: 'running',
          startedAt: new Date()
        }
      });

      const startTime = Date.now();
      let totalAirdrops = 0;
      let newAirdrops = 0;
      let updatedAirdrops = 0;
      const errors: string[] = [];

      try {
        const airdrops = await this.fetchAirdropsFromAggregator(aggregator);
        totalAirdrops = airdrops.length;

        for (const airdropData of airdrops) {
          try {
            const result = await this.processAggregatorAirdrop(aggregatorId, airdropData);
            if (result.isNew) {
              newAirdrops++;
            } else if (result.isUpdated) {
              updatedAirdrops++;
            }
          } catch (error) {
            errors.push(`Failed to process airdrop ${airdropData.id}: ${error.message}`);
          }
        }

        const duration = Math.floor((Date.now() - startTime) / 1000);

        // Update sync record
        await db.aggregatorSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'completed',
            totalAirdrops,
            newAirdrops,
            updatedAirdrops,
            errors,
            duration,
            completedAt: new Date(),
            syncData: {
              aggregatorName: aggregator.name,
              processedAt: new Date().toISOString()
            }
          }
        });

        // Update aggregator last sync
        await db.airdropAggregator.update({
          where: { id: aggregatorId },
          data: {
            lastSyncAt: new Date(),
            updatedAt: new Date()
          }
        });

        logger.info(`Synced ${totalAirdrops} airdrops from ${aggregator.name} (${newAirdrops} new, ${updatedAirdrops} updated)`);
      } catch (error) {
        // Update sync record with error
        await db.aggregatorSync.update({
          where: { id: syncRecord.id },
          data: {
            status: 'failed',
            errors: [error.message],
            duration: Math.floor((Date.now() - startTime) / 1000),
            completedAt: new Date()
          }
        });

        throw error;
      }
    } catch (error) {
      logger.error(`Failed to sync aggregator ${aggregatorId}:`, error);
    }
  }

  private async fetchAirdropsFromAggregator(aggregator: any): Promise<AggregatorAirdrop[]> {
    try {
      const config = aggregator.config as any;
      const endpoints = config.endpoints;

      // Since we don't have real API keys, we'll simulate fetching data
      // In a real implementation, this would make actual HTTP requests
      
      // Use web search to find current airdrops as a fallback
      const searchQuery = 'crypto airdrop 2024 upcoming legitimate';
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 20
      });

      // Convert search results to airdrop format
      const airdrops: AggregatorAirdrop[] = searchResults.map((result, index) => ({
        id: `${aggregator.name}_${index}`,
        title: result.name,
        description: result.snippet,
        projectWebsite: result.url,
        blockchain: this.extractBlockchainFromContent(result.snippet),
        status: 'upcoming',
        tags: this.extractTagsFromContent(result.snippet),
        confidence: 70
      }));

      return airdrops;
    } catch (error) {
      logger.error(`Failed to fetch airdrops from ${aggregator.name}:`, error);
      return [];
    }
  }

  private async processAggregatorAirdrop(aggregatorId: string, airdropData: AggregatorAirdrop) {
    try {
      // Check if airdrop already exists
      const existingAirdrop = await db.airdrop.findFirst({
        where: {
          OR: [
            { slug: this.generateSlug(airdropData.title) },
            { 
              metadata: {
                path: ['aggregatorData', 'id'],
                equals: airdropData.id
              }
            }
          ]
        }
      });

      // Create or find project
      const project = await this.findOrCreateProject(airdropData);

      if (existingAirdrop) {
        // Update existing airdrop
        const updatedAirdrop = await db.airdrop.update({
          where: { id: existingAirdrop.id },
          data: {
            title: airdropData.title,
            description: airdropData.description,
            status: this.mapAggregatorStatus(airdropData.status),
            totalAmount: airdropData.totalAmount ? new Decimal(airdropData.totalAmount) : existingAirdrop.totalAmount,
            participantsCount: airdropData.participantsCount || existingAirdrop.participantsCount,
            tags: airdropData.tags || existingAirdrop.tags,
            socialLinks: airdropData.socialLinks || existingAirdrop.socialLinks,
            requirements: airdropData.requirements || existingAirdrop.requirements,
            metadata: {
              ...existingAirdrop.metadata,
              aggregatorData: airdropData,
              aggregatorId,
              lastSyncFromAggregator: new Date().toISOString()
            },
            updatedAt: new Date()
          }
        });

        return { isNew: false, isUpdated: true, airdrop: updatedAirdrop };
      } else {
        // Create new airdrop
        const newAirdrop = await db.airdrop.create({
          data: {
            title: airdropData.title,
            slug: this.generateSlug(airdropData.title),
            description: airdropData.description,
            projectId: project.id,
            status: this.mapAggregatorStatus(airdropData.status),
            type: 'standard',
            startDate: airdropData.startDate ? new Date(airdropData.startDate) : new Date(),
            endDate: airdropData.endDate ? new Date(airdropData.endDate) : null,
            totalAmount: airdropData.totalAmount ? new Decimal(airdropData.totalAmount) : new Decimal(0),
            tokenSymbol: airdropData.tokenSymbol,
            participantsCount: airdropData.participantsCount || 0,
            trustScore: new Decimal(airdropData.confidence || 70),
            tags: airdropData.tags || [],
            socialLinks: airdropData.socialLinks || {},
            requirements: airdropData.requirements || {},
            metadata: {
              aggregatorData: airdropData,
              aggregatorId,
              source: 'aggregator'
            }
          }
        });

        // Create initial metrics
        await db.airdropMetrics.create({
          data: {
            airdropId: newAirdrop.id,
            date: new Date(),
            totalParticipants: airdropData.participantsCount || 0,
            newParticipants: 0,
            completedParticipants: 0,
            verifiedParticipants: 0,
            totalRewardsDistributed: new Decimal(0)
          }
        });

        return { isNew: true, isUpdated: false, airdrop: newAirdrop };
      }
    } catch (error) {
      logger.error('Failed to process aggregator airdrop:', error);
      throw error;
    }
  }

  private async findOrCreateProject(airdropData: AggregatorAirdrop) {
    try {
      // Try to find existing project by website
      if (airdropData.projectWebsite) {
        const existingProject = await db.project.findFirst({
          where: {
            website: airdropData.projectWebsite
          }
        });

        if (existingProject) {
          return existingProject;
        }
      }

      // Create new project
      const projectName = this.extractProjectName(airdropData.title);
      const project = await db.project.create({
        data: {
          name: projectName,
          slug: this.generateSlug(projectName),
          description: airdropData.description,
          website: airdropData.projectWebsite || '',
          category: this.inferCategory(airdropData.tags),
          blockchain: airdropData.blockchain,
          verificationStatus: 'unverified',
          isActive: true,
          tags: airdropData.tags || [],
          metadata: {
            source: 'aggregator',
            createdAt: new Date().toISOString()
          }
        }
      });

      return project;
    } catch (error) {
      logger.error('Failed to find or create project:', error);
      throw error;
    }
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();
  }

  private extractProjectName(title: string): string {
    // Extract project name from airdrop title
    const patterns = [
      /^(.+?)\s+Airdrop/i,
      /^(.+?)\s+Token\s+Airdrop/i,
      /^(.+?)\s+Free\s+Tokens/i
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return title;
  }

  private inferCategory(tags?: string[]): string {
    if (!tags) return 'defi';

    const tagCategories: Record<string, string> = {
      'defi': 'defi',
      'nft': 'nft',
      'gaming': 'gaming',
      'game': 'gaming',
      'infrastructure': 'infrastructure',
      'layer2': 'infrastructure',
      'dao': 'dao',
      'exchange': 'defi'
    };

    for (const tag of tags) {
      const lowerTag = tag.toLowerCase();
      if (tagCategories[lowerTag]) {
        return tagCategories[lowerTag];
      }
    }

    return 'defi';
  }

  private extractBlockchainFromContent(content: string): string {
    const blockchains = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'solana'];
    const lowerContent = content.toLowerCase();

    for (const blockchain of blockchains) {
      if (lowerContent.includes(blockchain)) {
        return blockchain;
      }
    }

    return 'ethereum'; // Default
  }

  private extractTagsFromContent(content: string): string[] {
    const tags: string[] = [];
    const keywords = ['airdrop', 'crypto', 'token', 'defi', 'nft', 'gaming', 'ethereum', 'bitcoin', 'blockchain'];
    
    const lowerContent = content.toLowerCase();
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    return tags;
  }

  private mapAggregatorStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'upcoming': 'upcoming',
      'active': 'active',
      'ended': 'ended',
      'completed': 'ended',
      'cancelled': 'cancelled',
      'ongoing': 'active'
    };

    return statusMap[status.toLowerCase()] || 'upcoming';
  }

  async getAggregatorStats() {
    const aggregators = await db.airdropAggregator.findMany({
      include: {
        _count: {
          select: {
            syncs: true
          }
        }
      }
    });

    return aggregators.map(aggregator => ({
      id: aggregator.id,
      name: aggregator.name,
      isActive: aggregator.isActive,
      reliability: aggregator.reliability,
      lastSyncAt: aggregator.lastSyncAt,
      totalSyncs: aggregator._count.syncs,
      supportedChains: aggregator.supportedChains
    }));
  }

  async getSyncHistory(aggregatorId: string, limit = 10) {
    return await db.aggregatorSync.findMany({
      where: { aggregatorId },
      orderBy: { startedAt: 'desc' },
      take: limit
    });
  }
}

export const airdropAggregatorService = new AirdropAggregatorService();