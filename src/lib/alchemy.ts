import { Alchemy, Network } from 'alchemy-sdk';

// Chain configurations
const CHAIN_CONFIGS = {
  1: { // Ethereum Mainnet
    network: Network.ETH_MAINNET,
    apiKey: process.env.ALCHEMY_API_KEY_ETHEREUM,
  },
  137: { // Polygon
    network: Network.MATIC_MAINNET,
    apiKey: process.env.ALCHEMY_API_KEY_POLYGON,
  },
  56: { // BSC
    network: Network.BSC_MAINNET,
    apiKey: process.env.ALCHEMY_API_KEY_BSC,
  },
  42161: { // Arbitrum
    network: Network.ARB_MAINNET,
    apiKey: process.env.ALCHEMY_API_KEY_ARBITRUM,
  },
  10: { // Optimism
    network: Network.OPT_MAINNET,
    apiKey: process.env.ALCHEMY_API_KEY_OPTIMISM,
  },
  8453: { // Base
    network: Network.BASE_MAINNET,
    apiKey: process.env.ALCHEMY_API_KEY_BASE,
  },
};

// Alchemy clients cache
const alchemyClients: Record<number, Alchemy> = {};

/**
 * Get Alchemy client for a specific chain
 */
export function getAlchemyClient(chainId: number): Alchemy | null {
  const config = CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS];
  
  if (!config || !config.apiKey) {
    console.warn(`No Alchemy configuration found for chain ${chainId}`);
    return null;
  }

  // Return cached client if available
  if (alchemyClients[chainId]) {
    return alchemyClients[chainId];
  }

  // Create and cache new client
  const client = new Alchemy({
    apiKey: config.apiKey,
    network: config.network,
  });

  alchemyClients[chainId] = client;
  return client;
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChains(): number[] {
  return Object.keys(CHAIN_CONFIGS)
    .map(chainId => parseInt(chainId))
    .filter(chainId => CHAIN_CONFIGS[chainId as keyof typeof CHAIN_CONFIGS].apiKey);
}

/**
 * Get chain name by ID
 */
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    137: 'Polygon',
    56: 'BSC',
    42161: 'Arbitrum',
    10: 'Optimism',
    8453: 'Base',
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}

/**
 * Validate Ethereum address
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get transaction history for the last 6-12 months
 */
export async function getTransactionHistory(
  client: Alchemy, 
  address: string,
  months: number = 6
) {
  try {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);

    const transactions = await client.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: address,
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
      maxCount: 1000,
      order: "desc",
    });

    return {
      transactions: transactions.transfers || [],
      totalCount: transactions.transfers?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return { transactions: [], totalCount: 0 };
  }
}

/**
 * Get ERC-20 token balances
 */
export async function getTokenBalances(client: Alchemy, address: string) {
  try {
    const balances = await client.core.getTokensForOwner(address);
    return {
      tokens: balances.tokens || [],
      totalCount: balances.tokens?.length || 0,
    };
  } catch (error) {
    console.error('Error fetching token balances:', error);
    return { tokens: [], totalCount: 0 };
  }
}

/**
 * Get NFT holdings (ERC-721 and ERC-1155)
 */
export async function getNftHoldings(client: Alchemy, address: string) {
  try {
    const nfts = await client.nft.getNftsForOwner(address, {
      pageSize: 100,
    });
    
    return {
      nfts: nfts.ownedNfts || [],
      totalCount: nfts.totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching NFT holdings:', error);
    return { nfts: [], totalCount: 0 };
  }
}