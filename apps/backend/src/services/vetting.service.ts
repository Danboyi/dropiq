import { db } from '@/lib/db';
import { 
  DiscoveredAirdrop, 
  VettingJob, 
  VettingReport,
  VettingLayer,
  VettingResult,
  JobStatus,
  JobType,
  DiscoveryStatus
} from '@prisma/client';
import { DiscoveryService } from './discovery.service';
import { ExternalAPIService } from './external-api.service';
import ZAI from 'z-ai-web-dev-sdk';
import axios from 'axios';

export interface VettingConfig {
  enableSanityCheck: boolean;
  enableFundamentals: boolean;
  enableAIAnalysis: boolean;
  riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export interface VettingResult {
  layer: VettingLayer;
  result: VettingResult;
  score: number;
  summary: string;
  risks: string[];
  rewards: string[];
  data: any;
}

export class VettingService {
  private static defaultConfig: VettingConfig = {
    enableSanityCheck: true,
    enableFundamentals: true,
    enableAIAnalysis: true,
    riskThresholds: {
      low: 30,
      medium: 60,
      high: 80
    }
  };

  /**
   * Start vetting process for a discovered airdrop
   */
  static async startVetting(discoveredAirdropId: string, config: Partial<VettingConfig> = {}): Promise<void> {
    const vettingConfig = { ...this.defaultConfig, ...config };
    
    try {
      const discoveredAirdrop = await db.discoveredAirdrop.findUnique({
        where: { id: discoveredAirdropId },
        include: { source: true }
      });

      if (!discoveredAirdrop) {
        throw new Error(`Discovered airdrop not found: ${discoveredAirdropId}`);
      }

      // Update status to vetting
      await db.discoveredAirdrop.update({
        where: { id: discoveredAirdropId },
        data: { status: DiscoveryStatus.VETTING }
      });

      // Create vetting jobs
      const jobs: VettingJob[] = [];

      if (vettingConfig.enableSanityCheck) {
        jobs.push(await this.createVettingJob(
          discoveredAirdropId,
          JobType.VETTING_SANITY,
          1, // High priority
          { layer: VettingLayer.SECURITY }
        ));
      }

      if (vettingConfig.enableFundamentals) {
        jobs.push(await this.createVettingJob(
          discoveredAirdropId,
          JobType.VETTING_FUNDAMENTALS,
          2, // Medium priority
          { layer: VettingLayer.TECHNICAL }
        ));
      }

      if (vettingConfig.enableAIAnalysis) {
        jobs.push(await this.createVettingJob(
          discoveredAirdropId,
          JobType.VETTING_AI_ANALYSIS,
          3, // Lower priority
          { layer: VettingLayer.COMMUNITY }
        ));
      }

      console.log(`Created ${jobs.length} vetting jobs for discovered airdrop: ${discoveredAirdropId}`);

    } catch (error) {
      console.error('Error starting vetting process:', error);
      throw error;
    }
  }

  /**
   * Create a vetting job
   */
  private static async createVettingJob(
    discoveredAirdropId: string,
    type: JobType,
    priority: number,
    config: any
  ): Promise<VettingJob> {
    return await db.vettingJob.create({
      data: {
        type,
        status: JobStatus.PENDING,
        priority,
        config,
        discoveredAirdropId,
        scheduledAt: new Date()
      }
    });
  }

  /**
   * Process a vetting job
   */
  static async processVettingJob(jobId: string): Promise<void> {
    const job = await db.vettingJob.findUnique({
      where: { id: jobId },
      include: { discoveredAirdrop: true }
    });

    if (!job) {
      throw new Error(`Vetting job not found: ${jobId}`);
    }

    try {
      // Update job status to running
      await db.vettingJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.RUNNING,
          startedAt: new Date(),
          progress: 0
        }
      });

      let vettingResult: VettingResult;

      switch (job.type) {
        case JobType.VETTING_SANITY:
          vettingResult = await this.performSanityCheck(job.discoveredAirdrop);
          break;
        case JobType.VETTING_FUNDAMENTALS:
          vettingResult = await this.performFundamentalsCheck(job.discoveredAirdrop);
          break;
        case JobType.VETTING_AI_ANALYSIS:
          vettingResult = await this.performAIAnalysis(job.discoveredAirdrop);
          break;
        default:
          throw new Error(`Unsupported vetting job type: ${job.type}`);
      }

      // Save vetting report
      await this.saveVettingReport(job.discoveredAirdropId, vettingResult);

      // Update job status to completed
      await db.vettingJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.COMPLETED,
          completedAt: new Date(),
          progress: 100,
          result: vettingResult
        }
      });

      // Check if all jobs are completed
      await this.checkVettingCompletion(job.discoveredAirdropId);

    } catch (error) {
      console.error(`Error processing vetting job ${jobId}:`, error);
      
      // Update job status to failed
      await db.vettingJob.update({
        where: { id: jobId },
        data: {
          status: JobStatus.FAILED,
          error: error instanceof Error ? error.message : 'Unknown error',
          retryCount: job.retryCount + 1
        }
      });

      throw error;
    }
  }

  /**
   * Layer 1: Sanity Check
   */
  private static async performSanityCheck(discoveredAirdrop: DiscoveredAirdrop): Promise<VettingResult> {
    const data = discoveredAirdrop.rawContent as any;
    const risks: string[] = [];
    const rewards: string[] = [];
    let score = 100;

    // Check for spam indicators
    if (data.description && data.description.length < 50) {
      risks.push('Very short description');
      score -= 20;
    }

    // Check for duplicate content
    if (discoveredAirdrop.duplicateOf) {
      risks.push('Duplicate content detected');
      score -= 30;
    }

    // Check for basic project information
    if (!data.name || data.name.toLowerCase().includes('unknown')) {
      risks.push('Missing or unclear project name');
      score -= 25;
    }

    // Check for social links
    if (!data.socialLinks || Object.keys(data.socialLinks).length === 0) {
      risks.push('No social media presence');
      score -= 15;
    } else {
      rewards.push('Has social media presence');
    }

    // Check for URL
    if (!data.url && !data.sourceUrl) {
      risks.push('No project website');
      score -= 20;
    } else {
      rewards.push('Has project website');
    }

    const result = score >= 70 ? VettingResult.SAFE : 
                   score >= 40 ? VettingResult.CAUTION : 
                   VettingResult.RISKY;

    return {
      layer: VettingLayer.SECURITY,
      result,
      score,
      summary: `Sanity check completed with score ${score}/100`,
      risks,
      rewards,
      data: {
        checks: {
          hasDescription: !!data.description,
          hasName: !!data.name,
          hasSocialLinks: !!(data.socialLinks && Object.keys(data.socialLinks).length > 0),
          hasUrl: !!(data.url || data.sourceUrl)
        }
      }
    };
  }

  /**
   * Layer 2: Fundamentals Check
   */
  private static async performFundamentalsCheck(discoveredAirdrop: DiscoveredAirdrop): Promise<VettingResult> {
    const data = discoveredAirdrop.rawContent as any;
    const risks: string[] = [];
    const rewards: string[] = [];
    let score = 100;

    try {
      // Check for contract addresses (if available)
      if (data.contractAddress) {
        const contractAnalysis = await this.analyzeContract(data.contractAddress);
        if (contractAnalysis.risk > 0.7) {
          risks.push('High contract risk detected');
          score -= 40;
        } else {
          rewards.push('Contract analysis passed');
        }
      }

      // Check for team information
      if (data.team && data.team.anonymous) {
        risks.push('Anonymous team');
        score -= 25;
      } else if (data.team && data.team.experienced) {
        rewards.push('Experienced team');
        score += 10;
      }

      // Check for tokenomics
      if (data.tokenomics) {
        if (data.tokenomics.totalSupply && data.tokenomics.totalSupply > 1e12) {
          risks.push('Very high token supply');
          score -= 15;
        }
        if (data.tokenomics.vesting && data.tokenomics.vesting.fair) {
          rewards.push('Fair vesting schedule');
          score += 10;
        }
      }

      // Check for audit information
      if (data.audit) {
        if (data.audit.certified) {
          rewards.push('Certified audit available');
          score += 20;
        }
      } else {
        risks.push('No audit information available');
        score -= 10;
      }

    } catch (error) {
      console.error('Error in fundamentals check:', error);
      risks.push('Fundamentals check failed');
      score -= 30;
    }

    const result = score >= 70 ? VettingResult.SAFE : 
                   score >= 40 ? VettingResult.CAUTION : 
                   VettingResult.RISKY;

    return {
      layer: VettingLayer.TECHNICAL,
      result,
      score,
      summary: `Fundamentals check completed with score ${score}/100`,
      risks,
      rewards,
      data: {
        contractChecked: !!data.contractAddress,
        teamChecked: !!data.team,
        tokenomicsChecked: !!data.tokenomics,
        auditChecked: !!data.audit
      }
    };
  }

  /**
   * Layer 3: AI Analysis
   */
  private static async performAIAnalysis(discoveredAirdrop: DiscoveredAirdrop): Promise<VettingResult> {
    const data = discoveredAirdrop.rawContent as any;
    const risks: string[] = [];
    const rewards: string[] = [];
    let score = 100;

    try {
      const zai = await ZAI.create();

      // Analyze sentiment and legitimacy
      const analysisPrompt = `
        Analyze this airdrop announcement for legitimacy and potential risks:
        
        Project Name: ${data.name}
        Description: ${data.description}
        Requirements: ${data.requirements ? data.requirements.join(', ') : 'Not specified'}
        
        Please provide:
        1. Sentiment analysis (positive/neutral/negative)
        2. Legitimacy score (0-100)
        3. Risk factors
        4. Positive indicators
        5. Overall assessment
      `;

      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing cryptocurrency airdrops for legitimacy and risk factors.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      
      // Parse AI response (simplified)
      if (aiResponse.toLowerCase().includes('high risk')) {
        risks.push('AI analysis indicates high risk');
        score -= 30;
      }
      if (aiResponse.toLowerCase().includes('scam')) {
        risks.push('AI analysis indicates potential scam');
        score -= 50;
      }
      if (aiResponse.toLowerCase().includes('legitimate')) {
        rewards.push('AI analysis indicates legitimacy');
        score += 20;
      }
      if (aiResponse.toLowerCase().includes('positive')) {
        rewards.push('Positive sentiment detected');
        score += 10;
      }

      // Check for bot activity indicators
      const botCheckPrompt = `
        Analyze this text for bot activity indicators:
        "${data.description}"
        
        Look for:
        - Repetitive phrases
        - Generic language
        - Excessive emoji usage
        - Unusual capitalization
        - Grammar issues
      `;

      const botCheck = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert at detecting bot-generated content.'
          },
          {
            role: 'user',
            content: botCheckPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.1
      });

      const botResponse = botCheck.choices[0]?.message?.content || '';
      
      if (botResponse.toLowerCase().includes('bot detected')) {
        risks.push('Bot activity detected');
        score -= 25;
      } else if (botResponse.toLowerCase().includes('human-like')) {
        rewards.push('Human-like content');
        score += 15;
      }

    } catch (error) {
      console.error('Error in AI analysis:', error);
      risks.push('AI analysis failed');
      score -= 20;
    }

    const result = score >= 70 ? VettingResult.SAFE : 
                   score >= 40 ? VettingResult.CAUTION : 
                   VettingResult.RISKY;

    return {
      layer: VettingLayer.COMMUNITY,
      result,
      score,
      summary: `AI analysis completed with score ${score}/100`,
      risks,
      rewards,
      data: {
        aiAnalysisCompleted: true,
        sentiment: score >= 60 ? 'positive' : 'negative'
      }
    };
  }

  /**
   * Analyze smart contract using external APIs
   */
  private static async analyzeContract(contractAddress: string): Promise<{ risk: number; issues: string[] }> {
    try {
      // Use GoPlus Labs for contract analysis
      const analysis = await ExternalAPIService.analyzeContract(contractAddress);
      
      const issues = analysis.issues.map(issue => 
        `${issue.severity.toUpperCase()}: ${issue.description}`
      );

      return {
        risk: analysis.risk.overall,
        issues
      };
    } catch (error) {
      console.error('Error analyzing contract:', error);
      return { risk: 0.5, issues: ['Contract analysis failed'] };
    }
  }

  /**
   * Save vetting report
   */
  private static async saveVettingReport(discoveredAirdropId: string, result: VettingResult): Promise<VettingReport> {
    return await db.vettingReport.create({
      data: {
        discoveredAirdropId,
        layer: result.layer,
        result: result.result,
        score: result.score,
        summary: result.summary,
        risks: JSON.stringify(result.risks),
        rewards: JSON.stringify(result.rewards),
        data: result.data,
        generatedAt: new Date(),
        model: 'DropIQ-V1.0'
      }
    });
  }

  /**
   * Check if all vetting jobs are completed
   */
  private static async checkVettingCompletion(discoveredAirdropId: string): Promise<void> {
    const pendingJobs = await db.vettingJob.count({
      where: {
        discoveredAirdropId,
        status: {
          in: [JobStatus.PENDING, JobStatus.RUNNING]
        }
      }
    });

    if (pendingJobs === 0) {
      // All jobs completed, calculate overall score
      const reports = await db.vettingReport.findMany({
        where: { discoveredAirdropId }
      });

      const averageScore = reports.length > 0 
        ? reports.reduce((sum, report) => sum + report.score, 0) / reports.length 
        : 0;

      // Update discovered airdrop status
      const newStatus = averageScore >= 60 ? DiscoveryStatus.APPROVED : DiscoveryStatus.DISCOVERED;
      
      await db.discoveredAirdrop.update({
        where: { id: discoveredAirdropId },
        data: { status: newStatus }
      });

      console.log(`Vetting completed for ${discoveredAirdropId}. Average score: ${averageScore}/100, Status: ${newStatus}`);
    }
  }

  /**
   * Get vetting summary for a discovered airdrop
   */
  static async getVettingSummary(discoveredAirdropId: string): Promise<any> {
    const reports = await db.vettingReport.findMany({
      where: { discoveredAirdropId },
      orderBy: { generatedAt: 'desc' }
    });

    const jobs = await db.vettingJob.findMany({
      where: { discoveredAirdropId },
      orderBy: { createdAt: 'desc' }
    });

    const averageScore = reports.length > 0 
      ? reports.reduce((sum, report) => sum + report.score, 0) / reports.length 
      : 0;

    return {
      reports: reports.map(report => ({
        ...report,
        risks: JSON.parse(report.risks || '[]'),
        rewards: JSON.parse(report.rewards || '[]')
      })),
      jobs,
      averageScore,
      totalReports: reports.length,
      completedJobs: jobs.filter(job => job.status === JobStatus.COMPLETED).length,
      pendingJobs: jobs.filter(job => job.status === JobStatus.PENDING || job.status === JobStatus.RUNNING).length
    };
  }
}