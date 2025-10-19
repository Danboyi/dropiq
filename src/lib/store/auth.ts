import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState } from '@/types/wallet';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }) => Promise<void>;
  connectWallet: (data: {
    address: string;
    signature: string;
    message: string;
    walletType: string;
    chainId?: number;
  }) => Promise<void>;
  linkWallet: (data: {
    address: string;
    signature: string;
    message: string;
    walletType: string;
    chainId?: number;
  }) => Promise<void>;
  upgradeGuest: (data: {
    email: string;
    password: string;
    username?: string;
    displayName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Computed
  canAccessPremium: boolean;
  needsUpgrade: boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: false,

      // Computed properties
      get canAccessPremium() {
        const { user } = get();
        return user?.role === 'premium';
      },

      get needsUpgrade() {
        const { user } = get();
        return user?.role === 'guest';
      },

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
          }

          const data = await response.json();

          set({
            user: data.user,
            token: data.tokens.accessToken,
            isAuthenticated: true,
            isGuest: data.user.role === 'guest',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false,
          });
          throw error;
        }
      },

      register: async (data: {
        email: string;
        password: string;
        username?: string;
        displayName?: string;
      }) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
          }

          const result = await response.json();

          set({
            user: result.user,
            token: result.tokens.accessToken,
            isAuthenticated: true,
            isGuest: result.user.role === 'guest',
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Registration failed',
            isLoading: false,
          });
          throw error;
        }
      },

      connectWallet: async (data: {
        address: string;
        signature: string;
        message: string;
        walletType: string;
        chainId?: number;
      }) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('/api/auth/connect-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Wallet connection failed');
          }

          const result = await response.json();

          set({
            user: result.user,
            token: result.tokens.accessToken,
            isAuthenticated: true,
            isGuest: result.user.role === 'guest',
            isLoading: false,
          });

          // Show upgrade prompt if new guest user
          if (result.isNewUser) {
            // You could show a modal or notification here
            console.log('Guest session created. Consider upgrading to full account.');
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Wallet connection failed',
            isLoading: false,
          });
          throw error;
        }
      },

      linkWallet: async (data: {
        address: string;
        signature: string;
        message: string;
        walletType: string;
        chainId?: number;
      }) => {
        try {
          set({ isLoading: true, error: null });

          const { token } = get();
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch('/api/auth/link-wallet', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to link wallet');
          }

          // Refresh user data to show new wallet
          await get().refreshUserProfile();

          set({ isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to link wallet',
            isLoading: false,
          });
          throw error;
        }
      },

      upgradeGuest: async (data: {
        email: string;
        password: string;
        username?: string;
        displayName?: string;
      }) => {
        try {
          set({ isLoading: true, error: null });

          const { token } = get();
          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch('/api/auth/upgrade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Account upgrade failed');
          }

          const result = await response.json();

          set({
            user: result.user,
            isGuest: false,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Account upgrade failed',
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          const { token } = get();
          
          if (token) {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
          }
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isGuest: false,
            error: null,
          });
        }
      },

      refreshToken: async () => {
        try {
          const response = await fetch('/api/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refreshToken: localStorage.getItem('refreshToken'),
            }),
          });

          if (!response.ok) {
            throw new Error('Token refresh failed');
          }

          const data = await response.json();

          set({
            token: data.tokens.accessToken,
          });

          localStorage.setItem('refreshToken', data.tokens.refreshToken);
        } catch (error) {
          console.error('Token refresh error:', error);
          // Force logout on refresh failure
          get().logout();
        }
      },

      setUser: (user: any) => {
        set({
          user,
          isAuthenticated: !!user,
          isGuest: user?.role === 'guest',
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },

      // Helper method to refresh user profile
      refreshUserProfile: async () => {
        try {
          const { token } = get();
          if (!token) return;

          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            set({
              user: data.user,
              isGuest: data.user.role === 'guest',
            });
          }
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
      }),
    }
  )
);