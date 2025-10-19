import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

// Test database configuration
const TEST_DATABASE_URL = 'file:./test.db'
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
})

describe('Database Integration Tests', () => {
  beforeAll(async () => {
    // Set up test database
    process.env.DATABASE_URL = TEST_DATABASE_URL
    
    // Push schema to test database
    execSync('npx prisma db push --force-reset', {
      env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
      stdio: 'inherit',
    })
    
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    
    // Clean up test database
    try {
      execSync('rm -f test.db', { stdio: 'inherit' })
    } catch (error) {
      // Ignore cleanup errors
    }
  })

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.userBehavior.deleteMany()
    await prisma.user.deleteMany()
    await prisma.authSession.deleteMany()
    await prisma.airdrop.deleteMany()
    await prisma.project.deleteMany()
  })

  describe('User Management', () => {
    it('should create and retrieve users', async () => {
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        displayName: 'Test User',
        role: 'user',
      }

      const createdUser = await prisma.user.create({
        data: userData,
      })

      expect(createdUser).toBeDefined()
      expect(createdUser.email).toBe(userData.email)
      expect(createdUser.username).toBe(userData.username)
      expect(createdUser.isActive).toBe(true)
      expect(createdUser.isPremium).toBe(false)
      expect(createdUser.createdAt).toBeInstanceOf(Date)

      // Retrieve user
      const retrievedUser = await prisma.user.findUnique({
        where: { id: createdUser.id },
      })

      expect(retrievedUser).toEqual(createdUser)
    })

    it('should handle user authentication sessions', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      const sessionData = {
        userId: user.id,
        token: 'session-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        ipAddress: '127.0.0.1',
        userAgent: 'Test Agent',
      }

      const createdSession = await prisma.authSession.create({
        data: sessionData,
      })

      expect(createdSession).toBeDefined()
      expect(createdSession.userId).toBe(user.id)
      expect(createdSession.isActive).toBe(true)

      // Test session retrieval with user relation
      const sessionWithUser = await prisma.authSession.findUnique({
        where: { id: createdSession.id },
        include: { user: true },
      })

      expect(sessionWithUser?.user).toBeDefined()
      expect(sessionWithUser?.user.email).toBe(user.email)
    })

    it('should enforce unique constraints', async () => {
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      // Should fail to create user with same email
      await expect(
        prisma.user.create({
          data: {
            email: 'test@example.com',
            username: 'differentuser',
          },
        })
      ).rejects.toThrow()

      // Should fail to create user with same username
      await expect(
        prisma.user.create({
          data: {
            email: 'different@example.com',
            username: 'testuser',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('Airdrop Management', () => {
    it('should create and retrieve airdrops with projects', async () => {
      const projectData = {
        name: 'Test Project',
        slug: 'test-project',
        description: 'A test project for airdrop',
        website: 'https://testproject.com',
        category: 'defi',
        blockchain: 'ethereum',
        trustScore: 75.5,
      }

      const project = await prisma.project.create({
        data: projectData,
      })

      const airdropData = {
        title: 'Test Airdrop',
        slug: 'test-airdrop',
        description: 'A test airdrop for testing',
        shortDescription: 'Test airdrop',
        projectId: project.id,
        status: 'active',
        type: 'standard',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalAmount: 10000.0,
        tokenSymbol: 'TEST',
        participantsCount: 0,
        trustScore: 80.0,
        featured: false,
        trending: false,
      }

      const airdrop = await prisma.airdrop.create({
        data: airdropData,
      })

      expect(airdrop).toBeDefined()
      expect(airdrop.title).toBe(airdropData.title)
      expect(airdrop.projectId).toBe(project.id)

      // Test retrieval with project relation
      const airdropWithProject = await prisma.airdrop.findUnique({
        where: { id: airdrop.id },
        include: { project: true },
      })

      expect(airdropWithProject?.project).toBeDefined()
      expect(airdropWithProject?.project.name).toBe(project.name)
    })

    it('should handle airdrop status transitions', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          slug: 'test-project',
          description: 'Test project',
          website: 'https://testproject.com',
          category: 'defi',
          blockchain: 'ethereum',
        },
      })

      const airdrop = await prisma.airdrop.create({
        data: {
          title: 'Test Airdrop',
          slug: 'test-airdrop',
          description: 'Test airdrop',
          projectId: project.id,
          status: 'upcoming',
          type: 'standard',
          startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          totalAmount: 10000.0,
        },
      })

      // Update to active
      const updatedAirdrop = await prisma.airdrop.update({
        where: { id: airdrop.id },
        data: {
          status: 'active',
          startDate: new Date(),
        },
      })

      expect(updatedAirdrop.status).toBe('active')

      // Update to ended
      const endedAirdrop = await prisma.airdrop.update({
        where: { id: airdrop.id },
        data: {
          status: 'ended',
          endDate: new Date(),
        },
      })

      expect(endedAirdrop.status).toBe('ended')
    })

    it('should handle decimal values correctly', async () => {
      const project = await prisma.project.create({
        data: {
          name: 'Test Project',
          slug: 'test-project',
          description: 'Test project',
          website: 'https://testproject.com',
          category: 'defi',
          blockchain: 'ethereum',
        },
      })

      const airdrop = await prisma.airdrop.create({
        data: {
          title: 'Test Airdrop',
          slug: 'test-airdrop',
          description: 'Test airdrop',
          projectId: project.id,
          status: 'active',
          type: 'standard',
          startDate: new Date(),
          totalAmount: 12345.6789, // Test decimal precision
          minRewardAmount: 0.001,
          maxRewardAmount: 9999.9999,
          trustScore: 87.654321,
        },
      })

      expect(airdrop.totalAmount.toNumber()).toBe(12345.6789)
      expect(airdrop.minRewardAmount?.toNumber()).toBe(0.001)
      expect(airdrop.maxRewardAmount?.toNumber()).toBe(9999.9999)
      expect(airdrop.trustScore.toNumber()).toBe(87.654321)
    })
  })

  describe('User Behavior Analytics', () => {
    it('should create and retrieve behavior events', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      const behaviorData = {
        userId: user.id,
        sessionId: 'session-123',
        eventType: 'click',
        eventName: 'button_click',
        eventData: { buttonId: 'submit', page: 'home' },
        pageUrl: 'https://dropiq.com',
        pageTitle: 'DropIQ - Home',
        referrer: 'https://google.com',
        userAgent: 'Mozilla/5.0...',
        ipAddress: '127.0.0.1',
        duration: 5000,
        scrollDepth: 75,
        metadata: { source: 'organic' },
      }

      const behavior = await prisma.userBehavior.create({
        data: behaviorData,
      })

      expect(behavior).toBeDefined()
      expect(behavior.userId).toBe(user.id)
      expect(behavior.eventType).toBe('click')
      expect(behavior.eventName).toBe('button_click')
      expect(behavior.duration).toBe(5000)
      expect(behavior.scrollDepth).toBe(75)
      expect(behavior.metadata).toEqual({ source: 'organic' })

      // Test retrieval with user relation
      const behaviorWithUser = await prisma.userBehavior.findUnique({
        where: { id: behavior.id },
        include: { user: true },
      })

      expect(behaviorWithUser?.user).toBeDefined()
      expect(behaviorWithUser?.user.email).toBe(user.email)
    })

    it('should handle large metadata objects', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      const largeMetadata = {
        source: 'organic',
        campaign: 'summer2024',
        utm: {
          source: 'google',
          medium: 'cpc',
          campaign: 'test',
          term: 'airdrop',
          content: 'ad1',
        },
        device: {
          type: 'desktop',
          os: 'windows',
          browser: 'chrome',
          version: '120.0.0.0',
        },
        location: {
          country: 'US',
          region: 'CA',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles',
        },
        custom: {
          feature1: 'value1',
          feature2: 'value2',
          feature3: 'value3',
        },
      }

      const behavior = await prisma.userBehavior.create({
        data: {
          userId: user.id,
          sessionId: 'session-123',
          eventType: 'view',
          eventName: 'page_view',
          eventData: { page: 'home' },
          pageUrl: 'https://dropiq.com',
          pageTitle: 'DropIQ - Home',
          metadata: largeMetadata,
        },
      })

      expect(behavior.metadata).toEqual(largeMetadata)

      // Test retrieval of large metadata
      const retrievedBehavior = await prisma.userBehavior.findUnique({
        where: { id: behavior.id },
      })

      expect(retrievedBehavior?.metadata).toEqual(largeMetadata)
    })

    it('should query behavior events efficiently', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      // Create multiple behavior events
      const events = Array.from({ length: 100 }, (_, i) => ({
        userId: user.id,
        sessionId: 'session-123',
        eventType: ['click', 'view', 'scroll'][i % 3],
        eventName: `event_${i}`,
        eventData: { index: i },
        pageUrl: 'https://dropiq.com',
        pageTitle: 'DropIQ - Home',
        timestamp: new Date(Date.now() - i * 1000), // Staggered timestamps
      }))

      await prisma.userBehavior.createMany({
        data: events,
      })

      // Test querying with filters
      const startTime = Date.now()
      const clickEvents = await prisma.userBehavior.findMany({
        where: {
          userId: user.id,
          eventType: 'click',
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      })
      const endTime = Date.now()

      expect(clickEvents).toHaveLength(34) // 100 events / 3 types ≈ 33-34 events per type
      expect(endTime - startTime).toBeLessThan(100) // Query should be fast

      // Test aggregation queries
      const aggregationStart = Date.now()
      const eventCounts = await prisma.userBehavior.groupBy({
        by: ['eventType'],
        where: { userId: user.id },
        _count: { eventType: true },
      })
      const aggregationEnd = Date.now()

      expect(eventCounts).toHaveLength(3)
      expect(eventCounts.find(e => e.eventType === 'click')?._count.eventType).toBe(34)
      expect(aggregationEnd - aggregationStart).toBeLessThan(100) // Aggregation should be fast
    })
  })

  describe('Database Performance', () => {
    it('should handle concurrent operations', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      // Create many behavior events concurrently
      const promises = Array.from({ length: 1000 }, (_, i) =>
        prisma.userBehavior.create({
          data: {
            userId: user.id,
            sessionId: 'session-123',
            eventType: 'click',
            eventName: `event_${i}`,
            eventData: { index: i },
            pageUrl: 'https://dropiq.com',
            pageTitle: 'DropIQ - Home',
          },
        })
      )

      const startTime = Date.now()
      await Promise.all(promises)
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds

      // Verify all events were created
      const count = await prisma.userBehavior.count({
        where: { userId: user.id },
      })
      expect(count).toBe(1000)
    })

    it('should maintain performance with large datasets', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      // Create a large dataset
      await prisma.userBehavior.createMany({
        data: Array.from({ length: 10000 }, (_, i) => ({
          userId: user.id,
          sessionId: 'session-123',
          eventType: ['click', 'view', 'scroll', 'form_submit'][i % 4],
          eventName: `event_${i}`,
          eventData: { index: i },
          pageUrl: 'https://dropiq.com',
          pageTitle: 'DropIQ - Home',
          timestamp: new Date(Date.now() - i * 1000),
        })),
      })

      // Test query performance
      const startTime = Date.now()
      const results = await prisma.userBehavior.findMany({
        where: {
          userId: user.id,
          eventType: 'click',
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      })
      const endTime = Date.now()

      expect(results).toHaveLength(100)
      expect(endTime - startTime).toBeLessThan(200) // Should be fast even with large dataset
    })

    it('should handle transactions correctly', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          username: 'testuser',
        },
      })

      // Test successful transaction
      await prisma.$transaction(async (tx) => {
        await tx.userBehavior.create({
          data: {
            userId: user.id,
            sessionId: 'session-123',
            eventType: 'click',
            eventName: 'event1',
            eventData: {},
            pageUrl: 'https://dropiq.com',
            pageTitle: 'DropIQ - Home',
          },
        })

        await tx.userBehavior.create({
          data: {
            userId: user.id,
            sessionId: 'session-123',
            eventType: 'view',
            eventName: 'event2',
            eventData: {},
            pageUrl: 'https://dropiq.com',
            pageTitle: 'DropIQ - Home',
          },
        })
      })

      const count = await prisma.userBehavior.count({
        where: { userId: user.id },
      })
      expect(count).toBe(2)

      // Test failed transaction (rollback)
      try {
        await prisma.$transaction(async (tx) => {
          await tx.userBehavior.create({
            data: {
              userId: user.id,
              sessionId: 'session-123',
              eventType: 'click',
              eventName: 'event3',
              eventData: {},
              pageUrl: 'https://dropiq.com',
              pageTitle: 'DropIQ - Home',
            },
          })

          // This will cause an error
          await tx.user.create({
            data: {
              email: 'test@example.com', // Duplicate email
              username: 'testuser2',
            },
          })
        })
      } catch (error) {
        // Expected error
      }

      // Count should still be 2 (transaction rolled back)
      const finalCount = await prisma.userBehavior.count({
        where: { userId: user.id },
      })
      expect(finalCount).toBe(2)
    })
  })
})