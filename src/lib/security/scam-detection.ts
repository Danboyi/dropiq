import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface ScamDetectionResult {
  isScam: boolean;
  confidence: number; // 0-100
  riskScore: number; // 0-100
  redFlags: RedFlag[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  analysis: {
    projectAnalysis: ProjectAnalysis;
    teamAnalysis: TeamAnalysis;
    tokenAnalysis: TokenAnalysis;
    socialAnalysis: SocialAnalysis;
    contractAnalysis: ContractAnalysis;
  };
}

export interface RedFlag {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: any;
  weight: number; // 0-1
}

export interface ProjectAnalysis {
  hasWebsite: boolean;
  websiteQuality: number; // 0-100
  hasWhitepaper: boolean;
  whitepaperQuality: number; // 0-100
  hasRoadmap: boolean;
  roadmapQuality: number; // 0-100
  projectAge: number; // days
  descriptionQuality: number; // 0-100
  hasClearUseCase: boolean;
}

export interface TeamAnalysis {
  hasTeamInfo: boolean;
  teamVisible: boolean;
  teamExperience: number; // 0-100
  hasDoxxedTeam: boolean;
  teamSize: number;
  LinkedInProfiles: number;
  teamConsistency: number; // 0-100
}

export interface TokenAnalysis {
  hasToken: boolean;
  tokenDistribution: number; // 0-100 (fair distribution)
  liquidityLocked: boolean;
  contractVerified: boolean;
  hasAudit: boolean;
  tokenomics: number; // 0-100
  supplyReasonable: boolean;
}

export interface SocialAnalysis {
  hasTwitter: boolean;
  twitterFollowers: number;
  twitterEngagement: number; // 0-100
  hasDiscord: boolean;
  discordMembers: number;
  hasTelegram: boolean;
  telegramMembers: number;
  socialConsistency: number; // 0-100
  botActivity: number; // 0-100 (higher = more suspicious)
}

export interface ContractAnalysis {
  contractVerified: boolean;
  hasHoneypot: boolean;
  hasMintFunction: boolean;
  hasOwnerFunctions: boolean;
  transferTax: number;
  blacklistFunctions: boolean;
  proxyContract: boolean;
  contractAge: number; // days
}

export class ScamDetectionEngine {
  private zai: ZAI;

  constructor() {
    this.zai = null as any;
  }

  private async initializeZAI() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }

  async analyzeProject(projectData: {
    name: string;
    description: string;
    website?: string;
    contractAddress?: string;
    socialLinks?: any;
    team?: any;
    tokenomics?: any;
    blockchain: string;
  }): Promise<ScamDetectionResult> {
    await this.initializeZAI();

    const redFlags: RedFlag[] = [];
    let totalRiskScore = 0;
    let totalWeight = 0;

    // Project Analysis
    const projectAnalysis = await this.analyzeProjectDetails(projectData);
    const projectRedFlags = this.getProjectRedFlags(projectAnalysis);
    redFlags.push(...projectRedFlags);

    // Team Analysis
    const teamAnalysis = await this.analyzeTeam(projectData.team, projectData.website);
    const teamRedFlags = this.getTeamRedFlags(teamAnalysis);
    redFlags.push(...teamRedFlags);

    // Token Analysis
    const tokenAnalysis = await this.analyzeToken(projectData);
    const tokenRedFlags = this.getTokenRedFlags(tokenAnalysis);
    redFlags.push(...tokenRedFlags);

    // Social Analysis
    const socialAnalysis = await this.analyzeSocial(projectData.socialLinks);
    const socialRedFlags = this.getSocialRedFlags(socialAnalysis);
    redFlags.push(...socialRedFlags);

    // Contract Analysis
    const contractAnalysis = await this.analyzeContract(projectData.contractAddress, projectData.blockchain);
    const contractRedFlags = this.getContractRedFlags(contractAnalysis);
    redFlags.push(...contractRedFlags);

    // AI-powered analysis
    const aiAnalysis = await this.performAIAnalysis(projectData);
    const aiRedFlags = aiAnalysis.redFlags;
    redFlags.push(...aiRedFlags);

    // Calculate overall risk score
    const weightedRisk = this.calculateWeightedRisk(redFlags);
    const confidence = this.calculateConfidence(redFlags, projectAnalysis, teamAnalysis, socialAnalysis);
    
    // Determine severity
    const severity = this.determineSeverity(weightedRisk);

    // Generate recommendations
    const recommendations = this.generateRecommendations(redFlags, severity);

    // Check against blacklist
    const blacklistCheck = await this.checkBlacklist(projectData);
    if (blacklistCheck.isBlacklisted) {
      redFlags.push({
        type: 'blacklisted',
        severity: 'critical',
        description: `Project is blacklisted: ${blacklistCheck.reason}`,
        weight: 1.0
      });
    }

    return {
      isScam: weightedRisk > 70 || redFlags.some(f => f.severity === 'critical'),
      confidence,
      riskScore: weightedRisk,
      redFlags: redFlags.sort((a, b) => b.weight - a.weight),
      severity,
      recommendations,
      analysis: {
        projectAnalysis,
        teamAnalysis,
        tokenAnalysis,
        socialAnalysis,
        contractAnalysis
      }
    };
  }

  private async analyzeProjectDetails(projectData: any): Promise<ProjectAnalysis> {
    const hasWebsite = !!projectData.website;
    let websiteQuality = 0;
    
    if (hasWebsite) {
      websiteQuality = await this.analyzeWebsiteQuality(projectData.website);
    }

    const hasWhitepaper = !!projectData.whitepaper;
    let whitepaperQuality = 0;
    
    if (hasWhitepaper) {
      whitepaperQuality = await this.analyzeDocumentQuality(projectData.whitepaper);
    }

    const hasRoadmap = !!projectData.roadmap;
    let roadmapQuality = 0;
    
    if (hasRoadmap) {
      roadmapQuality = await this.analyzeDocumentQuality(projectData.roadmap);
    }

    const projectAge = this.calculateProjectAge(projectData.createdAt);
    const descriptionQuality = this.analyzeDescriptionQuality(projectData.description);
    const hasClearUseCase = this.hasClearUseCase(projectData.description);

    return {
      hasWebsite,
      websiteQuality,
      hasWhitepaper,
      whitepaperQuality,
      hasRoadmap,
      roadmapQuality,
      projectAge,
      descriptionQuality,
      hasClearUseCase
    };
  }

  private async analyzeTeam(teamData: any, website?: string): Promise<TeamAnalysis> {
    const hasTeamInfo = !!teamData && Object.keys(teamData).length > 0;
    const teamVisible = hasTeamInfo && teamData.anonymous !== true;
    const teamSize = hasTeamInfo ? (teamData.members?.length || 0) : 0;
    
    let teamExperience = 0;
    let hasDoxxedTeam = false;
    let LinkedInProfiles = 0;
    let teamConsistency = 0;

    if (hasTeamInfo && teamData.members) {
      for (const member of teamData.members) {
        if (member.linkedin) LinkedInProfiles++;
        if (member.experience) teamExperience += member.experience;
        if (member.public === true) hasDoxxedTeam = true;
      }
      teamExperience = Math.min(100, teamExperience / teamSize);
      teamConsistency = this.calculateTeamConsistency(teamData.members);
    }

    return {
      hasTeamInfo,
      teamVisible,
      teamExperience,
      hasDoxxedTeam,
      teamSize,
      LinkedInProfiles,
      teamConsistency
    };
  }

  private async analyzeToken(projectData: any): Promise<TokenAnalysis> {
    const hasToken = !!projectData.tokenomics;
    let tokenDistribution = 50; // Default medium score
    let liquidityLocked = false;
    let contractVerified = false;
    let hasAudit = false;
    let tokenomics = 50;
    let supplyReasonable = true;

    if (hasToken && projectData.tokenomics) {
      tokenDistribution = this.analyzeTokenDistribution(projectData.tokenomics);
      liquidityLocked = projectData.tokenomics.liquidityLocked || false;
      contractVerified = projectData.tokenomics.contractVerified || false;
      hasAudit = !!projectData.tokenomics.auditReport;
      tokenomics = this.analyzeTokenomics(projectData.tokenomics);
      supplyReasonable = this.isSupplyReasonable(projectData.tokenomics);
    }

    return {
      hasToken,
      tokenDistribution,
      liquidityLocked,
      contractVerified,
      hasAudit,
      tokenomics,
      supplyReasonable
    };
  }

  private async analyzeSocial(socialLinks: any): Promise<SocialAnalysis> {
    const hasTwitter = !!socialLinks?.twitter;
    const hasDiscord = !!socialLinks?.discord;
    const hasTelegram = !!socialLinks?.telegram;

    let twitterFollowers = 0;
    let twitterEngagement = 0;
    let discordMembers = 0;
    let telegramMembers = 0;
    let socialConsistency = 50;
    let botActivity = 0;

    if (hasTwitter) {
      const twitterData = await this.analyzeTwitterAccount(socialLinks.twitter);
      twitterFollowers = twitterData.followers;
      twitterEngagement = twitterData.engagement;
      botActivity = twitterData.botActivity;
    }

    if (hasDiscord) {
      discordMembers = await this.getDiscordMemberCount(socialLinks.discord);
    }

    if (hasTelegram) {
      telegramMembers = await this.getTelegramMemberCount(socialLinks.telegram);
    }

    socialConsistency = this.calculateSocialConsistency({
      twitter: twitterFollowers,
      discord: discordMembers,
      telegram: telegramMembers
    });

    return {
      hasTwitter,
      twitterFollowers,
      twitterEngagement,
      hasDiscord,
      discordMembers,
      hasTelegram,
      telegramMembers,
      socialConsistency,
      botActivity
    };
  }

  private async analyzeContract(contractAddress?: string, blockchain?: string): Promise<ContractAnalysis> {
    if (!contractAddress) {
      return {
        contractVerified: false,
        hasHoneypot: false,
        hasMintFunction: false,
        hasOwnerFunctions: false,
        transferTax: 0,
        blacklistFunctions: false,
        proxyContract: false,
        contractAge: 0
      };
    }

    // This would integrate with blockchain analysis services
    // For now, return default values
    return {
      contractVerified: false,
      hasHoneypot: false,
      hasMintFunction: false,
      hasOwnerFunctions: false,
      transferTax: 0,
      blacklistFunctions: false,
      proxyContract: false,
      contractAge: 0
    };
  }

  private async performAIAnalysis(projectData: any): Promise<{ redFlags: RedFlag[] }> {
    try {
      const prompt = `
        Analyze this crypto project for potential scam indicators:
        
        Project Name: ${projectData.name}
        Description: ${projectData.description}
        Website: ${projectData.website || 'None'}
        Blockchain: ${projectData.blockchain}
        
        Look for:
        1. Vague or unrealistic promises
        2. Grammar/spelling errors
        3. Pressure tactics
        4. Lack of technical details
        5. Copycat content
        6. Unrealistic ROI claims
        
        Return a JSON response with red flags if any are found.
      `;

      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert crypto scam detection analyst. Be thorough and objective.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{}');
      return {
        redFlags: aiResult.redFlags || []
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return { redFlags: [] };
    }
  }

  private getProjectRedFlags(analysis: ProjectAnalysis): RedFlag[] {
    const flags: RedFlag[] = [];

    if (!analysis.hasWebsite) {
      flags.push({
        type: 'no_website',
        severity: 'high',
        description: 'Project has no website',
        weight: 0.8
      });
    }

    if (analysis.hasWebsite && analysis.websiteQuality < 30) {
      flags.push({
        type: 'poor_website',
        severity: 'medium',
        description: 'Website quality is very poor',
        weight: 0.6
      });
    }

    if (!analysis.hasWhitepaper) {
      flags.push({
        type: 'no_whitepaper',
        severity: 'medium',
        description: 'No whitepaper available',
        weight: 0.5
      });
    }

    if (analysis.projectAge < 7) {
      flags.push({
        type: 'very_new_project',
        severity: 'medium',
        description: 'Project is less than a week old',
        weight: 0.4
      });
    }

    if (!analysis.hasClearUseCase) {
      flags.push({
        type: 'unclear_use_case',
        severity: 'high',
        description: 'Project has no clear use case',
        weight: 0.7
      });
    }

    return flags;
  }

  private getTeamRedFlags(analysis: TeamAnalysis): RedFlag[] {
    const flags: RedFlag[] = [];

    if (!analysis.hasTeamInfo) {
      flags.push({
        type: 'no_team_info',
        severity: 'high',
        description: 'No team information available',
        weight: 0.7
      });
    }

    if (!analysis.teamVisible) {
      flags.push({
        type: 'anonymous_team',
        severity: 'high',
        description: 'Team is anonymous',
        weight: 0.8
      });
    }

    if (analysis.teamSize === 0) {
      flags.push({
        type: 'no_team_members',
        severity: 'critical',
        description: 'No team members listed',
        weight: 0.9
      });
    }

    if (analysis.teamExperience < 20) {
      flags.push({
        type: 'inexperienced_team',
        severity: 'medium',
        description: 'Team lacks experience',
        weight: 0.5
      });
    }

    if (analysis.LinkedInProfiles === 0 && analysis.teamSize > 0) {
      flags.push({
        type: 'no_linkedin_profiles',
        severity: 'medium',
        description: 'No LinkedIn profiles found',
        weight: 0.4
      });
    }

    return flags;
  }

  private getTokenRedFlags(analysis: TokenAnalysis): RedFlag[] {
    const flags: RedFlag[] = [];

    if (analysis.hasToken && !analysis.contractVerified) {
      flags.push({
        type: 'unverified_contract',
        severity: 'high',
        description: 'Token contract is not verified',
        weight: 0.8
      });
    }

    if (analysis.hasToken && !analysis.liquidityLocked) {
      flags.push({
        type: 'unlocked_liquidity',
        severity: 'high',
        description: 'Liquidity is not locked',
        weight: 0.7
      });
    }

    if (analysis.hasToken && !analysis.hasAudit) {
      flags.push({
        type: 'no_audit',
        severity: 'medium',
        description: 'Token has no security audit',
        weight: 0.5
      });
    }

    if (analysis.hasToken && !analysis.supplyReasonable) {
      flags.push({
        type: 'unreasonable_supply',
        severity: 'medium',
        description: 'Token supply seems unreasonable',
        weight: 0.6
      });
    }

    return flags;
  }

  private getSocialRedFlags(analysis: SocialAnalysis): RedFlag[] {
    const flags: RedFlag[] = [];

    if (!analysis.hasTwitter && !analysis.hasDiscord && !analysis.hasTelegram) {
      flags.push({
        type: 'no_social_presence',
        severity: 'high',
        description: 'No social media presence',
        weight: 0.7
      });
    }

    if (analysis.hasTwitter && analysis.twitterFollowers < 100) {
      flags.push({
        type: 'low_twitter_followers',
        severity: 'medium',
        description: 'Very low Twitter follower count',
        weight: 0.4
      });
    }

    if (analysis.botActivity > 70) {
      flags.push({
        type: 'high_bot_activity',
        severity: 'high',
        description: 'High bot activity detected',
        weight: 0.8
      });
    }

    if (analysis.socialConsistency < 30) {
      flags.push({
        type: 'inconsistent_social',
        severity: 'medium',
        description: 'Inconsistent social media presence',
        weight: 0.5
      });
    }

    return flags;
  }

  private getContractRedFlags(analysis: ContractAnalysis): RedFlag[] {
    const flags: RedFlag[] = [];

    if (analysis.hasHoneypot) {
      flags.push({
        type: 'honeypot_detected',
        severity: 'critical',
        description: 'Honeypot mechanism detected',
        weight: 1.0
      });
    }

    if (analysis.transferTax > 20) {
      flags.push({
        type: 'high_transfer_tax',
        severity: 'high',
        description: 'Very high transfer tax',
        weight: 0.7
      });
    }

    if (analysis.blacklistFunctions) {
      flags.push({
        type: 'blacklist_functions',
        severity: 'high',
        description: 'Contract has blacklist functions',
        weight: 0.8
      });
    }

    if (analysis.contractAge < 1) {
      flags.push({
        type: 'very_new_contract',
        severity: 'medium',
        description: 'Contract was deployed very recently',
        weight: 0.4
      });
    }

    return flags;
  }

  private calculateWeightedRisk(redFlags: RedFlag[]): number {
    if (redFlags.length === 0) return 0;

    const severityWeights = {
      low: 0.2,
      medium: 0.5,
      high: 0.8,
      critical: 1.0
    };

    const totalWeight = redFlags.reduce((sum, flag) => {
      return sum + (flag.weight * severityWeights[flag.severity]);
    }, 0);

    return Math.min(100, totalWeight * 100);
  }

  private calculateConfidence(
    redFlags: RedFlag[],
    projectAnalysis: ProjectAnalysis,
    teamAnalysis: TeamAnalysis,
    socialAnalysis: SocialAnalysis
  ): number {
    let confidence = 50; // Base confidence

    // Increase confidence based on data availability
    if (projectAnalysis.hasWebsite) confidence += 10;
    if (projectAnalysis.hasWhitepaper) confidence += 10;
    if (teamAnalysis.hasTeamInfo) confidence += 10;
    if (socialAnalysis.hasTwitter) confidence += 10;

    // Adjust based on red flag count
    if (redFlags.length > 5) confidence += 10;
    if (redFlags.length > 10) confidence += 10;

    return Math.min(100, confidence);
  }

  private determineSeverity(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private generateRecommendations(redFlags: RedFlag[], severity: string): string[] {
    const recommendations: string[] = [];

    if (severity === 'critical') {
      recommendations.push('AVOID: This project shows multiple critical red flags');
      recommendations.push('Report this project to protect others');
    } else if (severity === 'high') {
      recommendations.push('EXTREME CAUTION: High risk detected');
      recommendations.push('Do not invest without thorough research');
      recommendations.push('Wait for more information and community feedback');
    } else if (severity === 'medium') {
      recommendations.push('Proceed with caution');
      recommendations.push('Verify team identity and project claims');
      recommendations.push('Start with minimal investment if any');
    } else {
      recommendations.push('Low risk, but still do your own research');
      recommendations.push('Monitor project development');
    }

    // Specific recommendations based on red flags
    const flagTypes = redFlags.map(f => f.type);
    if (flagTypes.includes('anonymous_team')) {
      recommendations.push('Verify team identity before any interaction');
    }
    if (flagTypes.includes('unverified_contract')) {
      recommendations.push('Wait for contract verification');
    }
    if (flagTypes.includes('no_audit')) {
      recommendations.push('Request security audit from the team');
    }

    return recommendations;
  }

  private async checkBlacklist(projectData: any): Promise<{ isBlacklisted: boolean; reason?: string }> {
    // Check domain blacklist
    if (projectData.website) {
      try {
        const domain = new URL(projectData.website).hostname;
        const domainBlacklist = await db.blacklistEntry.findFirst({
          where: {
            entryType: 'domain',
            value: domain,
            status: 'active'
          }
        });

        if (domainBlacklist) {
          return { isBlacklisted: true, reason: domainBlacklist.reason };
        }
      } catch (error) {
        // Invalid URL, continue
      }
    }

    // Check contract address blacklist
    if (projectData.contractAddress) {
      const contractBlacklist = await db.blacklistEntry.findFirst({
        where: {
          entryType: 'contract',
          value: projectData.contractAddress.toLowerCase(),
          status: 'active'
        }
      });

      if (contractBlacklist) {
        return { isBlacklisted: true, reason: contractBlacklist.reason };
      }
    }

    return { isBlacklisted: false };
  }

  // Helper methods (simplified implementations)
  private async analyzeWebsiteQuality(url: string): Promise<number> {
    // Implement website quality analysis
    return 75; // Placeholder
  }

  private async analyzeDocumentQuality(url: string): Promise<number> {
    // Implement document quality analysis
    return 70; // Placeholder
  }

  private calculateProjectAge(createdAt?: string): number {
    if (!createdAt) return 0;
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  private analyzeDescriptionQuality(description: string): number {
    if (!description) return 0;
    // Simple quality assessment based on length and content
    const wordCount = description.split(' ').length;
    if (wordCount < 50) return 20;
    if (wordCount < 100) return 40;
    if (wordCount < 200) return 60;
    return 80;
  }

  private hasClearUseCase(description: string): boolean {
    if (!description) return false;
    // Simple check for use case indicators
    const useCaseKeywords = ['solve', 'problem', 'solution', 'use case', 'application', 'utility'];
    return useCaseKeywords.some(keyword => 
      description.toLowerCase().includes(keyword)
    );
  }

  private calculateTeamConsistency(members: any[]): number {
    // Implement team consistency analysis
    return 75; // Placeholder
  }

  private analyzeTokenDistribution(tokenomics: any): number {
    // Implement token distribution analysis
    return 60; // Placeholder
  }

  private analyzeTokenomics(tokenomics: any): number {
    // Implement tokenomics analysis
    return 65; // Placeholder
  }

  private isSupplyReasonable(tokenomics: any): boolean {
    // Implement supply reasonableness check
    return true; // Placeholder
  }

  private async analyzeTwitterAccount(username: string): Promise<any> {
    // Implement Twitter analysis
    return {
      followers: 1000,
      engagement: 50,
      botActivity: 20
    }; // Placeholder
  }

  private async getDiscordMemberCount(invite: string): Promise<number> {
    // Implement Discord member count
    return 500; // Placeholder
  }

  private async getTelegramMemberCount(username: string): Promise<number> {
    // Implement Telegram member count
    return 300; // Placeholder
  }

  private calculateSocialConsistency(socialData: any): number {
    // Implement social consistency calculation
    return 70; // Placeholder
  }
}

export const scamDetectionEngine = new ScamDetectionEngine();