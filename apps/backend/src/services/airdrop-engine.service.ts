import { db } from '@/lib/db';
import { DiscoveryService } from './discovery.service';
import { VettingService } from './vetting.service';
import { JobQueueService } from './job-queue.service';
import { 
  DiscoverySource, 
  SourceType, 
  DiscoveryStatus,
  DiscoveredAirdrop 
} from '@prisma/client';

export class AirdropEngineService {
  private static isInitialized = false;

  /**
   * Initialize the airdrop engine
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Airdrop engine already initialized');
      return;
    }

    try {
      console.log('Initializing airdrop engine...');

      // Initialize job queues
      await JobQueueService.initialize();

      // Create default discovery sources if they don't exist
      await this.createDefaultDiscoverySources();

      // Schedule recurring jobs
      await JobQueueService.scheduleRecurringJobs();

      this.isInitialized = true;
      console.log('Airdrop engine initialized successfully');

    } catch (error) {
      console.error('Error initializing airdrop engine:', error);
      throw error;
    }
  }

  /**
   * Create default discovery sources
   */
  private static async createDefaultDiscoverySources(): Promise<void> {
    const defaultSources = [
      {
        name: 'Twitter Airdrops',
        type: SourceType.TWITTER,
        url: 'https://twitter.com',
        config: {
          hashtags: ['airdrop', 'cryptoairdrop', 'defiairdrop'],
          accounts: ['airdropalert', 'defi_prime', 'coinmarketcap'],
          searchQuery: 'airdrop OR cryptoairdrop OR giveaway -filter:retweets'
        }
      },
      {
        name: 'Reddit Airdrops',
        type: SourceType.REDDIT,
        url: 'https://reddit.com',
        config: {
          subreddits: ['airdrops', 'CryptoAirdrops', 'Airdrop_hunters'],
          minScore: 10,
          maxAge: 24 // hours
        }
      },
      {
        name: 'DeFi Pulse',
        type: SourceType.WEBSITE,
        url: 'https://defipulse.com',
        config: {
          scrapeInterval: 3600000, // 1 hour
          selectors: {
            airdropLinks: 'a[href*="airdrop"]',
            projectCards: '.project-card'
          }
        }
      },
      {
        name: 'CoinGecko New Listings',
        type: SourceType.WEBSITE,
        url: 'https://www.coingecko.com',
        config: {
          scrapeInterval: 1800000, // 30 minutes
          endpoints: ['/api/v3/coins/list'],
          filters: {
            minMarketCap: 1000000,
            maxAge: 7 // days
          }
        }
      }
    ];

    for (const sourceData of defaultSources) {
      const existingSource = await db.discoverySource.findFirst({
        where: { name: sourceData.name }
      });

      if (!existingSource) {
        await db.discoverySource.create({
          data: {
            ...sourceData,
            isActive: true
          }
        });
        console.log(`Created discovery source: ${sourceData.name}`);
      }
    }
  }

  /**
   * Run manual discovery
   */
  static async runManualDiscovery(sourceIds?: string[]): Promise<void> {
    try {
      console.log('Starting manual discovery...');

      const sources = sourceIds 
        ? await db.discoverySource.findMany({
            where: { 
              id: { in: sourceIds },
              isActive: true 
            }
          })
        : await db.discoverySource.findMany({
            where: { isActive: true }
          });

      for (const source of sources) {
        const jobType = this.getJobTypeForSource(source.type);
        if (jobType) {
          await JobQueueService.addDiscoveryJob(
            jobType,
            source.id,
            source.config
          );
        }
      }

      console.log(`Manual discovery started for ${sources.length} sources`);

    } catch (error) {
      console.error('Error running manual discovery:', error);
      throw error;
    }
  }

  /**
   * Start vetting for discovered airdrops
   */
  static async startVettingForDiscoveredAirdrops(limit: number = 10): Promise<void> {
    try {
      console.log('Starting vetting for discovered airdrops...');

      const discoveredAirdrops = await db.discoveredAirdrop.findMany({
        where: {
          status: DiscoveryStatus.DISCOVERED
        },
        take: limit,
        orderBy: { discoveredAt: 'asc' }
      });

      for (const discoveredAirdrop of discoveredAirdrops) {
        await VettingService.startVetting(discoveredAirdrop.id);
        
        // Add vetting jobs to queue
        await JobQueueService.addVettingJob(
          'VETTING_SANITY' as any,
          discoveredAirdrop.id,
          { layer: 'SECURITY' }
        );
        await JobQueueService.addVettingJob(
          'VETTING_FUNDAMENTALS' as any,
          discoveredAirdrop.id,
          { layer: 'TECHNICAL' },
          5000 // 5 second delay
        );
        await JobQueueService.addVettingJob(
          'VETTING_AI_ANALYSIS' as any,
          discoveredAirdrop.id,
          { layer: 'COMMUNITY' },
          10000 // 10 second delay
        );
      }

      console.log(`Started vetting for ${discoveredAirdrops.length} airdrops`);

    } catch (error) {
      console.error('Error starting vetting:', error);
      throw error;
    }
  }

  /**
   * Get engine statistics
   */
  static async getEngineStats(): Promise<any> {
    try {
      const [
        totalSources,
        activeSources,
        totalDiscovered,
        pendingReview,
        approved,
        rejected,
        queueStats
      ] = await Promise.all([
        db.discoverySource.count(),
        db.discoverySource.count({ where: { isActive: true } }),
        db.discoveredAirdrop.count(),
        db.discoveredAirdrop.count({ where: { status: DiscoveryStatus.DISCOVERED } }),
        db.discoveredAirdrop.count({ where: { status: DiscoveryStatus.APPROVED } }),
        db.discoveredAirdrop.count({ where: { status: DiscoveryStatus.REJECTED } }),
        JobQueueService.getQueueStats()
      ]);

      return {
        discovery: {
          totalSources,
          activeSources,
          totalDiscovered,
          pendingReview,
          approved,
          rejected
        },
        queues: queueStats,
        isInitialized: this.isInitialized
      };

    } catch (error) {
      console.error('Error getting engine stats:', error);
      return null;
    }
  }

  /**
   * Get recent discoveries
   */
  static async getRecentDiscoveries(limit: number = 20): Promise<DiscoveredAirdrop[]> {
    try {
      return await db.discoveredAirdrop.findMany({
        take: limit,
        orderBy: { discoveredAt: 'desc' },
        include: {
          source: true,
          vettingReports: {
            orderBy: { generatedAt: 'desc' },
            take: 3
          },
          _count: {
            select: {
              vettingJobs: true
            }
          }
        }
      });

    } catch (error) {
      console.error('Error getting recent discoveries:', error);
      return [];
    }
  }

  /**
   * Add custom discovery source
   */
  static async addDiscoverySource(
    name: string,
    type: SourceType,
    url: string,
    config: any = {}
  ): Promise<DiscoverySource> {
    try {
      const source = await db.discoverySource.create({
        data: {
          name,
          type,
          url,
          config,
          isActive: true
        }
      });

      console.log(`Added discovery source: ${name}`);
      return source;

    } catch (error) {
      console.error('Error adding discovery source:', error);
      throw error;
    }
  }

  /**
   * Update discovery source
   */
  static async updateDiscoverySource(
    id: string,
    updates: Partial<{
      name: string;
      url: string;
      config: any;
      isActive: boolean;
    }>
  ): Promise<DiscoverySource> {
    try {
      const source = await db.discoverySource.update({
        where: { id },
        data: updates
      });

      console.log(`Updated discovery source: ${source.name}`);
      return source;

    } catch (error) {
      console.error('Error updating discovery source:', error);
      throw error;
    }
  }

  /**
   * Delete discovery source
   */
  static async deleteDiscoverySource(id: string): Promise<void> {
    try {
      await db.discoverySource.delete({
        where: { id }
      });

      console.log(`Deleted discovery source: ${id}`);

    } catch (error) {
      console.error('Error deleting discovery source:', error);
      throw error;
    }
  }

  /**
   * Get job type for discovery source
   */
  private static getJobTypeForSource(sourceType: SourceType): string | null {
    switch (sourceType) {
      case SourceType.TWITTER:
        return 'SCRAPE_TWITTER';
      case SourceType.WEBSITE:
        return 'SCRAPE_WEBSITE';
      case SourceType.REDDIT:
        return 'SCRAPE_WEBSITE';
      default:
        return null;
    }
  }

  /**
   * Cleanup old data
   */
  static async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Clean up old discovered airdrops that were rejected
      const deletedAirdrops = await db.discoveredAirdrop.deleteMany({
        where: {
          status: DiscoveryStatus.REJECTED,
          discoveredAt: {
            lt: cutoffDate
          }
        }
      });

      // Clean up old completed jobs
      const deletedJobs = await db.vettingJob.deleteMany({
        where: {
          status: 'COMPLETED',
          completedAt: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleanup completed. Deleted ${deletedAirdrops.count} airdrops and ${deletedJobs.count} jobs`);

    } catch (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Export data for analysis
   */
  static async exportData(format: 'json' | 'csv' = 'json'): Promise<any> {
    try {
      const discoveredAirdrops = await db.discoveredAirdrop.findMany({
        include: {
          source: true,
          vettingReports: true,
          vettingJobs: true
        }
      });

      if (format === 'csv') {
        // Convert to CSV format (simplified)
        const csvData = discoveredAirdrops.map(airdrop => ({
          id: airdrop.id,
          name: airdrop.name,
          status: airdrop.status,
          source: airdrop.source.name,
          discoveredAt: airdrop.discoveredAt,
          priority: airdrop.priority,
          vettingScore: airdrop.vettingReports.length > 0 
            ? airdrop.vettingReports.reduce((sum, report) => sum + report.score, 0) / airdrop.vettingReports.length 
            : null
        }));

        return csvData;
      }

      return discoveredAirdrops;

    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  static async shutdown(): Promise<void> {
    try {
      console.log('Shutting down airdrop engine...');
      
      await JobQueueService.shutdown();
      
      this.isInitialized = false;
      console.log('Airdrop engine shut down successfully');

    } catch (error) {
      console.error('Error shutting down airdrop engine:', error);
      throw error;
    }
  }
}