import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useAppStore } from '@/lib/store';
import apiService from '@/lib/api';
import { toast } from 'sonner';

// Safe localStorage helper
const safeLocalStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

// Auth hooks
export function useLogin() {
  const setUser = useAppStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      apiService.login(email, password),
    onSuccess: (data) => {
      safeLocalStorage.setItem('access_token', data.accessToken);
      safeLocalStorage.setItem('refresh_token', data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Welcome back to DropIQ!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });
}

export function useRegister() {
  const setUser = useAppStore((state) => state.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      email: string;
      username: string;
      password: string;
      role?: string;
    }) => apiService.register(userData),
    onSuccess: (data) => {
      safeLocalStorage.setItem('access_token', data.accessToken);
      safeLocalStorage.setItem('refresh_token', data.refreshToken);
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Welcome to DropIQ!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    },
  });
}

export function useLogout() {
  const logout = useAppStore((state) => state.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiService.logout(),
    onSuccess: () => {
      safeLocalStorage.removeItem('access_token');
      safeLocalStorage.removeItem('refresh_token');
      logout();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Logout failed');
    },
  });
}

export function useProfile() {
  const setUser = useAppStore((state) => state.setUser);

  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiService.getProfile(),
    enabled: !!safeLocalStorage.getItem('access_token'),
    onSuccess: (data) => {
      setUser(data.user);
    },
    onError: () => {
      safeLocalStorage.removeItem('access_token');
      safeLocalStorage.removeItem('refresh_token');
    },
  });
}

// Airdrop hooks
export function useAirdrops(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  difficulty?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}) {
  const setAirdrops = useAppStore((state) => state.setAirdrops);

  return useQuery({
    queryKey: ['airdrops', params],
    queryFn: () => apiService.getAirdrops(params),
    onSuccess: (data) => {
      setAirdrops(data.airdrops);
    },
  });
}

export function useAirdrop(id: string) {
  return useQuery({
    queryKey: ['airdrop', id],
    queryFn: () => apiService.getAirdrop(id),
    enabled: !!id,
  });
}

export function useSaveAirdrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (airdropId: string) => apiService.saveAirdrop(airdropId),
    onSuccess: (_, airdropId) => {
      queryClient.invalidateQueries({ queryKey: ['airdrops'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Airdrop saved successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save airdrop');
    },
  });
}

export function useUnsaveAirdrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (airdropId: string) => apiService.unsaveAirdrop(airdropId),
    onSuccess: (_, airdropId) => {
      queryClient.invalidateQueries({ queryKey: ['airdrops'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Airdrop removed from saved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove airdrop');
    },
  });
}

export function useParticipateInAirdrop() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ airdropId, walletAddress }: { airdropId: string; walletAddress: string }) =>
      apiService.participateInAirdrop(airdropId, walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['airdrops'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Successfully participated in airdrop!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to participate in airdrop');
    },
  });
}

// Wallet hooks
export function useWallets() {
  const setWallets = useAppStore((state) => state.setWallets);

  return useQuery({
    queryKey: ['wallets'],
    queryFn: () => apiService.getWallets(),
    enabled: !!safeLocalStorage.getItem('access_token'),
    onSuccess: (data) => {
      setWallets(data.wallets);
    },
  });
}

export function useAddWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletData: {
      address: string;
      chainId: number;
      nickname?: string;
    }) => apiService.addWallet(walletData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add wallet');
    },
  });
}

export function useRemoveWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (walletId: string) => apiService.removeWallet(walletId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast.success('Wallet removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove wallet');
    },
  });
}

export function useAnalyzeWallet() {
  return useMutation({
    mutationFn: (walletAddress: string) => apiService.analyzeWallet(walletAddress),
    onSuccess: () => {
      toast.success('Wallet analysis completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to analyze wallet');
    },
  });
}

// Security hooks
export function useSecurityAlerts() {
  return useQuery({
    queryKey: ['security-alerts'],
    queryFn: () => apiService.getSecurityAlerts(),
    enabled: !!safeLocalStorage.getItem('access_token'),
  });
}

export function useReportScam() {
  return useMutation({
    mutationFn: (reportData: {
      airdropId?: string;
      walletAddress?: string;
      reason: string;
      description: string;
    }) => apiService.reportScam(reportData),
    onSuccess: () => {
      toast.success('Scam report submitted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit scam report');
    },
  });
}

// Analytics hooks
export function useHomeStats() {
  return useQuery({
    queryKey: ['home-stats'],
    queryFn: () => apiService.getDashboardStats(),
    enabled: !!safeLocalStorage.getItem('access_token'),
  });
}

export function useAirdropStats() {
  return useQuery({
    queryKey: ['airdrop-stats'],
    queryFn: () => apiService.getAirdropStats(),
    enabled: !!safeLocalStorage.getItem('access_token'),
  });
}

export function useWalletStats() {
  return useQuery({
    queryKey: ['wallet-stats'],
    queryFn: () => apiService.getWalletStats(),
    enabled: !!safeLocalStorage.getItem('access_token'),
  });
}

// Health check hook
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiService.healthCheck(),
    retry: false,
  });
}