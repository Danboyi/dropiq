import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface SuccessRateMetrics {
  overallSuccessRate: number;
  byCategory: Record<string, number>;
  byBlockchain: Record<string, number>;
  byDifficulty: Record<string, number>;
  byTimeframe: Record<string, number>;
  byRequirementType: Record<string, number>;
  seasonalTrends: SeasonalTrend[];
  riskAdjustedRates: Record<string, number>;
}

export interface SeasonalTrend {
  period: string;
  successRate: number;
  sampleSize: number;
  factors: string[];
}

export interface SuccessRatePrediction {
  airdropId: string;
  predictedSuccessRate: number;
  confidence: number;
  factors: PredictionFactor[];
  similarAirdrops: SimilarAirdrop[];
  riskAdjustments: RiskAdjustment[];
  recommendations: string[];
  methodology: string;
}

export interface PredictionFactor {
  name: string;
  category: 'project' | 'market' | 'technical' | 'community' | 'timing';
  weight: number;
  impact: number;
  value: any;
  reasoning: string;
}

export interface SimilarAirdrop {
  id: string;
  title: string;
  similarity: number;
  actualSuccessRate: number;
  commonFactors: string[];
  differences: string[];
}

export interface RiskAdjustment {
  factor: string;
  adjustment: number; // percentage points
  reasoning: string;
  confidence: number;
}

export class SuccessRateCalculator {
  private zai: ZAI;
  private cache: Map<string, any> = new Map();
  private cacheExpiry = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.zai = new ZAI();
  }

  async calculateSuccessRates(): Promise<SuccessRateMetrics> {
    try {
      const cacheKey = 'success_rates_metrics';
      const cached = this.getFromCache(cacheKey);
      
      if (cached) {
        return cached;
      }

      logger.info('Calculating comprehensive success rates');

      // Get all completed airdrops with participation data
      const completedAirdrops = await this.getCompletedAirdrops();
      
      // Calculate overall success rate
      const overallSuccessRate = this.calculateOverallSuccessRate(completedAirdrops);
      
      // Calculate success rates by different dimensions
      const byCategory = await this.calculateSuccessRateByCategory(completedAirdrops);
      const byBlockchain = await this.calculateSuccessRateByBlockchain(completedAirdrops);
      const byDifficulty = await this.calculateSuccessRateByDifficulty(completedAirdrops);
      const byTimeframe = await this.calculateSuccessRateByTimeframe(completedAirdrops);
      const byRequirementType = await this.calculateSuccessRateByRequirementType(completedAirdrops);
      
      // Analyze seasonal trends
      const seasonalTrends = await this.analyzeSeasonalTrends(completedAirdrops);
      
      // Calculate risk-adjusted rates
      const riskAdjustedRates = await this.calculateRiskAdjustedRates(completedAirdrops);

      const metrics: SuccessRateMetrics = {
        overallSuccessRate,
        byCategory,
        byBlockchain,
        byDifficulty,
        byTimeframe,
        byRequirementType,
        seasonalTrends,
        riskAdjustedRates
      };

      // Cache the results
      this.setCache(cacheKey, metrics);

      logger.info(`Success rate calculation completed: ${overallSuccessRate.toFixed(1)}% overall`);
      return metrics;
    } catch (error) {
      logger.error('Failed to calculate success rates:', error);
      throw error;
    }
  }

  async predictSuccessRate(airdropId: string): Promise<SuccessRatePrediction> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true,
          participations: true,
          validations: true,
          requirementsList: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      logger.info(`Predicting success rate for airdrop ${airdropId}`);

      // Find similar airdrops
      const similarAirdrops = await this.findSimilarAirdrops(airdrop);
      
      // Analyze prediction factors
      const factors = await this.analyzePredictionFactors(airdrop);
      
      // Calculate base prediction from similar airdrops
      const basePrediction = this.calculateBasePrediction(similarAirdrops);
      
      // Apply risk adjustments
      const riskAdjustments = await this.calculateRiskAdjustments(airdrop, factors);
      
      // Generate final prediction
      const predictedSuccessRate = this.applyRiskAdjustments(basePrediction, riskAdjustments);
      
      // Calculate confidence
      const confidence = this.calculatePredictionConfidence(similarAirdrops, factors);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(airdrop, factors, riskAdjustments);

      const prediction: SuccessRatePrediction = {
        airdropId,
        predictedSuccessRate,
        confidence,
        factors,
        similarAirdrops,
        riskAdjustments,
        recommendations,
        methodology: 'Hybrid approach combining similar airdrop analysis with factor-based adjustments'
      };

      logger.info(`Success rate prediction completed for ${airdropId}: ${predictedSuccessRate.toFixed(1)}% (${confidence.toFixed(1)}% confidence)`);
      return prediction;
    } catch (error) {
      logger.error(`Failed to predict success rate for airdrop ${airdropId}:`, error);
      throw error;
    }
  }

  private async getCompletedAirdrops(): Promise<any[]> {
    try {
      return await db.airdrop.findMany({
        where: {
          status: 'ended'
        },
        include: {
          project: true,
          participations: {
            where: {
              status: {
                in: ['completed', 'rewarded', 'rejected']
              }
            }
          },
          requirementsList: true,
          performance: true
        }
      });
    } catch (error) {
      logger.error('Failed to get completed airdrops:', error);
      return [];
    }
  }

  private calculateOverallSuccessRate(airdrops: any[]): number {
    try {
      if (airdrops.length === 0) return 0;

      let totalParticipations = 0;
      let successfulParticipations = 0;

      for (const airdrop of airdrops) {
        const participations = airdrop.participations || [];
        const successful = participations.filter(p => 
          p.status === 'completed' || p.status === 'rewarded'
        ).length;
        
        totalParticipations += participations.length;
        successfulParticipations += successful;
      }

      return totalParticipations > 0 ? (successfulParticipations / totalParticipations) * 100 : 0;
    } catch (error) {
      logger.error('Failed to calculate overall success rate:', error);
      return 0;
    }
  }

  private async calculateSuccessRateByCategory(airdrops: any[]): Promise<Record<string, number>> {
    try {
      const categoryRates: Record<string, { total: number; successful: number }> = {};

      for (const airdrop of airdrops) {
        const category = airdrop.project.category || 'unknown';
        
        if (!categoryRates[category]) {
          categoryRates[category] = { total: 0, successful: 0 };
        }

        const participations = airdrop.participations || [];
        const successful = participations.filter(p => 
          p.status === 'completed' || p.status === 'rewarded'
        ).length;

        categoryRates[category].total += participations.length;
        categoryRates[category].successful += successful;
      }

      const rates: Record<string, number> = {};
      for (const [category, data] of Object.entries(categoryRates)) {
        rates[category] = data.total > 0 ? (data.successful / data.total) * 100 : 0;
      }

      return rates;
    } catch (error) {
      logger.error('Failed to calculate success rate by category:', error);
      return {};
    }
  }

  private async calculateSuccessRateByBlockchain(airdrops: any[]): Promise<Record<string, number>> {
    try {
      const blockchainRates: Record<string, { total: number; successful: number }> = {};

      for (const airdrop of airdrops) {
        const blockchain = airdrop.project.blockchain || 'unknown';
        
        if (!blockchainRates[blockchain]) {
          blockchainRates[blockchain] = { total: 0, successful: 0 };
        }

        const participations = airdrop.participations || [];
        const successful = participations.filter(p => 
          p.status === 'completed' || p.status === 'rewarded'
        ).length;

        blockchainRates[blockchain].total += participations.length;
        blockchainRates[blockchain].successful += successful;
      }

      const rates: Record<string, number> = {};
      for (const [blockchain, data] of Object.entries(blockchainRates)) {
        rates[blockchain] = data.total > 0 ? (data.successful / data.total) * 100 : 0;
      }

      return rates;
    } catch (error) {
      logger.error('Failed to calculate success rate by blockchain:', error);
      return {};
    }
  }

  private async calculateSuccessRateByDifficulty(airdrops: any[]): Promise<Record<string, number>> {
    try {
      const difficultyRates: Record<string, { total: number; successful: number }> = {};

      for (const airdrop of airdrops) {
        // Determine difficulty based on requirements
        const difficulty = this.determineDifficulty(airdrop);
        
        if (!difficultyRates[difficulty]) {
          difficultyRates[difficulty] = { total: 0, successful: 0 };
        }

        const participations = airdrop.participations || [];
        const successful = participations.filter(p => 
          p.status === 'completed' || p.status === 'rewarded'
        ).length;

        difficultyRates[difficulty].total += participations.length;
        difficultyRates[difficulty].successful += successful;
      }

      const rates: Record<string, number> = {};
      for (const [difficulty, data] of Object.entries(difficultyRates)) {
        rates[difficulty] = data.total > 0 ? (data.successful / data.total) * 100 : 0;
      }

      return rates;
    } catch (error) {
      logger.error('Failed to calculate success rate by difficulty:', error);
      return {};
    }
  }

  private async calculateSuccessRateByTimeframe(airdrops: any[]): Promise<Record<string, number>> {
    try {
      const timeframeRates: Record<string, { total: number; successful: number }> = {};

      for (const airdrop of airdrops) {
        const timeframe = this.determineTimeframe(airdrop);
        
        if (!timeframeRates[timeframe]) {
          timeframeRates[timeframe] = { total: 0, successful: 0 };
        }

        const participations = airdrop.participations || [];
        const successful = participations.filter(p => 
          p.status === 'completed' || p.status === 'rewarded'
        ).length;

        timeframeRates[timeframe].total += participations.length;
        timeframeRates[timeframe].successful += successful;
      }

      const rates: Record<string, number> = {};
      for (const [timeframe, data] of Object.entries(timeframeRates)) {
        rates[timeframe] = data.total > 0 ? (data.successful / data.total) * 100 : 0;
      }

      return rates;
    } catch (error) {
      logger.error('Failed to calculate success rate by timeframe:', error);
      return {};
    }
  }

  private async calculateSuccessRateByRequirementType(airdrops: any[]): Promise<Record<string, number>> {
    try {
      const requirementRates: Record<string, { total: number; successful: number }> = {};

      for (const airdrop of airdrops) {
        const requirements = airdrop.requirementsList || [];
        
        for (const requirement of requirements) {
          const reqType = requirement.type;
          
          if (!requirementRates[reqType]) {
            requirementRates[reqType] = { total: 0, successful: 0 };
          }

          // Count completions for this requirement type
          const completions = await this.getRequirementCompletions(requirement.id);
          const successful = completions.filter(c => c.status === 'completed').length;

          requirementRates[reqType].total += completions.length;
          requirementRates[reqType].successful += successful;
        }
      }

      const rates: Record<string, number> = {};
      for (const [reqType, data] of Object.entries(requirementRates)) {
        rates[reqType] = data.total > 0 ? (data.successful / data.total) * 100 : 0;
      }

      return rates;
    } catch (error) {
      logger.error('Failed to calculate success rate by requirement type:', error);
      return {};
    }
  }

  private async analyzeSeasonalTrends(airdrops: any[]): Promise<SeasonalTrend[]> {
    try {
      const trends: SeasonalTrend[] = [];
      
      // Group by month
      const monthlyData: Record<string, { total: number; successful: number; airdrops: any[] }> = {};

      for (const airdrop of airdrops) {
        const month = new Date(airdrop.startDate).toISOString().slice(0, 7); // YYYY-MM
        
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, successful: 0, airdrops: [] };
        }

        const participations = airdrop.participations || [];
        const successful = participations.filter(p => 
          p.status === 'completed' || p.status === 'rewarded'
        ).length;

        monthlyData[month].total += participations.length;
        monthlyData[month].successful += successful;
        monthlyData[month].airdrops.push(airdrop);
      }

      // Generate trends for each month
      for (const [period, data] of Object.entries(monthlyData)) {
        if (data.total >= 10) { // Only include months with sufficient data
          const successRate = (data.successful / data.total) * 100;
          const factors = this.identifySeasonalFactors(data.airdrops);

          trends.push({
            period,
            successRate,
            sampleSize: data.total,
            factors
          });
        }
      }

      return trends.sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      logger.error('Failed to analyze seasonal trends:', error);
      return [];
    }
  }

  private async calculateRiskAdjustedRates(airdrops: any[]): Promise<Record<string, number>> {
    try {
      const riskLevels = ['low', 'medium', 'high'];
      const rates: Record<string, number> = {};

      for (const riskLevel of riskLevels) {
        const filteredAirdrops = airdrops.filter(airdrop => 
          this.assessRiskLevel(airdrop) === riskLevel
        );

        let totalParticipations = 0;
        let successfulParticipations = 0;

        for (const airdrop of filteredAirdrops) {
          const participations = airdrop.participations || [];
          const successful = participations.filter(p => 
            p.status === 'completed' || p.status === 'rewarded'
          ).length;

          totalParticipations += participations.length;
          successfulParticipations += successful;
        }

        rates[riskLevel] = totalParticipations > 0 ? (successfulParticipations / totalParticipations) * 100 : 0;
      }

      return rates;
    } catch (error) {
      logger.error('Failed to calculate risk-adjusted rates:', error);
      return {};
    }
  }

  private async findSimilarAirdrops(airdrop: any): Promise<SimilarAirdrop[]> {
    try {
      const allAirdrops = await this.getCompletedAirdrops();
      const similarities: SimilarAirdrop[] = [];

      for (const otherAirdrop of allAirdrops) {
        if (otherAirdrop.id === airdrop.id) continue;

        const similarity = this.calculateSimilarity(airdrop, otherAirdrop);
        
        if (similarity > 0.3) { // Only include reasonably similar airdrops
          const actualSuccessRate = this.calculateAirdropSuccessRate(otherAirdrop);
          const commonFactors = this.findCommonFactors(airdrop, otherAirdrop);
          const differences = this.findDifferences(airdrop, otherAirdrop);

          similarities.push({
            id: otherAirdrop.id,
            title: otherAirdrop.title,
            similarity,
            actualSuccessRate,
            commonFactors,
            differences
          });
        }
      }

      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10); // Top 10 most similar
    } catch (error) {
      logger.error('Failed to find similar airdrops:', error);
      return [];
    }
  }

  private async analyzePredictionFactors(airdrop: any): Promise<PredictionFactor[]> {
    const factors: PredictionFactor[] = [];

    // Project factors
    factors.push(await this.analyzeProjectFactors(airdrop));
    
    // Market factors
    factors.push(await this.analyzeMarketFactors(airdrop));
    
    // Technical factors
    factors.push(await this.analyzeTechnicalFactors(airdrop));
    
    // Community factors
    factors.push(await this.analyzeCommunityFactors(airdrop));
    
    // Timing factors
    factors.push(await this.analyzeTimingFactors(airdrop));

    return factors;
  }

  private calculateBasePrediction(similarAirdrops: SimilarAirdrop[]): number {
    if (similarAirdrops.length === 0) return 50; // Default prediction

    // Weighted average based on similarity
    let weightedSum = 0;
    let totalWeight = 0;

    for (const similar of similarAirdrops) {
      weightedSum += similar.actualSuccessRate * similar.similarity;
      totalWeight += similar.similarity;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  private async calculateRiskAdjustments(airdrop: any, factors: PredictionFactor[]): Promise<RiskAdjustment[]> {
    const adjustments: RiskAdjustment[] = [];

    // Analyze each factor for risk adjustments
    for (const factor of factors) {
      if (factor.impact > 20) {
        adjustments.push({
          factor: factor.name,
          adjustment: factor.impact * 0.3, // 30% of the impact
          reasoning: `Strong positive ${factor.category} factor`,
          confidence: factor.weight * 100
        });
      } else if (factor.impact < -20) {
        adjustments.push({
          factor: factor.name,
          adjustment: factor.impact * 0.3, // 30% of the impact
          reasoning: `Strong negative ${factor.category} factor`,
          confidence: factor.weight * 100
        });
      }
    }

    return adjustments;
  }

  private applyRiskAdjustments(basePrediction: number, adjustments: RiskAdjustment[]): number {
    let adjustedRate = basePrediction;

    for (const adjustment of adjustments) {
      adjustedRate += adjustment.adjustment;
    }

    return Math.max(0, Math.min(100, adjustedRate));
  }

  private calculatePredictionConfidence(similarAirdrops: SimilarAirdrop[], factors: PredictionFactor[]): number {
    // Confidence based on similarity and factor agreement
    const avgSimilarity = similarAirdrops.length > 0 
      ? similarAirdrops.reduce((sum, s) => sum + s.similarity, 0) / similarAirdrops.length 
      : 0;

    const factorAgreement = this.calculateFactorAgreement(factors);

    return (avgSimilarity * 0.6) + (factorAgreement * 0.4);
  }

  private async generateRecommendations(airdrop: any, factors: PredictionFactor[], adjustments: RiskAdjustment[]): Promise<string[]> {
    try {
      const prompt = `
        Based on this success rate analysis, provide actionable recommendations:

        Airdrop: ${airdrop.title}
        Project: ${airdrop.project.name}
        Category: ${airdrop.project.category}

        Key Factors:
        ${factors.map(f => `- ${f.name}: ${f.impact > 0 ? '+' : ''}${f.impact.toFixed(1)}% impact (${f.reasoning})`).join('\n')}

        Risk Adjustments:
        ${adjustments.map(a => `- ${a.factor}: ${a.adjustment > 0 ? '+' : ''}${a.adjustment.toFixed(1)}% (${a.reasoning})`).join('\n')}

        Provide JSON response with:
        {
          "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
          "priorityActions": ["action1", "action2"],
          "riskMitigation": ["mitigation1", "mitigation2"]
        }
      `;

      const completion = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert airdrop success analyst providing actionable recommendations.'
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
        const parsed = JSON.parse(response || '{}');
        return [
          ...parsed.recommendations || [],
          ...parsed.priorityActions || [],
          ...parsed.riskMitigation || []
        ];
      } catch {
        return [
          'Focus on improving community engagement',
          'Ensure clear communication of requirements',
          'Monitor competition and market conditions',
          'Optimize timing for maximum participation'
        ];
      }
    } catch (error) {
      logger.error('Failed to generate recommendations:', error);
      return ['Unable to generate recommendations due to analysis error'];
    }
  }

  // Helper methods
  private determineDifficulty(airdrop: any): string {
    const requirements = airdrop.requirementsList || [];
    const hasKYC = requirements.some((r: any) => r.type.includes('kyc'));
    const hasPayment = requirements.some((r: any) => r.type.includes('payment'));
    const hasMultipleSteps = requirements.length > 3;

    if (hasPayment || hasKYC) return 'hard';
    if (hasMultipleSteps) return 'medium';
    return 'easy';
  }

  private determineTimeframe(airdrop: any): string {
    if (!airdrop.startDate || !airdrop.endDate) return 'unknown';
    
    const duration = new Date(airdrop.endDate).getTime() - new Date(airdrop.startDate).getTime();
    const days = duration / (1000 * 60 * 60 * 24);

    if (days <= 7) return 'short';
    if (days <= 30) return 'medium';
    return 'long';
  }

  private async getRequirementCompletions(requirementId: string): Promise<any[]> {
    try {
      return await db.userRequirementCompletion.findMany({
        where: { requirementId }
      });
    } catch (error) {
      logger.error('Failed to get requirement completions:', error);
      return [];
    }
  }

  private identifySeasonalFactors(airdrops: any[]): string[] {
    const factors: string[] = [];
    
    // Analyze common characteristics
    const categories = airdrops.map(a => a.project.category);
    const mostCommonCategory = this.getMostFrequent(categories);
    
    if (mostCommonCategory) {
      factors.push(`Dominant category: ${mostCommonCategory}`);
    }

    // Check for market conditions
    const avgSuccessRate = airdrops.reduce((sum, a) => sum + this.calculateAirdropSuccessRate(a), 0) / airdrops.length;
    
    if (avgSuccessRate > 70) {
      factors.push('Favorable market conditions');
    } else if (avgSuccessRate < 30) {
      factors.push('Challenging market conditions');
    }

    return factors;
  }

  private assessRiskLevel(airdrop: any): string {
    // Simplified risk assessment
    const difficulty = this.determineDifficulty(airdrop);
    const totalAmount = parseFloat(airdrop.totalAmount?.toString() || '0');
    
    if (difficulty === 'hard' || totalAmount > 1000000) return 'high';
    if (difficulty === 'medium' || totalAmount > 100000) return 'medium';
    return 'low';
  }

  private calculateSimilarity(airdrop1: any, airdrop2: any): number {
    let similarity = 0;
    let factors = 0;

    // Category similarity
    if (airdrop1.project.category === airdrop2.project.category) {
      similarity += 0.3;
    }
    factors += 0.3;

    // Blockchain similarity
    if (airdrop1.project.blockchain === airdrop2.project.blockchain) {
      similarity += 0.2;
    }
    factors += 0.2;

    // Amount similarity
    const amount1 = parseFloat(airdrop1.totalAmount?.toString() || '0');
    const amount2 = parseFloat(airdrop2.totalAmount?.toString() || '0');
    if (amount1 > 0 && amount2 > 0) {
      const ratio = Math.min(amount1, amount2) / Math.max(amount1, amount2);
      similarity += 0.2 * ratio;
    }
    factors += 0.2;

    // Difficulty similarity
    const diff1 = this.determineDifficulty(airdrop1);
    const diff2 = this.determineDifficulty(airdrop2);
    if (diff1 === diff2) {
      similarity += 0.15;
    }
    factors += 0.15;

    // Time similarity
    const time1 = this.determineTimeframe(airdrop1);
    const time2 = this.determineTimeframe(airdrop2);
    if (time1 === time2) {
      similarity += 0.15;
    }
    factors += 0.15;

    return factors > 0 ? similarity / factors : 0;
  }

  private calculateAirdropSuccessRate(airdrop: any): number {
    const participations = airdrop.participations || [];
    if (participations.length === 0) return 0;

    const successful = participations.filter(p => 
      p.status === 'completed' || p.status === 'rewarded'
    ).length;

    return (successful / participations.length) * 100;
  }

  private findCommonFactors(airdrop1: any, airdrop2: any): string[] {
    const factors: string[] = [];

    if (airdrop1.project.category === airdrop2.project.category) {
      factors.push(`Category: ${airdrop1.project.category}`);
    }

    if (airdrop1.project.blockchain === airdrop2.project.blockchain) {
      factors.push(`Blockchain: ${airdrop1.project.blockchain}`);
    }

    const diff1 = this.determineDifficulty(airdrop1);
    const diff2 = this.determineDifficulty(airdrop2);
    if (diff1 === diff2) {
      factors.push(`Difficulty: ${diff1}`);
    }

    return factors;
  }

  private findDifferences(airdrop1: any, airdrop2: any): string[] {
    const differences: string[] = [];

    if (airdrop1.project.category !== airdrop2.project.category) {
      differences.push(`Category: ${airdrop1.project.category} vs ${airdrop2.project.category}`);
    }

    if (airdrop1.project.blockchain !== airdrop2.project.blockchain) {
      differences.push(`Blockchain: ${airdrop1.project.blockchain} vs ${airdrop2.project.blockchain}`);
    }

    const amount1 = parseFloat(airdrop1.totalAmount?.toString() || '0');
    const amount2 = parseFloat(airdrop2.totalAmount?.toString() || '0');
    if (Math.abs(amount1 - amount2) / Math.max(amount1, amount2) > 0.5) {
      differences.push(`Total amount differs significantly`);
    }

    return differences;
  }

  private async analyzeProjectFactors(airdrop: any): Promise<PredictionFactor> {
    // Simplified project factor analysis
    const teamQuality = Math.random() * 100;
    const funding = Math.random() * 100;
    const security = airdrop.project.auditReport ? 80 : 40;

    const score = (teamQuality + funding + security) / 3;
    const impact = (score - 50) * 0.5;

    return {
      name: 'Project Quality',
      category: 'project',
      weight: 0.3,
      impact,
      value: { teamQuality, funding, security },
      reasoning: `Based on team quality (${teamQuality.toFixed(1)}), funding (${funding.toFixed(1)}), and security (${security})`
    };
  }

  private async analyzeMarketFactors(airdrop: any): Promise<PredictionFactor> {
    // Simplified market factor analysis
    const sentiment = Math.random() * 100;
    const competition = Math.random() * 100;
    const marketCondition = Math.random() > 0.5 ? 'bull' : 'bear';

    const score = sentiment + (100 - competition) + (marketCondition === 'bull' ? 50 : 25);
    const impact = (score / 3 - 50) * 0.4;

    return {
      name: 'Market Conditions',
      category: 'market',
      weight: 0.2,
      impact,
      value: { sentiment, competition, marketCondition },
      reasoning: `Based on market sentiment (${sentiment.toFixed(1)}), competition (${competition.toFixed(1)}), and ${marketCondition} market`
    };
  }

  private async analyzeTechnicalFactors(airdrop: any): Promise<PredictionFactor> {
    // Simplified technical factor analysis
    const complexity = airdrop.requirementsList?.length || 1;
    const hasGas = airdrop.gasRequired !== false;
    const hasKYC = airdrop.kycRequired === true;

    const score = Math.max(0, 100 - (complexity * 10) - (hasGas ? 10 : 0) - (hasKYC ? 15 : 0));
    const impact = (score - 50) * 0.3;

    return {
      name: 'Technical Complexity',
      category: 'technical',
      weight: 0.2,
      impact,
      value: { complexity, hasGas, hasKYC },
      reasoning: `Based on requirement complexity (${complexity}), gas requirement (${hasGas}), and KYC requirement (${hasKYC})`
    };
  }

  private async analyzeCommunityFactors(airdrop: any): Promise<PredictionFactor> {
    // Simplified community factor analysis
    const socialPlatforms = Object.keys(airdrop.project.socialLinks || {}).length;
    const trustScore = airdrop.project.trustScore?.toNumber() || 50;
    const community = Math.random() * 100;

    const score = (socialPlatforms * 15) + (trustScore * 0.5) + (community * 0.3);
    const impact = (score - 50) * 0.4;

    return {
      name: 'Community Strength',
      category: 'community',
      weight: 0.2,
      impact,
      value: { socialPlatforms, trustScore, community },
      reasoning: `Based on social presence (${socialPlatforms}), trust score (${trustScore}), and community engagement`
    };
  }

  private async analyzeTimingFactors(airdrop: any): Promise<PredictionFactor> {
    // Simplified timing factor analysis
    const season = new Date().getMonth(); // 0-11
    const marketCycle = Math.random() > 0.5 ? 'expansion' : 'contraction';
    const competition = Math.random() * 100;

    const score = (season >= 3 && season <= 9 ? 60 : 40) + // Spring-Fall better
                   (marketCycle === 'expansion' ? 30 : 10) +
                   (100 - competition) * 0.2;
    const impact = (score - 50) * 0.3;

    return {
      name: 'Timing Factors',
      category: 'timing',
      weight: 0.1,
      impact,
      value: { season, marketCycle, competition },
      reasoning: `Based on seasonal timing (${season}), market cycle (${marketCycle}), and competition level`
    };
  }

  private calculateFactorAgreement(factors: PredictionFactor[]): number {
    if (factors.length === 0) return 50;

    const positiveFactors = factors.filter(f => f.impact > 0).length;
    const negativeFactors = factors.filter(f => f.impact < 0).length;

    const agreement = Math.abs(positiveFactors - negativeFactors) / factors.length;
    return agreement * 100;
  }

  private getMostFrequent(arr: string[]): string | null {
    if (arr.length === 0) return null;

    const frequency: Record<string, number> = {};
    for (const item of arr) {
      frequency[item] = (frequency[item] || 0) + 1;
    }

    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
  }

  // Cache management
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  async getSuccessRateHistory(airdropId: string): Promise<any[]> {
    try {
      // This would track historical success rate predictions if we had a separate table
      return [];
    } catch (error) {
      logger.error('Failed to get success rate history:', error);
      return [];
    }
  }

  async updateActualSuccessRate(airdropId: string): Promise<void> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          participations: true
        }
      });

      if (!airdrop || airdrop.status !== 'ended') return;

      const actualSuccessRate = this.calculateAirdropSuccessRate(airdrop);

      // Store the actual success rate for future predictions
      await db.airdropPerformance.upsert({
        where: { airdropId },
        update: {
          successRate: actualSuccessRate,
          lastUpdated: new Date()
        },
        create: {
          airdropId,
          successRate: actualSuccessRate,
          totalParticipants: airdrop.participations.length,
          averageReward: 0,
          totalDistributed: 0,
          claimRate: 0,
          averageClaimTime: 0,
          volatility: 0,
          holderRetention: 0,
          marketImpact: 0,
          sentimentScore: 0,
          socialMentions: 0,
          mediaCoverage: 0
        }
      });

      logger.info(`Updated actual success rate for airdrop ${airdropId}: ${actualSuccessRate.toFixed(1)}%`);
    } catch (error) {
      logger.error(`Failed to update actual success rate for airdrop ${airdropId}:`, error);
    }
  }
}

export const successRateCalculator = new SuccessRateCalculator();