import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import ZAI from 'z-ai-web-dev-sdk';

export interface ROIMetrics {
  airdropId: string;
  walletAddress: string;
  initialInvestment: number;
  currentValue: number;
  totalReturn: number;
  roiPercentage: number;
  holdingPeriod: number; // days
  annualizedROI: number;
  riskAdjustedROI: number;
  peakValue: number;
  lowestValue: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentStatus: 'holding' | 'sold' | 'partial_sold';
  lastUpdated: Date;
  metadata: any;
}

export interface PortfolioROI {
  walletAddress: string;
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
  roiPercentage: number;
  annualizedROI: number;
  winRate: number; // percentage of profitable airdrops
  averageHoldingPeriod: number;
  bestPerformer: string;
  worstPerformer: string;
  diversificationScore: number;
  riskScore: number;
  recommendations: string[];
}

export interface ROIPrediction {
  airdropId: string;
  predictedROI: number;
  confidence: number;
  timeframe: number; // days
  riskLevel: 'low' | 'medium' | 'high';
  factors: ROIFactor[];
  scenarios: ROIScenario[];
  assumptions: string[];
  methodology: string;
}

export interface ROIFactor {
  name: string;
  category: 'market' | 'project' | 'tokenomics' | 'timing' | 'competition';
  weight: number;
  impact: number;
  currentValue: any;
  projectedValue: any;
  reasoning: string;
}

export interface ROIScenario {
  name: string;
  probability: number;
  projectedROI: number;
  conditions: string[];
  timeframe: number;
}

export class ROITracker {
  private zai: ZAI;
  private priceCache: Map<string, { price: number; timestamp: number }> = new Map();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.zai = new ZAI();
  }

  async trackROI(airdropId: string, walletAddress: string): Promise<ROIMetrics> {
    try {
      logger.info(`Tracking ROI for ${walletAddress} in airdrop ${airdropId}`);

      // Get participation data
      const participation = await this.getParticipation(airdropId, walletAddress);
      if (!participation || !participation.rewardAmount) {
        throw new Error('No reward found for this participation');
      }

      // Get current token price
      const currentPrice = await this.getTokenPrice(airdropId);
      
      // Calculate ROI metrics
      const metrics = await this.calculateROIMetrics(participation, currentPrice);
      
      // Store metrics
      await this.storeROIMetrics(metrics);

      logger.info(`ROI tracking completed: ${metrics.roiPercentage.toFixed(2)}% for ${walletAddress}`);
      return metrics;
    } catch (error) {
      logger.error(`Failed to track ROI for ${walletAddress} in airdrop ${airdropId}:`, error);
      throw error;
    }
  }

  async calculatePortfolioROI(walletAddress: string): Promise<PortfolioROI> {
    try {
      logger.info(`Calculating portfolio ROI for ${walletAddress}`);

      // Get all participations with rewards
      const participations = await this.getRewardParticipations(walletAddress);
      
      if (participations.length === 0) {
        return this.createEmptyPortfolio(walletAddress);
      }

      // Calculate ROI for each participation
      const roiMetrics: ROIMetrics[] = [];
      for (const participation of participations) {
        try {
          const currentPrice = await this.getTokenPrice(participation.airdropId);
          const metrics = await this.calculateROIMetrics(participation, currentPrice);
          roiMetrics.push(metrics);
        } catch (error) {
          logger.error(`Failed to calculate ROI for participation ${participation.id}:`, error);
        }
      }

      // Aggregate portfolio metrics
      const portfolioMetrics = this.aggregatePortfolioMetrics(walletAddress, roiMetrics);
      
      // Generate recommendations
      const recommendations = await this.generatePortfolioRecommendations(portfolioMetrics, roiMetrics);

      const portfolio: PortfolioROI = {
        ...portfolioMetrics,
        recommendations
      };

      logger.info(`Portfolio ROI calculation completed: ${portfolio.roiPercentage.toFixed(2)}% for ${walletAddress}`);
      return portfolio;
    } catch (error) {
      logger.error(`Failed to calculate portfolio ROI for ${walletAddress}:`, error);
      throw error;
    }
  }

  async predictROI(airdropId: string, timeframe: number = 365): Promise<ROIPrediction> {
    try {
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          project: true,
          potential: true,
          performance: true
        }
      });

      if (!airdrop) {
        throw new Error('Airdrop not found');
      }

      logger.info(`Predicting ROI for airdrop ${airdropId} over ${timeframe} days`);

      // Analyze ROI factors
      const factors = await this.analyzeROIFactors(airdrop);
      
      // Generate scenarios
      const scenarios = await this.generateROIScenarios(airdrop, factors, timeframe);
      
      // Calculate base prediction
      const basePrediction = this.calculateBaseROIPrediction(factors);
      
      // Apply scenario adjustments
      const predictedROI = this.applyScenarioAdjustments(basePrediction, scenarios);
      
      // Calculate confidence
      const confidence = this.calculatePredictionConfidence(factors, scenarios);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(factors, scenarios);
      
      // Generate assumptions
      const assumptions = this.generateAssumptions(factors);

      const prediction: ROIPrediction = {
        airdropId,
        predictedROI,
        confidence,
        timeframe,
        riskLevel,
        factors,
        scenarios,
        assumptions,
        methodology: 'Multi-factor predictive model with scenario analysis'
      };

      logger.info(`ROI prediction completed for ${airdropId}: ${predictedROI.toFixed(2)}% (${confidence.toFixed(1)}% confidence)`);
      return prediction;
    } catch (error) {
      logger.error(`Failed to predict ROI for airdrop ${airdropId}:`, error);
      throw error;
    }
  }

  private async getParticipation(airdropId: string, walletAddress: string): Promise<any> {
    return await db.userAirdropParticipation.findFirst({
      where: {
        airdropId,
        walletAddress,
        status: {
          in: ['completed', 'rewarded']
        }
      },
      include: {
        airdrop: {
          include: {
            project: true,
            token: true
          }
        }
      }
    });
  }

  private async getRewardParticipations(walletAddress: string): Promise<any[]> {
    return await db.userAirdropParticipation.findMany({
      where: {
        walletAddress,
        rewardAmount: {
          not: null
        },
        status: {
          in: ['completed', 'rewarded']
        }
      },
      include: {
        airdrop: {
          include: {
            project: true,
            token: true
          }
        }
      }
    });
  }

  private async getTokenPrice(airdropId: string): Promise<number> {
    try {
      const cacheKey = `price_${airdropId}`;
      const cached = this.priceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.price;
      }

      // Get token info from airdrop
      const airdrop = await db.airdrop.findUnique({
        where: { id: airdropId },
        include: {
          token: true,
          project: true
        }
      });

      if (!airdrop?.token) {
        // Simulated price for non-token airdrops
        const simulatedPrice = Math.random() * 10 + 0.1; // $0.10 - $10.10
        this.priceCache.set(cacheKey, { price: simulatedPrice, timestamp: Date.now() });
        return simulatedPrice;
      }

      // In a real implementation, this would fetch from CoinGecko/CoinMarketCap API
      // For now, simulate price based on market data
      const basePrice = Math.random() * 5 + 0.5; // $0.50 - $5.50
      const marketAdjustment = Math.random() * 2 - 1; // -1 to +1
      const price = Math.max(0.01, basePrice + marketAdjustment);

      this.priceCache.set(cacheKey, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      logger.error('Failed to get token price:', error);
      return 1; // Default price
    }
  }

  private async calculateROIMetrics(participation: any, currentPrice: number): Promise<ROIMetrics> {
    try {
      const rewardAmount = parseFloat(participation.rewardAmount.toString());
      const initialInvestment = this.estimateInitialInvestment(participation);
      
      // Calculate current value
      const currentValue = rewardAmount * currentPrice;
      
      // Calculate returns
      const totalReturn = currentValue - initialInvestment;
      const roiPercentage = initialInvestment > 0 ? (totalReturn / initialInvestment) * 100 : 0;
      
      // Calculate holding period
      const completedAt = participation.completedAt || participation.createdAt;
      const holdingPeriod = Math.floor((Date.now() - new Date(completedAt).getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate annualized ROI
      const annualizedROI = holdingPeriod > 0 ? (Math.pow(1 + (roiPercentage / 100), 365 / holdingPeriod) - 1) * 100 : 0;
      
      // Simulate historical data for advanced metrics
      const historicalData = this.simulateHistoricalData(rewardAmount, completedAt, currentPrice);
      const peakValue = Math.max(...historicalData.map(d => d.value));
      const lowestValue = Math.min(...historicalData.map(d => d.value));
      const volatility = this.calculateVolatility(historicalData);
      const maxDrawdown = this.calculateMaxDrawdown(historicalData);
      const sharpeRatio = this.calculateSharpeRatio(historicalData);
      const riskAdjustedROI = roiPercentage - (volatility * 2); // Simple risk adjustment

      const metrics: ROIMetrics = {
        airdropId: participation.airdropId,
        walletAddress: participation.walletAddress,
        initialInvestment,
        currentValue,
        totalReturn,
        roiPercentage,
        holdingPeriod,
        annualizedROI,
        riskAdjustedROI,
        peakValue,
        lowestValue,
        volatility,
        sharpeRatio,
        maxDrawdown,
        currentStatus: participation.rewardClaimed ? 'holding' : 'sold',
        lastUpdated: new Date(),
        metadata: {
          rewardAmount,
          currentPrice,
          historicalDataPoints: historicalData.length,
          tokenSymbol: participation.airdrop.token?.symbol || 'TOKEN',
          projectName: participation.airdrop.project.name
        }
      };

      return metrics;
    } catch (error) {
      logger.error('Failed to calculate ROI metrics:', error);
      throw error;
    }
  }

  private estimateInitialInvestment(participation: any): number {
    try {
      // Estimate gas fees and other costs
      const blockchain = participation.airdrop.project.blockchain;
      const gasEstimates: Record<string, number> = {
        'ethereum': 50, // $50 average gas cost
        'polygon': 5,
        'bsc': 10,
        'arbitrum': 15,
        'optimism': 15,
        'avalanche': 8,
        'fantom': 3,
        'solana': 2
      };

      const gasCost = gasEstimates[blockchain] || 20;
      
      // Add other potential costs (KYC, transactions, etc.)
      const otherCosts = participation.airdrop.kycRequired ? 10 : 0;
      const transactionCosts = participation.airdrop.gasRequired ? gasCost : 0;

      return gasCost + otherCosts + transactionCosts;
    } catch (error) {
      logger.error('Failed to estimate initial investment:', error);
      return 25; // Default estimate
    }
  }

  private simulateHistoricalData(rewardAmount: number, startDate: string | Date, currentPrice: number): any[] {
    try {
      const dataPoints = [];
      const days = Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const dataPointCount = Math.min(days, 90); // Max 90 days of data

      for (let i = 0; i < dataPointCount; i++) {
        const date = new Date(new Date(startDate).getTime() + (i * 24 * 60 * 60 * 1000));
        
        // Simulate price movement with some volatility
        const randomFactor = (Math.random() - 0.5) * 0.4; // ±20% variation
        const trendFactor = i / dataPointCount; // Gradual trend toward current price
        const price = currentPrice * (1 + randomFactor * (1 - trendFactor) + (trendFactor - 0.5) * 0.2);
        
        dataPoints.push({
          date: date.toISOString(),
          price: Math.max(0.01, price),
          value: rewardAmount * Math.max(0.01, price)
        });
      }

      return dataPoints;
    } catch (error) {
      logger.error('Failed to simulate historical data:', error);
      return [];
    }
  }

  private calculateVolatility(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      const previousValue = historicalData[i - 1].value;
      const currentValue = historicalData[i].value;
      if (previousValue > 0) {
        returns.push((currentValue - previousValue) / previousValue);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance) * 100; // Convert to percentage
  }

  private calculateMaxDrawdown(historicalData: any[]): number {
    if (historicalData.length === 0) return 0;

    let peak = historicalData[0].value;
    let maxDrawdown = 0;

    for (const dataPoint of historicalData) {
      if (dataPoint.value > peak) {
        peak = dataPoint.value;
      }
      
      const drawdown = ((peak - dataPoint.value) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateSharpeRatio(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < historicalData.length; i++) {
      const previousValue = historicalData[i - 1].value;
      const currentValue = historicalData[i].value;
      if (previousValue > 0) {
        returns.push((currentValue - previousValue) / previousValue);
      }
    }

    if (returns.length === 0) return 0;

    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateVolatility(historicalData) / 100;
    
    // Assuming 2% risk-free rate annually
    const riskFreeRate = 0.02 / 365;
    
    return volatility > 0 ? (meanReturn - riskFreeRate) / volatility : 0;
  }

  private async storeROIMetrics(metrics: ROIMetrics): Promise<void> {
    try {
      // Store in metadata for now (could be moved to dedicated table)
      await db.userAirdropParticipation.updateMany({
        where: {
          airdropId: metrics.airdropId,
          walletAddress: metrics.walletAddress
        },
        data: {
          metadata: {
            roiMetrics: metrics,
            lastUpdated: new Date().toISOString()
          }
        }
      });

      logger.info(`Stored ROI metrics for ${metrics.walletAddress} in airdrop ${metrics.airdropId}`);
    } catch (error) {
      logger.error('Failed to store ROI metrics:', error);
    }
  }

  private createEmptyPortfolio(walletAddress: string): PortfolioROI {
    return {
      walletAddress,
      totalInvestment: 0,
      currentValue: 0,
      totalReturn: 0,
      roiPercentage: 0,
      annualizedROI: 0,
      winRate: 0,
      averageHoldingPeriod: 0,
      bestPerformer: '',
      worstPerformer: '',
      diversificationScore: 0,
      riskScore: 0,
      recommendations: ['Start participating in airdrops to track ROI']
    };
  }

  private aggregatePortfolioMetrics(walletAddress: string, roiMetrics: ROIMetrics[]): PortfolioROI {
    const totalInvestment = roiMetrics.reduce((sum, m) => sum + m.initialInvestment, 0);
    const currentValue = roiMetrics.reduce((sum, m) => sum + m.currentValue, 0);
    const totalReturn = currentValue - totalInvestment;
    const roiPercentage = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

    // Calculate average holding period
    const averageHoldingPeriod = roiMetrics.length > 0 
      ? roiMetrics.reduce((sum, m) => sum + m.holdingPeriod, 0) / roiMetrics.length 
      : 0;

    // Calculate annualized ROI
    const annualizedROI = averageHoldingPeriod > 0 
      ? (Math.pow(1 + (roiPercentage / 100), 365 / averageHoldingPeriod) - 1) * 100 
      : 0;

    // Calculate win rate
    const profitableAirdrops = roiMetrics.filter(m => m.roiPercentage > 0).length;
    const winRate = roiMetrics.length > 0 ? (profitableAirdrops / roiMetrics.length) * 100 : 0;

    // Find best and worst performers
    const sortedByROI = [...roiMetrics].sort((a, b) => b.roiPercentage - a.roiPercentage);
    const bestPerformer = sortedByROI[0]?.airdropId || '';
    const worstPerformer = sortedByROI[sortedByROI.length - 1]?.airdropId || '';

    // Calculate diversification score
    const categories = new Set(roiMetrics.map(m => m.metadata?.projectName).filter(Boolean));
    const diversificationScore = Math.min(100, categories.size * 20);

    // Calculate risk score
    const avgVolatility = roiMetrics.length > 0 
      ? roiMetrics.reduce((sum, m) => sum + m.volatility, 0) / roiMetrics.length 
      : 0;
    const riskScore = Math.min(100, avgVolatility);

    return {
      walletAddress,
      totalInvestment,
      currentValue,
      totalReturn,
      roiPercentage,
      annualizedROI,
      winRate,
      averageHoldingPeriod,
      bestPerformer,
      worstPerformer,
      diversificationScore,
      riskScore,
      recommendations: [] // Will be filled separately
    };
  }

  private async generatePortfolioRecommendations(portfolio: PortfolioROI, roiMetrics: ROIMetrics[]): Promise<string[]> {
    try {
      const recommendations: string[] = [];

      // Performance-based recommendations
      if (portfolio.roiPercentage < 0) {
        recommendations.push('Consider reviewing your airdrop selection strategy - current portfolio is underperforming');
      } else if (portfolio.roiPercentage > 100) {
        recommendations.push('Excellent performance! Consider taking some profits on high performers');
      }

      // Diversification recommendations
      if (portfolio.diversificationScore < 40) {
        recommendations.push('Increase diversification by participating in airdrops from different project categories');
      }

      // Risk-based recommendations
      if (portfolio.riskScore > 70) {
        recommendations.push('High portfolio volatility detected - consider more stable projects');
      } else if (portfolio.riskScore < 20) {
        recommendations.push('Low risk portfolio - consider adding higher potential opportunities');
      }

      // Holding period recommendations
      if (portfolio.averageHoldingPeriod < 7) {
        recommendations.push('Very short holding periods - consider longer-term strategies for better returns');
      } else if (portfolio.averageHoldingPeriod > 180) {
        recommendations.push('Long holding periods - review underperforming assets for potential rebalancing');
      }

      // Win rate recommendations
      if (portfolio.winRate < 30) {
        recommendations.push('Low success rate - focus on higher quality projects with better fundamentals');
      }

      // Specific airdrop recommendations
      const worstPerformer = roiMetrics.find(m => m.airdropId === portfolio.worstPerformer);
      if (worstPerformer && worstPerformer.roiPercentage < -50) {
        recommendations.push(`Consider cutting losses on ${worstPerformer.metadata?.projectName || 'underperforming asset'}`);
      }

      return recommendations.slice(0, 5); // Limit to 5 recommendations
    } catch (error) {
      logger.error('Failed to generate portfolio recommendations:', error);
      return ['Unable to generate recommendations due to analysis error'];
    }
  }

  private async analyzeROIFactors(airdrop: any): Promise<ROIFactor[]> {
    const factors: ROIFactor[] = [];

    // Market factors
    factors.push(await this.analyzeMarketROIFactors(airdrop));
    
    // Project factors
    factors.push(await this.analyzeProjectROIFactors(airdrop));
    
    // Tokenomics factors
    factors.push(await this.analyzeTokenomicsROIFactors(airdrop));
    
    // Timing factors
    factors.push(await this.analyzeTimingROIFactors(airdrop));
    
    // Competition factors
    factors.push(await this.analyzeCompetitionROIFactors(airdrop));

    return factors;
  }

  private async generateROIScenarios(airdrop: any, factors: ROIFactor[], timeframe: number): Promise<ROIScenario[]> {
    const scenarios: ROIScenario[] = [];

    // Bull market scenario
    scenarios.push({
      name: 'Bull Market',
      probability: 0.25,
      projectedROI: 150,
      conditions: ['Favorable market conditions', 'High investor sentiment', 'Increased adoption'],
      timeframe
    });

    // Base case scenario
    scenarios.push({
      name: 'Base Case',
      probability: 0.50,
      projectedROI: 50,
      conditions: ['Current market conditions continue', 'Moderate growth', 'Stable adoption'],
      timeframe
    });

    // Bear market scenario
    scenarios.push({
      name: 'Bear Market',
      probability: 0.25,
      projectedROI: -25,
      conditions: ['Unfavorable market conditions', 'Low investor sentiment', 'Reduced adoption'],
      timeframe
    });

    return scenarios;
  }

  private calculateBaseROIPrediction(factors: ROIFactor[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    for (const factor of factors) {
      weightedSum += factor.impact * factor.weight;
      totalWeight += factor.weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 50;
  }

  private applyScenarioAdjustments(basePrediction: number, scenarios: ROIScenario[]): number {
    let weightedROI = 0;

    for (const scenario of scenarios) {
      weightedROI += scenario.projectedROI * scenario.probability;
    }

    return weightedROI;
  }

  private calculatePredictionConfidence(factors: ROIFactor[], scenarios: ROIScenario[]): number {
    // Confidence based on factor agreement and scenario spread
    const factorAgreement = this.calculateFactorAgreement(factors);
    const scenarioSpread = this.calculateScenarioSpread(scenarios);
    
    return (factorAgreement * 0.6) + ((100 - scenarioSpread) * 0.4);
  }

  private determineRiskLevel(factors: ROIFactor[], scenarios: ROIScenario[]): 'low' | 'medium' | 'high' {
    const avgImpact = factors.reduce((sum, f) => sum + Math.abs(f.impact), 0) / factors.length;
    const scenarioRange = Math.max(...scenarios.map(s => s.projectedROI)) - Math.min(...scenarios.map(s => s.projectedROI));
    
    if (avgImpact > 50 || scenarioRange > 200) return 'high';
    if (avgImpact > 25 || scenarioRange > 100) return 'medium';
    return 'low';
  }

  private generateAssumptions(factors: ROIFactor[]): string[] {
    return [
      'Market conditions remain stable',
      'Project development continues as planned',
      'No major regulatory changes',
      'Tokenomics remain unchanged',
      'Competition levels stay constant'
    ];
  }

  // Helper methods for factor analysis
  private async analyzeMarketROIFactors(airdrop: any): Promise<ROIFactor> {
    const marketSentiment = Math.random() * 100;
    const competition = Math.random() * 100;
    const impact = (marketSentiment - competition) * 0.5;

    return {
      name: 'Market Conditions',
      category: 'market',
      weight: 0.3,
      impact,
      currentValue: { sentiment: marketSentiment, competition },
      projectedValue: { sentiment: marketSentiment + 10, competition: competition - 5 },
      reasoning: `Market sentiment (${marketSentiment.toFixed(1)}) and competition level (${competition.toFixed(1)})`
    };
  }

  private async analyzeProjectROIFactors(airdrop: any): Promise<ROIFactor> {
    const projectQuality = Math.random() * 100;
    const teamStrength = Math.random() * 100;
    const impact = (projectQuality + teamStrength) * 0.25;

    return {
      name: 'Project Fundamentals',
      category: 'project',
      weight: 0.25,
      impact,
      currentValue: { quality: projectQuality, team: teamStrength },
      projectedValue: { quality: projectQuality + 5, team: teamStrength + 5 },
      reasoning: `Project quality (${projectQuality.toFixed(1)}) and team strength (${teamStrength.toFixed(1)})`
    };
  }

  private async analyzeTokenomicsROIFactors(airdrop: any): Promise<ROIFactor> {
    const supplyDistribution = Math.random() * 100;
    const utility = Math.random() * 100;
    const impact = (supplyDistribution + utility) * 0.3;

    return {
      name: 'Tokenomics',
      category: 'tokenomics',
      weight: 0.2,
      impact,
      currentValue: { distribution: supplyDistribution, utility },
      projectedValue: { distribution: supplyDistribution, utility: utility + 10 },
      reasoning: `Token distribution (${supplyDistribution.toFixed(1)}) and utility (${utility.toFixed(1)})`
    };
  }

  private async analyzeTimingROIFactors(airdrop: any): Promise<ROIFactor> {
    const marketCycle = Math.random() * 100;
    const seasonality = Math.random() * 100;
    const impact = (marketCycle + seasonality) * 0.2;

    return {
      name: 'Timing',
      category: 'timing',
      weight: 0.15,
      impact,
      currentValue: { cycle: marketCycle, seasonality },
      projectedValue: { cycle: marketCycle + 10, seasonality: seasonality + 5 },
      reasoning: `Market cycle (${marketCycle.toFixed(1)}) and seasonality (${seasonality.toFixed(1)})`
    };
  }

  private async analyzeCompetitionROIFactors(airdrop: any): Promise<ROIFactor> {
    const competitiveAdvantage = Math.random() * 100;
    const marketShare = Math.random() * 100;
    const impact = (competitiveAdvantage + marketShare) * 0.2;

    return {
      name: 'Competition',
      category: 'competition',
      weight: 0.1,
      impact,
      currentValue: { advantage: competitiveAdvantage, marketShare },
      projectedValue: { advantage: competitiveAdvantage + 5, marketShare: marketShare + 3 },
      reasoning: `Competitive advantage (${competitiveAdvantage.toFixed(1)}) and market share (${marketShare.toFixed(1)})`
    };
  }

  private calculateFactorAgreement(factors: ROIFactor[]): number {
    if (factors.length === 0) return 50;

    const positiveFactors = factors.filter(f => f.impact > 0).length;
    const agreement = Math.abs(positiveFactors - factors.length / 2) / (factors.length / 2);
    
    return agreement * 100;
  }

  private calculateScenarioSpread(scenarios: ROIScenario[]): number {
    const rois = scenarios.map(s => s.projectedROI);
    return Math.max(...rois) - Math.min(...rois);
  }

  async getTopPerformingAirdrops(limit = 20): Promise<any[]> {
    try {
      // This would query from a dedicated ROI metrics table
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get top performing airdrops:', error);
      return [];
    }
  }

  async getROIHistory(walletAddress: string, airdropId?: string): Promise<any[]> {
    try {
      // This would return historical ROI data
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Failed to get ROI history:', error);
      return [];
    }
  }

  async updateROIForAllUsers(): Promise<void> {
    try {
      logger.info('Starting ROI update for all users');

      // Get all users with reward participations
      const users = await db.userAirdropParticipation.findMany({
        where: {
          rewardAmount: {
            not: null
          }
        },
        select: {
          walletAddress: true
        },
        distinct: ['walletAddress']
      });

      for (const user of users) {
        try {
          await this.calculatePortfolioROI(user.walletAddress);
        } catch (error) {
          logger.error(`Failed to update ROI for user ${user.walletAddress}:`, error);
        }
      }

      logger.info(`ROI update completed for ${users.length} users`);
    } catch (error) {
      logger.error('Failed to update ROI for all users:', error);
    }
  }
}

export const roiTracker = new ROITracker();