import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WalletState, WalletConnection, WalletProvider, TokenBalance, Transaction } from '@/types/wallet';
import { getWalletProvider, getInstalledWallets } from '@/lib/wallet-providers';
import { getChainById } from '@/lib/chains';

interface WalletStore extends WalletState {
  // Actions
  connect: (providerId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchChain: (chainId: number) => Promise<void>;
  signMessage: (message: string) => Promise<string>;
  refreshBalance: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  refreshTransactions: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed
  availableWallets: WalletProvider[];
  currentChain: any;
  isConnected: boolean;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      // Initial state
      connection: null,
      provider: null,
      balance: '0',
      tokens: [],
      transactions: [],
      isLoading: false,
      error: null,

      // Computed properties
      get availableWallets() {
        return getInstalledWallets();
      },

      get currentChain() {
        const { connection } = get();
        if (!connection) return null;
        return getChainById(connection.chainId);
      },

      get isConnected() {
        const { connection } = get();
        return connection?.isConnected ?? false;
      },

      // Actions
      connect: async (providerId: string) => {
        try {
          set({ isLoading: true, error: null });

          const provider = getWalletProvider(providerId);
          if (!provider) {
            throw new Error(`Wallet provider ${providerId} not found`);
          }

          const connection = await provider.connect();
          
          set({
            connection,
            provider,
            isLoading: false,
          });

          // Auto-refresh balance after connection
          await get().refreshBalance();
          
          // Setup event listeners for MetaMask
          if (providerId === 'metamask' && typeof window !== 'undefined' && window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts: string[]) => {
              if (accounts.length === 0) {
                get().disconnect();
              } else {
                set(state => ({
                  connection: state.connection ? {
                    ...state.connection,
                    address: accounts[0],
                  } : null,
                }));
                get().refreshBalance();
              }
            });

            window.ethereum.on('chainChanged', (chainId: string) => {
              set(state => ({
                connection: state.connection ? {
                  ...state.connection,
                  chainId: parseInt(chainId, 16),
                } : null,
              }));
              get().refreshBalance();
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to connect wallet',
            isLoading: false,
          });
        }
      },

      disconnect: async () => {
        try {
          const { provider } = get();
          if (provider) {
            await provider.disconnect();
          }

          set({
            connection: null,
            provider: null,
            balance: '0',
            tokens: [],
            transactions: [],
            error: null,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to disconnect wallet',
          });
        }
      },

      switchChain: async (chainId: number) => {
        try {
          const { provider } = get();
          if (!provider) {
            throw new Error('No wallet connected');
          }

          set({ isLoading: true, error: null });

          await provider.switchChain(chainId);
          
          set(state => ({
            connection: state.connection ? {
              ...state.connection,
              chainId,
            } : null,
            isLoading: false,
          }));

          // Refresh balance after chain switch
          await get().refreshBalance();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to switch chain',
            isLoading: false,
          });
        }
      },

      signMessage: async (message: string) => {
        try {
          const { provider } = get();
          if (!provider) {
            throw new Error('No wallet connected');
          }

          return await provider.signMessage(message);
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to sign message',
          });
          throw error;
        }
      },

      refreshBalance: async () => {
        try {
          const { provider, connection } = get();
          if (!provider || !connection) {
            return;
          }

          const balance = await provider.getBalance(connection.address);
          set({ balance });
        } catch (error) {
          console.error('Failed to refresh balance:', error);
        }
      },

      refreshTokens: async () => {
        try {
          // This would typically call an API to get token balances
          // For now, set empty array
          set({ tokens: [] });
        } catch (error) {
          console.error('Failed to refresh tokens:', error);
        }
      },

      refreshTransactions: async () => {
        try {
          const { provider, connection } = get();
          if (!provider || !connection) {
            return;
          }

          const transactions = await provider.getTransactionHistory(connection.address);
          set({ transactions });
        } catch (error) {
          console.error('Failed to refresh transactions:', error);
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        connection: state.connection,
        provider: state.provider?.id || null,
      }),
    }
  )
);