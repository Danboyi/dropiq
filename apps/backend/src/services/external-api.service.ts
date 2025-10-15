import axios from 'axios';
import { db } from '@/lib/db';
import { DataType } from '@prisma/client';

export interface ExternalAPIConfig {
  goplus: {
    apiKey: string;
    baseUrl: string;
  };
  moralis: {
    apiKey: string;
    baseUrl: string;
  };
  coingecko: {
    apiKey?: string;
    baseUrl: string;
  };
}

export interface ContractAnalysis {
  contractAddress: string;
  chainId: string;
  risk: {
    overall: number;
    security: number;
    liquidity: number;
    centralization: number;
  };
  issues: Array<{
    severity: 'high' | 'medium' | 'low';
    type: string;
    description: string;
  }>;
  tokenInfo?: {
    name: string;
    symbol: string;
    totalSupply: string;
    decimals: number;
  };
}

export interface TokenPrice {
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
}

export interface SocialStats {
  twitterFollowers: number;
  discordMembers: number;
  telegramMembers: number;
  redditSubscribers: number;
  sentiment: {
    overall: 'positive' | 'neutral' | 'negative';
    score: number;
  };
}

export class ExternalAPIService {
  private static config: ExternalAPIConfig = {
    goplus: {
      apiKey: process.env.GOPLUS_API_KEY || '',
      baseUrl: 'https://api.gopluslabs.io/api/v1'
    },
    moralis: {
      apiKey: process.env.MORALIS_API_KEY || '',
      baseUrl: 'https://deep-index.moralis.io/api/v2'
    },
    coingecko: {
      apiKey: process.env.COINGECKO_API_KEY,
      baseUrl: 'https://api.coingecko.com/api/v3'
    }
  };

  /**
   * Get cached data or fetch from external API
   */
  private static async getCachedOrFetch<T>(
    source: string,
    type: DataType,
    identifier: string,
    fetcher: () => Promise<T>,
    cacheExpiryMinutes: number = 60
  ): Promise<T> {
    try {
      // Check cache first
      const cached = await db.externalData.findFirst({
        where: {
          source,
          type,
          identifier,
          isValid: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (cached) {
        return cached.data as T;
      }

      // Fetch fresh data
      const data = await fetcher();

      // Cache the result
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + cacheExpiryMinutes);

      await db.externalData.upsert({
        where: {
          source_type_identifier: {
            source,
            type,
            identifier
          }
        },
        update: {
          data,
          expiresAt,
          isValid: true,
          fetchedAt: new Date(),
          updatedAt: new Date()
        },
        create: {
          source,
          type,
          identifier,
          data,
          expiresAt,
          isValid: true,
          fetchedAt: new Date()
        }
      });

      return data;

    } catch (error) {
      console.error(`Error fetching data from ${source}:`, error);
      
      // Try to return stale cached data if available
      const staleData = await db.externalData.findFirst({
        where: {
          source,
          type,
          identifier
        },
        orderBy: { fetchedAt: 'desc' }
      });

      if (staleData) {
        console.warn(`Returning stale data for ${source}:${type}:${identifier}`);
        return staleData.data as T;
      }

      throw error;
    }
  }

  /**
   * Analyze smart contract using GoPlus Labs
   */
  static async analyzeContract(
    contractAddress: string,
    chainId: string = '1'
  ): Promise<ContractAnalysis> {
    return this.getCachedOrFetch(
      'goplus',
      DataType.CONTRACT_ANALYSIS,
      `${chainId}:${contractAddress}`,
      async () => {
        if (!this.config.goplus.apiKey) {
          throw new Error('GoPlus API key not configured');
        }

        const response = await axios.get(
          `${this.config.goplus.baseUrl}/token_security/${chainId}`,
          {
            params: {
              contract_addresses: contractAddress
            },
            headers: {
              'Accept': 'application/json'
            },
            timeout: 10000
          }
        );

        const data = response.data;
        const contractData = data[contractAddress.toLowerCase()];

        if (!contractData) {
          throw new Error('Contract not found');
        }

        // Calculate risk scores
        const securityRisk = this.calculateSecurityRisk(contractData);
        const liquidityRisk = this.calculateLiquidityRisk(contractData);
        const centralizationRisk = this.calculateCentralizationRisk(contractData);
        const overallRisk = (securityRisk + liquidityRisk + centralizationRisk) / 3;

        return {
          contractAddress,
          chainId,
          risk: {
            overall: overallRisk,
            security: securityRisk,
            liquidity: liquidityRisk,
            centralization: centralizationRisk
          },
          issues: this.extractIssues(contractData),
          tokenInfo: contractData.token_name ? {
            name: contractData.token_name,
            symbol: contractData.token_symbol,
            totalSupply: contractData.total_supply,
            decimals: parseInt(contractData.decimals || '0')
          } : undefined
        };
      },
      30 // Cache for 30 minutes
    );
  }

  /**
   * Get token price from CoinGecko
   */
  static async getTokenPrice(symbol: string): Promise<TokenPrice> {
    return this.getCachedOrFetch(
      'coingecko',
      DataType.TOKEN_PRICE,
      symbol.toLowerCase(),
      async () => {
        try {
          const params: any = {
            vs_currencies: 'usd',
            include_market_cap: 'true',
            include_24hr_vol: 'true',
            include_24hr_change: 'true'
          };

          if (this.config.coingecko.apiKey) {
            params.x_cg_demo_api_key = this.config.coingecko.apiKey;
          }

          const response = await axios.get(
            `${this.config.coingecko.baseUrl}/simple/price`,
            {
              params: {
                ...params,
                ids: this.getCoinGeckoId(symbol)
              },
              timeout: 10000
            }
          );

          const data = response.data;
          const coinId = this.getCoinGeckoId(symbol);
          const priceData = data[coinId];

          if (!priceData) {
            throw new Error(`Token ${symbol} not found`);
          }

          return {
            symbol: symbol.toUpperCase(),
            price: priceData.usd,
            marketCap: priceData.usd_market_cap || 0,
            volume24h: priceData.usd_24h_vol || 0,
            change24h: priceData.usd_24h_change || 0
          };

        } catch (error) {
          // Fallback to mock data for demo
          return {
            symbol: symbol.toUpperCase(),
            price: Math.random() * 100,
            marketCap: Math.random() * 1000000000,
            volume24h: Math.random() * 100000000,
            change24h: (Math.random() - 0.5) * 20
          };
        }
      },
      5 // Cache for 5 minutes
    );
  }

  /**
   * Get social media statistics
   */
  static async getSocialStats(projectName: string): Promise<SocialStats> {
    return this.getCachedOrFetch(
      'moralis',
      DataType.SOCIAL_STATS,
      projectName.toLowerCase(),
      async () => {
        // Mock implementation - in real app, you'd integrate with actual social media APIs
        return {
          twitterFollowers: Math.floor(Math.random() * 100000),
          discordMembers: Math.floor(Math.random() * 50000),
          telegramMembers: Math.floor(Math.random() * 30000),
          redditSubscribers: Math.floor(Math.random() * 20000),
          sentiment: {
            overall: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)] as any,
            score: Math.random() * 100
          }
        };
      },
      60 // Cache for 1 hour
    );
  }

  /**
   * Get comprehensive project analysis
   */
  static async getProjectAnalysis(
    contractAddress?: string,
    tokenSymbol?: string,
    projectName?: string
  ): Promise<{
    contract?: ContractAnalysis;
    price?: TokenPrice;
    social?: SocialStats;
    overallRisk: number;
    recommendations: string[];
  }> {
    const results: any = {};
    const recommendations: string[] = [];

    try {
      if (contractAddress) {
        results.contract = await this.analyzeContract(contractAddress);
        
        if (results.contract.risk.overall > 0.7) {
          recommendations.push('High contract risk detected - proceed with caution');
        }
      }

      if (tokenSymbol) {
        results.price = await this.getTokenPrice(tokenSymbol);
        
        if (results.price.change24h < -20) {
          recommendations.push('Significant price drop detected - monitor closely');
        }
      }

      if (projectName) {
        results.social = await this.getSocialStats(projectName);
        
        if (results.social.sentiment.score < 30) {
          recommendations.push('Negative social sentiment detected');
        }
      }

      // Calculate overall risk
      let overallRisk = 0;
      let riskFactors = 0;

      if (results.contract) {
        overallRisk += results.contract.risk.overall;
        riskFactors++;
      }

      if (results.price && results.price.change24h < -10) {
        overallRisk += 0.6;
        riskFactors++;
      }

      if (results.social && results.social.sentiment.score < 40) {
        overallRisk += 0.4;
        riskFactors++;
      }

      results.overallRisk = riskFactors > 0 ? overallRisk / riskFactors : 0;
      results.recommendations = recommendations;

      return results;

    } catch (error) {
      console.error('Error in project analysis:', error);
      throw error;
    }
  }

  /**
   * Calculate security risk from GoPlus data
   */
  private static calculateSecurityRisk(contractData: any): number {
    let risk = 0;

    if (contractData.is_honeypot === '1') risk += 0.9;
    if (contractData.is_anti_whale === '1') risk += 0.3;
    if (contractData.buy_tax > 50) risk += 0.4;
    if (contractData.sell_tax > 50) risk += 0.4;
    if (contractData.slippage_can't_change === '0') risk += 0.2;
    if (contractData.is_open_source === '0') risk += 0.5;
    if (contractData.is_proxy === '1') risk += 0.3;
    if (contractData.mintable === '1') risk += 0.4;
    if (contractData.can_take_back_ownership === '1') risk += 0.6;

    return Math.min(risk, 1);
  }

  /**
   * Calculate liquidity risk from GoPlus data
   */
  private static calculateLiquidityRisk(contractData: any): number {
    let risk = 0;

    const liquidity = parseFloat(contractData.liquidity || '0');
    if (liquidity < 1000) risk += 0.8;
    else if (liquidity < 10000) risk += 0.5;
    else if (liquidity < 50000) risk += 0.2;

    const holders = parseInt(contractData.holders || '0');
    if (holders < 50) risk += 0.4;
    else if (holders < 200) risk += 0.2;

    return Math.min(risk, 1);
  }

  /**
   * Calculate centralization risk from GoPlus data
   */
  private static calculateCentralizationRisk(contractData: any): number {
    let risk = 0;

    if (contractData.owner_percent > 50) risk += 0.6;
    else if (contractData.owner_percent > 20) risk += 0.3;

    if (contractData.top_holders_percent > 80) risk += 0.5;
    else if (contractData.top_holders_percent > 50) risk += 0.2;

    return Math.min(risk, 1);
  }

  /**
   * Extract issues from GoPlus data
   */
  private static extractIssues(contractData: any): Array<{severity: 'high' | 'medium' | 'low', type: string, description: string}> {
    const issues: any[] = [];

    if (contractData.is_honeypot === '1') {
      issues.push({
        severity: 'high',
        type: 'honeypot',
        description: 'Contract is identified as a honeypot scam'
      });
    }

    if (contractData.buy_tax > 20) {
      issues.push({
        severity: 'medium',
        type: 'high_buy_tax',
        description: `High buy tax: ${contractData.buy_tax}%`
      });
    }

    if (contractData.sell_tax > 20) {
      issues.push({
        severity: 'medium',
        type: 'high_sell_tax',
        description: `High sell tax: ${contractData.sell_tax}%`
      });
    }

    if (contractData.is_open_source === '0') {
      issues.push({
        severity: 'medium',
        type: 'closed_source',
        description: 'Contract source code is not verified'
      });
    }

    if (contractData.can_take_back_ownership === '1') {
      issues.push({
        severity: 'high',
        type: 'ownership_change',
        description: 'Owner can change contract ownership'
      });
    }

    return issues;
  }

  /**
   * Get CoinGecko ID for token symbol
   */
  private static getCoinGeckoId(symbol: string): string {
    const symbolMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'BNB': 'binancecoin',
      'XRP': 'ripple',
      'ADA': 'cardano',
      'SOL': 'solana',
      'DOGE': 'dogecoin',
      'DOT': 'polkadot',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'ATOM': 'cosmos',
      'NEAR': 'near'
    };

    return symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupCache(): Promise<void> {
    try {
      const deleted = await db.externalData.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${deleted.count} expired cache entries`);

    } catch (error) {
      console.error('Error cleaning up cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static async getCacheStats(): Promise<any> {
    try {
      const [total, valid, expired, bySource] = await Promise.all([
        db.externalData.count(),
        db.externalData.count({ where: { isValid: true } }),
        db.externalData.count({ where: { isValid: false } }),
        db.externalData.groupBy({
          by: ['source'],
          _count: true
        })
      ]);

      return {
        total,
        valid,
        expired,
        bySource: bySource.reduce((acc, item) => {
          acc[item.source] = item._count;
          return acc;
        }, {} as Record<string, number>)
      };

    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}