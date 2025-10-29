import { db } from '@/lib/db';
import { mlInfrastructure } from './infrastructure';

// On-Chain Analysis Service
export class OnChainAnalyzer {
  private static instance: OnChainAnalyzer;

  private constructor() {}

  static getInstance(): OnChainAnalyzer {
    if (!OnChainAnalyzer.instance) {
      OnChainAnalyzer.instance = new OnChainAnalyzer();
    }
    return OnChainAnalyzer.instance;
  }

  // Analyze user's on-chain history for airdrop recommendations
  async analyzeOnChainHistory(userId: string, walletAddress: string): Promise<any> {
    try {
      // Get user's transaction history (mock implementation)
      const transactionHistory = await this.getTransactionHistory(walletAddress);
      
      // Analyze patterns
      const patterns = await this.analyzeTransactionPatterns(transactionHistory);
      
      // Get protocol interactions
      const protocolInteractions = await this.analyzeProtocolInteractions(transactionHistory);
      
      // Calculate DeFi score
      const defiScore = this.calculateDeFiScore(transactionHistory, protocolInteractions);
      
      // Analyze gas spending patterns
      const gasPatterns = this.analyzeGasSpending(transactionHistory);
      
      // Identify preferred chains
      const chainPreferences = this.analyzeChainPreferences(transactionHistory);
      
      // Calculate risk profile from on-chain data
      const onChainRiskProfile = this.calculateOnChainRiskProfile(transactionHistory, patterns);
      
      return {
        transactionHistory: transactionHistory.slice(0, 50), // Last 50 transactions
        patterns,
        protocolInteractions,
        defiScore,
        gasPatterns,
        chainPreferences,
        onChainRiskProfile,
        walletAge: this.calculateWalletAge(transactionHistory),
        totalTransactions: transactionHistory.length,
        uniqueProtocols: protocolInteractions.length,
        analysisTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to analyze on-chain history:', error);
      return this.getFallbackOnChainAnalysis();
    }
  }

  // Generate enhanced airdrop recommendations based on on-chain data
  async generateEnhancedRecommendations(userId: string, onChainData: any): Promise<any> {
    try {
      // Get user preferences
      const userPreferences = await this.getUserPreferences(userId);
      
      // Get all available airdrops
      const availableAirdrops = await db.airdrop.findMany({
        where: {
          status: 'VETTED',
          endDate: { gt: new Date() },
        },
        orderBy: [
          { hypeScore: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      // Score each airdrop based on user's on-chain profile
      const scoredAirdrops = await Promise.all(
        availableAirdrops.map(async (airdrop) => {
          const score = await this.calculateAirdropScore(airdrop, onChainData, userPreferences);
          return { ...airdrop, recommendationScore: score };
        })
      );

      // Sort by recommendation score
      const recommendations = scoredAirdrops
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 20);

      // Categorize recommendations
      const categorized = this.categorizeRecommendations(recommendations, onChainData);

      return {
        recommendations: categorized.highPriority,
        secondaryRecommendations: categorized.mediumPriority,
        exploratoryRecommendations: categorized.lowPriority,
        insights: this.generateInsights(onChainData, userPreferences),
        confidence: this.calculateRecommendationConfidence(onChainData),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to generate enhanced recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  // Private helper methods
  private async getTransactionHistory(walletAddress: string): Promise<any[]> {
    // Mock implementation - in real app, this would query blockchain data
    // Using Web3 providers like Alchemy, Infura, or The Graph
    
    const mockTransactions = [
      {
        hash: '0x123...',
        blockNumber: 18500000,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        from: walletAddress,
        to: '0xabc...', // Uniswap V3 Router
        value: '100000000000000000', // 0.1 ETH
        gasUsed: '150000',
        gasPrice: '20000000000', // 20 gwei
        chainId: 1, // Ethereum
        protocol: 'uniswap',
        category: 'dex',
      },
      {
        hash: '0x456...',
        blockNumber: 18501000,
        timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
        from: walletAddress,
        to: '0xdef...', // Aave V3 Pool
        value: '500000000000000000', // 0.5 ETH
        gasUsed: '200000',
        gasPrice: '25000000000', // 25 gwei
        chainId: 1,
        protocol: 'aave',
        category: 'lending',
      },
      {
        hash: '0x789...',
        blockNumber: 18502000,
        timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        from: walletAddress,
        to: '0xghi...', // Compound
        value: '300000000000000000', // 0.3 ETH
        gasUsed: '180000',
        gasPrice: '22000000000', // 22 gwei
        chainId: 1,
        protocol: 'compound',
        category: 'lending',
      },
      {
        hash: '0xabc...',
        blockNumber: 18503000,
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        from: walletAddress,
        to: '0xjkl...', // OpenSea
        value: '50000000000000000', // 0.05 ETH
        gasUsed: '250000',
        gasPrice: '30000000000', // 30 gwei
        chainId: 1,
        protocol: 'opensea',
        category: 'nft',
      },
      {
        hash: '0xdef...',
        blockNumber: 18504000,
        timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        from: walletAddress,
        to: '0xmno...', // Arbitrum Bridge
        value: '200000000000000000', // 0.2 ETH
        gasUsed: '300000',
        gasPrice: '18000000000', // 18 gwei
        chainId: 1,
        protocol: 'arbitrum',
        category: 'bridge',
      },
    ];

    return mockTransactions;
  }

  private async analyzeTransactionPatterns(transactions: any[]): Promise<any> {
    if (transactions.length === 0) return { frequency: 'low', consistency: 'low' };

    const now = Date.now();
    const timeSpan = now - new Date(transactions[transactions.length - 1].timestamp).getTime();
    const daysActive = timeSpan / (1000 * 60 * 60 * 24);
    
    const frequency = transactions.length / Math.max(daysActive, 1);
    
    // Analyze transaction timing patterns
    const hourlyDistribution = new Array(24).fill(0);
    transactions.forEach(tx => {
      const hour = new Date(tx.timestamp).getHours();
      hourlyDistribution[hour]++;
    });

    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    
    return {
      frequency: frequency > 1 ? 'high' : frequency > 0.5 ? 'medium' : 'low',
      consistency: this.calculateConsistency(transactions),
      averageDailyTransactions: frequency,
      peakActivityHour: peakHour,
      timeSpanDays: Math.round(daysActive),
      totalTransactions: transactions.length,
    };
  }

  private async analyzeProtocolInteractions(transactions: any[]): Promise<any[]> {
    const protocols = new Map();
    
    transactions.forEach(tx => {
      if (tx.protocol) {
        if (!protocols.has(tx.protocol)) {
          protocols.set(tx.protocol, {
            name: tx.protocol,
            category: tx.category,
            interactions: 0,
            totalValue: 0,
            firstInteraction: tx.timestamp,
            lastInteraction: tx.timestamp,
          });
        }
        
        const protocol = protocols.get(tx.protocol);
        protocol.interactions++;
        protocol.totalValue += parseFloat(tx.value) / 1e18; // Convert from wei
        protocol.lastInteraction = tx.timestamp;
      }
    });

    return Array.from(protocols.values()).map(p => ({
      ...p,
      avgValuePerInteraction: p.totalValue / p.interactions,
      interactionFrequency: p.interactions / this.getDaysBetween(p.firstInteraction, p.lastInteraction),
    }));
  }

  private calculateDeFiScore(transactions: any[], protocolInteractions: any[]): number {
    let score = 0;
    
    // Base score for transaction activity
    score += Math.min(transactions.length * 2, 20);
    
    // Bonus for protocol diversity
    score += Math.min(protocolInteractions.length * 5, 25);
    
    // Bonus for different categories
    const categories = new Set(protocolInteractions.map(p => p.category));
    score += Math.min(categories.size * 8, 30);
    
    // Bonus for total value transacted
    const totalValue = protocolInteractions.reduce((sum, p) => sum + p.totalValue, 0);
    score += Math.min(totalValue * 10, 25);
    
    return Math.min(score, 100);
  }

  private analyzeGasSpending(transactions: any[]): any {
    const totalGasSpent = transactions.reduce((sum, tx) => {
      return sum + (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18;
    }, 0);

    const avgGasPerTransaction = totalGasSpent / transactions.length;
    
    // Analyze gas optimization
    const gasPrices = transactions.map(tx => parseFloat(tx.gasPrice));
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    
    return {
      totalGasSpent,
      avgGasPerTransaction,
      avgGasPrice: avgGasPrice / 1e9, // Convert to gwei
      gasOptimizationScore: this.calculateGasOptimizationScore(gasPrices),
      totalTransactions: transactions.length,
    };
  }

  private analyzeChainPreferences(transactions: any[]): any {
    const chainUsage = new Map();
    
    transactions.forEach(tx => {
      const chainId = tx.chainId || 1;
      chainUsage.set(chainId, (chainUsage.get(chainId) || 0) + 1);
    });

    const total = transactions.length;
    const preferences = Array.from(chainUsage.entries()).map(([chainId, count]) => ({
      chainId,
      usage: count,
      percentage: (count / total) * 100,
      name: this.getChainName(chainId),
    }));

    return {
      preferredChains: preferences.sort((a, b) => b.percentage - a.percentage),
      chainDiversity: chainUsage.size,
      mostUsedChain: preferences[0]?.name || 'Ethereum',
    };
  }

  private calculateOnChainRiskProfile(transactions: any[], patterns: any): any {
    let riskScore = 50; // Base risk score

    // Adjust based on transaction frequency
    if (patterns.frequency === 'high') riskScore += 10;
    else if (patterns.frequency === 'low') riskScore -= 10;

    // Adjust based on protocol diversity
    const uniqueProtocols = new Set(transactions.map(tx => tx.protocol)).size;
    if (uniqueProtocols > 5) riskScore += 15;
    else if (uniqueProtocols < 2) riskScore -= 15;

    // Adjust based on gas spending
    const totalGasSpent = transactions.reduce((sum, tx) => {
      return sum + (parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice)) / 1e18;
    }, 0);
    
    if (totalGasSpent > 1) riskScore += 10; // High gas spender
    else if (totalGasSpent < 0.1) riskScore -= 10; // Conservative

    return {
      riskScore: Math.max(0, Math.min(100, riskScore)),
      riskLevel: riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low',
      factors: {
        transactionFrequency: patterns.frequency,
        protocolDiversity: uniqueProtocols,
        gasSpending: totalGasSpent,
      },
    };
  }

  private async calculateAirdropScore(airdrop: any, onChainData: any, userPreferences: any): Promise<number> {
    let score = 0;

    // Category matching
    if (userPreferences.preferredCategories.includes(airdrop.category)) {
      score += 25;
    }

    // Chain matching
    if (onChainData.chainPreferences.preferredChains.some((chain: any) => chain.chainId === airdrop.chainId)) {
      score += 20;
    }

    // Protocol similarity
    if (onChainData.protocolInteractions.some((protocol: any) => protocol.category === airdrop.category)) {
      score += 15;
    }

    // Risk alignment
    const riskDiff = Math.abs(onChainData.onChainRiskProfile.riskScore - (airdrop.riskScore || 50));
    score += Math.max(0, 20 - riskDiff / 5);

    // DeFi experience bonus
    if (onChainData.defiScore > 60 && airdrop.category === 'defi') {
      score += 10;
    }

    // Gas optimization alignment
    if (userPreferences.gasOptimization && airdrop.gasEfficiency) {
      score += 10;
    }

    return score;
  }

  private categorizeRecommendations(recommendations: any[], onChainData: any): any {
    return {
      highPriority: recommendations.filter(r => r.recommendationScore > 70).slice(0, 5),
      mediumPriority: recommendations.filter(r => r.recommendationScore > 40 && r.recommendationScore <= 70).slice(0, 8),
      lowPriority: recommendations.filter(r => r.recommendationScore <= 40).slice(0, 7),
    };
  }

  private generateInsights(onChainData: any, userPreferences: any): string[] {
    const insights = [];

    if (onChainData.defiScore > 70) {
      insights.push("You have strong DeFi experience - consider complex protocol airdrops");
    }

    if (onChainData.chainPreferences.chainDiversity > 3) {
      insights.push("You're active across multiple chains - explore cross-chain opportunities");
    }

    if (onChainData.gasPatterns.gasOptimizationScore > 70) {
      insights.push("You're gas-efficient - consider time-sensitive airdrops");
    }

    if (onChainData.patterns.frequency === 'high') {
      insights.push("High transaction activity - you may qualify for volume-based airdrops");
    }

    return insights;
  }

  private calculateRecommendationConfidence(onChainData: any): number {
    let confidence = 50;

    if (onChainData.totalTransactions > 20) confidence += 20;
    if (onChainData.defiScore > 60) confidence += 15;
    if (onChainData.chainPreferences.chainDiversity > 2) confidence += 10;
    if (onChainData.walletAge > 30) confidence += 5;

    return Math.min(confidence, 100);
  }

  // Helper methods
  private calculateConsistency(transactions: any[]): string {
    if (transactions.length < 2) return 'low';
    
    const intervals = [];
    for (let i = 1; i < transactions.length; i++) {
      const interval = new Date(transactions[i-1].timestamp).getTime() - new Date(transactions[i].timestamp).getTime();
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    
    return variance < avgInterval * 0.5 ? 'high' : variance < avgInterval ? 'medium' : 'low';
  }

  private getDaysBetween(date1: string, date2: string): number {
    return Math.abs(new Date(date1).getTime() - new Date(date2).getTime()) / (1000 * 60 * 60 * 24);
  }

  private getChainName(chainId: number): string {
    const chains: { [key: number]: string } = {
      1: 'Ethereum',
      137: 'Polygon',
      42161: 'Arbitrum',
      10: 'Optimism',
      8453: 'Base',
      324: 'zkSync',
      59144: 'Linea',
      534352: 'Scroll',
    };
    return chains[chainId] || `Chain ${chainId}`;
  }

  private calculateGasOptimizationScore(gasPrices: number[]): number {
    if (gasPrices.length < 2) return 50;
    
    const avgGasPrice = gasPrices.reduce((sum, price) => sum + price, 0) / gasPrices.length;
    const minGasPrice = Math.min(...gasPrices);
    
    // Higher score for gas prices closer to minimum
    return Math.max(0, 100 - ((avgGasPrice - minGasPrice) / avgGasPrice) * 100);
  }

  private calculateWalletAge(transactions: any[]): number {
    if (transactions.length === 0) return 0;
    
    const oldestTx = transactions[transactions.length - 1];
    return Math.floor((Date.now() - new Date(oldestTx.timestamp).getTime()) / (1000 * 60 * 60 * 24));
  }

  private async getUserPreferences(userId: string): Promise<any> {
    try {
      const response = await fetch(`/api/user/preferences`, {
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.preferences || {};
      }
    } catch (error) {
      console.error('Failed to fetch user preferences:', error);
    }
    
    return {};
  }

  private getFallbackOnChainAnalysis(): any {
    return {
      transactionHistory: [],
      patterns: { frequency: 'low', consistency: 'low' },
      protocolInteractions: [],
      defiScore: 30,
      gasPatterns: { totalGasSpent: 0, avgGasPerTransaction: 0, gasOptimizationScore: 50 },
      chainPreferences: { preferredChains: [], chainDiversity: 0 },
      onChainRiskProfile: { riskScore: 50, riskLevel: 'medium' },
      walletAge: 0,
      totalTransactions: 0,
      uniqueProtocols: 0,
      analysisTimestamp: new Date().toISOString(),
    };
  }

  private getFallbackRecommendations(): any {
    return {
      recommendations: [],
      secondaryRecommendations: [],
      exploratoryRecommendations: [],
      insights: ["Complete more transactions to get personalized recommendations"],
      confidence: 30,
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const onChainAnalyzer = OnChainAnalyzer.getInstance();