export interface Chain {
  id: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet?: boolean;
}

export interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  isInstalled: () => boolean;
  connect: () => Promise<WalletConnection>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  getBalance: (address: string) => Promise<string>;
  getTransactionHistory: (address: string) => Promise<Transaction[]>;
}

export interface WalletConnection {
  address: string;
  chainId: number;
  provider: string;
  isConnected: boolean;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  data?: string;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  valueUSD?: number;
  isNFT?: boolean;
  tokenId?: string;
  metadata?: any;
}

export interface AirdropEligibility {
  projectId: string;
  projectName: string;
  isEligible: boolean;
  requirements: {
    type: 'balance' | 'transaction' | 'contract_interaction' | 'snapshot' | 'holding';
    description: string;
    isMet: boolean;
    currentValue?: string;
    requiredValue?: string;
  }[];
  estimatedValue?: number;
  confidence: number;
  lastChecked: Date;
}

export interface SecurityScan {
  address: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  threats: {
    type: 'drainer' | 'phishing' | 'malicious_contract' | 'approval_hijack' | 'front_running';
    description: string;
    severity: number;
    confidence: number;
  }[];
  recommendations: string[];
  scannedAt: Date;
}

export interface TransactionSimulation {
  from: string;
  to: string;
  data: string;
  value: string;
  gasEstimate: string;
  potentialRisks: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  stateChanges: {
    tokenTransfers: Array<{
      token: string;
      from: string;
      to: string;
      amount: string;
    }>;
    balanceChanges: Array<{
      address: string;
      change: string;
    }>;
  };
}

export interface WalletState {
  connection: WalletConnection | null;
  provider: WalletProvider | null;
  balance: string;
  tokens: TokenBalance[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export interface AuthState {
  user: {
    id: string;
    email?: string;
    role: 'guest' | 'user' | 'premium';
    wallets: string[];
  } | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;
}