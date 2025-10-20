# Railway Environment Variables Configuration

This document provides a comprehensive guide to configuring environment variables for deploying DropIQ on Railway.

## 🚋 Required Environment Variables

### Core Application Settings

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ Yes | `production` | Application environment |
| `PORT` | ✅ Yes | `3000` | Application port (Railway sets this automatically) |
| `NEXT_PUBLIC_APP_NAME` | ✅ Yes | `DropIQ` | Application name |
| `NEXT_PUBLIC_APP_VERSION` | ✅ Yes | `1.0.0` | Application version |

### Database Configuration

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `DATABASE_URL` | ✅ Yes | Railway PostgreSQL Plugin | PostgreSQL connection string |
| `POSTGRES_USER` | ✅ Yes | Railway PostgreSQL Plugin | Database username |
| `POSTGRES_PASSWORD` | ✅ Yes | Railway PostgreSQL Plugin | Database password |
| `POSTGRES_DB` | ✅ Yes | Railway PostgreSQL Plugin | Database name |

### Cache Configuration

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `REDIS_URL` | ✅ Yes | Railway Redis Plugin | Redis connection string |
| `REDIS_PASSWORD` | ✅ Yes | Railway Redis Plugin | Redis password |

### Authentication & Security

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `JWT_SECRET` | ✅ Yes | `your-super-secret-jwt-key-min-32-chars` | JWT signing secret (min 32 chars) |
| `NEXTAUTH_SECRET` | ✅ Yes | `your-nextauth-secret-min-32-chars` | NextAuth.js secret (min 32 chars) |
| `NEXTAUTH_URL` | ✅ Yes | `https://your-app.railway.app` | NextAuth.js URL |

### External Services

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_WALLET_CONNECT_ID` | ✅ Yes | `your-walletconnect-project-id` | WalletConnect project ID |
| `SENTRY_DSN` | ✅ Yes | `https://your-sentry-dsn` | Sentry error tracking DSN |

### Railway-Specific Variables

| Variable | Required | Auto-set | Description |
|----------|----------|----------|-------------|
| `RAILWAY_ENVIRONMENT` | ❌ No | ✅ Yes | Railway environment name |
| `RAILWAY_SERVICE_NAME` | ❌ No | ✅ Yes | Railway service name |
| `RAILWAY_PUBLIC_DOMAIN` | ❌ No | ✅ Yes | Railway public domain |
| `RAILWAY_GIT_COMMIT_SHA` | ❌ No | ✅ Yes | Git commit SHA |

## 🔧 Optional Environment Variables

### Logging & Monitoring

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `SENTRY_ENVIRONMENT` | `production` | Sentry environment name |

### Application Features

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` | Solana network (mainnet-beta, devnet, testnet) |
| `ENABLE_ANALYTICS` | `true` | Enable analytics tracking |
| `ENABLE_PERFORMANCE_MONITORING` | `true` | Enable performance monitoring |

### Development & Debugging

| Variable | Default | Description |
|----------|---------|-------------|
| `DEBUG_MODE` | `false` | Enable debug mode |
| `ENABLE_SWAGGER` | `false` | Enable Swagger UI |
| `ENABLE_DB_LOGS` | `false` | Enable database query logs |

## 🏗️ Environment-Specific Configuration

### Production Environment

```bash
# Core
NODE_ENV=production
PORT=3000

# Database (from Railway PostgreSQL Plugin)
DATABASE_URL=${{database.DATABASE_URL}}
POSTGRES_USER=dropiq
POSTGRES_DB=dropiq_prod

# Cache (from Railway Redis Plugin)
REDIS_URL=${{redis.REDIS_URL}}

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
NEXTAUTH_SECRET=your-nextauth-secret-min-32-characters
NEXTAUTH_URL=${{frontend.RAILWAY_PUBLIC_DOMAIN}}

# External Services
NEXT_PUBLIC_WALLET_CONNECT_ID=your-walletconnect-project-id
SENTRY_DSN=your-sentry-dsn

# Application
NEXT_PUBLIC_APP_NAME=DropIQ
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
LOG_LEVEL=info
```

### Preview Environment (Pull Requests)

```bash
# Core
NODE_ENV=production
PORT=3000

# Database (from Railway PostgreSQL Plugin)
DATABASE_URL=${{database.DATABASE_URL}}
POSTGRES_USER=dropiq
POSTGRES_DB=dropiq_preview

# Cache (from Railway Redis Plugin)
REDIS_URL=${{redis.REDIS_URL}}

# Authentication
JWT_SECRET=your-preview-jwt-secret-min-32-characters
NEXTAUTH_SECRET=your-preview-nextauth-secret-min-32-characters
NEXTAUTH_URL=${{frontend.RAILWAY_PUBLIC_DOMAIN}}

# External Services
NEXT_PUBLIC_WALLET_CONNECT_ID=your-walletconnect-project-id
SENTRY_DSN=your-preview-sentry-dsn

# Application
NEXT_PUBLIC_APP_NAME=DropIQ (Preview)
NEXT_PUBLIC_APP_VERSION=1.0.0-preview
NEXT_PUBLIC_SOLANA_NETWORK=devnet
LOG_LEVEL=debug
```

## 🛠️ Setup Instructions

### 1. Railway Dashboard Configuration

1. **Go to Railway Dashboard**
   - Navigate to [railway.app](https://railway.app)
   - Select your DropIQ project

2. **Add Required Plugins**
   ```bash
   # Add PostgreSQL Plugin
   Click "+ New" → "PostgreSQL" → Name: "database"
   
   # Add Redis Plugin
   Click "+ New" → "Redis" → Name: "redis"
   ```

3. **Set Environment Variables**
   - Go to "Variables" tab
   - Add all required variables from the table above
   - Railway automatically injects plugin variables

### 2. Automatic Variable Injection

Railway automatically provides these variables:

```bash
# From PostgreSQL Plugin
DATABASE_URL=postgresql://user:pass@host:port/dbname

# From Redis Plugin
REDIS_URL=redis://host:port

# Railway System Variables
RAILWAY_ENVIRONMENT=production
RAILWAY_SERVICE_NAME=frontend
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app
RAILWAY_GIT_COMMIT_SHA=abc123def456
```

### 3. Variable Validation

The application includes validation for required variables:

```typescript
// Startup validation
const requiredVars = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_WALLET_CONNECT_ID'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}
```

## 🔒 Security Best Practices

### 1. Secret Management

- **Use Railway's built-in secret management**
- **Never commit secrets to Git**
- **Use strong, unique secrets**
- **Rotate secrets regularly**

### 2. Secret Generation

Generate secure secrets using these commands:

```bash
# Generate JWT Secret (32+ characters)
openssl rand -base64 32

# Generate NextAuth Secret (32+ characters)
openssl rand -base64 32

# Generate Database Password (16+ characters)
openssl rand -base64 16
```

### 3. Environment-Specific Secrets

Use different secrets for different environments:

```bash
# Production
JWT_SECRET=prod-super-secret-key-32-chars-minimum
NEXTAUTH_SECRET=prod-nextauth-secret-32-chars-minimum

# Preview/Staging
JWT_SECRET=preview-super-secret-key-32-chars-minimum
NEXTAUTH_SECRET=preview-nextauth-secret-32-chars-minimum
```

## 🚨 Troubleshooting

### Common Issues

1. **Missing DATABASE_URL**
   ```bash
   # Solution: Add PostgreSQL plugin
   # Click "+ New" → "PostgreSQL"
   ```

2. **Missing REDIS_URL**
   ```bash
   # Solution: Add Redis plugin
   # Click "+ New" → "Redis"
   ```

3. **JWT_SECRET too short**
   ```bash
   # Solution: Generate longer secret
   openssl rand -base64 32
   ```

4. **NEXTAUTH_URL mismatch**
   ```bash
   # Solution: Use Railway domain variable
   NEXTAUTH_URL=${{frontend.RAILWAY_PUBLIC_DOMAIN}}
   ```

### Debug Commands

```bash
# Check current variables
railway variables

# View application logs
railway logs

# Restart service with new variables
railway up

# Shell into container to check variables
railway shell
env | grep -E "(DATABASE|REDIS|JWT|NEXTAUTH)"
```

### Health Check

Test your configuration:

```bash
# Check health endpoint
curl https://your-app.railway.app/api/health

# Expected response includes:
{
  "status": "healthy",
  "services": {
    "database": { "status": "healthy" },
    "sentry": { "active": true, "dsnConfigured": true }
  },
  "environment": {
    "railwayEnvironment": "production",
    "railwayService": "frontend"
  }
}
```

## 📋 Checklist

Before deploying to production, ensure:

- [ ] PostgreSQL plugin added and connected
- [ ] Redis plugin added and connected
- [ ] All required environment variables set
- [ ] JWT_SECRET is 32+ characters
- [ ] NEXTAUTH_SECRET is 32+ characters
- [ ] NEXTAUTH_URL matches Railway domain
- [ ] Sentry DSN configured (optional but recommended)
- [ ] WalletConnect project ID configured
- [ ] Health check endpoint returns healthy status
- [ ] Application logs show successful database connection
- [ ] No startup errors in Railway logs

## 🔄 Variable Updates

To update environment variables:

1. **Go to Railway Dashboard**
2. **Select your project**
3. **Go to "Variables" tab**
4. **Add or update variables**
5. **Railway automatically restarts services**

For sensitive changes like database credentials:
1. Update variables
2. Monitor deployment logs
3. Verify health checks pass
4. Test application functionality