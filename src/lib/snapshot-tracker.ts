import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface SnapshotConfig {
  airdropId: string;
  contractAddress?: string;
  blockchain: string;
  snapshotType: 'balance' | 'holder' | 'specific' | 'custom';
  blockNumber?: bigint;
  blockTimestamp?: Date;
  criteria: any;
  scheduledFor?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SnapshotResult {
  id: string;
  airdropId: string;
  contractAddress?: string;
  blockchain: string;
  blockNumber: bigint;
  blockTimestamp: Date;
  snapshotType: string;
  totalHolders: number;
  totalBalance: number;
  criteria: any;
  data: any;
  filePath?: string;
  fileSize?: number;
  status: string;
  errorMessage?: string;
  processedAt?: Date;
  metadata: any;
}

export interface SnapshotAlert {
  id: string;
  airdropId: string;
  type: 'scheduled' | 'completed' | 'failed' | 'deadline_approaching' | 'criteria_changed';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  data?: any;
  createdAt: Date;
  readAt?: Date;
}

export class SnapshotTrackerService {
  private zai: ZAI;
  private scheduledSnapshots: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initialize() {
    try {
      // Load pending snapshots
      await this.loadPendingSnapshots();
      
      // Start monitoring for upcoming snapshots
      this.startSnapshotMonitoring();
      
      logger.info('Snapshot tracker service initialized');
    } catch (error) {
      logger.error('Failed to initialize snapshot tracker:', error);
    }
  }

  async scheduleSnapshot(config: SnapshotConfig): Promise<SnapshotResult> {
    try {
      const snapshotId = `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create snapshot record
      const snapshot = await db.snapshotRecord.create({
        data: {
          id: snapshotId,
          airdropId: config.airdropId,
          contractAddress: config.contractAddress,
          blockchain: config.blockchain,
          blockNumber: config.blockNumber || BigInt(0),
          blockTimestamp: config.blockTimestamp || new Date(),
          snapshotType: config.snapshotType,
          totalHolders: 0,
          totalBalance: 0,
          criteria: config.criteria,
          data: {},
          status: 'processing',
          metadata: {
            scheduledAt: new Date().toISOString(),
            priority: config.priority,
            config
          }
        }
      });

      // Schedule snapshot if needed
      if (config.scheduledFor && config.scheduledFor > new Date()) {
        await this.scheduleSnapshotExecution(snapshotId, config.scheduledFor);
      } else {
        // Execute immediately
        await this.executeSnapshot(snapshotId);
      }

      logger.info(`Scheduled snapshot ${snapshotId} for airdrop ${config.airdropId}`);
      return snapshot;
    } catch (error) {
      logger.error('Failed to schedule snapshot:', error);
      throw error;
    }
  }

  private async loadPendingSnapshots(): Promise<void> {
    try {
      const pendingSnapshots = await db.snapshotRecord.findMany({
        where: {
          status: 'processing'
        }
      });

      for (const snapshot of pendingSnapshots) {
        const scheduledFor = snapshot.metadata?.scheduledAt;
        if (scheduledFor) {
          const scheduledDate = new Date(scheduledFor);
          if (scheduledDate > new Date()) {
            await this.scheduleSnapshotExecution(snapshot.id, scheduledDate);
          } else {
            // Should have been executed, run now
            await this.executeSnapshot(snapshot.id);
          }
        }
      }

      logger.info(`Loaded ${pendingSnapshots.length} pending snapshots`);
    } catch (error) {
      logger.error('Failed to load pending snapshots:', error);
    }
  }

  private async scheduleSnapshotExecution(snapshotId: string, scheduledFor: Date): Promise<void> {
    try {
      const delay = scheduledFor.getTime() - new Date().getTime();
      
      if (delay <= 0) {
        await this.executeSnapshot(snapshotId);
        return;
      }

      const timeout = setTimeout(async () => {
        await this.executeSnapshot(snapshotId);
      }, delay);

      this.scheduledSnapshots.set(snapshotId, timeout);

      logger.info(`Scheduled snapshot execution for ${snapshotId} at ${scheduledFor.toISOString()}`);
    } catch (error) {
      logger.error(`Failed to schedule snapshot execution for ${snapshotId}:`, error);
    }
  }

  private async executeSnapshot(snapshotId: string): Promise<void> {
    try {
      const snapshot = await db.snapshotRecord.findUnique({
        where: { id: snapshotId },
        include: {
          airdrop: {
            include: {
              project: true
            }
          }
        }
      });

      if (!snapshot) {
        logger.error(`Snapshot ${snapshotId} not found`);
        return;
      }

      logger.info(`Executing snapshot ${snapshotId} for airdrop ${snapshot.airdropId}`);

      // Update status to processing
      await db.snapshotRecord.update({
        where: { id: snapshotId },
        data: {
          status: 'processing',
          metadata: {
            ...snapshot.metadata,
            executionStarted: new Date().toISOString()
          }
        }
      });

      // Execute snapshot based on type
      let result: any;
      switch (snapshot.snapshotType) {
        case 'balance':
          result = await this.executeBalanceSnapshot(snapshot);
          break;
        case 'holder':
          result = await this.executeHolderSnapshot(snapshot);
          break;
        case 'specific':
          result = await this.executeSpecificSnapshot(snapshot);
          break;
        case 'custom':
          result = await this.executeCustomSnapshot(snapshot);
          break;
        default:
          throw new Error(`Unknown snapshot type: ${snapshot.snapshotType}`);
      }

      // Update snapshot with results
      await db.snapshotRecord.update({
        where: { id: snapshotId },
        data: {
          blockNumber: result.blockNumber || snapshot.blockNumber,
          blockTimestamp: result.blockTimestamp || snapshot.blockTimestamp,
          totalHolders: result.totalHolders || 0,
          totalBalance: result.totalBalance || 0,
          data: result.data || {},
          filePath: result.filePath,
          fileSize: result.fileSize,
          status: 'completed',
          processedAt: new Date(),
          metadata: {
            ...snapshot.metadata,
            executionCompleted: new Date().toISOString(),
            executionDuration: Date.now() - new Date(snapshot.metadata.executionStarted).getTime()
          }
        }
      });

      // Create completion alert
      await this.createSnapshotAlert(snapshot.airdropId, {
        type: 'completed',
        severity: 'info',
        title: 'Snapshot Completed',
        message: `Snapshot ${snapshotId} has been completed successfully`,
        data: {
          snapshotId,
          totalHolders: result.totalHolders,
          totalBalance: result.totalBalance
        }
      });

      // Process eligibility based on snapshot
      await this.processEligibilityFromSnapshot(snapshot, result);

      logger.info(`Successfully executed snapshot ${snapshotId}`);
    } catch (error) {
      logger.error(`Failed to execute snapshot ${snapshotId}:`, error);
      
      // Update snapshot with error
      await db.snapshotRecord.update({
        where: { id: snapshotId },
        data: {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            executionFailed: new Date().toISOString()
          }
        }
      });

      // Create error alert
      const snapshot = await db.snapshotRecord.findUnique({ where: { id: snapshotId } });
      if (snapshot) {
        await this.createSnapshotAlert(snapshot.airdropId, {
          type: 'failed',
          severity: 'error',
          title: 'Snapshot Failed',
          message: `Snapshot ${snapshotId} failed to execute`,
          data: {
            snapshotId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
      }
    } finally {
      // Clear scheduled timeout
      if (this.scheduledSnapshots.has(snapshotId)) {
        clearTimeout(this.scheduledSnapshots.get(snapshotId)!);
        this.scheduledSnapshots.delete(snapshotId);
      }
    }
  }

  private async executeBalanceSnapshot(snapshot: any): Promise<any> {
    try {
      // Simulated balance snapshot execution
      // In a real implementation, this would query the blockchain for token balances
      
      const blockNumber = BigInt(Math.floor(Math.random() * 1000000) + 18000000);
      const blockTimestamp = new Date();
      
      // Generate simulated holder data
      const holderCount = Math.floor(Math.random() * 10000) + 100;
      const holders = [];
      let totalBalance = 0;

      for (let i = 0; i < holderCount; i++) {
        const balance = Math.random() * 10000;
        totalBalance += balance;
        
        holders.push({
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          balance: balance,
          percentage: (balance / totalBalance) * 100
        });
      }

      // Sort by balance descending
      holders.sort((a, b) => b.balance - a.balance);

      const data = {
        type: 'balance_snapshot',
        holders: holders.slice(0, 1000), // Limit to top 1000
        totalHolders: holderCount,
        totalBalance,
        averageBalance: totalBalance / holderCount,
        topHolders: holders.slice(0, 10),
        distribution: this.calculateDistribution(holders)
      };

      // Save to file (simulated)
      const filePath = `/snapshots/balance_${snapshot.id}.json`;
      const fileSize = JSON.stringify(data).length;

      return {
        blockNumber,
        blockTimestamp,
        totalHolders: holderCount,
        totalBalance,
        data,
        filePath,
        fileSize
      };
    } catch (error) {
      logger.error('Failed to execute balance snapshot:', error);
      throw error;
    }
  }

  private async executeHolderSnapshot(snapshot: any): Promise<any> {
    try {
      // Simulated holder snapshot (focuses on unique holders regardless of balance)
      const blockNumber = BigInt(Math.floor(Math.random() * 1000000) + 18000000);
      const blockTimestamp = new Date();
      
      const holderCount = Math.floor(Math.random() * 5000) + 50;
      const holders = [];

      for (let i = 0; i < holderCount; i++) {
        holders.push({
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          firstSeen: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          transactionCount: Math.floor(Math.random() * 100) + 1,
          isContract: Math.random() > 0.8
        });
      }

      const data = {
        type: 'holder_snapshot',
        holders,
        totalHolders: holderCount,
        uniqueHolders: holders.filter(h => !h.isContract).length,
        contractHolders: holders.filter(h => h.isContract).length,
        averageAge: holders.reduce((sum, h) => sum + (Date.now() - h.firstSeen.getTime()), 0) / holders.length,
        averageTransactions: holders.reduce((sum, h) => sum + h.transactionCount, 0) / holders.length
      };

      const filePath = `/snapshots/holder_${snapshot.id}.json`;
      const fileSize = JSON.stringify(data).length;

      return {
        blockNumber,
        blockTimestamp,
        totalHolders: holderCount,
        totalBalance: 0,
        data,
        filePath,
        fileSize
      };
    } catch (error) {
      logger.error('Failed to execute holder snapshot:', error);
      throw error;
    }
  }

  private async executeSpecificSnapshot(snapshot: any): Promise<any> {
    try {
      // Simulated specific snapshot based on custom criteria
      const criteria = snapshot.criteria || {};
      const blockNumber = BigInt(Math.floor(Math.random() * 1000000) + 18000000);
      const blockTimestamp = new Date();
      
      let qualifiedHolders = [];
      const totalChecked = Math.floor(Math.random() * 10000) + 100;

      for (let i = 0; i < totalChecked; i++) {
        const holder = {
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          balance: Math.random() * 10000,
          transactions: Math.floor(Math.random() * 100),
          age: Math.floor(Math.random() * 365)
        };

        // Check if holder meets criteria
        const qualified = this.checkCriteria(holder, criteria);
        if (qualified) {
          qualifiedHolders.push(holder);
        }
      }

      const data = {
        type: 'specific_snapshot',
        criteria,
        totalChecked,
        qualifiedHolders,
        totalQualified: qualifiedHolders.length,
        qualificationRate: (qualifiedHolders.length / totalChecked) * 100,
        qualifiedAddresses: qualifiedHolders.map(h => h.address)
      };

      const filePath = `/snapshots/specific_${snapshot.id}.json`;
      const fileSize = JSON.stringify(data).length;

      return {
        blockNumber,
        blockTimestamp,
        totalHolders: qualifiedHolders.length,
        totalBalance: qualifiedHolders.reduce((sum, h) => sum + h.balance, 0),
        data,
        filePath,
        fileSize
      };
    } catch (error) {
      logger.error('Failed to execute specific snapshot:', error);
      throw error;
    }
  }

  private async executeCustomSnapshot(snapshot: any): Promise<any> {
    try {
      // Custom snapshot execution based on AI analysis
      const prompt = `
        Design a custom snapshot strategy for this airdrop:
        
        Airdrop: ${snapshot.airdrop.title}
        Project: ${snapshot.airdrop.project.name}
        Category: ${snapshot.airdrop.project.category}
        Blockchain: ${snapshot.blockchain}
        
        Criteria: ${JSON.stringify(snapshot.criteria)}
        
        Provide a JSON response with:
        {
          "strategy": "description of the snapshot strategy",
          "targetSegments": ["segment1", "segment2"],
          "weights": {"segment1": 0.6, "segment2": 0.4},
          "estimatedHolders": number,
          "implementation": "steps to implement"
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert blockchain snapshot strategist.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      const strategy = JSON.parse(response || '{}');

      const blockNumber = BigInt(Math.floor(Math.random() * 1000000) + 18000000);
      const blockTimestamp = new Date();
      
      // Generate simulated results based on strategy
      const estimatedHolders = strategy.estimatedHolders || Math.floor(Math.random() * 5000) + 100;
      const holders = [];

      for (const segment of strategy.targetSegments || []) {
        const segmentCount = Math.floor(estimatedHolders * (strategy.weights?.[segment] || 0.5));
        
        for (let i = 0; i < segmentCount; i++) {
          holders.push({
            address: `0x${Math.random().toString(16).substr(2, 40)}`,
            segment,
            weight: strategy.weights?.[segment] || 1,
            balance: Math.random() * 10000,
            qualificationScore: Math.random() * 100
          });
        }
      }

      const data = {
        type: 'custom_snapshot',
        strategy,
        holders,
        totalHolders: holders.length,
        segments: strategy.targetSegments || [],
        segmentDistribution: holders.reduce((acc, holder) => {
          acc[holder.segment] = (acc[holder.segment] || 0) + 1;
          return acc;
        }, {})
      };

      const filePath = `/snapshots/custom_${snapshot.id}.json`;
      const fileSize = JSON.stringify(data).length;

      return {
        blockNumber,
        blockTimestamp,
        totalHolders: holders.length,
        totalBalance: holders.reduce((sum, h) => sum + h.balance, 0),
        data,
        filePath,
        fileSize
      };
    } catch (error) {
      logger.error('Failed to execute custom snapshot:', error);
      throw error;
    }
  }

  private checkCriteria(holder: any, criteria: any): boolean {
    try {
      // Check minimum balance
      if (criteria.minBalance && holder.balance < criteria.minBalance) {
        return false;
      }

      // Check minimum transactions
      if (criteria.minTransactions && holder.transactions < criteria.minTransactions) {
        return false;
      }

      // Check minimum age
      if (criteria.minAge && holder.age < criteria.minAge) {
        return false;
      }

      // Check maximum balance (for anti-whale)
      if (criteria.maxBalance && holder.balance > criteria.maxBalance) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check criteria:', error);
      return false;
    }
  }

  private calculateDistribution(holders: any[]): any {
    try {
      const sorted = [...holders].sort((a, b) => a.balance - b.balance);
      const total = holders.length;
      
      return {
        top1: sorted.slice(-Math.ceil(total * 0.01)).reduce((sum, h) => sum + h.balance, 0),
        top5: sorted.slice(-Math.ceil(total * 0.05)).reduce((sum, h) => sum + h.balance, 0),
        top10: sorted.slice(-Math.ceil(total * 0.1)).reduce((sum, h) => sum + h.balance, 0),
        top25: sorted.slice(-Math.ceil(total * 0.25)).reduce((sum, h) => sum + h.balance, 0),
        bottom50: sorted.slice(0, Math.ceil(total * 0.5)).reduce((sum, h) => sum + h.balance, 0)
      };
    } catch (error) {
      logger.error('Failed to calculate distribution:', error);
      return {};
    }
  }

  private async processEligibilityFromSnapshot(snapshot: any, result: any): Promise<void> {
    try {
      // Get all users who have checked eligibility for this airdrop
      const eligibilityChecks = await db.eligibilityCheck.findMany({
        where: {
          airdropId: snapshot.airdropId,
          status: 'completed'
        },
        distinct: ['walletAddress'],
        select: {
          walletAddress: true
        }
      });

      // Check each user against the snapshot
      for (const check of eligibilityChecks) {
        const isInSnapshot = this.checkWalletInSnapshot(check.walletAddress, result.data);
        
        if (isInSnapshot) {
          // Update eligibility check with snapshot data
          await db.eligibilityCheck.updateMany({
            where: {
              airdropId: snapshot.airdropId,
              walletAddress: check.walletAddress
            },
            data: {
              results: {
                snapshotId: snapshot.id,
                inSnapshot: true,
                snapshotData: this.getWalletSnapshotData(check.walletAddress, result.data)
              }
            }
          });
        }
      }

      logger.info(`Processed eligibility for ${eligibilityChecks.length} wallets from snapshot ${snapshot.id}`);
    } catch (error) {
      logger.error('Failed to process eligibility from snapshot:', error);
    }
  }

  private checkWalletInSnapshot(walletAddress: string, snapshotData: any): boolean {
    try {
      if (!snapshotData.holders) return false;
      
      return snapshotData.holders.some((holder: any) => 
        holder.address.toLowerCase() === walletAddress.toLowerCase()
      );
    } catch (error) {
      logger.error('Failed to check wallet in snapshot:', error);
      return false;
    }
  }

  private getWalletSnapshotData(walletAddress: string, snapshotData: any): any {
    try {
      if (!snapshotData.holders) return null;
      
      const holder = snapshotData.holders.find((h: any) => 
        h.address.toLowerCase() === walletAddress.toLowerCase()
      );
      
      return holder || null;
    } catch (error) {
      logger.error('Failed to get wallet snapshot data:', error);
      return null;
    }
  }

  private async createSnapshotAlert(airdropId: string, alertData: any): Promise<void> {
    try {
      await db.userNotification.create({
        data: {
          type: 'snapshot_update',
          title: alertData.title,
          message: alertData.message,
          data: {
            airdropId,
            alertType: alertData.type,
            ...alertData.data
          },
          priority: alertData.severity === 'critical' ? 'high' : 'normal',
          category: alertData.severity === 'error' ? 'error' : 'info'
        }
      });

      logger.info(`Created snapshot alert for airdrop ${airdropId}: ${alertData.type}`);
    } catch (error) {
      logger.error('Failed to create snapshot alert:', error);
    }
  }

  private startSnapshotMonitoring(): void {
    // Check for upcoming snapshots every 5 minutes
    setInterval(async () => {
      await this.checkUpcomingSnapshots();
    }, 5 * 60 * 1000);
  }

  private async checkUpcomingSnapshots(): Promise<void> {
    try {
      const upcomingSnapshots = await db.snapshotRecord.findMany({
        where: {
          status: 'processing',
          metadata: {
            path: ['scheduledAt'],
            not: null
          }
        },
        include: {
          airdrop: {
            select: {
              title: true,
              endDate: true
            }
          }
        }
      });

      const now = new Date();
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

      for (const snapshot of upcomingSnapshots) {
        const scheduledFor = new Date(snapshot.metadata.scheduledAt);
        
        // Alert if snapshot is within the next hour
        if (scheduledFor > now && scheduledFor <= oneHourFromNow) {
          await this.createSnapshotAlert(snapshot.airdropId, {
            type: 'scheduled',
            severity: 'info',
            title: 'Snapshot Scheduled',
            message: `Snapshot for "${snapshot.airdrop.title}" is scheduled for ${scheduledFor.toLocaleString()}`,
            data: {
              snapshotId: snapshot.id,
              scheduledFor: scheduledFor.toISOString()
            }
          });
        }

        // Alert if snapshot is overdue
        if (scheduledFor < now && snapshot.status === 'processing') {
          await this.createSnapshotAlert(snapshot.airdropId, {
            type: 'deadline_approaching',
            severity: 'warning',
            title: 'Snapshot Overdue',
            message: `Snapshot for "${snapshot.airdrop.title}" was scheduled for ${scheduledFor.toLocaleString()} but has not been executed`,
            data: {
              snapshotId: snapshot.id,
              scheduledFor: scheduledFor.toISOString(),
              overdue: (now.getTime() - scheduledFor.getTime()) / (1000 * 60) // minutes
            }
          });
        }
      }
    } catch (error) {
      logger.error('Failed to check upcoming snapshots:', error);
    }
  }

  async getSnapshotHistory(airdropId: string): Promise<SnapshotResult[]> {
    try {
      return await db.snapshotRecord.findMany({
        where: { airdropId },
        orderBy: { createdAt: 'desc' }
      });
    } catch (error) {
      logger.error('Failed to get snapshot history:', error);
      return [];
    }
  }

  async getSnapshot(snapshotId: string): Promise<SnapshotResult | null> {
    try {
      return await db.snapshotRecord.findUnique({
        where: { id: snapshotId }
      });
    } catch (error) {
      logger.error('Failed to get snapshot:', error);
      return null;
    }
  }

  async getPendingSnapshots(): Promise<SnapshotResult[]> {
    try {
      return await db.snapshotRecord.findMany({
        where: {
          status: 'processing'
        },
        include: {
          airdrop: {
            select: {
              title: true,
              endDate: true
            }
          }
        },
        orderBy: {
          createdAt: 'asc'
        }
      });
    } catch (error) {
      logger.error('Failed to get pending snapshots:', error);
      return [];
    }
  }

  async cancelSnapshot(snapshotId: string): Promise<boolean> {
    try {
      // Clear scheduled timeout
      if (this.scheduledSnapshots.has(snapshotId)) {
        clearTimeout(this.scheduledSnapshots.get(snapshotId)!);
        this.scheduledSnapshots.delete(snapshotId);
      }

      // Update snapshot status
      await db.snapshotRecord.update({
        where: { id: snapshotId },
        data: {
          status: 'failed',
          errorMessage: 'Snapshot cancelled by user',
          metadata: {
            cancelledAt: new Date().toISOString()
          }
        }
      });

      logger.info(`Cancelled snapshot ${snapshotId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to cancel snapshot ${snapshotId}:`, error);
      return false;
    }
  }

  async getSnapshotStats(): Promise<any> {
    try {
      const stats = await db.snapshotRecord.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      const totalSnapshots = stats.reduce((sum, stat) => sum + stat._count.id, 0);

      return {
        total: totalSnapshots,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        pending: this.scheduledSnapshots.size
      };
    } catch (error) {
      logger.error('Failed to get snapshot stats:', error);
      return {
        total: 0,
        byStatus: {},
        pending: 0
      };
    }
  }
}

export const snapshotTrackerService = new SnapshotTrackerService();