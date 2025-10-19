import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface EligibilityCriteria {
  id: string;
  type: 'wallet_balance' | 'token_holdings' | 'transaction_history' | 'contract_interaction' | 'time_based' | 'social_activity' | 'snapshot_based';
  name: string;
  description: string;
  conditions: any;
  weight: number; // Importance weight for overall eligibility
  required: boolean; // Must be satisfied vs. nice-to-have
}

export interface EligibilityCheck {
  id: string;
  airdropId: string;
  walletAddress: string;
  checkType: 'snapshot' | 'realtime' | 'prediction';
  status: 'pending' | 'checking' | 'completed' | 'failed';
  isEligible: boolean;
  eligibilityScore: number; // 0-100
  criteria: EligibilityResult[];
  results: any;
  recommendations: string[];
  nextCheckAt?: Date;
  checkedAt?: Date;
  metadata: any;
}

export interface EligibilityResult {
  criteriaId: string;
  criteriaName: string;
  satisfied: boolean;
  score: number;
  actualValue: any;
  requiredValue: any;
  details: any;
  evidence: any;
}

export interface EligibilityAlert {
  id: string;
  walletAddress: string;
  airdropId: string;
  type: 'became_eligible' | 'lost_eligibility' | 'deadline_approaching' | 'requirement_change';
  severity: 'info' | 'warning' | 'urgent';
  title: string;
  message: string;
  recommendations: string[];
  createdAt: Date;
  readAt?: Date;
}

export class EligibilityMonitorService {
  private zai: ZAI;
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initialize() {
    try {
      // Start monitoring active airdrops
      await this.startMonitoringActiveAirdrops();
      
      logger.info('Eligibility monitoring service initialized');
    } catch (error) {
      logger.error('Failed to initialize eligibility monitoring:', error);
    }
  }

  async checkEligibility(airdropId: string, walletAddress: string, checkType: 'snapshot' | 'realtime' | 'prediction' = 'realtime'): Promise<EligibilityCheck> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true,
          eligibilityCriteria: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      // Create eligibility check record
      const eligibilityCheck = await db.eligibilityCheck.create({
        data: {
          airdropId,
          walletAddress,
          checkType,
          status: 'checking',
          eligibilityScore: 0,
          criteria: [],
          results: {},
          recommendations: [],
          metadata: {
            startedAt: new Date().toISOString()
          }
        }
      });

      // Get eligibility criteria for the airdrop
      const criteria = await this.getEligibilityCriteria(airdrop);
      
      // Evaluate each criterion
      const results: EligibilityResult[] = [];
      for (const criterion of criteria) {
        const result = await this.evaluateCriterion(criterion, walletAddress, airdrop);
        results.push(result);
      }

      // Calculate overall eligibility
      const overallResult = this.calculateOverallEligibility(results, criteria);

      // Update eligibility check
      const updatedCheck = await db.eligibilityCheck.update({
        where: { id: eligibilityCheck.id },
        data: {
          status: 'completed',
          isEligible: overallResult.isEligible,
          eligibilityScore: overallResult.score,
          criteria: results,
          results: overallResult.details,
          recommendations: overallResult.recommendations,
          checkedAt: new Date(),
          nextCheckAt: this.calculateNextCheckDate(checkType, airdrop),
          metadata: {
            ...eligibilityCheck.metadata,
            completedAt: new Date().toISOString(),
            checkDuration: Date.now() - new Date(eligibilityCheck.createdAt).getTime()
          }
        }
      });

      // Check for eligibility changes
      await this.checkForEligibilityChanges(walletAddress, airdropId, overallResult);

      // Create alerts if necessary
      if (overallResult.alerts && overallResult.alerts.length > 0) {
        await this.createEligibilityAlerts(walletAddress, airdropId, overallResult.alerts);
      }

      logger.info(`Eligibility check completed for ${walletAddress} in airdrop ${airdropId}: ${overallResult.isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'} (${overallResult.score}%)`);
      return updatedCheck;
    } catch (error) {
      logger.error(`Failed to check eligibility for ${walletAddress} in airdrop ${airdropId}:`, error);
      throw error;
    }
  }

  private async getEligibilityCriteria(airdrop: any): Promise<EligibilityCriteria[]> {
    try {
      // Get criteria from airdrop configuration
      const configuredCriteria = airdrop.eligibilityCriteria || airdrop.metadata?.eligibilityCriteria || [];
      
      // If no criteria configured, use default ones based on airdrop type
      if (configuredCriteria.length === 0) {
        return this.getDefaultCriteria(airdrop);
      }

      return configuredCriteria.map((c: any, index: number) => ({
        id: c.id || `criteria_${index}`,
        type: c.type,
        name: c.name,
        description: c.description,
        conditions: c.conditions,
        weight: c.weight || 1,
        required: c.required !== false
      }));
    } catch (error) {
      logger.error('Failed to get eligibility criteria:', error);
      return this.getDefaultCriteria(airdrop);
    }
  }

  private getDefaultCriteria(airdrop: any): EligibilityCriteria[] {
    const criteria: EligibilityCriteria[] = [];

    // Basic wallet criteria
    criteria.push({
      id: 'wallet_active',
      type: 'transaction_history',
      name: 'Active Wallet',
      description: 'Wallet must have transaction history',
      conditions: {
        minTransactions: 1,
        minAge: 30 // days
      },
      weight: 2,
      required: true
    });

    // Balance criteria (if not gas-less)
    if (airdrop.gasRequired !== false) {
      criteria.push({
        id: 'minimum_balance',
        type: 'wallet_balance',
        name: 'Minimum Balance',
        description: 'Minimum ETH balance for gas fees',
        conditions: {
          minBalance: '0.01',
          token: 'ETH'
        },
        weight: 1,
        required: true
      });
    }

    // Project-specific criteria
    if (airdrop.project.category === 'defi') {
      criteria.push({
        id: 'defi_interaction',
        type: 'contract_interaction',
        name: 'DeFi Protocol Usage',
        description: 'Must have interacted with DeFi protocols',
        conditions: {
          minInteractions: 1,
          protocols: ['uniswap', 'compound', 'aave']
        },
        weight: 2,
        required: false
      });
    }

    if (airdrop.project.category === 'nft') {
      criteria.push({
        id: 'nft_holdings',
        type: 'token_holdings',
        name: 'NFT Holdings',
        description: 'Must hold NFTs',
        conditions: {
          minNFTs: 1,
          excludeSpam: true
        },
        weight: 2,
        required: false
      });
    }

    // Time-based criteria
    if (airdrop.startDate) {
      criteria.push({
        id: 'wallet_age',
        type: 'time_based',
        name: 'Wallet Age',
        description: 'Wallet must be created before snapshot',
        conditions: {
          createdBefore: airdrop.startDate
        },
        weight: 1,
        required: true
      });
    }

    return criteria;
  }

  private async evaluateCriterion(criterion: EligibilityCriteria, walletAddress: string, airdrop: any): Promise<EligibilityResult> {
    try {
      switch (criterion.type) {
        case 'wallet_balance':
          return await this.checkWalletBalance(criterion, walletAddress);
        case 'token_holdings':
          return await this.checkTokenHoldings(criterion, walletAddress);
        case 'transaction_history':
          return await this.checkTransactionHistory(criterion, walletAddress);
        case 'contract_interaction':
          return await this.checkContractInteraction(criterion, walletAddress);
        case 'time_based':
          return await this.checkTimeBased(criterion, walletAddress);
        case 'social_activity':
          return await this.checkSocialActivity(criterion, walletAddress);
        case 'snapshot_based':
          return await this.checkSnapshotBased(criterion, walletAddress, airdrop);
        default:
          return this.createUnknownResult(criterion);
      }
    } catch (error) {
      logger.error(`Failed to evaluate criterion ${criterion.id}:`, error);
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkWalletBalance(criterion: EligibilityCriteria, walletAddress: string): Promise<EligibilityResult> {
    try {
      // Simulated balance check - in real implementation, use Web3 library
      const balance = Math.random() * 10; // Random ETH balance
      const minBalance = parseFloat(criterion.conditions.minBalance || '0.01');
      
      const satisfied = balance >= minBalance;
      const score = Math.min(100, (balance / minBalance) * 100);

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: balance,
        requiredValue: minBalance,
        details: {
          balance,
          currency: criterion.conditions.token || 'ETH',
          minRequired: minBalance
        },
        evidence: {
          source: 'blockchain',
          timestamp: new Date().toISOString(),
          transactionHash: null
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkTokenHoldings(criterion: EligibilityCriteria, walletAddress: string): Promise<EligibilityResult> {
    try {
      // Simulated token holdings check
      const holdings = Math.floor(Math.random() * 10);
      const minHoldings = criterion.conditions.minNFTs || 1;
      
      const satisfied = holdings >= minHoldings;
      const score = Math.min(100, (holdings / minHoldings) * 100);

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: holdings,
        requiredValue: minHoldings,
        details: {
          holdings,
          minRequired: minHoldings,
          tokenType: 'NFT'
        },
        evidence: {
          source: 'blockchain',
          timestamp: new Date().toISOString(),
          contractAddresses: [] // Would contain actual NFT contract addresses
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkTransactionHistory(criterion: EligibilityCriteria, walletAddress: string): Promise<EligibilityResult> {
    try {
      // Simulated transaction history check
      const transactionCount = Math.floor(Math.random() * 100);
      const minTransactions = criterion.conditions.minTransactions || 1;
      const walletAge = Math.floor(Math.random() * 365); // days
      const minAge = criterion.conditions.minAge || 30;
      
      const transactionsOk = transactionCount >= minTransactions;
      const ageOk = walletAge >= minAge;
      const satisfied = transactionsOk && ageOk;
      
      const score = Math.min(100, ((transactionCount / minTransactions) * 50) + ((walletAge / minAge) * 50));

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: { transactionCount, walletAge },
        requiredValue: { minTransactions, minAge },
        details: {
          transactionCount,
          walletAge,
          minTransactions,
          minAge,
          transactionsOk,
          ageOk
        },
        evidence: {
          source: 'blockchain',
          timestamp: new Date().toISOString(),
          firstTransaction: new Date(Date.now() - walletAge * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkContractInteraction(criterion: EligibilityCriteria, walletAddress: string): Promise<EligibilityResult> {
    try {
      // Simulated contract interaction check
      const interactions = Math.floor(Math.random() * 20);
      const minInteractions = criterion.conditions.minInteractions || 1;
      const protocols = criterion.conditions.protocols || [];
      
      const satisfied = interactions >= minInteractions;
      const score = Math.min(100, (interactions / minInteractions) * 100);

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: interactions,
        requiredValue: minInteractions,
        details: {
          interactions,
          minInteractions,
          protocols: protocols.slice(0, interactions), // Simulate which protocols were used
          uniqueProtocols: Math.min(interactions, protocols.length)
        },
        evidence: {
          source: 'blockchain',
          timestamp: new Date().toISOString(),
          interactions: [] // Would contain actual transaction hashes
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkTimeBased(criterion: EligibilityCriteria, walletAddress: string): Promise<EligibilityResult> {
    try {
      // Simulated wallet creation time check
      const walletCreated = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      const requiredBefore = new Date(criterion.conditions.createdBefore);
      
      const satisfied = walletCreated < requiredBefore;
      const score = satisfied ? 100 : 0;

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: walletCreated,
        requiredValue: requiredBefore,
        details: {
          walletCreated: walletCreated.toISOString(),
          requiredBefore: requiredBefore.toISOString(),
          daysDifference: Math.floor((requiredBefore.getTime() - walletCreated.getTime()) / (24 * 60 * 60 * 1000))
        },
        evidence: {
          source: 'blockchain',
          timestamp: new Date().toISOString(),
          firstBlock: Math.floor(Math.random() * 10000000) + 15000000
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkSocialActivity(criterion: EligibilityCriteria, walletAddress: string): Promise<EligibilityResult> {
    try {
      // Simulated social activity check
      const socialScore = Math.floor(Math.random() * 100);
      const minScore = criterion.conditions.minSocialScore || 50;
      
      const satisfied = socialScore >= minScore;
      const score = Math.min(100, (socialScore / minScore) * 100);

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: socialScore,
        requiredValue: minScore,
        details: {
          socialScore,
          minScore,
          platforms: ['twitter', 'discord'], // Simulated
          lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        evidence: {
          source: 'social_api',
          timestamp: new Date().toISOString(),
          profiles: {} // Would contain actual social profile data
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private async checkSnapshotBased(criterion: EligibilityCriteria, walletAddress: string, airdrop: any): Promise<EligibilityResult> {
    try {
      // Check if there's a snapshot record for this airdrop
      const snapshot = await db.snapshotRecord.findFirst({
        where: {
          airdropId: airdrop.id,
          status: 'completed'
        },
        orderBy: {
          blockTimestamp: 'desc'
        }
      });

      if (!snapshot) {
        return {
          criteriaId: criterion.id,
          criteriaName: criterion.name,
          satisfied: false,
          score: 0,
          actualValue: null,
          requiredValue: 'Snapshot data',
          details: {
            message: 'No snapshot data available',
            airdropId: airdrop.id
          },
          evidence: {
            source: 'database',
            timestamp: new Date().toISOString()
          }
        };
      }

      // Simulated snapshot check
      const isInSnapshot = Math.random() > 0.3; // 70% chance of being in snapshot
      const balance = isInSnapshot ? Math.random() * 1000 : 0;
      
      const satisfied = isInSnapshot && balance > 0;
      const score = satisfied ? Math.min(100, balance) : 0;

      return {
        criteriaId: criterion.id,
        criteriaName: criterion.name,
        satisfied,
        score,
        actualValue: { isInSnapshot, balance },
        requiredValue: { inSnapshot: true, minBalance: 0 },
        details: {
          snapshotBlock: snapshot.blockNumber.toString(),
          snapshotTime: snapshot.blockTimestamp.toISOString(),
          isInSnapshot,
          balance
        },
        evidence: {
          source: 'snapshot',
          timestamp: new Date().toISOString(),
          snapshotId: snapshot.id
        }
      };
    } catch (error) {
      return this.createErrorResult(criterion, error);
    }
  }

  private createUnknownResult(criterion: EligibilityCriteria): EligibilityResult {
    return {
      criteriaId: criterion.id,
      criteriaName: criterion.name,
      satisfied: false,
      score: 0,
      actualValue: null,
      requiredValue: 'Unknown',
      details: {
        message: 'Unknown criterion type',
        type: criterion.type
      },
      evidence: {
        source: 'system',
        timestamp: new Date().toISOString()
      }
    };
  }

  private createErrorResult(criterion: EligibilityCriteria, error: any): EligibilityResult {
    return {
      criteriaId: criterion.id,
      criteriaName: criterion.name,
      satisfied: false,
      score: 0,
      actualValue: null,
      requiredValue: 'Error',
      details: {
        error: error.message || 'Unknown error',
        type: criterion.type
      },
      evidence: {
        source: 'system',
        timestamp: new Date().toISOString(),
        error: true
      }
    };
  }

  private calculateOverallEligibility(results: EligibilityResult[], criteria: EligibilityCriteria[]): any {
    try {
      // Check required criteria
      const requiredResults = results.filter(r => {
        const criterion = criteria.find(c => c.id === r.criteriaId);
        return criterion?.required;
      });

      const requiredSatisfied = requiredResults.every(r => r.satisfied);
      
      // Calculate weighted score
      let totalScore = 0;
      let totalWeight = 0;

      for (const result of results) {
        const criterion = criteria.find(c => c.id === r.criteriaId);
        if (criterion) {
          totalScore += result.score * criterion.weight;
          totalWeight += criterion.weight;
        }
      }

      const overallScore = totalWeight > 0 ? totalScore / totalWeight : 0;
      const isEligible = requiredSatisfied && overallScore >= 50; // 50% threshold

      // Generate recommendations
      const recommendations = this.generateRecommendations(results, criteria);

      // Generate alerts
      const alerts = this.generateAlerts(results, criteria);

      return {
        isEligible,
        score: Math.round(overallScore),
        requiredSatisfied,
        details: {
          totalScore,
          totalWeight,
          requiredCriteriaCount: requiredResults.length,
          requiredSatisfiedCount: requiredResults.filter(r => r.satisfied).length
        },
        recommendations,
        alerts
      };
    } catch (error) {
      logger.error('Failed to calculate overall eligibility:', error);
      return {
        isEligible: false,
        score: 0,
        requiredSatisfied: false,
        details: { error: error.message },
        recommendations: ['Unable to determine eligibility'],
        alerts: []
      };
    }
  }

  private generateRecommendations(results: EligibilityResult[], criteria: EligibilityCriteria[]): string[] {
    const recommendations: string[] = [];

    for (const result of results) {
      if (!result.satisfied) {
        const criterion = criteria.find(c => c.id === r.criteriaId);
        if (criterion) {
          switch (criterion.type) {
            case 'wallet_balance':
              recommendations.push('Add more ETH to your wallet to cover gas fees');
              break;
            case 'transaction_history':
              recommendations.push('Increase your wallet activity by making more transactions');
              break;
            case 'contract_interaction':
              recommendations.push(`Interact with ${criterion.conditions.protocols?.join(', ') || 'DeFi protocols'} to improve eligibility`);
              break;
            case 'token_holdings':
              recommendations.push('Acquire more NFTs or tokens to meet requirements');
              break;
            case 'time_based':
              recommendations.push('Wallet age requirements not met - consider using an older wallet');
              break;
            default:
              recommendations.push(`Complete the ${criterion.name} requirement`);
          }
        }
      }
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }

  private generateAlerts(results: EligibilityResult[], criteria: EligibilityCriteria[]): any[] {
    const alerts: any[] = [];

    // Check for recently satisfied criteria
    const newlySatisfied = results.filter(r => r.satisfied && 
      (r.details?.recentlyChanged || false)
    );

    if (newlySatisfied.length > 0) {
      alerts.push({
        type: 'requirement_satisfied',
        severity: 'info',
        message: `You now meet ${newlySatisfied.length} additional requirement(s)`
      });
    }

    // Check for deadline proximity
    const deadlineCriteria = criteria.find(c => c.type === 'time_based');
    if (deadlineCriteria) {
      const result = results.find(r => r.criteriaId === deadlineCriteria.id);
      if (result && !result.satisfied) {
        const daysUntil = result.details?.daysDifference;
        if (daysUntil && daysUntil < 7 && daysUntil > 0) {
          alerts.push({
            type: 'deadline_approaching',
            severity: daysUntil < 3 ? 'urgent' : 'warning',
            message: `Wallet age deadline approaching in ${daysUntil} days`
          });
        }
      }
    }

    return alerts;
  }

  private calculateNextCheckDate(checkType: string, airdrop: any): Date {
    const now = new Date();
    
    switch (checkType) {
      case 'realtime':
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
      case 'snapshot':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      case 'prediction':
        return new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
      default:
        return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    }
  }

  private async checkForEligibilityChanges(walletAddress: string, airdropId: string, newResult: any): Promise<void> {
    try {
      // Get previous eligibility check
      const previousCheck = await db.eligibilityCheck.findFirst({
        where: {
          walletAddress,
          airdropId,
          status: 'completed'
        },
        orderBy: {
          checkedAt: 'desc'
        }
      });

      if (!previousCheck) return;

      const becameEligible = !previousCheck.isEligible && newResult.isEligible;
      const lostEligibility = previousCheck.isEligible && !newResult.isEligible;

      if (becameEligible) {
        await this.createEligibilityAlert(walletAddress, airdropId, {
          type: 'became_eligible',
          severity: 'info',
          title: 'Good News! You are now eligible',
          message: `You now meet the requirements for this airdrop`,
          recommendations: ['Participate soon before the deadline']
        });
      } else if (lostEligibility) {
        await this.createEligibilityAlert(walletAddress, airdropId, {
          type: 'lost_eligibility',
          severity: 'warning',
          title: 'Eligibility Status Changed',
          message: `You no longer meet the requirements for this airdrop`,
          recommendations: newResult.recommendations
        });
      }
    } catch (error) {
      logger.error('Failed to check eligibility changes:', error);
    }
  }

  private async createEligibilityAlert(walletAddress: string, airdropId: string, alertData: any): Promise<void> {
    try {
      await db.userNotification.create({
        data: {
          type: 'eligibility_change',
          title: alertData.title,
          message: alertData.message,
          data: {
            walletAddress,
            airdropId,
            alertType: alertData.type
          },
          priority: alertData.severity === 'urgent' ? 'high' : 'normal',
          category: alertData.severity === 'warning' ? 'warning' : 'info'
        }
      });

      logger.info(`Created eligibility alert for ${walletAddress} in airdrop ${airdropId}`);
    } catch (error) {
      logger.error('Failed to create eligibility alert:', error);
    }
  }

  private async createEligibilityAlerts(walletAddress: string, airdropId: string, alerts: any[]): Promise<void> {
    for (const alert of alerts) {
      await this.createEligibilityAlert(walletAddress, airdropId, alert);
    }
  }

  async startMonitoringActiveAirdrops(): Promise<void> {
    try {
      const activeAirdrops = await db.airdrop.findMany({
        where: {
          status: 'active',
          OR: [
            { endDate: { gte: new Date() } },
            { endDate: null }
          ]
        }
      });

      for (const airdrop of activeAirdrops) {
        await this.startAirdropMonitoring(airdrop.id);
      }

      logger.info(`Started monitoring ${activeAirdrops.length} active airdrops`);
    } catch (error) {
      logger.error('Failed to start monitoring active airdrops:', error);
    }
  }

  async startAirdropMonitoring(airdropId: string): Promise<void> {
    try {
      // Stop existing monitoring if any
      if (this.monitoringIntervals.has(airdropId)) {
        clearInterval(this.monitoringIntervals.get(airdropId));
      }

      // Start periodic monitoring
      const interval = setInterval(async () => {
        await this.monitorAirdropEligibility(airdropId);
      }, 60 * 60 * 1000); // Check every hour

      this.monitoringIntervals.set(airdropId, interval);

      // Initial monitoring
      await this.monitorAirdropEligibility(airdropId);

      logger.info(`Started eligibility monitoring for airdrop ${airdropId}`);
    } catch (error) {
      logger.error(`Failed to start monitoring airdrop ${airdropId}:`, error);
    }
  }

  async stopAirdropMonitoring(airdropId: string): Promise<void> {
    if (this.monitoringIntervals.has(airdropId)) {
      clearInterval(this.monitoringIntervals.get(airdropId));
      this.monitoringIntervals.delete(airdropId);
      logger.info(`Stopped eligibility monitoring for airdrop ${airdropId}`);
    }
  }

  private async monitorAirdropEligibility(airdropId: string): Promise<void> {
    try {
      // Get users who have previously checked eligibility for this airdrop
      const previousChecks = await db.eligibilityCheck.findMany({
        where: {
          airdropId,
          status: 'completed'
        },
        distinct: ['walletAddress'],
        select: {
          walletAddress: true
        }
      });

      // Re-check eligibility for a sample of users
      const sampleSize = Math.min(10, previousChecks.length);
      const sample = previousChecks.slice(0, sampleSize);

      for (const check of sample) {
        try {
          await this.checkEligibility(airdropId, check.walletAddress, 'realtime');
        } catch (error) {
          logger.error(`Failed to re-check eligibility for ${check.walletAddress}:`, error);
        }
      }

      if (sample.length > 0) {
        logger.info(`Re-checked eligibility for ${sample.length} users in airdrop ${airdropId}`);
      }
    } catch (error) {
      logger.error(`Failed to monitor airdrop eligibility ${airdropId}:`, error);
    }
  }

  async getEligibilityStatus(walletAddress: string, airdropId: string): Promise<EligibilityCheck | null> {
    try {
      return await db.eligibilityCheck.findFirst({
        where: {
          walletAddress,
          airdropId,
          status: 'completed'
        },
        orderBy: {
          checkedAt: 'desc'
        }
      });
    } catch (error) {
      logger.error('Failed to get eligibility status:', error);
      return null;
    }
  }

  async getUserEligibilitySummary(walletAddress: string): Promise<any> {
    try {
      const checks = await db.eligibilityCheck.findMany({
        where: {
          walletAddress,
          status: 'completed'
        },
        include: {
          airdrop: {
            select: {
              id: true,
              title: true,
              status: true,
              endDate: true
            }
          }
        },
        orderBy: {
          checkedAt: 'desc'
        }
      });

      const eligible = checks.filter(c => c.isEligible);
      const notEligible = checks.filter(c => !c.isEligible);

      return {
        totalChecked: checks.length,
        eligible: eligible.length,
        notEligible: notEligible.length,
        averageScore: checks.length > 0 
          ? checks.reduce((sum, c) => sum + c.eligibilityScore, 0) / checks.length 
          : 0,
        recentChecks: checks.slice(0, 10),
        upcomingDeadlines: checks
          .filter(c => c.airdrop.endDate && c.airdrop.endDate > new Date())
          .sort((a, b) => new Date(a.airdrop.endDate!).getTime() - new Date(b.airdrop.endDate!).getTime())
          .slice(0, 5)
      };
    } catch (error) {
      logger.error('Failed to get user eligibility summary:', error);
      return null;
    }
  }
}

export const eligibilityMonitorService = new EligibilityMonitorService();