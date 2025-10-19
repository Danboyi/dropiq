import request from 'supertest'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/analytics/behavior/route'

// Mock the database for integration testing
const mockDb = {
  userBehavior: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  dataPrivacySettings: {
    findUnique: jest.fn(),
  },
  airdropAnalytics: {
    upsert: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  },
}

// Mock the db module
jest.mock('@/lib/db', () => mockDb)

// Mock ZAI
jest.mock('z-ai-web-dev-sdk', () => ({
  __esModule: true,
  default: class MockZAI {
    static async create() {
      return {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'Mock AI analysis',
                },
              }],
            }),
          },
        },
      }
    }
  },
}))

describe('Analytics API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/analytics/behavior', () => {
    it('should successfully track a behavior event', async () => {
      const eventData = {
        eventType: 'click',
        eventName: 'button_click',
        eventData: { buttonId: 'submit', page: 'home' },
        pageUrl: 'https://dropiq.com',
        pageTitle: 'DropIQ - Home',
        sessionId: 'session123',
        userId: 'user123',
        duration: 5000,
        scrollDepth: 75,
      }

      const mockCreatedBehavior = {
        id: 'behavior123',
        ...eventData,
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
      }

      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)
      mockDb.dataPrivacySettings.findUnique.mockResolvedValue({
        userId: 'user123',
        analyticsConsent: true,
      })

      const mockRequest = {
        json: async () => eventData,
        ip: '127.0.0.1',
      } as NextRequest

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.id).toBe('behavior123')
      expect(mockDb.userBehavior.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'click',
          eventName: 'button_click',
          eventData: { buttonId: 'submit', page: 'home' },
          pageUrl: 'https://dropiq.com',
          pageTitle: 'DropIQ - Home',
          sessionId: 'session123',
          userId: 'user123',
          duration: 5000,
          scrollDepth: 75,
          ipAddress: '127.0.0.1',
        }),
      })
    })

    it('should handle airdrop interaction with analytics update', async () => {
      const eventData = {
        eventType: 'airdrop_interact',
        eventName: 'view',
        eventData: { airdropId: 'airdrop123', source: 'list' },
        pageUrl: 'https://dropiq.com/airdrops',
        pageTitle: 'DropIQ - Airdrops',
        sessionId: 'session123',
      }

      const mockCreatedBehavior = {
        id: 'behavior123',
        ...eventData,
        timestamp: new Date(),
      }

      const mockAnalytics = {
        id: 'analytics123',
        airdropId: 'airdrop123',
        date: new Date(),
        views: 1,
        clicks: 0,
        registrations: 0,
        completions: 0,
      }

      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)
      mockDb.airdropAnalytics.upsert.mockResolvedValue(mockAnalytics)
      mockDb.airdropAnalytics.findUnique.mockResolvedValue(mockAnalytics)

      const mockRequest = {
        json: async () => eventData,
        ip: '127.0.0.1',
      } as NextRequest

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockDb.airdropAnalytics.upsert).toHaveBeenCalled()
      expect(mockDb.airdropAnalytics.update).toHaveBeenCalledWith({
        where: { id: 'analytics123' },
        data: { views: { increment: 1 } },
      })
    })

    it('should respect user privacy settings', async () => {
      const eventData = {
        userId: 'user123',
        eventType: 'click',
        eventName: 'button_click',
      }

      mockDb.dataPrivacySettings.findUnique.mockResolvedValue({
        userId: 'user123',
        analyticsConsent: false,
      })

      const mockRequest = {
        json: async () => eventData,
        ip: '127.0.0.1',
      } as NextRequest

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Analytics tracking disabled by user')
      expect(mockDb.userBehavior.create).not.toHaveBeenCalled()
    })

    it('should handle batch behavior tracking', async () => {
      const events = [
        {
          eventType: 'click',
          eventName: 'button_click',
          eventData: { buttonId: 'submit' },
        },
        {
          eventType: 'view',
          eventName: 'page_view',
          eventData: { page: 'home' },
        },
        {
          eventType: 'scroll',
          eventName: 'page_scroll',
          eventData: { depth: 50 },
        },
      ]

      const mockRequest = {
        json: async () => ({ events }),
        ip: '127.0.0.1',
      } as NextRequest

      // Mock successful creation for each event
      events.forEach((event, index) => {
        mockDb.userBehavior.create.mockResolvedValueOnce({
          id: `behavior${index}`,
          ...event,
          timestamp: new Date(),
        })
      })

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockDb.userBehavior.create).toHaveBeenCalledTimes(3)
    })

    it('should handle malformed JSON gracefully', async () => {
      const mockRequest = {
        json: async () => {
          throw new Error('Invalid JSON')
        },
        ip: '127.0.0.1',
      } as NextRequest

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to track behavior')
    })
  })

  describe('GET /api/analytics/behavior', () => {
    it('should retrieve behavior analytics with filters', async () => {
      const mockBehaviors = [
        {
          id: 'behavior1',
          userId: 'user123',
          eventType: 'click',
          eventName: 'button_click',
          pageUrl: 'https://dropiq.com/home',
          timestamp: new Date('2024-01-01T10:00:00Z'),
          duration: 5000,
        },
        {
          id: 'behavior2',
          userId: 'user123',
          eventType: 'view',
          eventName: 'page_view',
          pageUrl: 'https://dropiq.com/airdrops',
          timestamp: new Date('2024-01-01T10:05:00Z'),
          duration: 3000,
        },
        {
          id: 'behavior3',
          userId: 'user456',
          eventType: 'click',
          eventName: 'button_click',
          pageUrl: 'https://dropiq.com/marketplace',
          timestamp: new Date('2024-01-01T10:10:00Z'),
          duration: 7000,
        },
      ]

      mockDb.userBehavior.findMany.mockResolvedValue(mockBehaviors)

      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior?userId=user123&startDate=2024-01-01&endDate=2024-01-02&limit=100')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.behaviors).toHaveLength(3)
      expect(data.total).toBe(3)
      expect(data.insights).toBeDefined()
      expect(mockDb.userBehavior.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user123',
          timestamp: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-02'),
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 100,
      })
    })

    it('should generate comprehensive insights', async () => {
      const mockBehaviors = [
        {
          id: 'behavior1',
          eventType: 'click',
          eventName: 'button_click',
          pageUrl: 'https://dropiq.com/home',
          duration: 5000,
          scrollDepth: 75,
        },
        {
          id: 'behavior2',
          eventType: 'view',
          eventName: 'page_view',
          pageUrl: 'https://dropiq.com/home',
          duration: 8000,
          scrollDepth: 90,
        },
        {
          id: 'behavior3',
          eventType: 'form_submit',
          eventName: 'contact_form',
          pageUrl: 'https://dropiq.com/contact',
          duration: 12000,
          scrollDepth: 50,
        },
      ]

      mockDb.userBehavior.findMany.mockResolvedValue(mockBehaviors)

      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.insights).toEqual({
        totalEvents: 3,
        uniquePages: 2,
        avgSessionDuration: 8333.33, // (5000 + 8000 + 12000) / 3
        topEventTypes: {
          click: 1,
          view: 1,
          form_submit: 1,
        },
        engagementScore: 33.33, // 1 engagement event / 3 total events * 100
        behaviorPatterns: expect.any(Array),
      })
    })

    it('should handle large datasets efficiently', async () => {
      const mockBehaviors = Array.from({ length: 1000 }, (_, i) => ({
        id: `behavior${i}`,
        userId: `user${i % 10}`,
        eventType: ['click', 'view', 'scroll'][i % 3],
        eventName: `event_${i}`,
        pageUrl: `https://dropiq.com/page${i % 5}`,
        timestamp: new Date(Date.now() - i * 1000),
        duration: Math.floor(Math.random() * 10000),
      }))

      mockDb.userBehavior.findMany.mockResolvedValue(mockBehaviors)

      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior?limit=1000')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      const startTime = Date.now()
      const response = await GET(mockRequest)
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond within 1 second
    })

    it('should handle database connection errors', async () => {
      mockDb.userBehavior.findMany.mockRejectedValue(new Error('Database connection failed'))

      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch behavior analytics')
    })
  })

  describe('Analytics API Performance', () => {
    it('should handle concurrent requests', async () => {
      const eventData = {
        eventType: 'click',
        eventName: 'button_click',
        eventData: { buttonId: 'submit' },
      }

      const mockCreatedBehavior = {
        id: 'behavior123',
        ...eventData,
        timestamp: new Date(),
      }

      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)

      const promises = Array.from({ length: 100 }, () => {
        const mockRequest = {
          json: async () => eventData,
          ip: '127.0.0.1',
        } as NextRequest
        return POST(mockRequest)
      })

      const startTime = Date.now()
      const responses = await Promise.all(promises)
      const endTime = Date.now()

      expect(responses).toHaveLength(100)
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
      expect(endTime - startTime).toBeLessThan(5000) // Should handle 100 requests within 5 seconds
    })

    it('should maintain response time under load', async () => {
      const eventData = {
        eventType: 'click',
        eventName: 'button_click',
        eventData: { buttonId: 'submit' },
      }

      const mockCreatedBehavior = {
        id: 'behavior123',
        ...eventData,
        timestamp: new Date(),
      }

      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)

      const responseTimes = []
      
      for (let i = 0; i < 50; i++) {
        const mockRequest = {
          json: async () => eventData,
          ip: '127.0.0.1',
        } as NextRequest

        const startTime = Date.now()
        const response = await POST(mockRequest)
        const endTime = Date.now()

        responseTimes.push(endTime - startTime)
        expect(response.status).toBe(200)
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      expect(avgResponseTime).toBeLessThan(100) // Average response time should be under 100ms
    })
  })
})