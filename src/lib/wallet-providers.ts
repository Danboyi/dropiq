import { WalletProvider, WalletConnection, Transaction } from '@/types/wallet';
import { getChainById } from './chains';

declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
    walletLinkExtension?: any;
    keplr?: any;
    leap?: any;
  }
}

export class MetaMaskProvider implements WalletProvider {
  id = 'metamask';
  name = 'MetaMask';
  icon = '/wallets/metamask.svg';

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum?.isMetaMask;
  }

  async connect(): Promise<WalletConnection> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        provider: this.id,
        isConnected: true,
      };
    } catch (error) {
      throw new Error(`Failed to connect MetaMask: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    // MetaMask doesn't have a programmatic disconnect method
    // This is handled by the wallet state management
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });
    } catch (error: any) {
      // Chain not added, try to add it
      if (error.code === 4902) {
        const chain = getChainById(chainId);
        if (chain) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: chain.name,
                rpcUrls: [chain.rpcUrl],
                blockExplorerUrls: [chain.blockExplorerUrl],
                nativeCurrency: chain.nativeCurrency,
              },
            ],
          });
        }
      } else {
        throw new Error(`Failed to switch chain: ${error}`);
      }
    }
  }

  async signMessage(message: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      return await window.ethereum.request({
        method: 'personal_sign',
        params: [message, accounts[0]],
      });
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`);
    }
  }

  async getBalance(address: string): Promise<string> {
    if (!this.isInstalled()) {
      throw new Error('MetaMask is not installed');
    }

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      });

      return balance;
    } catch (error) {
      throw new Error(`Failed to get balance: ${error}`);
    }
  }

  async getTransactionHistory(address: string): Promise<Transaction[]> {
    // This would typically use an external API like Etherscan
    // For now, return empty array
    return [];
  }
}

export class WalletConnectProvider implements WalletProvider {
  id = 'walletconnect';
  name = 'WalletConnect';
  icon = '/wallets/walletconnect.svg';

  private walletConnectInstance: any = null;

  isInstalled(): boolean {
    return true; // WalletConnect works via QR code, no installation needed
  }

  async connect(): Promise<WalletConnection> {
    // This is a simplified implementation
    // In production, you would use the WalletConnect v2 SDK
    throw new Error('WalletConnect implementation requires WalletConnect v2 SDK');
  }

  async disconnect(): Promise<void> {
    if (this.walletConnectInstance) {
      await this.walletConnectInstance.disconnect();
      this.walletConnectInstance = null;
    }
  }

  async switchChain(chainId: number): Promise<void> {
    // Implementation depends on WalletConnect v2 SDK
    throw new Error('Chain switching not implemented for WalletConnect');
  }

  async signMessage(message: string): Promise<string> {
    if (!this.walletConnectInstance) {
      throw new Error('WalletConnect not connected');
    }
    // Implementation depends on WalletConnect v2 SDK
    throw new Error('Message signing not implemented for WalletConnect');
  }

  async getBalance(address: string): Promise<string> {
    // Would use RPC calls through WalletConnect
    throw new Error('Balance fetching not implemented for WalletConnect');
  }

  async getTransactionHistory(address: string): Promise<Transaction[]> {
    return [];
  }
}

export class CoinbaseWalletProvider implements WalletProvider {
  id = 'coinbase';
  name = 'Coinbase Wallet';
  icon = '/wallets/coinbase.svg';

  isInstalled(): boolean {
    return typeof window !== 'undefined' && !!window.walletLinkExtension;
  }

  async connect(): Promise<WalletConnection> {
    if (!this.isInstalled()) {
      throw new Error('Coinbase Wallet is not installed');
    }

    // Simplified implementation
    // In production, you would use the Coinbase Wallet SDK
    throw new Error('Coinbase Wallet implementation requires Coinbase Wallet SDK');
  }

  async disconnect(): Promise<void> {
    // Implementation depends on Coinbase Wallet SDK
  }

  async switchChain(chainId: number): Promise<void> {
    throw new Error('Chain switching not implemented for Coinbase Wallet');
  }

  async signMessage(message: string): Promise<string> {
    throw new Error('Message signing not implemented for Coinbase Wallet');
  }

  async getBalance(address: string): Promise<string> {
    throw new Error('Balance fetching not implemented for Coinbase Wallet');
  }

  async getTransactionHistory(address: string): Promise<Transaction[]> {
    return [];
  }
}

export const WALLET_PROVIDERS: WalletProvider[] = [
  new MetaMaskProvider(),
  new WalletConnectProvider(),
  new CoinbaseWalletProvider(),
];

export const getWalletProvider = (id: string): WalletProvider | undefined => {
  return WALLET_PROVIDERS.find(provider => provider.id === id);
};

export const getInstalledWallets = (): WalletProvider[] => {
  return WALLET_PROVIDERS.filter(provider => provider.isInstalled());
};