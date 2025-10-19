import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface ProcessingTask {
  id: string;
  type: 'verification' | 'validation' | 'risk_assessment' | 'categorization' | 'enrichment';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  result?: any;
  error?: string;
}

export interface VerificationResult {
  isValid: boolean;
  confidence: number;
  riskScore: number;
  checks: string[];
  issues: string[];
  warnings: string[];
  recommendations: string[];
  evidence: any;
  metadata: any;
}

export interface ValidationResult {
  result: 'valid' | 'invalid' | 'suspicious' | 'needs_review';
  confidence: number;
  riskScore: number;
  legitimacyScore: number;
  factors: any;
  analysis: string;
}

export class DataProcessingPipeline {
  private zai: ZAI;
  private processingQueue: ProcessingTask[] = [];
  private isProcessing = false;

  constructor() {
    this.zai = new ZAI();
  }

  async initialize() {
    try {
      // Start the processing loop
      this.startProcessingLoop();
      
      // Process any pending tasks from database
      await this.loadPendingTasks();
      
      logger.info('Data processing pipeline initialized');
    } catch (error) {
      logger.error('Failed to initialize data processing pipeline:', error);
    }
  }

  async addTask(task: Omit<ProcessingTask, 'id' | 'status' | 'createdAt'>): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const fullTask: ProcessingTask = {
      ...task,
      id: taskId,
      status: 'pending',
      createdAt: new Date()
    };

    this.processingQueue.push(fullTask);
    
    // Sort queue by priority
    this.processingQueue.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    logger.info(`Added processing task: ${taskId} (${task.type})`);
    return taskId;
  }

  private async loadPendingTasks() {
    try {
      // Load pending discoveries that need processing
      const pendingDiscoveries = await db.airdropDiscovery.findMany({
        where: {
          status: 'pending'
        },
        include: {
          source: true,
          validations: true
        }
      });

      for (const discovery of pendingDiscoveries) {
        await this.addTask({
          type: 'verification',
          priority: discovery.priority as any,
          data: {
            discoveryId: discovery.id,
            discovery
          }
        });
      }

      logger.info(`Loaded ${pendingDiscoveries.length} pending discoveries for processing`);
    } catch (error) {
      logger.error('Failed to load pending tasks:', error);
    }
  }

  private startProcessingLoop() {
    setInterval(async () => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        await this.processNextTask();
      }
    }, 1000); // Process every second
  }

  private async processNextTask() {
    if (this.processingQueue.length === 0) return;

    this.isProcessing = true;
    const task = this.processingQueue.shift()!;

    try {
      task.status = 'processing';
      logger.info(`Processing task: ${task.id} (${task.type})`);

      let result: any;

      switch (task.type) {
        case 'verification':
          result = await this.processVerification(task.data);
          break;
        case 'validation':
          result = await this.processValidation(task.data);
          break;
        case 'risk_assessment':
          result = await this.processRiskAssessment(task.data);
          break;
        case 'categorization':
          result = await this.processCategorization(task.data);
          break;
        case 'enrichment':
          result = await this.processEnrichment(task.data);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = 'completed';
      task.processedAt = new Date();
      task.result = result;

      logger.info(`Completed task: ${task.id}`);
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Failed task: ${task.id}`, error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async processVerification(data: any): Promise<VerificationResult> {
    try {
      const { discoveryId, discovery } = data;

      // Perform comprehensive verification
      const checks = await this.performVerificationChecks(discovery);
      
      // Calculate overall confidence and risk
      const confidence = this.calculateConfidence(checks);
      const riskScore = this.calculateRiskScore(checks);

      // Generate recommendations
      const recommendations = this.generateRecommendations(checks, riskScore);

      const result: VerificationResult = {
        isValid: confidence > 60 && riskScore < 40,
        confidence,
        riskScore,
        checks: checks.map(c => c.type),
        issues: checks.filter(c => c.status === 'failed').map(c => c.issue),
        warnings: checks.filter(c => c.status === 'warning').map(c => c.warning),
        recommendations,
        evidence: checks.reduce((acc, check) => {
          acc[check.type] = check.evidence;
          return acc;
        }, {} as any),
        metadata: {
          discoveryId,
          processedAt: new Date().toISOString(),
          checkDetails: checks
        }
      };

      // Update discovery status based on verification
      await this.updateDiscoveryAfterVerification(discoveryId, result);

      return result;
    } catch (error) {
      logger.error('Verification processing failed:', error);
      throw error;
    }
  }

  private async performVerificationChecks(discovery: any): Promise<any[]> {
    const checks = [];

    // Source reliability check
    checks.push(await this.checkSourceReliability(discovery));

    // Content analysis check
    checks.push(await this.checkContentAnalysis(discovery));

    // URL/domain verification
    checks.push(await this.checkDomainVerification(discovery));

    // Social media verification
    checks.push(await this.checkSocialMediaVerification(discovery));

    // Project legitimacy check
    checks.push(await this.checkProjectLegitimacy(discovery));

    // Scam pattern detection
    checks.push(await this.checkScamPatterns(discovery));

    return checks;
  }

  private async checkSourceReliability(discovery: any): Promise<any> {
    try {
      const source = discovery.source;
      let reliability = source?.reliability || 50;

      // Boost reliability for certain source types
      if (source?.type === 'contract_monitor') reliability += 20;
      if (source?.type === 'aggregator') reliability += 15;
      if (source?.type === 'community') reliability += 10;

      return {
        type: 'source_reliability',
        status: reliability > 70 ? 'passed' : reliability > 50 ? 'warning' : 'failed',
        score: reliability,
        evidence: {
          sourceType: source?.type,
          sourceReliability: source?.reliability,
          adjustedReliability: reliability
        },
        issue: reliability < 50 ? 'Low reliability source' : undefined,
        warning: reliability < 70 ? 'Moderate reliability source' : undefined
      };
    } catch (error) {
      return {
        type: 'source_reliability',
        status: 'failed',
        score: 0,
        evidence: { error: error.message },
        issue: 'Source reliability check failed'
      };
    }
  }

  private async checkContentAnalysis(discovery: any): Promise<any> {
    try {
      const prompt = `
        Analyze this airdrop discovery content for legitimacy:

        Title: ${discovery.title}
        Description: ${discovery.description}
        Content: ${discovery.content}
        Source: ${discovery.sourceUrl}

        Check for:
        1. Grammar and spelling quality
        2. Professional language usage
        3. Clear and specific information
        4. Realistic claims and promises
        5. Contact information availability
        6. Detailed requirements explanation

        Provide a JSON response with:
        - score: 0-100 quality score
        - issues: array of problems found
        - positives: array of good indicators
        - recommendation: "accept", "review", or "reject"
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content analyst for cryptocurrency airdrops.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      const analysis = JSON.parse(response || '{}');

      return {
        type: 'content_analysis',
        status: analysis.score > 70 ? 'passed' : analysis.score > 50 ? 'warning' : 'failed',
        score: analysis.score || 50,
        evidence: analysis,
        issue: analysis.score < 50 ? 'Poor content quality' : undefined,
        warning: analysis.score < 70 ? 'Moderate content quality' : undefined
      };
    } catch (error) {
      return {
        type: 'content_analysis',
        status: 'warning',
        score: 50,
        evidence: { error: error.message },
        warning: 'Content analysis failed'
      };
    }
  }

  private async checkDomainVerification(discovery: any): Promise<any> {
    try {
      if (!discovery.sourceUrl) {
        return {
          type: 'domain_verification',
          status: 'warning',
          score: 50,
          evidence: { reason: 'No URL provided' },
          warning: 'No URL to verify'
        };
      }

      const url = new URL(discovery.sourceUrl);
      const domain = url.hostname;

      // Check for suspicious domains
      const suspiciousPatterns = [
        /\.tk$/, /\.ml$/, /\.ga$/, /\.cf$/,
        /crypto-.*-free\.com$/,
        /.*-airdrop-.*\.com$/,
        /.*-token-.*\.com$/
      ];

      const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(domain));

      // Check domain age (simulated)
      const domainAge = Math.random() * 365; // Random age in days
      const isNewDomain = domainAge < 30;

      let score = 70;
      if (isSuspicious) score -= 40;
      if (isNewDomain) score -= 20;

      return {
        type: 'domain_verification',
        status: score > 60 ? 'passed' : score > 40 ? 'warning' : 'failed',
        score,
        evidence: {
          domain,
          domainAge,
          isSuspicious,
          isNewDomain
        },
        issue: score < 40 ? 'Suspicious domain detected' : undefined,
        warning: score < 60 ? 'Domain concerns detected' : undefined
      };
    } catch (error) {
      return {
        type: 'domain_verification',
        status: 'failed',
        score: 0,
        evidence: { error: error.message },
        issue: 'Domain verification failed'
      };
    }
  }

  private async checkSocialMediaVerification(discovery: any): Promise<any> {
    try {
      const socialLinks = discovery.metadata?.socialLinks || discovery.socialLinks || {};
      
      if (Object.keys(socialLinks).length === 0) {
        return {
          type: 'social_media_verification',
          status: 'warning',
          score: 40,
          evidence: { reason: 'No social media links' },
          warning: 'No social media presence found'
        };
      }

      // Simulate social media verification
      let verifiedCount = 0;
      let totalCount = 0;

      for (const [platform, url] of Object.entries(socialLinks)) {
        totalCount++;
        // Simulate verification check
        if (Math.random() > 0.3) verifiedCount++;
      }

      const score = (verifiedCount / totalCount) * 100;

      return {
        type: 'social_media_verification',
        status: score > 70 ? 'passed' : score > 50 ? 'warning' : 'failed',
        score,
        evidence: {
          socialLinks,
          verifiedCount,
          totalCount,
          verificationRate: verifiedCount / totalCount
        },
        issue: score < 50 ? 'Social media verification failed' : undefined,
        warning: score < 70 ? 'Limited social media verification' : undefined
      };
    } catch (error) {
      return {
        type: 'social_media_verification',
        status: 'warning',
        score: 50,
        evidence: { error: error.message },
        warning: 'Social media verification failed'
      };
    }
  }

  private async checkProjectLegitimacy(discovery: any): Promise<any> {
    try {
      const prompt = `
        Assess the legitimacy of this project based on the airdrop discovery:

        Title: ${discovery.title}
        Description: ${discovery.description}
        Source: ${discovery.sourceUrl}
        Author: ${discovery.author}

        Evaluate:
        1. Project concept and feasibility
        2. Team transparency (if mentioned)
        3. Technical details provided
        4. Business model clarity
        5. Roadmap or timeline presence
        6. Community engagement indicators

        Provide a JSON response with:
        - legitimacyScore: 0-100
        - redFlags: array of concerning elements
        - greenFlags: array of positive indicators
        - assessment: brief summary
        - recommendation: "legitimate", "questionable", or "suspicious"
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at evaluating cryptocurrency project legitimacy.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const response = completion.choices[0]?.message?.content;
      const analysis = JSON.parse(response || '{}');

      return {
        type: 'project_legitimacy',
        status: analysis.legitimacyScore > 70 ? 'passed' : analysis.legitimacyScore > 50 ? 'warning' : 'failed',
        score: analysis.legitimacyScore || 50,
        evidence: analysis,
        issue: analysis.legitimacyScore < 50 ? 'Project legitimacy concerns' : undefined,
        warning: analysis.legitimacyScore < 70 ? 'Moderate legitimacy concerns' : undefined
      };
    } catch (error) {
      return {
        type: 'project_legitimacy',
        status: 'warning',
        score: 50,
        evidence: { error: error.message },
        warning: 'Project legitimacy assessment failed'
      };
    }
  }

  private async checkScamPatterns(discovery: any): Promise<any> {
    try {
      const scamPatterns = [
        'send eth to receive',
        'connect wallet to receive',
        'private key',
        'seed phrase',
        'guaranteed profit',
        '100x return',
        'limited time only',
        'act now or miss out',
        'exclusive offer',
        'urgent action required'
      ];

      const content = `${discovery.title} ${discovery.description} ${discovery.content || ''}`.toLowerCase();
      
      let scamScore = 0;
      const foundPatterns: string[] = [];

      for (const pattern of scamPatterns) {
        if (content.includes(pattern)) {
          scamScore += 20;
          foundPatterns.push(pattern);
        }
      }

      // Check for excessive urgency
      const urgencyWords = ['urgent', 'immediately', 'now', 'today', 'hurry'];
      const urgencyCount = urgencyWords.filter(word => content.includes(word)).length;
      if (urgencyCount > 3) {
        scamScore += 15;
        foundPatterns.push('excessive urgency');
      }

      // Check for unrealistic promises
      const unrealisticPatterns = ['free money', 'guaranteed', 'no risk', 'instant profit'];
      for (const pattern of unrealisticPatterns) {
        if (content.includes(pattern)) {
          scamScore += 25;
          foundPatterns.push(pattern);
        }
      }

      const score = Math.max(0, 100 - scamScore);

      return {
        type: 'scam_pattern_detection',
        status: score > 70 ? 'passed' : score > 50 ? 'warning' : 'failed',
        score,
        evidence: {
          scamPatternsFound: foundPatterns,
          scamScore,
          urgencyCount
        },
        issue: score < 50 ? 'Multiple scam patterns detected' : undefined,
        warning: score < 70 ? 'Potential scam patterns detected' : undefined
      };
    } catch (error) {
      return {
        type: 'scam_pattern_detection',
        status: 'warning',
        score: 50,
        evidence: { error: error.message },
        warning: 'Scam pattern detection failed'
      };
    }
  }

  private calculateConfidence(checks: any[]): number {
    if (checks.length === 0) return 0;
    
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    return Math.round(totalScore / checks.length);
  }

  private calculateRiskScore(checks: any[]): number {
    if (checks.length === 0) return 100;
    
    const failedChecks = checks.filter(c => c.status === 'failed').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;
    
    const riskScore = (failedChecks * 40) + (warningChecks * 20);
    return Math.min(100, riskScore);
  }

  private generateRecommendations(checks: any[], riskScore: number): string[] {
    const recommendations: string[] = [];

    if (riskScore > 60) {
      recommendations.push('High risk detected - manual review required');
      recommendations.push('Consider rejecting this submission');
    } else if (riskScore > 30) {
      recommendations.push('Moderate risk - additional verification needed');
      recommendations.push('Request more information from source');
    } else {
      recommendations.push('Low risk - can proceed with standard verification');
    }

    // Specific recommendations based on failed checks
    const failedChecks = checks.filter(c => c.status === 'failed');
    for (const check of failedChecks) {
      switch (check.type) {
        case 'source_reliability':
          recommendations.push('Verify source credibility');
          break;
        case 'content_analysis':
          recommendations.push('Improve content quality');
          break;
        case 'domain_verification':
          recommendations.push('Investigate domain legitimacy');
          break;
        case 'scam_pattern_detection':
          recommendations.push('Investigate potential scam indicators');
          break;
      }
    }

    return recommendations;
  }

  private async updateDiscoveryAfterVerification(discoveryId: string, result: VerificationResult) {
    try {
      const status = result.isValid ? 'verified' : 'needs_review';
      
      await db.airdropDiscovery.update({
        where: { id: discoveryId },
        data: {
          status,
          confidence: result.confidence,
          processedAt: new Date(),
          metadata: {
            verificationResult: result,
            verifiedAt: new Date().toISOString()
          }
        }
      });

      // Create validation record
      await db.airdropValidation.create({
        data: {
          discoveryId,
          validationType: 'automated',
          validator: 'processing_pipeline',
          result: result.isValid ? 'valid' : 'needs_review',
          confidence: result.confidence,
          riskScore: result.riskScore,
          checks: result.checks,
          issues: result.issues,
          warnings: result.warnings,
          recommendations: result.recommendations,
          evidence: result.evidence
        }
      });

      logger.info(`Updated discovery ${discoveryId} status to ${status}`);
    } catch (error) {
      logger.error('Failed to update discovery after verification:', error);
    }
  }

  private async processValidation(data: any): Promise<ValidationResult> {
    // Implementation for validation processing
    return {
      result: 'needs_review',
      confidence: 50,
      riskScore: 50,
      legitimacyScore: 50,
      factors: {},
      analysis: 'Validation processing not implemented'
    };
  }

  private async processRiskAssessment(data: any): Promise<any> {
    // Implementation for risk assessment processing
    return { riskScore: 50, factors: [] };
  }

  private async processCategorization(data: any): Promise<any> {
    // Implementation for categorization processing
    return { category: 'defi', tags: [] };
  }

  private async processEnrichment(data: any): Promise<any> {
    // Implementation for data enrichment processing
    return { enriched: true, additionalData: {} };
  }

  async getProcessingStats() {
    return {
      queueLength: this.processingQueue.length,
      isProcessing: this.isProcessing,
      pendingTasks: this.processingQueue.filter(t => t.status === 'pending').length,
      processingTasks: this.processingQueue.filter(t => t.status === 'processing').length,
      completedTasks: this.processingQueue.filter(t => t.status === 'completed').length,
      failedTasks: this.processingQueue.filter(t => t.status === 'failed').length
    };
  }

  async getTaskHistory(limit = 50) {
    return this.processingQueue
      .filter(task => task.status !== 'pending')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

export const dataProcessingPipeline = new DataProcessingPipeline();