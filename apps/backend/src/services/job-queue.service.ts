import { Queue, Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from '@/lib/db';
import { VettingService } from './vetting.service';
import { DiscoveryService } from './discovery.service';
import { 
  JobStatus, 
  JobType, 
  DiscoveryStatus,
  VettingJob 
} from '@prisma/client';

export interface JobData {
  type: JobType;
  discoveredAirdropId?: string;
  config?: any;
  sourceId?: string;
  sourceType?: string;
}

export class JobQueueService {
  private static redisConnection: Redis;
  private static discoveryQueue: Queue<JobData>;
  private static vettingQueue: Queue<JobData>;
  private static discoveryWorker: Worker<JobData>;
  private static vettingWorker: Worker<JobData>;

  /**
   * Initialize job queues and workers
   */
  static async initialize(): Promise<void> {
    try {
      // Initialize Redis connection
      this.redisConnection = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
      });

      // Initialize queues
      this.discoveryQueue = new Queue<JobData>('discovery-queue', {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      this.vettingQueue = new Queue<JobData>('vetting-queue', {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Initialize workers
      this.initializeWorkers();

      console.log('Job queues initialized successfully');

    } catch (error) {
      console.error('Error initializing job queues:', error);
      throw error;
    }
  }

  /**
   * Initialize workers
   */
  private static initializeWorkers(): void {
    // Discovery worker
    this.discoveryWorker = new Worker<JobData>(
      'discovery-queue',
      async (job: Job<JobData>) => {
        await this.processDiscoveryJob(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 2, // Limit concurrent discovery jobs
      }
    );

    // Vetting worker
    this.vettingWorker = new Worker<JobData>(
      'vetting-queue',
      async (job: Job<JobData>) => {
        await this.processVettingJob(job);
      },
      {
        connection: this.redisConnection,
        concurrency: 5, // Allow more concurrent vetting jobs
      }
    );

    // Worker event listeners
    this.discoveryWorker.on('completed', (job) => {
      console.log(`Discovery job completed: ${job.id}`);
    });

    this.discoveryWorker.on('failed', (job, err) => {
      console.error(`Discovery job failed: ${job?.id}`, err);
    });

    this.vettingWorker.on('completed', (job) => {
      console.log(`Vetting job completed: ${job.id}`);
    });

    this.vettingWorker.on('failed', (job, err) => {
      console.error(`Vetting job failed: ${job?.id}`, err);
    });
  }

  /**
   * Process discovery job
   */
  private static async processDiscoveryJob(job: Job<JobData>): Promise<void> {
    const { type, sourceId, sourceType, config } = job.data;

    try {
      console.log(`Processing discovery job: ${type} for source: ${sourceId}`);

      let scrapedAirdrops: any[] = [];

      switch (type) {
        case JobType.SCRAPE_TWITTER:
          scrapedAirdrops = await DiscoveryService.scrapeTwitter(
            config?.hashtags,
            config?.accounts
          );
          break;
        case JobType.SCRAPE_WEBSITE:
          if (config?.url) {
            const result = await DiscoveryService.scrapeWebsite(config.url);
            scrapedAirdrops = result ? [result] : [];
          }
          break;
        case JobType.EXTERNAL_API_CALL:
          // Handle external API calls for discovery
          scrapedAirdrops = await this.processExternalAPICall(config);
          break;
        default:
          throw new Error(`Unsupported discovery job type: ${type}`);
      }

      // Save discovered airdrops
      for (const scrapedAirdrop of scrapedAirdrops) {
        if (sourceId) {
          await DiscoveryService.saveDiscoveredAirdrop(sourceId, scrapedAirdrop);
        }
      }

      // Update source last scraped time
      if (sourceId) {
        await db.discoverySource.update({
          where: { id: sourceId },
          data: { lastScraped: new Date() }
        });
      }

      console.log(`Discovery job ${job.id} completed. Found ${scrapedAirdrops.length} airdrops`);

    } catch (error) {
      console.error(`Error processing discovery job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Process vetting job
   */
  private static async processVettingJob(job: Job<JobData>): Promise<void> {
    const { type, discoveredAirdropId, config } = job.data;

    try {
      console.log(`Processing vetting job: ${type} for airdrop: ${discoveredAirdropId}`);

      if (!discoveredAirdropId) {
        throw new Error('Discovered airdrop ID is required for vetting jobs');
      }

      // Find the corresponding database job
      const dbJob = await db.vettingJob.findFirst({
        where: {
          discoveredAirdropId,
          type,
          status: {
            in: [JobStatus.PENDING, JobStatus.RETRYING]
          }
        }
      });

      if (!dbJob) {
        throw new Error(`Vetting job not found in database for airdrop: ${discoveredAirdropId}`);
      }

      // Update job status to running
      await db.vettingJob.update({
        where: { id: dbJob.id },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date(),
          progress: 0
        }
      });

      // Process the vetting
      await VettingService.processVettingJob(dbJob.id);

      console.log(`Vetting job ${job.id} completed successfully`);

    } catch (error) {
      console.error(`Error processing vetting job ${job.id}:`, error);
      throw error;
    }
  }

  /**
   * Process external API call
   */
  private static async processExternalAPICall(config: any): Promise<any[]> {
    // This would handle external API calls for discovery
    // For example, calling CoinGecko, DeFi Pulse, etc.
    return [];
  }

  /**
   * Add discovery job
   */
  static async addDiscoveryJob(
    type: JobType,
    sourceId: string,
    config?: any,
    delay: number = 0
  ): Promise<string> {
    const jobData: JobData = {
      type,
      sourceId,
      config
    };

    const job = await this.discoveryQueue.add(
      `discovery-${type}`,
      jobData,
      {
        delay,
        priority: type === JobType.SCRAPE_TWITTER ? 10 : 5,
      }
    );

    console.log(`Discovery job added: ${job.id}`);
    return job.id!;
  }

  /**
   * Add vetting job
   */
  static async addVettingJob(
    type: JobType,
    discoveredAirdropId: string,
    config?: any,
    delay: number = 0
  ): Promise<string> {
    const jobData: JobData = {
      type,
      discoveredAirdropId,
      config
    };

    const job = await this.vettingQueue.add(
      `vetting-${type}`,
      jobData,
      {
        delay,
        priority: type === JobType.VETTING_SANITY ? 10 : 
                   type === JobType.VETTING_FUNDAMENTALS ? 8 : 5,
      }
    );

    console.log(`Vetting job added: ${job.id}`);
    return job.id!;
  }

  /**
   * Schedule recurring discovery jobs
   */
  static async scheduleRecurringJobs(): Promise<void> {
    try {
      // Get active discovery sources
      const sources = await db.discoverySource.findMany({
        where: { isActive: true }
      });

      for (const source of sources) {
        const jobType = this.getJobTypeForSource(source.type);
        if (jobType) {
          // Schedule job to run every 30 minutes
          await this.discoveryQueue.add(
            `recurring-discovery-${source.id}`,
            {
              type: jobType,
              sourceId: source.id,
              config: source.config
            },
            {
              repeat: { pattern: '*/30 * * * *' }, // Every 30 minutes
              priority: 5
            }
          );
        }
      }

      console.log('Recurring discovery jobs scheduled');

    } catch (error) {
      console.error('Error scheduling recurring jobs:', error);
    }
  }

  /**
   * Get job type for discovery source
   */
  private static getJobTypeForSource(sourceType: string): JobType | null {
    switch (sourceType) {
      case 'TWITTER':
        return JobType.SCRAPE_TWITTER;
      case 'WEBSITE':
        return JobType.SCRAPE_WEBSITE;
      case 'REDDIT':
        return JobType.SCRAPE_WEBSITE; // Use website scraper for Reddit
      default:
        return null;
    }
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<any> {
    try {
      const [discoveryWaiting, discoveryActive, discoveryCompleted, discoveryFailed] = await Promise.all([
        this.discoveryQueue.getWaiting(),
        this.discoveryQueue.getActive(),
        this.discoveryQueue.getCompleted(),
        this.discoveryQueue.getFailed()
      ]);

      const [vettingWaiting, vettingActive, vettingCompleted, vettingFailed] = await Promise.all([
        this.vettingQueue.getWaiting(),
        this.vettingQueue.getActive(),
        this.vettingQueue.getCompleted(),
        this.vettingQueue.getFailed()
      ]);

      return {
        discovery: {
          waiting: discoveryWaiting.length,
          active: discoveryActive.length,
          completed: discoveryCompleted.length,
          failed: discoveryFailed.length
        },
        vetting: {
          waiting: vettingWaiting.length,
          active: vettingActive.length,
          completed: vettingCompleted.length,
          failed: vettingFailed.length
        }
      };

    } catch (error) {
      console.error('Error getting queue stats:', error);
      return null;
    }
  }

  /**
   * Pause queues
   */
  static async pauseQueues(): Promise<void> {
    await this.discoveryQueue.pause();
    await this.vettingQueue.pause();
    console.log('Queues paused');
  }

  /**
   * Resume queues
   */
  static async resumeQueues(): Promise<void> {
    await this.discoveryQueue.resume();
    await this.vettingQueue.resume();
    console.log('Queues resumed');
  }

  /**
   * Graceful shutdown
   */
  static async shutdown(): Promise<void> {
    console.log('Shutting down job queues...');

    await this.discoveryWorker.close();
    await this.vettingWorker.close();
    await this.discoveryQueue.close();
    await this.vettingQueue.close();
    await this.redisConnection.quit();

    console.log('Job queues shut down successfully');
  }
}