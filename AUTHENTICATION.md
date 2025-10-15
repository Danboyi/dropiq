# DropIQ Authentication System

## Overview

The DropIQ platform implements a comprehensive hybrid authentication system that supports both traditional email/password authentication and Web3 wallet-based authentication. This system allows users to:

1. **Connect with Wallet**: Instant access using Ethereum wallets (MetaMask, Rainbow, etc.)
2. **Create Account**: Traditional email/password registration for persistent accounts
3. **Link Wallet**: Connect wallets to existing accounts for enhanced functionality

## Database Schema

### Core Models

#### User Model
- **Roles**: GUEST, USER, PREMIUM, ADMIN
- **Guest Users**: Created automatically when connecting a wallet for the first time
- **Persistent Users**: Created through email/password registration
- **Profile Information**: Name, avatar, bio, notification preferences

#### Wallet Model
- **Multiple Wallets**: Users can link multiple wallets to their account
- **Primary Wallet**: Designated main wallet for the account
- **ENS Support**: Resolves ENS names and avatars
- **Chain Support**: Multi-chain wallet connections

#### Airdrop Model
- **Vetted Information**: AI-vetted airdrop details
- **Risk Assessment**: Automated risk scoring and analysis
- **Requirements**: Structured eligibility criteria
- **Status Tracking**: Active, pending, completed states

#### Session Management
- **JWT Tokens**: Access and refresh token system
- **Session Tracking**: IP, user agent, expiration
- **Security**: Automatic token refresh and invalidation

## Backend Implementation

### Authentication Endpoints

#### Wallet Authentication
```typescript
POST /api/auth/connect-wallet
{
  address: string,
  signature: string,
  message: string,
  chainId?: number
}
```

#### Standard Authentication
```typescript
POST /api/auth/register
{
  email: string,
  password: string,
  firstName: string,
  lastName: string
}

POST /api/auth/login
{
  email: string,
  password: string
}
```

#### Token Management
```typescript
POST /api/auth/refresh
{
  refreshToken: string
}

POST /api/auth/logout
```

### Security Features

1. **Signature Verification**: Cryptographic proof of wallet ownership
2. **Nonce System**: Prevents replay attacks
3. **Token Refresh**: Automatic token renewal
4. **Session Management**: Secure session tracking
5. **Rate Limiting**: Prevents brute force attacks

## Frontend Implementation

### Wallet Connection (wagmi + viem)

```typescript
// wagmi configuration
import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, bsc } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, bsc],
  transports: {
    [mainnet.id]: http(),
    // ... other chains
  }
})
```

### State Management (Zustand)

```typescript
interface AuthState {
  user: User | null
  wallet: Wallet | null
  isAuthenticated: boolean
  accessToken: string | null
  // ... other state
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // State and actions
    }),
    { name: 'dropiq-auth' }
  )
)
```

### UI Components

1. **AuthModal**: Combined login/register/wallet connection modal
2. **WalletConnectModal**: Dedicated wallet connection interface
3. **UserMenu**: User profile and account management
4. **Dashboard**: Role-based dashboard rendering

## User Flow

### New User (Wallet First)
1. Click "Connect Wallet"
2. Select wallet provider
3. Sign authentication message
4. Create guest account automatically
5. Access preview dashboard
6. Option to upgrade to full account

### New User (Email First)
1. Click "Sign In" → "Register"
2. Fill registration form
3. Verify email (optional)
4. Access full dashboard
5. Option to link wallet later

### Existing User
1. Login with email/password or connect wallet
2. If wallet is linked to account, automatic login
3. Access full dashboard with all features

## Role-Based Access

### Guest Users
- **Limited Access**: Preview dashboard with 2-3 airdrops
- **Basic Features**: View limited airdrop information
- **Upgrade Prompt**: Encourages account creation

### Full Users
- **Complete Access**: All available airdrops
- **Progress Tracking**: Detailed progress monitoring
- **Analytics**: Basic analytics and insights

### Premium Users
- **Enhanced Features**: Advanced analytics and insights
- **Priority Support**: Faster response times
- **Exclusive Content**: Premium airdrop opportunities

## Security Considerations

1. **Private Key Security**: Never handles or stores private keys
2. **Message Signing**: Secure signature verification
3. **Token Storage**: Secure token storage in httpOnly cookies
4. **HTTPS Required**: All authentication endpoints require HTTPS
5. **Rate Limiting**: Prevents abuse and attacks

## Development Setup

### Backend
```bash
cd apps/backend
npm install
npm run db:generate
npm run db:push
npm run dev
```

### Frontend
```bash
cd apps/frontend
npm install
npm run dev
```

### Environment Variables
Copy `.env.example` files and configure:
- Database connection
- JWT secrets
- API URLs
- WalletConnect Project ID

## Testing

### Backend Tests
```bash
cd apps/backend
npm run test
npm run test:coverage
```

### Frontend Tests
```bash
cd apps/frontend
npm run test
npm run test:coverage
```

## Deployment

### Production Considerations
1. **Environment Variables**: Secure configuration management
2. **Database**: Production PostgreSQL instance
3. **SSL/TLS**: HTTPS for all endpoints
4. **Monitoring**: Error tracking and performance monitoring
5. **Backup**: Regular database backups

### Docker Deployment
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Future Enhancements

1. **Multi-Chain Support**: Expand wallet connection support
2. **Social Login**: Google, GitHub, Discord authentication
3. **2FA**: Two-factor authentication for enhanced security
4. **KYC Integration**: Identity verification for premium features
5. **Mobile App**: React Native mobile application