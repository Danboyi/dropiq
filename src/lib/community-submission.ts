import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface CommunitySubmissionData {
  submittedBy?: string;
  submitterEmail?: string;
  submitterWallet?: string;
  title: string;
  description: string;
  projectWebsite?: string;
  socialLinks?: Record<string, string>;
  evidence?: any;
  confidence: number; // 1-5
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SubmissionReview {
  submissionId: string;
  reviewerId: string;
  status: 'approved' | 'rejected' | 'needs_review';
  notes?: string;
  confidence: number;
  recommendations: string[];
}

export class CommunitySubmissionService {
  private zai: ZAI;

  constructor() {
    this.zai = new ZAI();
  }

  async submitAirdrop(submissionData: CommunitySubmissionData) {
    try {
      // Validate submission data
      const validation = await this.validateSubmission(submissionData);
      
      if (!validation.isValid) {
        throw new Error(`Invalid submission: ${validation.errors.join(', ')}`);
      }

      // Create submission record
      const submission = await db.communitySubmission.create({
        data: {
          submittedBy: submissionData.submittedBy,
          submitterEmail: submissionData.submitterEmail,
          submitterWallet: submissionData.submitterWallet,
          title: submissionData.title,
          description: submissionData.description,
          projectWebsite: submissionData.projectWebsite,
          socialLinks: submissionData.socialLinks || {},
          evidence: submissionData.evidence || {},
          confidence: submissionData.confidence,
          status: 'pending',
          priority: this.calculatePriority(submissionData),
          tags: submissionData.tags || [],
          metadata: {
            ...submissionData.metadata,
            validation,
            submittedAt: new Date().toISOString()
          }
        }
      });

      // Auto-review if high confidence
      if (submissionData.confidence >= 4 && validation.riskScore < 30) {
        await this.autoReviewSubmission(submission.id);
      }

      // Send notification to reviewers
      await this.notifyReviewers(submission);

      logger.info(`Community submission created: ${submission.id}`);
      return submission;
    } catch (error) {
      logger.error('Failed to create community submission:', error);
      throw error;
    }
  }

  private async validateSubmission(submissionData: CommunitySubmissionData) {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      // Basic validation
      if (!submissionData.title || submissionData.title.length < 10) {
        errors.push('Title must be at least 10 characters long');
      }

      if (!submissionData.description || submissionData.description.length < 50) {
        errors.push('Description must be at least 50 characters long');
      }

      if (submissionData.confidence < 1 || submissionData.confidence > 5) {
        errors.push('Confidence must be between 1 and 5');
      }

      // URL validation
      if (submissionData.projectWebsite) {
        try {
          new URL(submissionData.projectWebsite);
        } catch {
          errors.push('Invalid project website URL');
        }
      }

      // Wallet address validation
      if (submissionData.submitterWallet) {
        if (!this.isValidWalletAddress(submissionData.submitterWallet)) {
          errors.push('Invalid wallet address format');
        }
      }

      // AI-powered validation
      const aiValidation = await this.aiValidateSubmission(submissionData);
      
      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        riskScore: aiValidation.riskScore,
        legitimacyScore: aiValidation.legitimacyScore,
        aiAnalysis: aiValidation
      };
    } catch (error) {
      logger.error('Failed to validate submission:', error);
      return {
        isValid: false,
        errors: ['Validation system error'],
        warnings: [],
        riskScore: 100,
        legitimacyScore: 0,
        aiAnalysis: null
      };
    }
  }

  private async aiValidateSubmission(submissionData: CommunitySubmissionData) {
    try {
      const prompt = `
        Analyze this community airdrop submission for legitimacy and potential:

        Title: ${submissionData.title}
        Description: ${submissionData.description}
        Project Website: ${submissionData.projectWebsite || 'Not provided'}
        Submitter Confidence: ${submissionData.confidence}/5
        Tags: ${submissionData.tags?.join(', ') || 'None'}

        Social Links: ${JSON.stringify(submissionData.socialLinks || {})}
        Evidence: ${JSON.stringify(submissionData.evidence || {})}

        Provide a JSON response with:
        - riskScore: 0-100 (higher = more risky)
        - legitimacyScore: 0-100 (higher = more legitimate)
        - redFlags: array of suspicious indicators
        - positiveSignals: array of legitimate indicators
        - recommendations: array of recommended actions
        - summary: brief assessment of the submission
        - suggestedPriority: "low", "medium", or "high"

        Look for:
        1. Scam indicators (requests for payments, private keys, etc.)
        2. Project legitimacy (website quality, team information, etc.)
        3. Airdrop feasibility (clear requirements, realistic claims, etc.)
        4. Source credibility (submitter information, evidence quality)
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert airdrop reviewer specializing in identifying legitimate opportunities and potential scams.'
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
          riskScore: 50,
          legitimacyScore: 50,
          redFlags: ['ai_analysis_failed'],
          positiveSignals: [],
          recommendations: ['manual_review_required'],
          summary: 'AI analysis failed',
          suggestedPriority: 'medium'
        };
      }
    } catch (error) {
      logger.error('Failed to AI validate submission:', error);
      return {
        riskScore: 100,
        legitimacyScore: 0,
        redFlags: ['system_error'],
        positiveSignals: [],
        recommendations: ['retry_validation'],
        summary: 'Validation system error',
        suggestedPriority: 'low'
      };
    }
  }

  private calculatePriority(submissionData: CommunitySubmissionData): string {
    // Calculate priority based on confidence and other factors
    if (submissionData.confidence >= 4 && submissionData.evidence) {
      return 'high';
    } else if (submissionData.confidence >= 3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private async autoReviewSubmission(submissionId: string) {
    try {
      const submission = await db.communitySubmission.findUnique({
        where: { id: submissionId }
      });

      if (!submission) return;

      // Perform automated review
      const reviewResult = await this.performAutomatedReview(submission);

      // Update submission status
      await db.communitySubmission.update({
        where: { id: submissionId },
        data: {
          status: reviewResult.status,
          reviewerNotes: reviewResult.notes,
          reviewedAt: new Date(),
          metadata: {
            ...submission.metadata,
            autoReview: reviewResult
          }
        }
      });

      // If approved, create airdrop discovery
      if (reviewResult.status === 'approved') {
        await this.createAirdropFromSubmission(submission);
      }

      logger.info(`Auto-reviewed submission ${submissionId}: ${reviewResult.status}`);
    } catch (error) {
      logger.error('Failed to auto-review submission:', error);
    }
  }

  private async performAutomatedReview(submission: any) {
    try {
      const validation = submission.metadata?.validation;
      
      if (!validation) {
        return {
          status: 'needs_review',
          notes: 'Missing validation data',
          confidence: 0
        };
      }

      // Auto-approve criteria
      if (
        submission.confidence >= 4 &&
        validation.riskScore < 20 &&
        validation.legitimacyScore > 80 &&
        submission.projectWebsite &&
        !validation.errors.length
      ) {
        return {
          status: 'approved',
          notes: 'Auto-approved: High confidence submission with low risk',
          confidence: 90
        };
      }

      // Auto-reject criteria
      if (
        validation.riskScore > 80 ||
        validation.legitimacyScore < 20 ||
        validation.errors.some((e: string) => e.includes('scam') || e.includes('invalid'))
      ) {
        return {
          status: 'rejected',
          notes: 'Auto-rejected: High risk or legitimacy concerns',
          confidence: 10
        };
      }

      return {
        status: 'needs_review',
        notes: 'Requires manual review',
        confidence: 50
      };
    } catch (error) {
      logger.error('Failed to perform automated review:', error);
      return {
        status: 'needs_review',
        notes: 'Automated review failed',
        confidence: 0
      };
    }
  }

  private async createAirdropFromSubmission(submission: any) {
    try {
      // Find or create project
      const project = await this.findOrCreateProjectFromSubmission(submission);

      // Create airdrop discovery
      const discovery = await db.airdropDiscovery.create({
        data: {
          sourceId: await this.getCommunitySourceId(),
          sourceUrl: submission.projectWebsite,
          title: `Community Submission: ${submission.title}`,
          description: submission.description,
          content: `Community submitted airdrop opportunity\n\n${submission.description}\n\nSubmitted by: ${submission.submitterEmail || 'Anonymous'}\nConfidence: ${submission.confidence}/5`,
          author: submission.submitterWallet || 'Community Member',
          publishedAt: submission.createdAt,
          discoveredAt: new Date(),
          confidence: submission.confidence * 20, // Convert 1-5 to 0-100
          status: 'verified',
          priority: submission.priority,
          tags: ['community_submission', ...submission.tags],
          metadata: {
            submissionId: submission.id,
            submitterEmail: submission.submitterEmail,
            submitterWallet: submission.submitterWallet,
            evidence: submission.evidence,
            socialLinks: submission.socialLinks,
            validation: submission.metadata?.validation
          }
        }
      });

      // Create validation
      await db.airdropValidation.create({
        data: {
          discoveryId: discovery.id,
          validationType: 'community',
          validator: 'community_review',
          result: 'valid',
          confidence: submission.confidence * 20,
          riskScore: submission.metadata?.validation?.riskScore || 50,
          checks: ['community_submission', 'automated_review'],
          issues: [],
          warnings: submission.metadata?.validation?.warnings || [],
          recommendations: ['community_verified'],
          evidence: {
            submission,
            validation: submission.metadata?.validation
          }
        }
      });

      logger.info(`Created airdrop discovery from community submission: ${discovery.id}`);
    } catch (error) {
      logger.error('Failed to create airdrop from submission:', error);
    }
  }

  private async findOrCreateProjectFromSubmission(submission: any) {
    try {
      // Try to find existing project by website
      if (submission.projectWebsite) {
        let existingProject = await db.project.findFirst({
          where: {
            website: submission.projectWebsite
          }
        });

        if (existingProject) {
          return existingProject;
        }
      }

      // Create new project
      const project = await db.project.create({
        data: {
          name: this.extractProjectName(submission.title),
          slug: this.generateSlug(submission.title),
          description: submission.description,
          website: submission.projectWebsite || '',
          category: this.inferCategory(submission.tags),
          blockchain: 'ethereum', // Default
          verificationStatus: 'community_verified',
          isActive: true,
          tags: submission.tags || [],
          socialLinks: submission.socialLinks || {},
          metadata: {
            source: 'community_submission',
            submissionId: submission.id,
            submitterConfidence: submission.confidence
          }
        }
      });

      return project;
    } catch (error) {
      logger.error('Failed to find or create project from submission:', error);
      throw error;
    }
  }

  private async getCommunitySourceId(): Promise<string> {
    try {
      // Find or create community source
      let source = await db.airdropSource.findUnique({
        where: { name: 'Community Submissions' }
      });

      if (!source) {
        source = await db.airdropSource.create({
          data: {
            name: 'Community Submissions',
            type: 'community',
            reliability: 75,
            syncFrequency: 300,
            isActive: true,
            config: {
              acceptsSubmissions: true,
              autoReview: true,
              communityModerated: true
            }
          }
        });
      }

      return source.id;
    } catch (error) {
      logger.error('Failed to get community source ID:', error);
      throw error;
    }
  }

  private extractProjectName(title: string): string {
    // Extract project name from submission title
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

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      + '-' + Date.now();
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

  private isValidWalletAddress(address: string): boolean {
    // Simple ETH address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private async notifyReviewers(submission: any) {
    try {
      // Create notification for reviewers
      await db.userNotification.create({
        data: {
          type: 'community_submission',
          title: 'New Community Submission',
          message: `A new airdrop submission "${submission.title}" requires review`,
          data: {
            submissionId: submission.id,
            priority: submission.priority
          },
          priority: submission.priority === 'high' ? 'high' : 'normal',
          category: 'info'
        }
      });

      logger.info(`Reviewers notified about submission: ${submission.id}`);
    } catch (error) {
      logger.error('Failed to notify reviewers:', error);
    }
  }

  async reviewSubmission(reviewData: SubmissionReview, reviewerId: string) {
    try {
      const submission = await db.communitySubmission.findUnique({
        where: { id: reviewData.submissionId }
      });

      if (!submission) {
        throw new Error('Submission not found');
      }

      // Update submission with review
      const updatedSubmission = await db.communitySubmission.update({
        where: { id: reviewData.submissionId },
        data: {
          status: reviewData.status,
          reviewerId,
          reviewerNotes: reviewData.notes,
          reviewedAt: new Date(),
          ...(reviewData.status === 'approved' && { approvedAt: new Date() }),
          ...(reviewData.status === 'rejected' && { 
            rejectedAt: new Date(),
            rejectionReason: reviewData.notes 
          }),
          metadata: {
            ...submission.metadata,
            review: {
              ...reviewData,
              reviewedAt: new Date().toISOString(),
              reviewerId
            }
          }
        }
      });

      // If approved, create airdrop discovery
      if (reviewData.status === 'approved') {
        await this.createAirdropFromSubmission(updatedSubmission);
      }

      logger.info(`Submission ${reviewData.submissionId} reviewed: ${reviewData.status}`);
      return updatedSubmission;
    } catch (error) {
      logger.error('Failed to review submission:', error);
      throw error;
    }
  }

  async getPendingSubmissions(limit = 20) {
    return await db.communitySubmission.findMany({
      where: {
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  async getSubmissionStats() {
    const stats = await db.communitySubmission.groupBy({
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

  async getSubmissionsByUser(submitterEmail?: string, submitterWallet?: string) {
    const where: any = {};
    
    if (submitterEmail) where.submitterEmail = submitterEmail;
    if (submitterWallet) where.submitterWallet = submitterWallet;

    return await db.communitySubmission.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}

export const communitySubmissionService = new CommunitySubmissionService();