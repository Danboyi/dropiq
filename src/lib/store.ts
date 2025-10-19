import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'FREE' | 'PREMIUM' | 'PRO' | 'ENTERPRISE' | 'ADMIN';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  address: string;
  chainId: number;
  chainName: string;
  nickname?: string;
  isPrimary: boolean;
  riskScore: number;
  airdropEligibility: number;
  createdAt: string;
}

export interface Airdrop {
  id: string;
  title: string;
  description: string;
  project: string;
  logo: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  type: 'STANDARD' | 'NFT' | 'GOVERNANCE' | 'SOCIAL' | 'TESTNET';
  estimatedValue: number;
  actualValue?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  requirements: string[];
  deadline?: string;
  participants: number;
  maxParticipants?: number;
  tags: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  scamProbability: number;
  createdAt: string;
  updatedAt: string;
}

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Wallet state
  wallets: Wallet[];
  connectedWallet: Wallet | null;
  
  // Airdrop state
  airdrops: Airdrop[];
  savedAirdrops: string[];
  participatedAirdrops: string[];
  
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'EUR' | 'GBP';
  notifications: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setWallets: (wallets: Wallet[]) => void;
  addWallet: (wallet: Wallet) => void;
  removeWallet: (walletId: string) => void;
  setConnectedWallet: (wallet: Wallet | null) => void;
  setAirdrops: (airdrops: Airdrop[]) => void;
  saveAirdrop: (airdropId: string) => void;
  unsaveAirdrop: (airdropId: string) => void;
  participateInAirdrop: (airdropId: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCurrency: (currency: 'USD' | 'EUR' | 'GBP') => void;
  toggleNotifications: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      wallets: [],
      connectedWallet: null,
      airdrops: [],
      savedAirdrops: [],
      participatedAirdrops: [],
      sidebarOpen: false,
      theme: 'system',
      currency: 'USD',
      notifications: true,
      
      // Actions
      setUser: (user) => set({ 
        user, 
        isAuthenticated: !!user,
        isLoading: false 
      }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      setWallets: (wallets) => set({ wallets }),
      
      addWallet: (wallet) => set((state) => ({ 
        wallets: [...state.wallets, wallet] 
      })),
      
      removeWallet: (walletId) => set((state) => ({
        wallets: state.wallets.filter(w => w.id !== walletId),
        connectedWallet: state.connectedWallet?.id === walletId ? null : state.connectedWallet
      })),
      
      setConnectedWallet: (wallet) => set({ connectedWallet: wallet }),
      
      setAirdrops: (airdrops) => set({ airdrops }),
      
      saveAirdrop: (airdropId) => set((state) => ({
        savedAirdrops: state.savedAirdrops.includes(airdropId) 
          ? state.savedAirdrops 
          : [...state.savedAirdrops, airdropId]
      })),
      
      unsaveAirdrop: (airdropId) => set((state) => ({
        savedAirdrops: state.savedAirdrops.filter(id => id !== airdropId)
      })),
      
      participateInAirdrop: (airdropId) => set((state) => ({
        participatedAirdrops: state.participatedAirdrops.includes(airdropId)
          ? state.participatedAirdrops
          : [...state.participatedAirdrops, airdropId]
      })),
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      
      setTheme: (theme) => set({ theme }),
      
      setCurrency: (currency) => set({ currency }),
      
      toggleNotifications: () => set((state) => ({ 
        notifications: !state.notifications 
      })),
      
      logout: () => set({
        user: null,
        isAuthenticated: false,
        wallets: [],
        connectedWallet: null,
        savedAirdrops: [],
        participatedAirdrops: []
      })
    }),
    {
      name: 'dropiq-storage',
      partialize: (state) => ({
        theme: state.theme,
        currency: state.currency,
        notifications: state.notifications,
        savedAirdrops: state.savedAirdrops,
        participatedAirdrops: state.participatedAirdrops,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);