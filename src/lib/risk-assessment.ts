import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface RiskAssessmentQuestions {
  investmentExperience: number; // 1-5 scale
  riskCapacity: number; // 1-5 scale
  timeHorizon: number; // 1-5 scale
  technicalKnowledge: number; // 1-5 scale
  securityPriority: number; // 1-5 scale
  lossTolerance: number; // 1-5 scale
  diversificationUnderstanding: number; // 1-5 scale
  volatilityComfort: number; // 1-5 scale
}

export interface RiskAssessmentResult {
  riskToleranceScore: number; // 0-100
  riskCategory: 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive';
  financialCapacity: 'low' | 'medium' | 'high' | 'very_high';
  lossAcceptance: number; // percentage
  timeHorizon: 'short' | 'medium' | 'long';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  technicalKnowledge: number; // 1-10 scale
  securityConsciousness: number; // 1-10 scale
  recommendations: string[];
  riskFactors: {
    factor: string;
    weight: number;
    score: number;
  }[];
  confidenceScore: number; // 0-1
}

export class RiskToleranceAssessment {
  private zai: ZAI;

  constructor() {
    this.zai = new ZAI();
  }

  /**
   * Calculate risk tolerance score based on assessment questions
   */
  async calculateRiskTolerance(
    userId: string,
    answers: RiskAssessmentQuestions
  ): Promise<RiskAssessmentResult> {
    // Weight factors for different aspects of risk tolerance
    const weights = {
      investmentExperience: 0.15,
      riskCapacity: 0.20,
      timeHorizon: 0.15,
      technicalKnowledge: 0.10,
      securityPriority: 0.15,
      lossTolerance: 0.15,
      diversificationUnderstanding: 0.05,
      volatilityComfort: 0.05
    };

    // Calculate weighted score (0-100)
    let weightedScore = 0;
    const riskFactors = [];

    for (const [key, weight] of Object.entries(weights)) {
      const score = (answers[key as keyof RiskAssessmentQuestions] / 5) * 100;
      weightedScore += score * weight;
      riskFactors.push({
        factor: key,
        weight: weight * 100,
        score: Math.round(score)
      });
    }

    // Normalize to 0-100 scale
    const riskToleranceScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    // Determine risk category
    const riskCategory = this.getRiskCategory(riskToleranceScore);

    // Determine financial capacity based on risk capacity and experience
    const financialCapacity = this.getFinancialCapacity(
      answers.riskCapacity,
      answers.investmentExperience
    );

    // Calculate loss acceptance percentage
    const lossAcceptance = this.calculateLossAcceptance(
      answers.lossTolerance,
      answers.riskCapacity
    );

    // Determine time horizon
    const timeHorizon = this.getTimeHorizon(answers.timeHorizon);

    // Determine experience level
    const experienceLevel = this.getExperienceLevel(answers.investmentExperience);

    // Calculate technical knowledge (1-10 scale)
    const technicalKnowledge = Math.round((answers.technicalKnowledge / 5) * 10);

    // Calculate security consciousness (1-10 scale)
    const securityConsciousness = Math.round((answers.securityPriority / 5) * 10);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(
      riskToleranceScore,
      riskCategory,
      experienceLevel,
      answers
    );

    // Calculate confidence score based on consistency of answers
    const confidenceScore = this.calculateConfidenceScore(answers);

    return {
      riskToleranceScore,
      riskCategory,
      financialCapacity,
      lossAcceptance,
      timeHorizon,
      experienceLevel,
      technicalKnowledge,
      securityConsciousness,
      recommendations,
      riskFactors,
      confidenceScore
    };
  }

  /**
   * Save risk assessment results to database
   */
  async saveRiskAssessment(
    userId: string,
    result: RiskAssessmentResult,
    assessmentData: RiskAssessmentQuestions
  ): Promise<void> {
    // Check if user already has a risk profile
    const existingProfile = await db.riskProfile.findUnique({
      where: { userId }
    });

    // Save preference evolution if profile exists
    if (existingProfile) {
      await db.preferenceEvolution.create({
        data: {
          userId,
          category: 'risk',
          oldValue: {
            riskToleranceScore: existingProfile.riskToleranceScore,
            financialCapacity: existingProfile.financialCapacity,
            lossAcceptance: existingProfile.lossAcceptance,
            timeHorizon: existingProfile.timeHorizon,
            experienceLevel: existingProfile.experienceLevel
          },
          newValue: {
            riskToleranceScore: result.riskToleranceScore,
            financialCapacity: result.financialCapacity,
            lossAcceptance: result.lossAcceptance,
            timeHorizon: result.timeHorizon,
            experienceLevel: result.experienceLevel
          },
          changeReason: 'user_assessment_update',
          changeTrigger: 'risk_assessment_questionnaire'
        }
      });
    }

    // Update or create risk profile
    await db.riskProfile.upsert({
      where: { userId },
      update: {
        riskToleranceScore: result.riskToleranceScore,
        riskAssessmentData: assessmentData,
        financialCapacity: result.financialCapacity,
        lossAcceptance: result.lossAcceptance,
        timeHorizon: result.timeHorizon,
        experienceLevel: result.experienceLevel,
        technicalKnowledge: result.technicalKnowledge,
        securityConsciousness: result.securityConsciousness,
        riskBehaviorMetrics: {
          riskFactors: result.riskFactors,
          confidenceScore: result.confidenceScore,
          assessedAt: new Date().toISOString()
        },
        lastAssessmentAt: new Date()
      },
      create: {
        userId,
        riskToleranceScore: result.riskToleranceScore,
        riskAssessmentData: assessmentData,
        financialCapacity: result.financialCapacity,
        lossAcceptance: result.lossAcceptance,
        timeHorizon: result.timeHorizon,
        experienceLevel: result.experienceLevel,
        technicalKnowledge: result.technicalKnowledge,
        securityConsciousness: result.securityConsciousness,
        riskBehaviorMetrics: {
          riskFactors: result.riskFactors,
          confidenceScore: result.confidenceScore,
          assessedAt: new Date().toISOString()
        }
      }
    });

    // Generate insights based on assessment
    await this.generateRiskInsights(userId, result);
  }

  /**
   * Get risk category based on score
   */
  private getRiskCategory(score: number): RiskAssessmentResult['riskCategory'] {
    if (score <= 20) return 'conservative';
    if (score <= 40) return 'moderate';
    if (score <= 60) return 'balanced';
    if (score <= 80) return 'growth';
    return 'aggressive';
  }

  /**
   * Get financial capacity based on answers
   */
  private getFinancialCapacity(
    riskCapacity: number,
    investmentExperience: number
  ): RiskAssessmentResult['financialCapacity'] {
    const combined = (riskCapacity + investmentExperience) / 2;
    if (combined <= 2) return 'low';
    if (combined <= 3) return 'medium';
    if (combined <= 4) return 'high';
    return 'very_high';
  }

  /**
   * Calculate loss acceptance percentage
   */
  private calculateLossAcceptance(lossTolerance: number, riskCapacity: number): number {
    const baseAcceptance = (lossTolerance / 5) * 20; // 0-20% base
    const capacityModifier = (riskCapacity / 5) * 10; // 0-10% modifier
    return Math.round(baseAcceptance + capacityModifier);
  }

  /**
   * Get time horizon category
   */
  private getTimeHorizon(timeHorizon: number): RiskAssessmentResult['timeHorizon'] {
    if (timeHorizon <= 2) return 'short';
    if (timeHorizon <= 4) return 'medium';
    return 'long';
  }

  /**
   * Get experience level category
   */
  private getExperienceLevel(
    investmentExperience: number
  ): RiskAssessmentResult['experienceLevel'] {
    if (investmentExperience <= 1) return 'beginner';
    if (investmentExperience <= 3) return 'intermediate';
    if (investmentExperience <= 4) return 'advanced';
    return 'expert';
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(
    riskScore: number,
    riskCategory: RiskAssessmentResult['riskCategory'],
    experienceLevel: RiskAssessmentResult['experienceLevel'],
    answers: RiskAssessmentQuestions
  ): Promise<string[]> {
    try {
      const prompt = `
        Based on the following risk assessment results, provide 5 personalized recommendations for crypto airdrop participation:

        Risk Score: ${riskScore}/100 (${riskCategory})
        Experience Level: ${experienceLevel}
        Technical Knowledge: ${answers.technicalKnowledge}/5
        Security Priority: ${answers.securityPriority}/5
        Loss Tolerance: ${answers.lossTolerance}/5

        Provide specific, actionable recommendations that match this risk profile.
        Focus on security, diversification, and appropriate risk-taking.
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a financial risk advisor specializing in cryptocurrency airdrops. Provide conservative, security-focused advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const content = completion.choices[0]?.message?.content || '';
      return content.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getDefaultRecommendations(riskCategory, experienceLevel);
    }
  }

  /**
   * Get default recommendations if AI fails
   */
  private getDefaultRecommendations(
    riskCategory: RiskAssessmentResult['riskCategory'],
    experienceLevel: RiskAssessmentResult['experienceLevel']
  ): string[] {
    const recommendations = [];

    if (riskCategory === 'conservative') {
      recommendations.push(
        'Focus on established projects with low risk scores',
        'Never invest more than you can afford to lose',
        'Use hardware wallets for all interactions'
      );
    } else if (riskCategory === 'aggressive') {
      recommendations.push(
        'Consider higher-risk, higher-reward opportunities',
        'Diversify across multiple risk categories',
        'Set clear stop-loss limits'
      );
    } else {
      recommendations.push(
        'Maintain a balanced portfolio of risk levels',
        'Research each project thoroughly before participating',
        'Start with smaller investments to test the waters'
      );
    }

    if (experienceLevel === 'beginner') {
      recommendations.push(
        'Start with testnet interactions to learn the process',
        'Follow educational content about DeFi security'
      );
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Calculate confidence score based on answer consistency
   */
  private calculateConfidenceScore(answers: RiskAssessmentQuestions): number {
    // Check for consistency between related answers
    let consistencyScore = 0.5; // Base score

    // Experience should correlate with technical knowledge
    const experienceTechDiff = Math.abs(answers.investmentExperience - answers.technicalKnowledge);
    if (experienceTechDiff <= 1) consistencyScore += 0.2;

    // Risk capacity should correlate with loss tolerance
    const riskLossDiff = Math.abs(answers.riskCapacity - answers.lossTolerance);
    if (riskLossDiff <= 1) consistencyScore += 0.2;

    // Security priority should be high for all users
    if (answers.securityPriority >= 4) consistencyScore += 0.1;

    return Math.min(1.0, consistencyScore);
  }

  /**
   * Generate insights based on risk assessment
   */
  private async generateRiskInsights(
    userId: string,
    result: RiskAssessmentResult
  ): Promise<void> {
    const insights = [];

    // High risk tolerance but low experience
    if (result.riskToleranceScore > 70 && result.experienceLevel === 'beginner') {
      insights.push({
        insightType: 'risk_pattern',
        insightTitle: 'High Risk Tolerance, Low Experience',
        insightDescription: 'You show high risk tolerance but have limited experience. Consider starting with lower-risk projects to build experience.',
        confidenceScore: 0.8,
        impactLevel: 'high',
        actionableRecommendation: 'Focus on educational content and start with established projects.'
      });
    }

    // Low security consciousness
    if (result.securityConsciousness < 6) {
      insights.push({
        insightType: 'risk_pattern',
        insightTitle: 'Security Awareness Gap',
        insightDescription: 'Your security awareness score suggests room for improvement in protecting your assets.',
        confidenceScore: 0.9,
        impactLevel: 'critical',
        actionableRecommendation: 'Complete our security best practices guide before participating in airdrops.'
      });
    }

    // Save insights
    for (const insight of insights) {
      await db.preferenceInsight.create({
        data: {
          userId,
          ...insight,
          supportingData: {
            riskToleranceScore: result.riskToleranceScore,
            experienceLevel: result.experienceLevel,
            securityConsciousness: result.securityConsciousness
          },
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });
    }
  }

  /**
   * Get user's current risk profile
   */
  async getRiskProfile(userId: string): Promise<RiskAssessmentResult | null> {
    const profile = await db.riskProfile.findUnique({
      where: { userId }
    });

    if (!profile) return null;

    return {
      riskToleranceScore: profile.riskToleranceScore,
      riskCategory: this.getRiskCategory(profile.riskToleranceScore),
      financialCapacity: profile.financialCapacity as RiskAssessmentResult['financialCapacity'],
      lossAcceptance: profile.lossAcceptance,
      timeHorizon: profile.timeHorizon as RiskAssessmentResult['timeHorizon'],
      experienceLevel: profile.experienceLevel as RiskAssessmentResult['experienceLevel'],
      technicalKnowledge: profile.technicalKnowledge,
      securityConsciousness: profile.securityConsciousness,
      recommendations: [], // Would need to be stored separately or regenerated
      riskFactors: profile.riskBehaviorMetrics?.riskFactors || [],
      confidenceScore: profile.riskBehaviorMetrics?.confidenceScore || 0.5
    };
  }
}