import { Transaction, TokenBalance, AirdropEligibility } from '@/types/wallet';
import { getChainById } from './chains';

export interface TransactionAnalysis {
  totalTransactions: number;
  totalValueUSD: number;
  gasSpentUSD: number;
  uniqueContracts: string[];
  contractInteractions: Array<{
    address: string;
    name?: string;
    interactionCount: number;
    lastInteraction: Date;
  }>;
  tokenSwaps: number;
  nftMints: number;
  bridgeTransactions: number;
  stakingTransactions: number;
  governanceParticipation: boolean;
}

export interface BalanceAnalysis {
  totalValueUSD: number;
  tokenDistribution: Array<{
    symbol: string;
    valueUSD: number;
    percentage: number;
  }>;
  nftCount: number;
  stakedAmounts: Array<{
    token: string;
    amount: string;
    valueUSD: number;
  }>;
  liquidityPositions: Array<{
    protocol: string;
    pair: string;
    valueUSD: number;
  }>;
}

export interface AirdropRequirement {
  type: 'balance' | 'transaction' | 'contract_interaction' | 'snapshot' | 'holding';
  description: string;
  checkFunction: (address: string, analysis: TransactionAnalysis & BalanceAnalysis) => Promise<{
    isMet: boolean;
    currentValue?: string;
    requiredValue?: string;
  }>;
}

export class OnChainAnalyzer {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
    this.baseUrl = 'https://api.etherscan.io/api';
  }

  /**
   * Fetch transaction history from Etherscan-like APIs
   */
  async getTransactionHistory(address: string, chainId: number = 1): Promise<Transaction[]> {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const url = `${chain.blockExplorerUrl}/api?` +
      `module=account&action=txlist&address=${address}&sort=desc&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== '1') {
        throw new Error('Failed to fetch transactions');
      }

      return data.result.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        blockNumber: parseInt(tx.blockNumber),
        timestamp: parseInt(tx.timeStamp),
        status: tx.isError === '0' ? 'success' : 'failed',
        data: tx.input,
      }));
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  }

  /**
   * Get token balances for an address
   */
  async getTokenBalances(address: string, chainId: number = 1): Promise<TokenBalance[]> {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    // Get ERC-20 tokens
    const tokenUrl = `${chain.blockExplorerUrl}/api?` +
      `module=account&action=tokentx&address=${address}&sort=desc&apikey=${this.apiKey}`;

    try {
      const response = await fetch(tokenUrl);
      const data = await response.json();

      if (data.status !== '1') {
        return [];
      }

      // Group by token contract and get current balance
      const tokenMap = new Map<string, TokenBalance>();

      for (const tx of data.result) {
        const contractAddress = tx.contractAddress;
        
        if (!tokenMap.has(contractAddress)) {
          tokenMap.set(contractAddress, {
            address: contractAddress,
            symbol: tx.tokenSymbol,
            name: tx.tokenName,
            decimals: parseInt(tx.tokenDecimal),
            balance: '0',
          });
        }
      }

      // Get current balances for each token
      const balances: TokenBalance[] = [];
      for (const [address, token] of tokenMap) {
        const balance = await this.getTokenBalance(address, address, chainId);
        balances.push({
          ...token,
          balance,
        });
      }

      return balances.filter(token => parseFloat(token.balance) > 0);
    } catch (error) {
      console.error('Error fetching token balances:', error);
      return [];
    }
  }

  /**
   * Get balance for a specific token
   */
  private async getTokenBalance(
    tokenAddress: string, 
    walletAddress: string, 
    chainId: number
  ): Promise<string> {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const url = `${chain.blockExplorerUrl}/api?` +
      `module=account&action=tokenbalance&contractaddress=${tokenAddress}&address=${walletAddress}&tag=latest&apikey=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      return data.result || '0';
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return '0';
    }
  }

  /**
   * Analyze transaction patterns
   */
  async analyzeTransactions(transactions: Transaction[]): Promise<TransactionAnalysis> {
    const uniqueContracts = new Set<string>();
    const contractInteractions = new Map<string, { count: number; lastDate: Date }>();
    let totalValueUSD = 0;
    let gasSpentUSD = 0;
    let tokenSwaps = 0;
    let nftMints = 0;
    let bridgeTransactions = 0;
    let stakingTransactions = 0;

    // Known DEX and protocol addresses
    const dexAddresses = [
      '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Uniswap V2 Router
      '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 Router
    ];

    const nftMarketplaces = [
      '0x7Be8076f4EA4A4AD08075C2508e481d6C946D12b', // OpenSea
    ];

    const bridgeContracts = [
      '0xA0c68C638235ee32657Be84180A3e0799D41dd40', // Multichain
    ];

    for (const tx of transactions) {
      // Track contract interactions
      if (tx.to && tx.to !== '0x0000000000000000000000000000000000000000') {
        uniqueContracts.add(tx.to);
        
        const current = contractInteractions.get(tx.to) || { count: 0, lastDate: new Date(0) };
        contractInteractions.set(tx.to, {
          count: current.count + 1,
          lastDate: new Date(Math.max(current.lastDate.getTime(), tx.timestamp * 1000)),
        });
      }

      // Categorize transactions
      if (dexAddresses.includes(tx.to.toLowerCase())) {
        tokenSwaps++;
      }

      if (nftMarketplaces.includes(tx.to.toLowerCase()) || tx.data?.includes('0x80ac58cd')) {
        nftMints++;
      }

      if (bridgeContracts.includes(tx.to.toLowerCase())) {
        bridgeTransactions++;
      }

      // Calculate values (simplified - in production you'd use price APIs)
      const ethValue = parseFloat(tx.value) / 1e18;
      const gasUsed = parseFloat(tx.gasUsed) * parseFloat(tx.gasPrice) / 1e18;
      
      // Assume $2000/ETH for calculation (in production use real price feeds)
      totalValueUSD += ethValue * 2000;
      gasSpentUSD += gasUsed * 2000;
    }

    return {
      totalTransactions: transactions.length,
      totalValueUSD,
      gasSpentUSD,
      uniqueContracts: Array.from(uniqueContracts),
      contractInteractions: Array.from(contractInteractions.entries()).map(([address, data]) => ({
        address,
        interactionCount: data.count,
        lastInteraction: data.lastDate,
      })),
      tokenSwaps,
      nftMints,
      bridgeTransactions,
      stakingTransactions,
      governanceParticipation: this.checkGovernanceParticipation(transactions),
    };
  }

  /**
   * Analyze token and NFT holdings
   */
  async analyzeBalances(tokens: TokenBalance[]): Promise<BalanceAnalysis> {
    let totalValueUSD = 0;
    const tokenDistribution: Array<{ symbol: string; valueUSD: number; percentage: number }> = [];
    let nftCount = 0;

    for (const token of tokens) {
      if (token.isNFT) {
        nftCount++;
        continue;
      }

      // Simplified price calculation (in production use price APIs)
      const priceUSD = this.getTokenPrice(token.symbol);
      const valueUSD = (parseFloat(token.balance) / Math.pow(10, token.decimals)) * priceUSD;
      
      totalValueUSD += valueUSD;
      tokenDistribution.push({
        symbol: token.symbol,
        valueUSD,
        percentage: 0, // Will be calculated below
      });
    }

    // Calculate percentages
    tokenDistribution.forEach(token => {
      token.percentage = totalValueUSD > 0 ? (token.valueUSD / totalValueUSD) * 100 : 0;
    });

    return {
      totalValueUSD,
      tokenDistribution: tokenDistribution.sort((a, b) => b.valueUSD - a.valueUSD),
      nftCount,
      stakedAmounts: [], // Would need protocol-specific data
      liquidityPositions: [], // Would need protocol-specific data
    };
  }

  /**
   * Check airdrop eligibility for various projects
   */
  async checkAirdropEligibility(
    address: string,
    transactionAnalysis: TransactionAnalysis,
    balanceAnalysis: BalanceAnalysis
  ): Promise<AirdropEligibility[]> {
    const airdrops: AirdropEligibility[] = [];

    // Example: Arbitrum Airdrop
    airdrops.push(await this.checkArbitrumEligibility(address, transactionAnalysis, balanceAnalysis));

    // Example: Optimism Airdrop
    airdrops.push(await this.checkOptimismEligibility(address, transactionAnalysis, balanceAnalysis));

    // Example: LayerZero Airdrop
    airdrops.push(await this.checkLayerZeroEligibility(address, transactionAnalysis, balanceAnalysis));

    return airdrops;
  }

  private async checkArbitrumEligibility(
    address: string,
    txAnalysis: TransactionAnalysis,
    balanceAnalysis: BalanceAnalysis
  ): Promise<AirdropEligibility> {
    const requirements = [
      {
        type: 'transaction' as const,
        description: 'Used Arbitrum before the snapshot date',
        isMet: txAnalysis.bridgeTransactions > 0,
        currentValue: txAnalysis.bridgeTransactions.toString(),
        requiredValue: '1',
      },
      {
        type: 'balance' as const,
        description: 'Held at least 0.1 ETH on Arbitrum',
        isMet: balanceAnalysis.totalValueUSD > 200, // Assuming 0.1 ETH = $200
        currentValue: `$${balanceAnalysis.totalValueUSD.toFixed(2)}`,
        requiredValue: '$200',
      },
    ];

    const isEligible = requirements.every(req => req.isMet);

    return {
      projectId: 'arbitrum',
      projectName: 'Arbitrum',
      isEligible,
      requirements,
      estimatedValue: isEligible ? 1500 : 0, // Estimated airdrop value
      confidence: 0.8,
      lastChecked: new Date(),
    };
  }

  private async checkOptimismEligibility(
    address: string,
    txAnalysis: TransactionAnalysis,
    balanceAnalysis: BalanceAnalysis
  ): Promise<AirdropEligibility> {
    const requirements = [
      {
        type: 'transaction' as const,
        description: 'Used Optimism before the snapshot date',
        isMet: txAnalysis.bridgeTransactions > 0,
        currentValue: txAnalysis.bridgeTransactions.toString(),
        requiredValue: '1',
      },
      {
        type: 'governance' as const,
        description: 'Participated in governance',
        isMet: txAnalysis.governanceParticipation,
        currentValue: txAnalysis.governanceParticipation ? 'Yes' : 'No',
        requiredValue: 'Yes',
      },
    ];

    const isEligible = requirements.every(req => req.isMet);

    return {
      projectId: 'optimism',
      projectName: 'Optimism',
      isEligible,
      requirements,
      estimatedValue: isEligible ? 800 : 0,
      confidence: 0.7,
      lastChecked: new Date(),
    };
  }

  private async checkLayerZeroEligibility(
    address: string,
    txAnalysis: TransactionAnalysis,
    balanceAnalysis: BalanceAnalysis
  ): Promise<AirdropEligibility> {
    const requirements = [
      {
        type: 'transaction' as const,
        description: 'Used LayerZero bridges',
        isMet: txAnalysis.bridgeTransactions >= 3,
        currentValue: txAnalysis.bridgeTransactions.toString(),
        requiredValue: '3',
      },
      {
        type: 'contract_interaction' as const,
        description: 'Interacted with multiple chains',
        isMet: txAnalysis.uniqueContracts.length >= 5,
        currentValue: txAnalysis.uniqueContracts.length.toString(),
        requiredValue: '5',
      },
    ];

    const isEligible = requirements.every(req => req.isMet);

    return {
      projectId: 'layerzero',
      projectName: 'LayerZero',
      isEligible,
      requirements,
      estimatedValue: isEligible ? 2000 : 0,
      confidence: 0.6,
      lastChecked: new Date(),
    };
  }

  private checkGovernanceParticipation(transactions: Transaction[]): boolean {
    // Check for governance-related transactions
    const governanceContracts = [
      '0x030dA4F024F5E0F0b9752E0A21b58C5615F69A3F', // Uniswap Governor
    ];

    return transactions.some(tx => 
      governanceContracts.includes(tx.to.toLowerCase()) ||
      tx.data?.includes('0x71270ba9') // Function signature for castVote
    );
  }

  private getTokenPrice(symbol: string): number {
    // Simplified price mapping (in production use price APIs)
    const prices: Record<string, number> = {
      'ETH': 2000,
      'USDC': 1,
      'USDT': 1,
      'WBTC': 45000,
      'MATIC': 0.8,
      'BNB': 300,
    };

    return prices[symbol] || 0;
  }
}