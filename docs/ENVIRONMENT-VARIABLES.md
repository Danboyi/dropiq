# Environment Variables Configuration

This document outlines all environment variables required for deploying and running the DropIQ platform on Railway.

## Required Environment Variables

### Database Configuration

| Variable | Description | Example | Source |
|----------|-------------|---------|--------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@host:port/database` | Railway PostgreSQL Plugin |
| `REDIS_URL` | Redis connection string for caching | `redis://host:port` | Railway Redis Plugin |

### Authentication & Security

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-super-secret-jwt-key-min-32-chars` | Must be at least 32 characters |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js sessions | `your-nextauth-secret-key` | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Base URL for NextAuth.js | `https://your-app.railway.app` | Must match your Railway app URL |

### External Services

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_WALLET_CONNECT_ID` | WalletConnect Project ID | `your-walletconnect-project-id` | Yes - for wallet connectivity |
| `SENTRY_DSN` | Sentry Data Source Name for error tracking | `https://your-sentry-dsn` | Recommended for production |

### Application Configuration

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `NODE_ENV` | Application environment | `development` | `development`, `production`, `preview` |
| `PORT` | Application port | `3000` | Railway sets this automatically |
| `LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |

## Optional Environment Variables

### Feature Flags

| Variable | Description | Default | Notes |
|----------|-------------|---------|-------|
| `ENABLE_ANALYTICS` | Enable analytics tracking | `true` | Set to `false` to disable |
| `ENABLE_AI_FEATURES` | Enable AI-powered features | `true` | Requires ZAI SDK configuration |
| `ENABLE_SOCIAL_FEATURES` | Enable social/community features | `true` | Set to `false` for private deployment |

### Performance Tuning

| Variable | Description | Default | Recommended |
|----------|-------------|---------|-------------|
| `CACHE_TTL` | Cache time-to-live in seconds | `3600` | Increase for better performance |
| `MAX_DB_CONNECTIONS` | Maximum database connections | `10` | Adjust based on Railway plan |
| `RATE_LIMIT_WINDOW` | Rate limit window in minutes | `15` | Adjust for security needs |

### Development Only

| Variable | Description | Example | Notes |
|----------|-------------|---------|-------|
| `DEBUG_MODE` | Enable debug logging | `false` | Set to `true` for troubleshooting |
| `MOCK_EXTERNAL_APIS` | Mock external API calls | `false` | Useful for development/testing |

## Railway Setup Instructions

### 1. Database Setup

1. In your Railway project, click `+ New` → `PostgreSQL`
2. Railway will automatically create and inject `DATABASE_URL`
3. No additional configuration needed

### 2. Redis Cache Setup

1. In your Railway project, click `+ New` → `Redis`
2. Railway will automatically create and inject `REDIS_URL`
3. No additional configuration needed

### 3. Environment Variables Setup

1. Go to your Railway project settings
2. Click on the "Variables" tab
3. Add all required environment variables from the tables above

### 4. Security Best Practices

#### Generate Secure Secrets

```bash
# Generate JWT Secret
openssl rand -base64 32

# Generate NextAuth Secret
openssl rand -base64 32
```

#### Environment-Specific Values

**Production:**
```bash
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_ANALYTICS=true
SENTRY_DSN=your-production-sentry-dsn
```

**Preview/Staging:**
```bash
NODE_ENV=preview
LOG_LEVEL=debug
ENABLE_ANALYTICS=false
DEBUG_MODE=true
```

## Validation Checklist

Before deploying to production, ensure:

- [ ] `DATABASE_URL` is correctly set and accessible
- [ ] `REDIS_URL` is correctly set and accessible
- [ ] `JWT_SECRET` is at least 32 characters long
- [ ] `NEXTAUTH_SECRET` is generated and unique
- [ ] `NEXTAUTH_URL` matches your Railway app URL
- [ ] `SENTRY_DSN` is configured for error tracking
- [ ] `NODE_ENV` is set to `production`
- [ ] All sensitive values are properly escaped

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` format
   - Check if PostgreSQL plugin is running
   - Ensure database migrations have run

2. **Authentication Failures**
   - Verify `JWT_SECRET` and `NEXTAUTH_SECRET` are set
   - Check `NEXTAUTH_URL` matches your app URL
   - Clear browser cookies and sessions

3. **Build Failures**
   - Check all required environment variables are set
   - Verify no syntax errors in variable values
   - Check Railway build logs for specific errors

### Debug Mode

Enable debug mode to troubleshoot issues:

```bash
DEBUG_MODE=true
LOG_LEVEL=debug
NODE_ENV=development
```

### Health Check

Monitor your deployment health:

```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## Security Considerations

1. **Never commit secrets to git**
2. **Use Railway's encrypted variable storage**
3. **Rotate secrets regularly**
4. **Monitor Sentry for security events**
5. **Use read-only database credentials when possible**

## Support

For issues with Railway deployment:

- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord Community](https://discord.gg/railway)
- [DropIQ GitHub Issues](https://github.com/dropiq/platform/issues)