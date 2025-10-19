import axios, { AxiosInstance, AxiosResponse } from 'axios';

class ApiService {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken) {
              const response = await this.client.post('/auth/refresh', {
                refreshToken,
              });
              
              const { accessToken } = response.data;
              localStorage.setItem('access_token', accessToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/auth/login';
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: {
    email: string;
    username: string;
    password: string;
    role?: string;
  }) {
    const response = await this.client.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    const response = await this.client.post('/auth/logout');
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data;
  }

  async updateProfile(userData: Partial<{
    username: string;
    avatar: string;
    preferences: Record<string, any>;
  }>) {
    const response = await this.client.put('/auth/profile', userData);
    return response.data;
  }

  // Airdrop endpoints
  async getAirdrops(params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    difficulty?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  }) {
    const response = await this.client.get('/airdrops', { params });
    return response.data;
  }

  async getAirdrop(id: string) {
    const response = await this.client.get(`/airdrops/${id}`);
    return response.data;
  }

  async saveAirdrop(airdropId: string) {
    const response = await this.client.post(`/airdrops/${airdropId}/save`);
    return response.data;
  }

  async unsaveAirdrop(airdropId: string) {
    const response = await this.client.delete(`/airdrops/${airdropId}/save`);
    return response.data;
  }

  async participateInAirdrop(airdropId: string, walletAddress: string) {
    const response = await this.client.post(`/airdrops/${airdropId}/participate`, {
      walletAddress,
    });
    return response.data;
  }

  async getAirdropAnalysis(airdropId: string) {
    const response = await this.client.get(`/airdrops/${airdropId}/analysis`);
    return response.data;
  }

  // Wallet endpoints
  async getWallets() {
    const response = await this.client.get('/wallets');
    return response.data;
  }

  async addWallet(walletData: {
    address: string;
    chainId: number;
    nickname?: string;
  }) {
    const response = await this.client.post('/wallets', walletData);
    return response.data;
  }

  async removeWallet(walletId: string) {
    const response = await this.client.delete(`/wallets/${walletId}`);
    return response.data;
  }

  async analyzeWallet(walletAddress: string) {
    const response = await this.client.post('/wallets/analyze', {
      address: walletAddress,
    });
    return response.data;
  }

  async getWalletAirdrops(walletAddress: string) {
    const response = await this.client.get(`/wallets/${walletAddress}/airdrops`);
    return response.data;
  }

  // Security endpoints
  async getSecurityAlerts() {
    const response = await this.client.get('/security/alerts');
    return response.data;
  }

  async reportScam(reportData: {
    airdropId?: string;
    walletAddress?: string;
    reason: string;
    description: string;
  }) {
    const response = await this.client.post('/security/report-scam', reportData);
    return response.data;
  }

  async getRiskScore(walletAddress: string) {
    const response = await this.client.get(`/security/risk-score/${walletAddress}`);
    return response.data;
  }

  // Analytics endpoints
  async getDashboardStats() {
    const response = await this.client.get('/analytics/dashboard');
    return response.data;
  }

  async getAirdropStats() {
    const response = await this.client.get('/analytics/airdrops');
    return response.data;
  }

  async getWalletStats() {
    const response = await this.client.get('/analytics/wallets');
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiService = new ApiService();
export default apiService;