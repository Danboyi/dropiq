# Railway Environment Variables Configuration

This document outlines all environment variables that need to be configured in the Railway dashboard for DropIQ deployment.

## 🚀 Quick Setup

### Required Variables (Must be set for deployment to work)

```bash
# Database Connection (Auto-injected by Railway PostgreSQL Plugin)
DATABASE_URL=postgresql://user:password@host:port/database

# Cache Connection (Auto-injected by Railway Redis Plugin)  
REDIS_URL=redis://host:port

# Application Environment
NODE_ENV=production
PORT=3000
```

### Authentication Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# NextAuth.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-min-32-chars
NEXTAUTH_URL=https://your-app.railway.app

# Session Configuration
SESSION_SECRET=your-session-secret-min-32-chars
```

### Blockchain & Wallet Variables

```bash
# WalletConnect Project ID (Required for wallet integration)
NEXT_PUBLIC_WALLET_CONNECT_ID=your-walletconnect-project-id

# Private Key for server-side operations (Optional)
PRIVATE_KEY=your-private-key-for-server-operations

# RPC Endpoints (Optional - defaults to public endpoints)
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your-project-id
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/your-project-id
BSC_RPC_URL=https://bsc-dataseed1.binance.org
```

### External API Keys

```bash
# CoinGecko API (Free tier available)
COINGECKO_API_KEY=your-coingecko-api-key

# Moralis Web3 API (Free tier available)
MORALIS_API_KEY=your-moralis-api-key

# Alchemy API (Free tier available)
ALCHEMY_API_KEY=your-alchemy-api-key

# ZAI Web Dev SDK (Already installed)
ZAI_API_KEY=your-zai-api-key
```

### Monitoring & Error Tracking

```bash
# Sentry Error Tracking (Recommended for production)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ENVIRONMENT=production
```

### Application Configuration

```bash
# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
API_BASE_URL=https://your-backend.railway.app

# CORS Configuration
ALLOWED_ORIGINS=https://your-app.railway.app,https://your-backend.railway.app

# Logging Configuration
LOG_LEVEL=info
RAILWAY_SERVICE_NAME=dropiq
RAILWAY_ENVIRONMENT=production
```

### Security Configuration

```bash
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security Headers
HELMET_ENABLED=true
CORS_ENABLED=true

# API Configuration
API_VERSION=v1
API_PREFIX=/api
```

## 📋 Railway Dashboard Setup Steps

### 1. Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your DropIQ repository
4. Railway will automatically detect the configuration

### 2. Add Required Services

1. **PostgreSQL Database**
   - Click `+ New` → `PostgreSQL`
   - Railway will automatically inject `DATABASE_URL`

2. **Redis Cache**
   - Click `+ New` → `Redis`
   - Railway will automatically inject `REDIS_URL`

### 3. Configure Environment Variables

1. Go to your project settings
2. Click "Variables" tab
3. Add the required variables from the sections above

#### Critical Variables to Set Manually:

```bash
# 1. Generate secure secrets
JWT_SECRET=openssl rand -base64 32
NEXTAUTH_SECRET=openssl rand -base64 32
SESSION_SECRET=openssl rand -base64 32

# 2. Add your WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_ID=get-from-walletconnect.com

# 3. Configure Sentry (optional but recommended)
SENTRY_DSN=get-from-sentry.io
```

### 4. Deploy Services

Railway will automatically create separate services:

- **Frontend Service** (Next.js application)
- **Backend Service** (Node.js API)
- **Database Service** (PostgreSQL)
- **Cache Service** (Redis)

## 🔧 Environment-Specific Configuration

### Development Environment

```bash
NODE_ENV=development
LOG_LEVEL=debug
RAILWAY_ENVIRONMENT=development
```

### Staging/Preview Environment

```bash
NODE_ENV=staging
LOG_LEVEL=info
RAILWAY_ENVIRONMENT=preview
SENTRY_ENVIRONMENT=staging
```

### Production Environment

```bash
NODE_ENV=production
LOG_LEVEL=info
RAILWAY_ENVIRONMENT=production
SENTRY_ENVIRONMENT=production
```

## 🔍 Variable Validation

### Database Connection Test

```bash
# Test database connection
curl https://your-backend.railway.app/api/health

# Expected response:
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected"
}
```

### Authentication Test

```bash
# Test JWT configuration
curl -X POST https://your-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Wallet Connection Test

```bash
# Test WalletConnect configuration
# Visit: https://your-app.railway.app/wallets
# Should show wallet connection modal
```

## 🚨 Security Considerations

### Secret Generation

Always use cryptographically secure secrets:

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Never use these example values in production!
```

### Environment Variable Best Practices

1. **Never commit secrets to Git**
2. **Use Railway's encrypted variable storage**
3. **Rotate secrets regularly**
4. **Use different secrets for different environments**
5. **Monitor for leaked secrets**

### Required Minimum Lengths

- `JWT_SECRET`: 32 characters minimum
- `NEXTAUTH_SECRET`: 32 characters minimum
- `SESSION_SECRET`: 32 characters minimum

## 📊 Monitoring Variables

### Railway-Specific Variables

Railway automatically provides these variables:

```bash
# Railway provides these automatically:
RAILWAY_SERVICE_NAME=dropiq
RAILWAY_ENVIRONMENT=production
RAILWAY_PUBLIC_DOMAIN=your-app.up.railway.app
RAILWAY_TCP_PROXY_DOMAIN=your-backend.up.railway.app
PORT=3000
```

### Custom Metrics

```bash
# Custom monitoring
METRICS_ENABLED=true
PERFORMANCE_MONITORING=true
HEALTH_CHECK_INTERVAL=30
```

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` is correctly injected
   - Verify PostgreSQL service is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Check `REDIS_URL` is correctly injected
   - Verify Redis service is running
   - Check connection string format

3. **JWT Authentication Errors**
   - Verify `JWT_SECRET` is set and >= 32 characters
   - Check token expiration settings
   - Verify `NEXTAUTH_SECRET` is set

4. **Wallet Connection Issues**
   - Verify `NEXT_PUBLIC_WALLET_CONNECT_ID` is valid
   - Check WalletConnect project configuration
   - Verify CORS settings

### Debug Commands

```bash
# Check environment variables in Railway
railway variables

# View logs
railway logs

# Check service status
railway status

# Open dashboard
railway open
```

### Health Check Endpoints

```bash
# Backend health check
GET /api/health

# Database health check  
GET /api/health/database

# Redis health check
GET /api/health/redis

# Full system health
GET /api/health/full
```

## 📚 Additional Resources

- [Railway Environment Variables Documentation](https://docs.railway.app/reference/variables)
- [NextAuth.js Environment Variables](https://next-auth.js.org/configuration/options)
- [WalletConnect Project Setup](https://docs.walletconnect.com/cloud/quickstart)
- [Sentry Configuration Guide](https://docs.sentry.io/platforms/node/configuration/)

---

**Note**: Always test your configuration in a preview environment before deploying to production!