# Redis Caching Strategy for DropIQ

## Overview

This document outlines the comprehensive Redis caching strategy designed to optimize performance and scalability for the DropIQ platform. The strategy focuses on reducing database load, improving response times, and handling high-traffic scenarios efficiently.

## Cache Architecture

### Primary Cache Categories

1. **User Data Cache** - User profiles, preferences, and sessions
2. **Airdrop Data Cache** - Active airdrops, trending lists, and detailed information
3. **Market Data Cache** - Token prices, market statistics, and trading data
4. **Analytics Cache** - Performance metrics, user activity, and platform statistics
5. **Security Cache** - Rate limiting, failed attempts, and security alerts
6. **Search Cache** - Query results and search suggestions

## Cache Key Naming Convention

```
{category}:{identifier}:{sub-category?}:{specific-id?}
```

Examples:
- `user:12345:preferences`
- `airdrop:active`
- `token:ETH:price`
- `security:failed_login:192.168.1.1`
- `search:base64encodedquery`

## TTL (Time To Live) Strategy

| Cache Type | TTL | Rationale |
|------------|-----|-----------|
| User Sessions | 24 hours | Standard session duration |
| User Profiles | 1 hour | Balance between freshness and performance |
| Active Airdrops | 5 minutes | Critical data that changes frequently |
| Featured Airdrops | 10 minutes | Moderately dynamic content |
| Trending Airdrops | 15 minutes | Calculated trends, less frequent updates |
| Token Prices | 1 minute | Real-time market data |
| Market Data | 2 minutes | Slightly less frequent than individual prices |
| Security Alerts | 5 minutes | Time-sensitive security information |
| Search Results | 5 minutes | Balance between freshness and performance |
| Analytics Data | 10-60 minutes | Depending on aggregation level |
| Rate Limits | Variable | Based on rate limit window |

## Detailed Cache Strategies

### 1. User Management Cache

#### User Profile Caching
```typescript
// Cache user profile with 1-hour TTL
await cacheService.cacheUser(userId, userData, 3600);

// Invalidate on profile update
await cacheService.invalidateUserCache(userId);
```

#### Session Management
```typescript
// Cache session with 24-hour TTL
await cacheService.cacheSession(sessionId, sessionData, 86400);

// Automatic cleanup on logout
await cacheService.deleteSession(sessionId);
```

#### Preferences Cache
- Cached separately from profile for granular updates
- 1-hour TTL with immediate invalidation on changes

### 2. Airdrop Data Cache

#### Multi-Tier Caching Strategy

**Tier 1: Active Airdrops (5 minutes)**
- Most frequently accessed data
- Updated when airdrops start/end or participant counts change

**Tier 2: Featured Airdrops (10 minutes)**
- Curated list of high-quality airdrops
- Updated when featured status changes

**Tier 3: Trending Airdrops (15 minutes)**
- Algorithmically calculated trends
- Updated periodically based on engagement metrics

#### Participant Count Caching
```typescript
// Increment atomically for accurate counts
await cacheService.incrementAirdropParticipants(airdropId);

// Periodic sync with database
await syncParticipantCountsWithDatabase();
```

### 3. Market Data Cache

#### Real-time Price Updates
- Individual token prices: 1-minute TTL
- Market data aggregates: 2-minute TTL
- Historical data: Longer TTL based on age

#### Price Alert System
```typescript
// Cache price thresholds for alerts
await cacheService.set(`price_alert:${symbol}:${threshold}`, alertData, 3600);
```

### 4. Analytics Cache

#### Daily Statistics
- Cached for 24 hours with automatic rollover
- Pre-computed aggregations for fast dashboard loading

#### User Activity Feeds
- Recent activity: 5-minute TTL
- Historical aggregations: Longer TTL based on time period

### 5. Security Cache

#### Rate Limiting
```typescript
// Sliding window rate limiting
const rateLimit = await cacheService.checkRateLimit(
  `api:${userId}:${endpoint}`,
  limit,
  window
);
```

#### Failed Login Attempts
- IP-based tracking with 1-hour TTL
- Automatic lockout after threshold

#### Security Alerts
- Time-sensitive caching with 5-minute TTL
- Immediate invalidation on new alerts

### 6. Search Cache

#### Query Result Caching
- Base64 encoded query keys
- 5-minute TTL for balance between freshness and performance
- Automatic invalidation on data updates

## Cache Invalidation Strategies

### 1. Write-Through Cache
- Database writes trigger immediate cache updates
- Ensures cache consistency

### 2. TTL-Based Expiration
- Automatic expiration for stale data
- Reduces manual invalidation complexity

### 3. Pattern-Based Invalidation
```typescript
// Invalidate all user-related cache
await cacheService.invalidatePattern(`user:${userId}:*`);

// Invalidate all airdrop cache
await cacheService.invalidatePattern(`airdrop:*`);
```

### 4. Event-Driven Invalidation
- Database triggers or application events
- Real-time cache updates

## Performance Optimizations

### 1. Connection Pooling
```typescript
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: true,
});
```

### 2. Pipeline Operations
```typescript
// Batch operations for better performance
const pipeline = redis.pipeline();
pipeline.set('key1', 'value1');
pipeline.set('key2', 'value2');
await pipeline.exec();
```

### 3. Compression for Large Data
```typescript
// Compress large JSON payloads
import { compress, decompress } from 'lz4';

await redis.set(key, compress(JSON.stringify(data)));
const data = JSON.parse(decompress(await redis.get(key)));
```

### 4. Memory Management
- Regular cleanup of expired keys
- Memory usage monitoring
- Eviction policies configuration

## Monitoring and Analytics

### 1. Cache Hit Rate Monitoring
```typescript
// Track cache performance
const cacheStats = {
  hits: 0,
  misses: 0,
  hitRate: () => cacheStats.hits / (cacheStats.hits + cacheStats misses)
};
```

### 2. Memory Usage Tracking
```typescript
// Monitor Redis memory usage
const info = await redis.info('memory');
const usedMemory = parseInt(info.match(/used_memory:(\d+)/)[1]);
```

### 3. Performance Metrics
- Response time improvements
- Database load reduction
- Error rates and timeouts

## Scaling Considerations

### 1. Redis Cluster
- Horizontal scaling for high throughput
- Data sharding across multiple nodes
- Automatic failover

### 2. Read Replicas
- Separate read and write operations
- Improved read performance
- Geographic distribution

### 3. Cache Warming
- Pre-populate critical cache entries
- Background refresh processes
- Predictive caching based on usage patterns

## Security Considerations

### 1. Access Control
```typescript
// Redis authentication
const redis = new Redis({
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true'
});
```

### 2. Data Encryption
- Sensitive data encryption before caching
- TLS for Redis connections
- Key obfuscation for sensitive operations

### 3. Rate Limiting
- API-level rate limiting
- Redis-based distributed rate limiting
- DDoS protection

## Disaster Recovery

### 1. Backup Strategy
- Regular Redis snapshots
- AOF (Append Only File) persistence
- Cross-region replication

### 2. Failover Procedures
- Automatic failover configuration
- Manual override capabilities
- Data consistency verification

### 3. Cache Rebuilding
- Automated cache warming scripts
- Priority-based cache population
- Gradual traffic restoration

## Best Practices

### 1. Cache Key Design
- Descriptive and consistent naming
- Avoid key collisions
- Include versioning for schema changes

### 2. Memory Efficiency
- Use appropriate data structures
- Regular cleanup of unused keys
- Monitor memory usage patterns

### 3. Error Handling
- Graceful degradation when Redis is unavailable
- Retry mechanisms for transient failures
- Fallback to database when needed

### 4. Testing
- Cache behavior testing
- Performance benchmarking
- Load testing with cache simulation

## Implementation Examples

### Cache-Aside Pattern
```typescript
async function getUserProfile(userId: string) {
  // Try cache first
  let user = await cacheService.getUser(userId);
  
  if (!user) {
    // Cache miss - fetch from database
    user = await database.users.findUnique({ where: { id: userId } });
    
    if (user) {
      // Populate cache
      await cacheService.cacheUser(userId, user);
    }
  }
  
  return user;
}
```

### Write-Through Pattern
```typescript
async function updateUserProfile(userId: string, updates: any) {
  // Update database
  const user = await database.users.update({
    where: { id: userId },
    data: updates
  });
  
  // Update cache
  await cacheService.cacheUser(userId, user);
  
  return user;
}
```

### Cache Warming
```typescript
async function warmCache() {
  // Pre-load active airdrops
  const activeAirdrops = await database.airdrops.findMany({
    where: { status: 'active' }
  });
  await cacheService.cacheActiveAirdrops(activeAirdrops);
  
  // Pre-load featured airdrops
  const featuredAirdrops = await database.airdrops.findMany({
    where: { featured: true }
  });
  await cacheService.cacheFeaturedAirdrops(featuredAirdrops);
}
```

This comprehensive caching strategy ensures optimal performance for the DropIQ platform while maintaining data consistency and providing scalability for future growth.