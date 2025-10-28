import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { useAuthStore } from '@/stores/authStore'

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Get token from localStorage or Zustand store
    let token: string | null = null
    
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token')
    }
    
    // Fallback to Zustand store if localStorage doesn't have token
    if (!token) {
      const store = useAuthStore.getState()
      token = store.token
    }

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Clear auth state and redirect to login
        const authStore = useAuthStore.getState()
        authStore.logout()

        // Clear token from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }

        // Redirect to login page (only on client side)
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }

        return Promise.reject(new Error('Session expired. Please login again.'))
      } catch (refreshError) {
        // If refresh fails, logout and redirect to login
        const authStore = useAuthStore.getState()
        authStore.logout()

        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          window.location.href = '/auth/login'
        }

        return Promise.reject(new Error('Authentication failed. Please login again.'))
      }
    }

    // Handle other HTTP errors
    if (error.response) {
      const errorMessage = error.response.data?.error || error.response.data?.message || 'Request failed'
      return Promise.reject(new Error(errorMessage))
    } else if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    } else {
      return Promise.reject(new Error('An unexpected error occurred.'))
    }
  }
)

// API methods for common operations
export const api = {
  // Auth endpoints
  auth: {
    getNonce: (address: string) => 
      apiClient.get(`/auth/connect-wallet?address=${address}`),
    
    connectWallet: (data: { address: string; signature: string; message: string }) =>
      apiClient.post('/auth/connect-wallet', data),
    
    register: (data: { email: string; password: string; name?: string }) =>
      apiClient.post('/auth/register', data),
    
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    
    linkWalletToAccount: (data: { address: string; signature: string; message: string }) =>
      apiClient.post('/auth/link-wallet-to-account', data),
  },

  // Airdrop endpoints
  airdrops: {
    getAll: (params?: any) =>
      apiClient.get('/airdrops', { params }),
    
    getById: (id: string) =>
      apiClient.get(`/airdrops/${id}`),
    
    search: (query: string) =>
      apiClient.get(`/airdrops/search?q=${encodeURIComponent(query)}`),
    
    submit: (data: any) =>
      apiClient.post('/airdrops/submit', data),
  },

  // Campaign endpoints
  campaigns: {
    getFeatured: () =>
      apiClient.get('/campaigns/featured'),
    
    createCheckoutSession: (data: { airdropId: string; tier: string; submittedBy?: string }) =>
      apiClient.post('/campaigns/create-checkout-session', data),
  },

  // Admin endpoints
  admin: {
    getCampaigns: (params?: { page?: number; status?: string }) =>
      apiClient.get('/admin/campaigns', { params }),
    
    updateCampaignStatus: (id: string, status: string, notes?: string) =>
      apiClient.patch(`/admin/campaigns/${id}`, { status, notes }),
  },

  // User endpoints
  user: {
    getProfile: () =>
      apiClient.get('/user/profile'),
    
    updateProfile: (data: any) =>
      apiClient.patch('/user/profile', data),
    
    getUserAirdropStatuses: () =>
      apiClient.get('/user/airdrop-statuses'),
    
    updateAirdropStatus: (airdropId: string, status: string, notes?: string) =>
      apiClient.post(`/user/airdrop-statuses/${airdropId}`, { status, notes }),
  },
}

// Export the axios instance for custom requests
export default apiClient

// Export types for API responses
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}