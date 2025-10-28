// User types
export interface User {
  id: string
  email?: string
  name?: string
  role: 'user' | 'admin'
  isGuest: boolean
  createdAt: string
  updatedAt: string
  wallets?: Wallet[]
}

export interface Wallet {
  id: string
  address: string
  userId?: string
  nonce: string
  lastUsedAt: string
  createdAt: string
  updatedAt: string
}

// JWT Payload
export interface JWTPayload {
  userId: string
  role: string
  address?: string
  isGuest?: boolean
  iat?: number
  exp?: number
}

// API Request/Response types
export interface ConnectWalletRequest {
  address: string
  signature: string
  message: string
}

export interface ConnectWalletResponse {
  success: boolean
  token: string
  user: User
  isNewUser: boolean
  message: string
}

export interface GetNonceResponse {
  nonce: string
  message: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface RegisterResponse {
  success: boolean
  token: string
  user: User
  message: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  success: boolean
  token: string
  user: User
  message: string
}

export interface LinkWalletRequest {
  address: string
  signature: string
  message: string
}

export interface LinkWalletResponse {
  success: boolean
  message: string
  wallet: {
    address: string
    linkedAt: Date
  }
}

// Auth Store State
export interface AuthState {
  user: User | null
  token: string | null
  isConnected: boolean
  connectedWallet: string | null
  isLoading: boolean
  error: string | null
}

// Auth Store Actions
export interface AuthActions {
  connectWallet: (address: string, signature: string, message: string) => Promise<void>
  disconnectWallet: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  linkWalletToAccount: (address: string, signature: string, message: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Combined Auth Store
export interface AuthStore extends AuthState, AuthActions {}

// API Error types
export interface APIError {
  error: string
  details?: string
  code?: string
}

// Wallet Connection types
export interface WalletConnectionState {
  address: string | null
  isConnected: boolean
  isConnecting: boolean
  provider: any
}

// Signature types
export interface SignatureRequest {
  message: string
  nonce: string
}

export interface SignatureResponse {
  signature: string
  address: string
}