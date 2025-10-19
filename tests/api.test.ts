import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '@/api/server';
import { db } from '@/lib/db';
import { AuthService } from '@/lib/auth';
import { UserRole, AirdropStatus, ScamSeverity } from '@prisma/client';

describe('Authentication Endpoints', () => {
  let testUser: any;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    // Clean up test data
    await db.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.user.deleteMany({
      where: { email: { contains: 'test' } }
    });
    await db.$disconnect();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'testuser@example.com',
        username: 'test_user',
        password: 'SecurePass123!',
        fullName: 'Test User'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user.role).toBe(UserRole.USER);
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();

      testUser = response.body.user;
      accessToken = response.body.tokens.accessToken;
      refreshToken = response.body.tokens.refreshToken;
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        username: 'test_user2',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 400 for weak password', async () => {
      const userData = {
        email: 'testuser2@example.com',
        username: 'test_user2',
        password: 'weak'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });

    it('should return 409 for duplicate email', async () => {
      const userData = {
        email: 'testuser@example.com',
        username: 'test_user3',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.error).toBe('Conflict');
    });
  });

  describe('POST /auth/login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.message).toBe('Login successful');
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.tokens.accessToken).toBeDefined();
      expect(response.body.tokens.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = {
        email: 'testuser@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Authentication Error');
    });

    it('should return 401 for non-existent user', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Authentication Error');
    });
  });

  describe('GET /auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.user.username).toBe('test_user');
      expect(response.body.user.wallets).toBeDefined();
      expect(response.body.user._count).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/v1/auth/profile')
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.error).toBe('Invalid authentication credentials');
    });
  });

  describe('PUT /auth/profile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        fullName: 'Updated Test User',
        bio: 'Crypto enthusiast and airdrop hunter',
        preferences: {
          emailNotifications: true,
          theme: 'dark'
        }
      };

      const response = await request(app)
        .put('/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.user.fullName).toBe(updateData.fullName);
      expect(response.body.user.bio).toBe(updateData.bio);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
    });
  });
});

describe('Airdrop Endpoints', () => {
  let accessToken: string;
  let testAirdrop: any;

  beforeAll(async () => {
    // Create test user and get token
    const userData = {
      email: 'airdroptest@example.com',
      username: 'airdrop_test',
      password: 'SecurePass123!',
      fullName: 'Airdrop Test User'
    };

    const registerResponse = await request(app)
      .post('/v1/auth/register')
      .send(userData);

    accessToken = registerResponse.body.tokens.accessToken;

    // Create test project for airdrops
    const testProject = await db.project.create({
      data: {
        name: 'Test Project',
        description: 'Test project for airdrops',
        chain: 'ETHEREUM',
        website: 'https://testproject.com',
        isVerified: true
      }
    });

    // Create test airdrop
    testAirdrop = await db.airdrop.create({
      data: {
        projectId: testProject.id,
        title: 'Test Airdrop',
        description: 'Test airdrop for testing',
        type: 'STANDARD',
        totalAmount: 10000,
        tokenSymbol: 'TEST',
        status: AirdropStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        maxParticipants: 1000
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await db.airdrop.deleteMany({
      where: { title: { contains: 'Test' } }
    });
    await db.project.deleteMany({
      where: { name: { contains: 'Test' } }
    });
    await db.user.deleteMany({
      where: { email: { contains: 'airdroptest' } }
    });
  });

  describe('GET /airdrops', () => {
    it('should get airdrops without authentication', async () => {
      const response = await request(app)
        .get('/v1/airdrops')
        .expect(200);

      expect(response.body.airdrops).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(Array.isArray(response.body.airdrops)).toBe(true);
    });

    it('should get airdrops with filters', async () => {
      const response = await request(app)
        .get('/v1/airdrops?status=ACTIVE&type=STANDARD&page=1&limit=10')
        .expect(200);

      expect(response.body.airdrops).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should get featured airdrops', async () => {
      const response = await request(app)
        .get('/v1/airdrops/featured')
        .expect(200);

      expect(response.body.featuredAirdrops).toBeDefined();
      expect(Array.isArray(response.body.featuredAirdrops)).toBe(true);
    });
  });

  describe('GET /airdrops/:id', () => {
    it('should get airdrop by ID', async () => {
      const response = await request(app)
        .get(`/v1/airdrops/${testAirdrop.id}`)
        .expect(200);

      expect(response.body.airdrop.id).toBe(testAirdrop.id);
      expect(response.body.airdrop.title).toBe(testAirdrop.title);
    });

    it('should return 404 for non-existent airdrop', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174000';
      const response = await request(app)
        .get(`/v1/airdrops/${fakeId}`)
        .expect(404);

      expect(response.body.error).toBe('Not Found');
    });
  });

  describe('POST /airdrops/:id/participate', () => {
    it('should participate in airdrop successfully', async () => {
      const participationData = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45',
        socialProfiles: {
          twitter: '@crypto_user',
          discord: 'crypto_user#1234'
        }
      };

      const response = await request(app)
        .post(`/v1/airdrops/${testAirdrop.id}/participate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(participationData)
        .expect(201);

      expect(response.body.message).toBe('Participation successful');
      expect(response.body.participation.walletAddress).toBe(participationData.walletAddress);
    });

    it('should return 401 without authentication', async () => {
      const participationData = {
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45'
      };

      const response = await request(app)
        .post(`/v1/airdrops/${testAirdrop.id}/participate`)
        .send(participationData)
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 400 for invalid wallet address', async () => {
      const participationData = {
        walletAddress: 'invalid-address'
      };

      const response = await request(app)
        .post(`/v1/airdrops/${testAirdrop.id}/participate`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(participationData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });
});

describe('Security Endpoints', () => {
  let accessToken: string;
  let testScamReport: any;

  beforeAll(async () => {
    // Create test user and get token
    const userData = {
      email: 'securitytest@example.com',
      username: 'security_test',
      password: 'SecurePass123!',
      fullName: 'Security Test User'
    };

    const registerResponse = await request(app)
      .post('/v1/auth/register')
      .send(userData);

    accessToken = registerResponse.body.tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await db.scamReport.deleteMany({
      where: { title: { contains: 'Test' } }
    });
    await db.user.deleteMany({
      where: { email: { contains: 'securitytest' } }
    });
  });

  describe('GET /security/scam-reports', () => {
    it('should get scam reports without authentication', async () => {
      const response = await request(app)
        .get('/v1/security/scam-reports')
        .expect(200);

      expect(response.body.reports).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(Array.isArray(response.body.reports)).toBe(true);
    });

    it('should get scam reports with filters', async () => {
      const response = await request(app)
        .get('/v1/security/scam-reports?verified=true&severity=HIGH&page=1&limit=10')
        .expect(200);

      expect(response.body.reports).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
    });
  });

  describe('POST /security/scam-reports', () => {
    it('should create scam report successfully', async () => {
      const reportData = {
        title: 'Test Scam Report',
        description: 'This is a test scam report for testing purposes',
        type: 'PHISHING',
        severity: ScamSeverity.HIGH,
        targetUrl: 'https://test-scam.com',
        targetProject: 'Test Scam Project',
        tags: ['test', 'phishing', 'scam']
      };

      const response = await request(app)
        .post('/v1/security/scam-reports')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reportData)
        .expect(201);

      expect(response.body.message).toBe('Scam report submitted successfully');
      expect(response.body.report.title).toBe(reportData.title);
      expect(response.body.report.type).toBe(reportData.type);
      expect(response.body.report.severity).toBe(reportData.severity);

      testScamReport = response.body.report;
    });

    it('should return 401 without authentication', async () => {
      const reportData = {
        title: 'Test Scam Report',
        description: 'This is a test scam report',
        type: 'PHISHING',
        severity: ScamSeverity.HIGH
      };

      const response = await request(app)
        .post('/v1/security/scam-reports')
        .send(reportData)
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });

    it('should return 400 for missing required fields', async () => {
      const reportData = {
        description: 'This is a test scam report'
      };

      const response = await request(app)
        .post('/v1/security/scam-reports')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(reportData)
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('POST /security/analyze', () => {
    it('should analyze potential scam successfully', async () => {
      const analysisData = {
        url: 'https://suspicious-site.com',
        description: 'Suspicious website asking for private keys',
        projectName: 'Suspicious Project'
      };

      const response = await request(app)
        .post('/v1/security/analyze')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(analysisData)
        .expect(200);

      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.riskScore).toBeDefined();
      expect(response.body.analysis.scamProbability).toBeDefined();
      expect(response.body.analysis.riskLevel).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      const analysisData = {
        url: 'https://suspicious-site.com'
      };

      const response = await request(app)
        .post('/v1/security/analyze')
        .send(analysisData)
        .expect(401);

      expect(response.body.error).toBe('Authentication required');
    });
  });
});

describe('System Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/v1/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeDefined();
      expect(response.body.version).toBeDefined();
      expect(response.body.services).toBeDefined();
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/v1/')
        .expect(200);

      expect(response.body.name).toBe('DropIQ API');
      expect(response.body.version).toBeDefined();
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.status).toBe('operational');
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/v1/non-existent-route')
      .expect(404);

    expect(response.body.error).toBe('Not Found');
  });

  it('should handle invalid JSON in request body', async () => {
    const response = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send('invalid-json')
      .expect(400);

    expect(response.body.error).toBeDefined();
  });

  it('should handle rate limiting', async () => {
    // Make multiple rapid requests to trigger rate limiting
    const promises = Array(10).fill(null).map(() =>
      request(app).post('/v1/auth/login').send({
        email: 'test@example.com',
        password: 'testpassword'
      })
    );

    const responses = await Promise.all(promises);
    
    // At least one should be rate limited
    const rateLimitedResponse = responses.find(res => res.status === 429);
    expect(rateLimitedResponse).toBeDefined();
    expect(rateLimitedResponse.body.error).toBe('Rate Limit Exceeded');
  });
});