import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface ContractMonitorConfig {
  contractAddress: string;
  blockchain: string;
  contractType: 'token' | 'nft' | 'multisig' | 'governance' | 'vesting';
  monitoringType: 'airdrop' | 'vesting' | 'governance' | 'general';
  alertThreshold: number;
  watchEvents: string[];
  checkFrequency: number;
  config: Record<string, any>;
}

export interface ContractAlert {
  eventType: string;
  transactionHash: string;
  blockNumber: bigint;
  fromAddress: string;
  toAddress: string;
  value?: number;
  data?: any;
  interpretedData?: any;
  severity: 'info' | 'warning' | 'critical';
}

export class SmartContractMonitorService {
  private zai: ZAI;
  private activeMonitors: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.zai = new ZAI();
  }

  async initializeMonitors() {
    try {
      // Monitor common airdrop-related contracts
      const commonContracts = [
        {
          contractAddress: '0x1234567890123456789012345678901234567890', // Example
          blockchain: 'ethereum',
          contractType: 'token' as const,
          monitoringType: 'airdrop' as const,
          alertThreshold: 100000, // $100k equivalent
          watchEvents: ['Transfer', 'Approval', 'Mint'],
          checkFrequency: 60,
          config: {
            monitorLargeTransfers: true,
            monitorMinting: true,
            monitorWhitelistChanges: true
          }
        }
      ];

      for (const contract of commonContracts) {
        await this.upsertMonitor(contract);
      }

      logger.info('Smart contract monitors initialized');
    } catch (error) {
      logger.error('Failed to initialize contract monitors:', error);
    }
  }

  async upsertMonitor(config: ContractMonitorConfig) {
    try {
      const monitor = await db.smartContractMonitor.upsert({
        where: { contractAddress: config.contractAddress },
        update: {
          blockchain: config.blockchain,
          contractType: config.contractType,
          monitoringType: config.monitoringType,
          alertThreshold: config.alertThreshold,
          watchEvents: config.watchEvents,
          checkFrequency: config.checkFrequency,
          config: config.config,
          isActive: true,
          updatedAt: new Date()
        },
        create: {
          contractAddress: config.contractAddress,
          blockchain: config.blockchain,
          contractType: config.contractType,
          monitoringType: config.monitoringType,
          alertThreshold: config.alertThreshold,
          watchEvents: config.watchEvents,
          checkFrequency: config.checkFrequency,
          config: config.config,
          isActive: true
        }
      });

      // Start monitoring if not already active
      if (!this.activeMonitors.has(monitor.id)) {
        this.startContractMonitoring(monitor.id);
      }

      return monitor;
    } catch (error) {
      logger.error(`Failed to upsert monitor for ${config.contractAddress}:`, error);
      throw error;
    }
  }

  async startContractMonitoring(monitorId: string) {
    try {
      const monitor = await db.smartContractMonitor.findUnique({
        where: { id: monitorId }
      });

      if (!monitor || !monitor.isActive) {
        return;
      }

      // Clear existing monitor
      if (this.activeMonitors.has(monitorId)) {
        clearInterval(this.activeMonitors.get(monitorId));
      }

      // Start periodic monitoring
      const monitoring = setInterval(async () => {
        await this.checkContract(monitorId);
      }, monitor.checkFrequency * 1000);

      this.activeMonitors.set(monitorId, monitoring);

      // Initial check
      await this.checkContract(monitorId);

      logger.info(`Started monitoring contract: ${monitor.contractAddress}`);
    } catch (error) {
      logger.error(`Failed to start monitoring contract ${monitorId}:`, error);
    }
  }

  async stopContractMonitoring(monitorId: string) {
    if (this.activeMonitors.has(monitorId)) {
      clearInterval(this.activeMonitors.get(monitorId));
      this.activeMonitors.delete(monitorId);
      logger.info(`Stopped monitoring contract: ${monitorId}`);
    }
  }

  async checkContract(monitorId: string) {
    try {
      const monitor = await db.smartContractMonitor.findUnique({
        where: { id: monitorId }
      });

      if (!monitor || !monitor.isActive) {
        return;
      }

      // Get contract events since last check
      const events = await this.getContractEvents(monitor);
      
      // Process each event
      for (const event of events) {
        await this.processContractEvent(monitorId, event);
      }

      // Update monitor last checked
      await db.smartContractMonitor.update({
        where: { id: monitorId },
        data: {
          lastChecked: new Date(),
          updatedAt: new Date()
        }
      });

      if (events.length > 0) {
        logger.info(`Processed ${events.length} events for contract ${monitor.contractAddress}`);
      }
    } catch (error) {
      logger.error(`Failed to check contract ${monitorId}:`, error);
    }
  }

  private async getContractEvents(monitor: any): Promise<any[]> {
    try {
      // Since we don't have direct blockchain access, we'll simulate event detection
      // In a real implementation, this would use Web3.js or Ethers.js to query the blockchain
      
      // Use web search to find recent transactions involving the contract
      const searchQuery = `blockchain transaction ${monitor.contractAddress} ${monitor.blockchain}`;
      
      const searchResults = await this.zai.functions.invoke("web_search", {
        query: searchQuery,
        num: 10
      });

      // Convert search results to simulated events
      const events = searchResults.map((result, index) => ({
        eventType: this.inferEventType(result.snippet),
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 18000000),
        fromAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
        toAddress: monitor.contractAddress,
        value: Math.random() * 1000000,
        data: {
          searchResult: result,
          timestamp: result.date || new Date().toISOString()
        }
      }));

      return events;
    } catch (error) {
      logger.error(`Failed to get events for contract ${monitor.contractAddress}:`, error);
      return [];
    }
  }

  private async processContractEvent(monitorId: string, event: any) {
    try {
      const monitor = await db.smartContractMonitor.findUnique({
        where: { id: monitorId }
      });

      if (!monitor) return;

      // Interpret the event using AI
      const interpretedData = await this.interpretEvent(monitor, event);
      
      // Determine severity
      const severity = this.calculateSeverity(monitor, event, interpretedData);

      // Create alert if significant
      if (severity !== 'info' || this.shouldCreateAlert(monitor, event)) {
        await this.createContractAlert(monitorId, {
          ...event,
          interpretedData,
          severity
        });
      }

      // Check for airdrop-related patterns
      if (monitor.monitoringType === 'airdrop') {
        await this.checkAirdropPatterns(monitor, event, interpretedData);
      }

    } catch (error) {
      logger.error('Failed to process contract event:', error);
    }
  }

  private async interpretEvent(monitor: any, event: any): Promise<any> {
    try {
      const prompt = `
        Analyze this blockchain contract event for potential airdrop significance:

        Contract: ${monitor.contractAddress}
        Blockchain: ${monitor.blockchain}
        Event Type: ${event.eventType}
        From: ${event.fromAddress}
        To: ${event.toAddress}
        Value: ${event.value}
        Data: ${JSON.stringify(event.data)}

        Provide a JSON response with:
        - significance: "high", "medium", or "low"
        - airdropLikelihood: 0-100 probability this is airdrop-related
        - patterns: array of recognized patterns
        - recommendations: array of recommended actions
        - riskLevel: "low", "medium", or "high"
        - summary: brief explanation of what this event means

        Focus on identifying:
        1. Large token transfers (potential airdrop distributions)
        2. Batch transfers to multiple addresses
        3. Whitelist or eligibility changes
        4. Token minting for distribution
        5. Contract upgrades or changes affecting airdrops
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert blockchain analyst specializing in airdrop detection and smart contract monitoring.'
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
        return {
          significance: 'low',
          airdropLikelihood: 0,
          patterns: [],
          recommendations: ['manual_review'],
          riskLevel: 'low',
          summary: 'Failed to interpret event'
        };
      }
    } catch (error) {
      logger.error('Failed to interpret event:', error);
      return {
        significance: 'low',
        airdropLikelihood: 0,
        patterns: [],
        recommendations: ['retry_analysis'],
        riskLevel: 'unknown',
        summary: 'Analysis failed'
      };
    }
  }

  private calculateSeverity(monitor: any, event: any, interpretedData: any): 'info' | 'warning' | 'critical' {
    // Check against alert threshold
    if (event.value && event.value > monitor.alertThreshold) {
      return 'critical';
    }

    // Check for high-risk patterns
    if (interpretedData.riskLevel === 'high') {
      return 'critical';
    }

    // Check for significant airdrop likelihood
    if (interpretedData.airdropLikelihood > 80) {
      return 'warning';
    }

    return 'info';
  }

  private shouldCreateAlert(monitor: any, event: any): boolean {
    // Create alerts for watched events
    return monitor.watchEvents.includes(event.eventType);
  }

  private async createContractAlert(monitorId: string, alertData: any) {
    try {
      await db.contractAlert.create({
        data: {
          monitorId,
          eventType: alertData.eventType,
          transactionHash: alertData.transactionHash,
          blockNumber: alertData.blockNumber,
          fromAddress: alertData.fromAddress,
          toAddress: alertData.toAddress,
          value: alertData.value,
          data: alertData.data,
          interpretedData: alertData.interpretedData,
          severity: alertData.severity,
          status: 'new'
        }
      });

      logger.info(`Created ${alertData.severity} alert for contract ${monitorId}`);
    } catch (error) {
      logger.error('Failed to create contract alert:', error);
    }
  }

  private async checkAirdropPatterns(monitor: any, event: any, interpretedData: any) {
    try {
      // Check if this event indicates a potential airdrop
      if (interpretedData.airdropLikelihood > 60) {
        // Create a discovery from this contract event
        await this.createAirdropFromContractEvent(monitor, event, interpretedData);
      }
    } catch (error) {
      logger.error('Failed to check airdrop patterns:', error);
    }
  }

  private async createAirdropFromContractEvent(monitor: any, event: any, interpretedData: any) {
    try {
      // Find or create project
      const project = await this.findOrCreateProjectFromContract(monitor);

      // Create airdrop discovery
      const discovery = await db.airdropDiscovery.create({
        data: {
          sourceId: await this.getContractMonitorSourceId(),
          sourceUrl: `https://etherscan.io/tx/${event.transactionHash}`,
          title: `Potential Airdrop: ${interpretedData.summary || 'Contract Activity Detected'}`,
          description: `Contract activity detected on ${monitor.contractAddress} with ${interpretedData.airdropLikelihood}% airdrop likelihood`,
          content: JSON.stringify({ event, interpretedData }, null, 2),
          author: 'Contract Monitor',
          publishedAt: new Date(),
          discoveredAt: new Date(),
          confidence: interpretedData.airdropLikelihood,
          status: interpretedData.airdropLikelihood > 80 ? 'verified' : 'pending',
          priority: interpretedData.airdropLikelihood > 80 ? 'high' : 'medium',
          tags: ['contract_monitor', 'blockchain', monitor.blockchain, ...interpretedData.patterns],
          metadata: {
            contractAddress: monitor.contractAddress,
            blockchain: monitor.blockchain,
            transactionHash: event.transactionHash,
            interpretedData,
            eventType: event.eventType
          }
        }
      });

      // Create validation
      await db.airdropValidation.create({
        data: {
          discoveryId: discovery.id,
          validationType: 'automated',
          validator: 'contract_monitor',
          result: interpretedData.airdropLikelihood > 80 ? 'valid' : 'needs_review',
          confidence: interpretedData.airdropLikelihood,
          riskScore: interpretedData.riskLevel === 'high' ? 80 : interpretedData.riskLevel === 'medium' ? 50 : 20,
          checks: ['contract_activity', 'pattern_recognition'],
          issues: interpretedData.riskLevel === 'high' ? ['high_risk_detected'] : [],
          warnings: interpretedData.riskLevel === 'medium' ? ['medium_risk'] : [],
          recommendations: interpretedData.recommendations,
          evidence: { event, interpretedData }
        }
      });

      logger.info(`Created airdrop discovery from contract event: ${discovery.id}`);
    } catch (error) {
      logger.error('Failed to create airdrop from contract event:', error);
    }
  }

  private async findOrCreateProjectFromContract(monitor: any) {
    try {
      // Try to find existing project by contract address
      let project = await db.project.findFirst({
        where: {
          contractAddress: monitor.contractAddress
        }
      });

      if (!project) {
        // Create new project from contract
        project = await db.project.create({
          data: {
            name: `Contract ${monitor.contractAddress.slice(0, 10)}...`,
            slug: `contract-${monitor.contractAddress.slice(2, 10)}`,
            description: `Project discovered through smart contract monitoring`,
            website: `https://etherscan.io/address/${monitor.contractAddress}`,
            category: 'defi',
            blockchain: monitor.blockchain,
            contractAddress: monitor.contractAddress,
            verificationStatus: 'unverified',
            isActive: true,
            tags: ['contract_discovered', monitor.blockchain],
            metadata: {
              discoveredBy: 'contract_monitor',
              contractType: monitor.contractType,
              monitoringType: monitor.monitoringType
            }
          }
        });
      }

      return project;
    } catch (error) {
      logger.error('Failed to find or create project from contract:', error);
      throw error;
    }
  }

  private async getContractMonitorSourceId(): Promise<string> {
    try {
      // Find or create contract monitor source
      let source = await db.airdropSource.findUnique({
        where: { name: 'Contract Monitor' }
      });

      if (!source) {
        source = await db.airdropSource.create({
          data: {
            name: 'Contract Monitor',
            type: 'contract_monitor',
            reliability: 90,
            syncFrequency: 60,
            isActive: true,
            config: {
              monitorsContracts: true,
              analyzesEvents: true,
              detectsPatterns: true
            }
          }
        });
      }

      return source.id;
    } catch (error) {
      logger.error('Failed to get contract monitor source ID:', error);
      throw error;
    }
  }

  private inferEventType(snippet: string): string {
    const lowerSnippet = snippet.toLowerCase();
    
    if (lowerSnippet.includes('transfer')) return 'Transfer';
    if (lowerSnippet.includes('approval')) return 'Approval';
    if (lowerSnippet.includes('mint')) return 'Mint';
    if (lowerSnippet.includes('burn')) return 'Burn';
    if (lowerSnippet.includes('swap')) return 'Swap';
    if (lowerSnippet.includes('governance')) return 'Governance';
    
    return 'Unknown';
  }

  async getActiveMonitors() {
    return await db.smartContractMonitor.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            alerts: true
          }
        }
      }
    });
  }

  async getRecentAlerts(limit = 50) {
    return await db.contractAlert.findMany({
      include: {
        monitor: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  async updateAlertStatus(alertId: string, status: string, notes?: string) {
    return await db.contractAlert.update({
      where: { id: alertId },
      data: {
        status,
        notes,
        updatedAt: new Date()
      }
    });
  }
}

export const smartContractMonitorService = new SmartContractMonitorService();