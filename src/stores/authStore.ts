import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthStore, User, APIError } from '@/types/auth'

// API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'

class AuthAPI {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || data.details || 'Request failed')
    }

    return data
  }

  async getNonce(address: string) {
    return this.request<{ nonce: string; message: string }>(`/auth/connect-wallet?address=${address}`)
  }

  async connectWallet(address: string, signature: string, message: string) {
    return this.request<{
      success: boolean
      token: string
      user: User
      isNewUser: boolean
      message: string
    }>('/auth/connect-wallet', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
    })
  }

  async register(email: string, password: string, name?: string) {
    return this.request<{
      success: boolean
      token: string
      user: User
      message: string
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async login(email: string, password: string) {
    return this.request<{
      success: boolean
      token: string
      user: User
      message: string
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async linkWalletToAccount(address: string, signature: string, message: string, token: string) {
    return this.request<{
      success: boolean
      message: string
      wallet: {
        address: string
        linkedAt: Date
      }
    }>('/auth/link-wallet-to-account', {
      method: 'POST',
      body: JSON.stringify({ address, signature, message }),
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
  }
}

const authAPI = new AuthAPI(API_BASE)

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isConnected: false,
      connectedWallet: null,
      isLoading: false,
      error: null,

      // Actions
      connectWallet: async (address: string, signature: string, message: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.connectWallet(address, signature, message)
          
          set({
            user: response.user,
            token: response.token,
            isConnected: true,
            connectedWallet: address.toLowerCase(),
            isLoading: false,
            error: null,
          })

          // Store token in localStorage for API calls
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.token)
          }

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to connect wallet',
          })
        }
      },

      disconnectWallet: () => {
        set({
          user: null,
          token: null,
          isConnected: false,
          connectedWallet: null,
          isLoading: false,
          error: null,
        })

        // Clear token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
      },

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.login(email, password)
          
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          })

          // Store token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.token)
          }

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to login',
          })
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.register(email, password, name)
          
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
            error: null,
          })

          // Store token in localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.token)
          }

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to register',
          })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isConnected: false,
          connectedWallet: null,
          isLoading: false,
          error: null,
        })

        // Clear token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
      },

      linkWalletToAccount: async (address: string, signature: string, message: string) => {
        const { token } = get()
        
        if (!token) {
          set({ error: 'No authentication token found' })
          return
        }

        set({ isLoading: true, error: null })
        
        try {
          const response = await authAPI.linkWalletToAccount(address, signature, message, token)
          
          // Update user state to reflect the linked wallet
          const currentUser = get().user
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              isGuest: false,
              wallets: [
                ...(currentUser.wallets || []),
                {
                  id: response.wallet.address,
                  address: response.wallet.address,
                  lastUsedAt: response.wallet.linkedAt.toISOString(),
                }
              ]
            }

            set({
              user: updatedUser,
              isConnected: true,
              connectedWallet: address.toLowerCase(),
              isLoading: false,
              error: null,
            })
          }

        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to link wallet',
          })
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isConnected: state.isConnected,
        connectedWallet: state.connectedWallet,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && typeof window !== 'undefined') {
          localStorage.setItem('auth_token', state.token)
        }
      },
    }
  )
)

// Selectors for common use cases
export const useAuth = () => {
  const store = useAuthStore()
  return {
    isAuthenticated: !!store.user && !!store.token,
    isGuest: store.user?.isGuest ?? false,
    hasWallet: store.isConnected && !!store.connectedWallet,
    user: store.user,
    ...store,
  }
}

export const useAuthUser = () => useAuthStore((state) => state.user)
export const useAuthToken = () => useAuthStore((state) => state.token)
export const useIsConnected = () => useAuthStore((state) => state.isConnected)
export const useAuthLoading = () => useAuthStore((state) => state.isLoading)
export const useAuthError = () => useAuthStore((state) => state.error)