import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface PotentialEstimation {
  id: string;
  airdropId: string;
  estimatedValue: number; // USD value per participant
  confidence: number; // 0-100
  successProbability: number; // 0-100
  riskScore: number; // 0-100
  potentialROI: number; // Expected return on investment
  timeToReturn: number; // Days to expected return
  factors: PotentialFactor[];
  calculations: EstimationCalculation[];
  lastUpdated: Date;
  metadata: any;
}

export interface PotentialFactor {
  name: string;
  category: 'project_fundamentals' | 'market_conditions' | 'tokenomics' | 'community' | 'competition' | 'timing';
  weight: number; // 0-1, importance weight
  score: number; // 0-100
  impact: number; // -100 to 100, positive or negative impact
  description: string;
  evidence: any;
}

export interface EstimationCalculation {
  step: string;
  formula: string;
  inputs: Record<string, number>;
  result: number;
  explanation: string;
}

export interface MarketData {
  tokenPrice?: number;
  marketCap?: number;
  volume24h?: number;
  priceChange24h?: number;
  sentiment?: number;
  competitionLevel?: number;
  marketCondition: 'bull' | 'bear' | 'neutral';
}

export class AirdropPotentialEstimator {
  private zai: ZAI;

  constructor() {
    this.zai = new ZAI();
  }

  async estimateAirdropPotential(airdropId: string): Promise<PotentialEstimation> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true,
          participations: true,
          performance: true,
          validations: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      logger.info(`Estimating potential for airdrop ${airdropId}`);

      // Gather market data
      const marketData = await this.gatherMarketData(airdrop);
      
      // Analyze potential factors
      const factors = await this.analyzePotentialFactors(airdrop, marketData);
      
      // Perform calculations
      const calculations = await this.performCalculations(airdrop, factors, marketData);
      
      // Calculate final estimates
      const estimates = this.calculateFinalEstimates(factors, calculations);
      
      // Generate AI-powered insights
      const aiInsights = await this.generateAIInsights(airdrop, factors, marketData);

      const estimation: PotentialEstimation = {
        id: `estimation_${Date.now()}`,
        airdropId,
        estimatedValue: estimates.estimatedValue,
        confidence: estimates.confidence,
        successProbability: estimates.successProbability,
        riskScore: estimates.riskScore,
        potentialROI: estimates.potentialROI,
        timeToReturn: estimates.timeToReturn,
        factors,
        calculations,
        lastUpdated: new Date(),
        metadata: {
          marketData,
          aiInsights,
          estimationVersion: '2.0',
          dataPoints: this.countDataPoints(airdrop)
        }
      };

      // Store estimation
      await this.storeEstimation(estimation);

      logger.info(`Potential estimation completed for airdrop ${airdropId}: $${estimates.estimatedValue} (${estimates.confidence}% confidence)`);
      return estimation;
    } catch (error) {
      logger.error(`Failed to estimate potential for airdrop ${airdropId}:`, error);
      throw error;
    }
  }

  private async gatherMarketData(airdrop: any): Promise<MarketData> {
    try {
      // Get market data for the project's token if available
      let tokenPrice = 0;
      let marketCap = 0;
      let volume24h = 0;
      let priceChange24h = 0;

      if (airdrop.project.tokens && airdrop.project.tokens.length > 0) {
        const token = airdrop.project.tokens[0];
        
        // Simulated market data - in real implementation, use CoinGecko/CoinMarketCap API
        tokenPrice = Math.random() * 10 + 0.1; // $0.10 - $10.10
        marketCap = tokenPrice * (Math.random() * 100000000 + 1000000); // $1M - $100M
        volume24h = marketCap * (Math.random() * 0.1 + 0.01); // 1% - 11% of market cap
        priceChange24h = (Math.random() - 0.5) * 20; // -10% to +10%
      }

      // Analyze market sentiment
      const sentiment = await this.analyzeMarketSentiment(airdrop);
      
      // Assess competition level
      const competitionLevel = await this.assessCompetitionLevel(airdrop);
      
      // Determine market condition
      const marketCondition = this.determineMarketCondition(priceChange24h, sentiment);

      return {
        tokenPrice,
        marketCap,
        volume24h,
        priceChange24h,
        sentiment,
        competitionLevel,
        marketCondition
      };
    } catch (error) {
      logger.error('Failed to gather market data:', error);
      return {
        priceChange24h: 0,
        sentiment: 50,
        competitionLevel: 50,
        marketCondition: 'neutral' as const
      };
    }
  }

  private async analyzePotentialFactors(airdrop: any, marketData: MarketData): Promise<PotentialFactor[]> {
    const factors: PotentialFactor[] = [];

    // Project fundamentals
    factors.push(await this.analyzeProjectFundamentals(airdrop));
    
    // Market conditions
    factors.push(await this.analyzeMarketConditions(marketData));
    
    // Tokenomics
    factors.push(await this.analyzeTokenomics(airdrop));
    
    // Community strength
    factors.push(await this.analyzeCommunityStrength(airdrop));
    
    // Competition
    factors.push(await this.analyzeCompetition(airdrop, marketData));
    
    // Timing
    factors.push(await this.analyzeTiming(airdrop, marketData));

    return factors;
  }

  private async analyzeProjectFundamentals(airdrop: any): Promise<PotentialFactor> {
    try {
      const project = airdrop.project;
      let score = 50; // Base score
      const evidence: any = {};

      // Team quality
      if (project.team) {
        const teamScore = this.evaluateTeamQuality(project.team);
        score += teamScore * 0.3;
        evidence.teamScore = teamScore;
      }

      // Funding
      if (project.funding) {
        const fundingScore = this.evaluateFunding(project.funding);
        score += fundingScore * 0.2;
        evidence.fundingScore = fundingScore;
      }

      // Security audits
      if (project.auditReport) {
        score += 15;
        evidence.hasAudit = true;
      }

      // Roadmap
      if (project.roadmap) {
        score += 10;
        evidence.hasRoadmap = true;
      }

      // Verification status
      if (project.verificationStatus === 'verified') {
        score += 10;
        evidence.verified = true;
      }

      // Trust score
      if (project.trustScore) {
        score += (project.trustScore.toNumber() - 50) * 0.2;
        evidence.trustScore = project.trustScore.toNumber();
      }

      score = Math.max(0, Math.min(100, score));

      return {
        name: 'Project Fundamentals',
        category: 'project_fundamentals',
        weight: 0.25,
        score,
        impact: (score - 50) * 2, // -100 to 100
        description: 'Analysis of team quality, funding, security, and project maturity',
        evidence
      };
    } catch (error) {
      logger.error('Failed to analyze project fundamentals:', error);
      return {
        name: 'Project Fundamentals',
        category: 'project_fundamentals',
        weight: 0.25,
        score: 50,
        impact: 0,
        description: 'Project fundamentals analysis failed',
        evidence: { error: error.message }
      };
    }
  }

  private async analyzeMarketConditions(marketData: MarketData): Promise<PotentialFactor> {
    try {
      let score = 50;
      const evidence: any = {};

      // Market sentiment
      score += (marketData.sentiment - 50) * 0.5;
      evidence.sentiment = marketData.sentiment;

      // Price momentum
      if (marketData.priceChange24h) {
        score += marketData.priceChange24h * 2;
        evidence.priceMomentum = marketData.priceChange24h;
      }

      // Volume analysis
      if (marketData.volume24h && marketData.marketCap) {
        const volumeRatio = marketData.volume24h / marketData.marketCap;
        if (volumeRatio > 0.05) score += 10; // High volume is good
        evidence.volumeRatio = volumeRatio;
      }

      // Market condition
      switch (marketData.marketCondition) {
        case 'bull':
          score += 15;
          break;
        case 'bear':
          score -= 15;
          break;
      }
      evidence.marketCondition = marketData.marketCondition;

      score = Math.max(0, Math.min(100, score));

      return {
        name: 'Market Conditions',
        category: 'market_conditions',
        weight: 0.2,
        score,
        impact: (score - 50) * 2,
        description: 'Current market sentiment, price momentum, and overall market health',
        evidence
      };
    } catch (error) {
      logger.error('Failed to analyze market conditions:', error);
      return {
        name: 'Market Conditions',
        category: 'market_conditions',
        weight: 0.2,
        score: 50,
        impact: 0,
        description: 'Market conditions analysis failed',
        evidence: { error: error.message }
      };
    }
  }

  private async analyzeTokenomics(airdrop: any): Promise<PotentialFactor> {
    try {
      let score = 50;
      const evidence: any = {};

      // Total supply analysis
      if (airdrop.totalAmount) {
        const totalAmount = parseFloat(airdrop.totalAmount.toString());
        
        // Reasonable total amount range
        if (totalAmount > 1000000 && totalAmount < 1000000000) {
          score += 10;
        } else if (totalAmount >= 1000000000) {
          score -= 10; // Too much inflation
        }
        
        evidence.totalAmount = totalAmount;
      }

      // Airdrop allocation percentage
      if (airdrop.project.tokenomics?.totalSupply) {
        const totalSupply = airdrop.project.tokenomics.totalSupply;
        const airdropAmount = parseFloat(airdrop.totalAmount?.toString() || '0');
        const allocationPercentage = (airdropAmount / totalSupply) * 100;
        
        // Optimal range: 1-10%
        if (allocationPercentage >= 1 && allocationPercentage <= 10) {
          score += 15;
        } else if (allocationPercentage > 20) {
          score -= 15; // Too high allocation
        }
        
        evidence.allocationPercentage = allocationPercentage;
      }

      // Vesting schedule
      if (airdrop.project.tokenomics?.vestingSchedule) {
        score += 10;
        evidence.hasVesting = true;
      }

      // Token utility
      if (airdrop.project.tokenomics?.utility) {
        score += 10;
        evidence.hasUtility = true;
      }

      score = Math.max(0, Math.min(100, score));

      return {
        name: 'Tokenomics',
        category: 'tokenomics',
        weight: 0.2,
        score,
        impact: (score - 50) * 2,
        description: 'Token supply, distribution, vesting, and utility analysis',
        evidence
      };
    } catch (error) {
      logger.error('Failed to analyze tokenomics:', error);
      return {
        name: 'Tokenomics',
        category: 'tokenomics',
        weight: 0.2,
        score: 50,
        impact: 0,
        description: 'Tokenomics analysis failed',
        evidence: { error: error.message }
      };
    }
  }

  private async analyzeCommunityStrength(airdrop: any): Promise<PotentialFactor> {
    try {
      let score = 50;
      const evidence: any = {};

      // Social media presence
      const socialLinks = airdrop.project.socialLinks || {};
      const platformCount = Object.keys(socialLinks).length;
      score += Math.min(platformCount * 5, 15);
      evidence.socialPlatforms = platformCount;

      // Participant engagement
      if (airdrop.participations) {
        const engagement = this.calculateEngagementRate(airdrop.participations);
        score += engagement * 0.3;
        evidence.engagementRate = engagement;
      }

      // Trust score from validations
      if (airdrop.validations && airdrop.validations.length > 0) {
        const avgConfidence = airdrop.validations.reduce((sum: number, v: any) => sum + v.confidence, 0) / airdrop.validations.length;
        score += (avgConfidence - 50) * 0.2;
        evidence.avgValidationConfidence = avgConfidence;
      }

      // Community activity (simulated)
      const communityActivity = Math.random() * 100;
      score += (communityActivity - 50) * 0.2;
      evidence.communityActivity = communityActivity;

      score = Math.max(0, Math.min(100, score));

      return {
        name: 'Community Strength',
        category: 'community',
        weight: 0.15,
        score,
        impact: (score - 50) * 2,
        description: 'Social media presence, community engagement, and activity levels',
        evidence
      };
    } catch (error) {
      logger.error('Failed to analyze community strength:', error);
      return {
        name: 'Community Strength',
        category: 'community',
        weight: 0.15,
        score: 50,
        impact: 0,
        description: 'Community strength analysis failed',
        evidence: { error: error.message }
      };
    }
  }

  private async analyzeCompetition(airdrop: any, marketData: MarketData): Promise<PotentialFactor> {
    try {
      let score = 50;
      const evidence: any = {};

      // Competition level (lower is better)
      const competitionScore = 100 - marketData.competitionLevel;
      score += (competitionScore - 50) * 0.3;
      evidence.competitionLevel = marketData.competitionLevel;

      // Category uniqueness
      const categoryUniqueness = this.calculateCategoryUniqueness(airdrop.project.category);
      score += categoryUniqueness * 0.3;
      evidence.categoryUniqueness = categoryUniqueness;

      // First-mover advantage
      const firstMoverAdvantage = this.assessFirstMoverAdvantage(airdrop);
      score += firstMoverAdvantage * 0.2;
      evidence.firstMoverAdvantage = firstMoverAdvantage;

      // Differentiation factors
      const differentiation = this.assessDifferentiation(airdrop);
      score += differentiation * 0.2;
      evidence.differentiation = differentiation;

      score = Math.max(0, Math.min(100, score));

      return {
        name: 'Competition',
        category: 'competition',
        weight: 0.1,
        score,
        impact: (score - 50) * 2,
        description: 'Competitive landscape analysis and differentiation factors',
        evidence
      };
    } catch (error) {
      logger.error('Failed to analyze competition:', error);
      return {
        name: 'Competition',
        category: 'competition',
        weight: 0.1,
        score: 50,
        impact: 0,
        description: 'Competition analysis failed',
        evidence: { error: error.message }
      };
    }
  }

  private async analyzeTiming(airdrop: any, marketData: MarketData): Promise<PotentialFactor> {
    try {
      let score = 50;
      const evidence: any = {};

      // Market cycle timing
      const cycleTiming = this.assessMarketCycleTiming(marketData);
      score += cycleTiming * 0.3;
      evidence.cycleTiming = cycleTiming;

      // Project maturity timing
      const maturityTiming = this.assessMaturityTiming(airdrop);
      score += maturityTiming * 0.3;
      evidence.maturityTiming = maturityTiming;

      // Seasonal factors
      const seasonalFactor = this.assessSeasonalFactors();
      score += seasonalFactor * 0.2;
      evidence.seasonalFactor = seasonalFactor;

      // Airdrop duration timing
      const durationTiming = this.assessDurationTiming(airdrop);
      score += durationTiming * 0.2;
      evidence.durationTiming = durationTiming;

      score = Math.max(0, Math.min(100, score));

      return {
        name: 'Timing',
        category: 'timing',
        weight: 0.1,
        score,
        impact: (score - 50) * 2,
        description: 'Market cycle, project maturity, and seasonal timing analysis',
        evidence
      };
    } catch (error) {
      logger.error('Failed to analyze timing:', error);
      return {
        name: 'Timing',
        category: 'timing',
        weight: 0.1,
        score: 50,
        impact: 0,
        description: 'Timing analysis failed',
        evidence: { error: error.message }
      };
    }
  }

  private async performCalculations(airdrop: any, factors: PotentialFactor[], marketData: MarketData): Promise<EstimationCalculation[]> {
    const calculations: EstimationCalculation[] = [];

    // Base value calculation
    calculations.push(this.calculateBaseValue(airdrop, marketData));
    
    // Adjusted value calculation
    calculations.push(this.calculateAdjustedValue(factors));
    
    // Success probability calculation
    calculations.push(this.calculateSuccessProbability(factors));
    
    // Risk assessment calculation
    calculations.push(this.calculateRiskAssessment(factors));
    
    // ROI calculation
    calculations.push(this.calculateROI(airdrop, factors, marketData));
    
    // Time to return calculation
    calculations.push(this.calculateTimeToReturn(airdrop, factors));

    return calculations;
  }

  private calculateBaseValue(airdrop: any, marketData: MarketData): EstimationCalculation {
    const totalAmount = parseFloat(airdrop.totalAmount?.toString() || '0');
    const participants = airdrop.participantsCount || 1000; // Default estimate
    
    // Base calculation: total value / participants
    let tokenValue = marketData.tokenPrice || 1; // Default to $1 if no price data
    let baseValue = (totalAmount * tokenValue) / participants;

    // Adjust for market conditions
    if (marketData.marketCondition === 'bear') {
      baseValue *= 0.7; // 30% reduction in bear market
    } else if (marketData.marketCondition === 'bull') {
      baseValue *= 1.3; // 30% boost in bull market
    }

    return {
      step: 'Base Value Calculation',
      formula: '(Total Amount × Token Price) ÷ Participants × Market Multiplier',
      inputs: {
        totalAmount,
        tokenPrice: tokenValue,
        participants,
        marketMultiplier: marketData.marketCondition === 'bear' ? 0.7 : marketData.marketCondition === 'bull' ? 1.3 : 1
      },
      result: baseValue,
      explanation: `Base value per participant before risk and factor adjustments`
    };
  }

  private calculateAdjustedValue(factors: PotentialFactor[]): EstimationCalculation {
    // Calculate weighted average of factor impacts
    let totalWeight = 0;
    let weightedImpact = 0;

    for (const factor of factors) {
      totalWeight += factor.weight;
      weightedImpact += factor.impact * factor.weight;
    }

    const averageImpact = totalWeight > 0 ? weightedImpact / totalWeight : 0;
    const adjustmentMultiplier = 1 + (averageImpact / 100);

    return {
      step: 'Factor Adjustment',
      formula: 'Base Value × (1 + Weighted Average Impact ÷ 100)',
      inputs: {
        weightedImpact,
        totalWeight,
        adjustmentMultiplier
      },
      result: adjustmentMultiplier,
      explanation: `Multiplier to adjust base value based on all factor analysis`
    };
  }

  private calculateSuccessProbability(factors: PotentialFactor[]): EstimationCalculation {
    // Use project fundamentals, community, and timing for success probability
    const relevantFactors = factors.filter(f => 
      ['project_fundamentals', 'community', 'timing'].includes(f.category)
    );

    let totalWeight = 0;
    let weightedScore = 0;

    for (const factor of relevantFactors) {
      totalWeight += factor.weight;
      weightedScore += factor.score * factor.weight;
    }

    const successProbability = totalWeight > 0 ? weightedScore / totalWeight : 50;

    return {
      step: 'Success Probability',
      formula: 'Weighted Average of Key Factor Scores',
      inputs: {
        relevantFactors: relevantFactors.length,
        totalWeight,
        weightedScore
      },
      result: successProbability,
      explanation: `Probability of successful airdrop completion based on key factors`
    };
  }

  private calculateRiskAssessment(factors: PotentialFactor[]): EstimationCalculation {
    // Invert success factors and add competition risk
    const riskFactors = factors.filter(f => 
      ['competition', 'market_conditions'].includes(f.category)
    );

    let totalWeight = 0;
    let weightedRisk = 0;

    for (const factor of riskFactors) {
      totalWeight += factor.weight;
      weightedRisk += (100 - factor.score) * factor.weight; // Invert score for risk
    }

    const riskScore = totalWeight > 0 ? weightedRisk / totalWeight : 50;

    return {
      step: 'Risk Assessment',
      formula: 'Weighted Average of Risk Factors (Inverted Scores)',
      inputs: {
        riskFactors: riskFactors.length,
        totalWeight,
        weightedRisk
      },
      result: riskScore,
      explanation: `Overall risk score based on market and competition factors`
    };
  }

  private calculateROI(airdrop: any, factors: PotentialFactor[], marketData: MarketData): EstimationCalculation {
    // Simplified ROI calculation based on potential appreciation
    const baseROI = 50; // 50% base ROI expectation
    
    // Adjust for market conditions
    let marketAdjustment = 0;
    if (marketData.marketCondition === 'bull') {
      marketAdjustment = 30;
    } else if (marketData.marketCondition === 'bear') {
      marketAdjustment = -20;
    }

    // Adjust for project quality
    const projectFactor = factors.find(f => f.category === 'project_fundamentals');
    const projectAdjustment = projectFactor ? (projectFactor.score - 50) * 0.5 : 0;

    const roi = Math.max(0, baseROI + marketAdjustment + projectAdjustment);

    return {
      step: 'ROI Calculation',
      formula: 'Base ROI + Market Adjustment + Project Quality Adjustment',
      inputs: {
        baseROI,
        marketAdjustment,
        projectAdjustment
      },
      result: roi,
      explanation: `Expected return on investment as percentage`
    };
  }

  private calculateTimeToReturn(airdrop: any, factors: PotentialFactor[]): EstimationCalculation {
    // Estimate days until significant return
    let baseDays = 90; // 3 months base expectation
    
    // Adjust for project maturity
    const maturityFactor = factors.find(f => f.category === 'project_fundamentals');
    if (maturityFactor && maturityFactor.score > 70) {
      baseDays -= 30; // Mature projects may return faster
    }

    // Adjust for market conditions
    const marketFactor = factors.find(f => f.category === 'market_conditions');
    if (marketFactor) {
      if (marketFactor.score > 70) {
        baseDays -= 15; // Good market may accelerate returns
      } else if (marketFactor.score < 30) {
        baseDays += 30; // Poor market may delay returns
      }
    }

    const timeToReturn = Math.max(30, baseDays); // Minimum 30 days

    return {
      step: 'Time to Return',
      formula: 'Base Days - Maturity Adjustment - Market Adjustment',
      inputs: {
        baseDays,
        maturityAdjustment: maturityFactor ? (maturityFactor.score > 70 ? -30 : 0) : 0,
        marketAdjustment: marketFactor ? (marketFactor.score > 70 ? -15 : marketFactor.score < 30 ? 30 : 0) : 0
      },
      result: timeToReturn,
      explanation: `Estimated days until significant return on investment`
    };
  }

  private calculateFinalEstimates(factors: PotentialFactor[], calculations: EstimationCalculation[]): any {
    const baseValueCalc = calculations.find(c => c.step === 'Base Value Calculation');
    const adjustmentCalc = calculations.find(c => c.step === 'Factor Adjustment');
    const successCalc = calculations.find(c => c.step === 'Success Probability');
    const riskCalc = calculations.find(c => c.step === 'Risk Assessment');
    const roiCalc = calculations.find(c => c.step === 'ROI Calculation');
    const timeCalc = calculations.find(c => c.step === 'Time to Return');

    const baseValue = baseValueCalc?.result || 10;
    const adjustmentMultiplier = adjustmentCalc?.result || 1;
    const successProbability = successCalc?.result || 50;
    const riskScore = riskCalc?.result || 50;
    const potentialROI = roiCalc?.result || 50;
    const timeToReturn = timeCalc?.result || 90;

    // Calculate final estimated value
    const estimatedValue = baseValue * adjustmentMultiplier * (successProbability / 100);
    
    // Calculate confidence based on factor agreement
    const confidence = this.calculateConfidence(factors);

    return {
      estimatedValue,
      confidence,
      successProbability,
      riskScore,
      potentialROI,
      timeToReturn
    };
  }

  private calculateConfidence(factors: PotentialFactor[]): number {
    if (factors.length === 0) return 50;

    // Calculate standard deviation of factor scores
    const scores = factors.map(f => f.score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher confidence when factors are aligned (lower standard deviation)
    const alignmentScore = Math.max(0, 100 - standardDeviation);
    
    // Also consider average score
    const averageScore = mean;

    // Combine alignment and average score
    return Math.round((alignmentScore * 0.6) + (averageScore * 0.4));
  }

  private async generateAIInsights(airdrop: any, factors: PotentialFactor[], marketData: MarketData): Promise<any> {
    try {
      const prompt = `
        Analyze this airdrop potential estimation and provide insights:

        Airdrop: ${airdrop.title}
        Project: ${airdrop.project.name}
        Category: ${airdrop.project.category}
        Total Amount: ${airdrop.totalAmount}
        Participants: ${airdrop.participantsCount}

        Factor Analysis:
        ${factors.map(f => `- ${f.name}: ${f.score}/100 (${f.impact > 0 ? '+' : ''}${f.impact.toFixed(1)}%)`).join('\n')}

        Market Data:
        - Condition: ${marketData.marketCondition}
        - Sentiment: ${marketData.sentiment}/100
        - Competition: ${marketData.competitionLevel}/100

        Provide JSON response with:
        {
          "strengths": ["strength1", "strength2"],
          "weaknesses": ["weakness1", "weakness2"],
          "opportunities": ["opportunity1", "opportunity2"],
          "threats": ["threat1", "threat2"],
          "recommendations": ["recommendation1", "recommendation2"],
          "overallAssessment": "Brief overall assessment"
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert airdrop analyst providing strategic insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content;
      
      try {
        return JSON.parse(response || '{}');
      } catch {
        return {
          strengths: ['Analysis completed'],
          weaknesses: ['Limited data'],
          opportunities: ['Market potential'],
          threats: ['Competition'],
          recommendations: ['Monitor closely'],
          overallAssessment: 'AI analysis unavailable'
        };
      }
    } catch (error) {
      logger.error('Failed to generate AI insights:', error);
      return {
        strengths: [],
        weaknesses: ['Analysis failed'],
        opportunities: [],
        threats: [],
        recommendations: ['Manual review required'],
        overallAssessment: 'AI insights unavailable'
      };
    }
  }

  private async storeEstimation(estimation: PotentialEstimation): Promise<void> {
    try {
      await db.airdropPotential.upsert({
        where: { airdropId: estimation.airdropId },
        update: {
          estimatedValue: estimation.estimatedValue,
          confidence: estimation.confidence,
          successProbability: estimation.successProbability,
          riskScore: estimation.riskScore,
          potentialROI: estimation.potentialROI,
          timeToReturn: estimation.timeToReturn,
          factors: estimation.factors,
          calculations: estimation.calculations,
          lastUpdated: estimation.lastUpdated,
          metadata: estimation.metadata
        },
        create: {
          airdropId: estimation.airdropId,
          estimatedValue: estimation.estimatedValue,
          confidence: estimation.confidence,
          successProbability: estimation.successProbability,
          riskScore: estimation.riskScore,
          potentialROI: estimation.potentialROI,
          timeToReturn: estimation.timeToReturn,
          factors: estimation.factors,
          calculations: estimation.calculations,
          lastUpdated: estimation.lastUpdated,
          metadata: estimation.metadata
        }
      });

      logger.info(`Stored potential estimation for airdrop ${estimation.airdropId}`);
    } catch (error) {
      logger.error('Failed to store estimation:', error);
    }
  }

  // Helper methods
  private evaluateTeamQuality(team: any): number {
    // Simulated team quality evaluation
    return Math.random() * 50 + 50; // 50-100
  }

  private evaluateFunding(funding: any): number {
    // Simulated funding evaluation
    return Math.random() * 40 + 60; // 60-100
  }

  private calculateEngagementRate(participations: any[]): number {
    // Simulated engagement rate calculation
    return Math.random() * 100;
  }

  private async analyzeMarketSentiment(airdrop: any): Promise<number> {
    // Simulated sentiment analysis
    return Math.random() * 100;
  }

  private async assessCompetitionLevel(airdrop: any): Promise<number> {
    // Simulated competition assessment
    return Math.random() * 100;
  }

  private determineMarketCondition(priceChange24h: number, sentiment: number): 'bull' | 'bear' | 'neutral' {
    if (priceChange24h > 5 && sentiment > 60) return 'bull';
    if (priceChange24h < -5 && sentiment < 40) return 'bear';
    return 'neutral';
  }

  private calculateCategoryUniqueness(category: string): number {
    // Simulated category uniqueness (lower competition = higher uniqueness)
    const uniquenessScores: Record<string, number> = {
      'defi': 30,
      'gaming': 60,
      'nft': 40,
      'infrastructure': 70,
      'layer2': 80,
      'dao': 75,
      'exchange': 25,
      'social': 65
    };
    
    return uniquenessScores[category] || 50;
  }

  private assessFirstMoverAdvantage(airdrop: any): number {
    // Simulated first-mover advantage assessment
    return Math.random() * 100;
  }

  private assessDifferentiation(airdrop: any): number {
    // Simulated differentiation assessment
    return Math.random() * 100;
  }

  private assessMarketCycleTiming(marketData: MarketData): number {
    // Simulated market cycle timing assessment
    if (marketData.marketCondition === 'bull') return 80;
    if (marketData.marketCondition === 'bear') return 20;
    return 50;
  }

  private assessMaturityTiming(airdrop: any): number {
    // Simulated maturity timing assessment
    return Math.random() * 100;
  }

  private assessSeasonalFactors(): number {
    // Simulated seasonal factors assessment
    return Math.random() * 100;
  }

  private assessDurationTiming(airdrop: any): number {
    // Simulated duration timing assessment
    return Math.random() * 100;
  }

  private countDataPoints(airdrop: any): number {
    return (airdrop.participations?.length || 0) + 
           (airdrop.validations?.length || 0) + 
           (airdrop.performance ? 1 : 0);
  }

  async getTopPotentialAirdrops(limit = 20): Promise<any[]> {
    try {
      return await db.airdropPotential.findMany({
        include: {
          airdrop: {
            include: {
              project: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: {
          estimatedValue: 'desc'
        },
        take: limit
      });
    } catch (error) {
      logger.error('Failed to get top potential airdrops:', error);
      return [];
    }
  }

  async getEstimationHistory(airdropId: string): Promise<any[]> {
    try {
      // This would track historical estimations if we had a separate table
      const current = await db.airdropPotential.findUnique({
        where: { airdropId }
      });

      return current ? [current] : [];
    } catch (error) {
      logger.error('Failed to get estimation history:', error);
      return [];
    }
  }
}

export const airdropPotentialEstimator = new AirdropPotentialEstimator();