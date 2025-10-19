import Redis from 'ioredis';
import { logger } from '../utils/logger';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.redis.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error);
    });
  }

  // ========================================
  // USER CACHE STRATEGIES
  // ========================================

  async cacheUser(userId: string, userData: any, ttl = this.defaultTTL) {
    const key = `user:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(userData));
  }

  async getUser(userId: string) {
    const key = `user:${userId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheUserPreferences(userId: string, preferences: any, ttl = this.defaultTTL) {
    const key = `user:${userId}:preferences`;
    await this.redis.setex(key, ttl, JSON.stringify(preferences));
  }

  async getUserPreferences(userId: string) {
    const key = `user:${userId}:preferences`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheUserWallets(userId: string, wallets: any[], ttl = this.defaultTTL) {
    const key = `user:${userId}:wallets`;
    await this.redis.setex(key, ttl, JSON.stringify(wallets));
  }

  async getUserWallets(userId: string) {
    const key = `user:${userId}:wallets`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async invalidateUserCache(userId: string) {
    const pattern = `user:${userId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // ========================================
  // AIRDROP CACHE STRATEGIES
  // ========================================

  async cacheActiveAirdrops(airdrops: any[], ttl = 300) { // 5 minutes
    const key = 'airdrops:active';
    await this.redis.setex(key, ttl, JSON.stringify(airdrops));
  }

  async getActiveAirdrops() {
    const key = 'airdrops:active';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheFeaturedAirdrops(airdrops: any[], ttl = 600) { // 10 minutes
    const key = 'airdrops:featured';
    await this.redis.setex(key, ttl, JSON.stringify(airdrops));
  }

  async getFeaturedAirdrops() {
    const key = 'airdrops:featured';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheTrendingAirdrops(airdrops: any[], ttl = 900) { // 15 minutes
    const key = 'airdrops:trending';
    await this.redis.setex(key, ttl, JSON.stringify(airdrops));
  }

  async getTrendingAirdrops() {
    const key = 'airdrops:trending';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheAirdropDetails(airdropId: string, details: any, ttl = this.defaultTTL) {
    const key = `airdrop:${airdropId}`;
    await this.redis.setex(key, ttl, JSON.stringify(details));
  }

  async getAirdropDetails(airdropId: string) {
    const key = `airdrop:${airdropId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheAirdropParticipants(airdropId: string, participants: number, ttl = 300) {
    const key = `airdrop:${airdropId}:participants`;
    await this.redis.setex(key, ttl, participants.toString());
  }

  async getAirdropParticipants(airdropId: string) {
    const key = `airdrop:${airdropId}:participants`;
    const data = await this.redis.get(key);
    return data ? parseInt(data) : null;
  }

  async incrementAirdropParticipants(airdropId: string) {
    const key = `airdrop:${airdropId}:participants`;
    return await this.redis.incr(key);
  }

  async invalidateAirdropCache(airdropId: string) {
    const pattern = `airdrop:${airdropId}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // ========================================
  // PROJECT CACHE STRATEGIES
  // ========================================

  async cacheProjectDetails(projectId: string, details: any, ttl = this.defaultTTL) {
    const key = `project:${projectId}`;
    await this.redis.setex(key, ttl, JSON.stringify(details));
  }

  async getProjectDetails(projectId: string) {
    const key = `project:${projectId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheProjectTrustScore(projectId: string, score: number, ttl = 1800) { // 30 minutes
    const key = `project:${projectId}:trust_score`;
    await this.redis.setex(key, ttl, score.toString());
  }

  async getProjectTrustScore(projectId: string) {
    const key = `project:${projectId}:trust_score`;
    const data = await this.redis.get(key);
    return data ? parseFloat(data) : null;
  }

  // ========================================
  // MARKET DATA CACHE STRATEGIES
  // ========================================

  async cacheTokenPrice(symbol: string, price: number, ttl = 60) { // 1 minute
    const key = `token:${symbol}:price`;
    await this.redis.setex(key, ttl, price.toString());
  }

  async getTokenPrice(symbol: string) {
    const key = `token:${symbol}:price`;
    const data = await this.redis.get(key);
    return data ? parseFloat(data) : null;
  }

  async cacheMarketData(symbols: string[], marketData: any[], ttl = 120) { // 2 minutes
    const key = 'market:data';
    await this.redis.setex(key, ttl, JSON.stringify(marketData));
  }

  async getMarketData() {
    const key = 'market:data';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ========================================
  // ANALYTICS CACHE STRATEGIES
  // ========================================

  async cacheDailyStats(date: string, stats: any, ttl = 86400) { // 24 hours
    const key = `stats:daily:${date}`;
    await this.redis.setex(key, ttl, JSON.stringify(stats));
  }

  async getDailyStats(date: string) {
    const key = `stats:daily:${date}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheUserActivity(userId: string, activity: any[], ttl = 300) { // 5 minutes
    const key = `user:${userId}:activity`;
    await this.redis.setex(key, ttl, JSON.stringify(activity));
  }

  async getUserActivity(userId: string) {
    const key = `user:${userId}:activity`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheAirdropMetrics(airdropId: string, metrics: any, ttl = 600) { // 10 minutes
    const key = `airdrop:${airdropId}:metrics`;
    await this.redis.setex(key, ttl, JSON.stringify(metrics));
  }

  async getAirdropMetrics(airdropId: string) {
    const key = `airdrop:${airdropId}:metrics`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ========================================
  // SECURITY CACHE STRATEGIES
  // ========================================

  async cacheSecurityAlerts(alerts: any[], ttl = 300) { // 5 minutes
    const key = 'security:alerts';
    await this.redis.setex(key, ttl, JSON.stringify(alerts));
  }

  async getSecurityAlerts() {
    const key = 'security:alerts';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheScamReports(reports: any[], ttl = 600) { // 10 minutes
    const key = 'security:scam_reports';
    await this.redis.setex(key, ttl, JSON.stringify(reports));
  }

  async getScamReports() {
    const key = 'security:scam_reports';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheFailedLoginAttempts(ip: string, attempts: number, ttl = 3600) { // 1 hour
    const key = `security:failed_login:${ip}`;
    await this.redis.setex(key, ttl, attempts.toString());
  }

  async getFailedLoginAttempts(ip: string) {
    const key = `security:failed_login:${ip}`;
    const data = await this.redis.get(key);
    return data ? parseInt(data) : 0;
  }

  async incrementFailedLoginAttempts(ip: string) {
    const key = `security:failed_login:${ip}`;
    return await this.redis.incr(key);
  }

  // ========================================
  // SHILLING MARKETPLACE CACHE
  // ========================================

  async cacheActiveCampaigns(campaigns: any[], ttl = 300) { // 5 minutes
    const key = 'campaigns:active';
    await this.redis.setex(key, ttl, JSON.stringify(campaigns));
  }

  async getActiveCampaigns() {
    const key = 'campaigns:active';
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async cacheCampaignDetails(campaignId: string, details: any, ttl = this.defaultTTL) {
    const key = `campaign:${campaignId}`;
    await this.redis.setex(key, ttl, JSON.stringify(details));
  }

  async getCampaignDetails(campaignId: string) {
    const key = `campaign:${campaignId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  async cacheSession(sessionId: string, sessionData: any, ttl = 86400) { // 24 hours
    const key = `session:${sessionId}`;
    await this.redis.setex(key, ttl, JSON.stringify(sessionData));
  }

  async getSession(sessionId: string) {
    const key = `session:${sessionId}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string) {
    const key = `session:${sessionId}`;
    await this.redis.del(key);
  }

  // ========================================
  // RATE LIMITING
  // ========================================

  async checkRateLimit(identifier: string, limit: number, window: number) {
    const key = `rate_limit:${identifier}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, window);
    }
    
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetTime: await this.redis.ttl(key)
    };
  }

  // ========================================
  // SEARCH CACHE
  // ========================================

  async cacheSearchResults(query: string, results: any[], ttl = 300) { // 5 minutes
    const key = `search:${Buffer.from(query).toString('base64')}`;
    await this.redis.setex(key, ttl, JSON.stringify(results));
  }

  async getSearchResults(query: string) {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  async invalidatePattern(pattern: string) {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
    return keys.length;
  }

  async set(key: string, value: any, ttl = this.defaultTTL) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async get(key: string) {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key: string) {
    return await this.redis.del(key);
  }

  async exists(key: string) {
    return await this.redis.exists(key);
  }

  async expire(key: string, ttl: number) {
    return await this.redis.expire(key, ttl);
  }

  async ttl(key: string) {
    return await this.redis.ttl(key);
  }

  async flush() {
    return await this.redis.flushdb();
  }

  async disconnect() {
    await this.redis.disconnect();
  }
}

export const cacheService = new CacheService();