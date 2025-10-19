import { POST, GET } from '@/app/api/analytics/behavior/route'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import ZAI from 'z-ai-web-dev-sdk'

// Mock dependencies
jest.mock('@/lib/db')
jest.mock('z-ai-web-dev-sdk')

const mockDb = db as jest.Mocked<typeof db>
const mockZAI = ZAI as jest.MockedClass<typeof ZAI>

describe('Analytics API - Behavior Tracking', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    mockRequest = {
      json: jest.fn(),
      ip: '127.0.0.1',
    } as any

    mockDb.userBehavior.create = jest.fn()
    mockDb.userBehavior.findMany = jest.fn()
    mockDb.dataPrivacySettings.findUnique = jest.fn()
    mockDb.airdropAnalytics.upsert = jest.fn()
    mockDb.airdropAnalytics.update = jest.fn()
    mockDb.airdropAnalytics.findUnique = jest.fn()
    mockDb.userBehavior.update = jest.fn()

    // Mock ZAI
    const mockZAIInstance = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    }
    mockZAI.create = jest.fn().mockResolvedValue(mockZAIInstance)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/analytics/behavior', () => {
    it('should track behavior event successfully', async () => {
      const eventData = {
        eventType: 'click',
        eventName: 'button_click',
        eventData: { buttonId: 'submit' },
        pageUrl: '/test',
        pageTitle: 'Test Page',
      }

      mockRequest.json = jest.fn().mockResolvedValue(eventData)

      const mockCreatedBehavior = {
        id: '1',
        ...eventData,
        timestamp: new Date(),
      }
      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.id).toBe('1')
      expect(mockDb.userBehavior.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: 'click',
          eventName: 'button_click',
          eventData: { buttonId: 'submit' },
          pageUrl: '/test',
          pageTitle: 'Test Page',
          ipAddress: '127.0.0.1',
        }),
      })
    })

    it('should return error for missing eventType', async () => {
      const eventData = {
        eventName: 'button_click',
        eventData: { buttonId: 'submit' },
      }

      mockRequest.json = jest.fn().mockResolvedValue(eventData)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('eventType is required')
    })

    it('should respect user privacy settings', async () => {
      const eventData = {
        userId: 'user1',
        eventType: 'click',
        eventName: 'button_click',
      }

      mockRequest.json = jest.fn().mockResolvedValue(eventData)

      mockDb.dataPrivacySettings.findUnique.mockResolvedValue({
        userId: 'user1',
        analyticsConsent: false,
      } as any)

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Analytics tracking disabled by user')
    })

    it('should handle airdrop interaction events', async () => {
      const eventData = {
        eventType: 'airdrop_interact',
        eventName: 'view',
        eventData: { airdropId: 'airdrop1' },
      }

      mockRequest.json = jest.fn().mockResolvedValue(eventData)

      const mockCreatedBehavior = {
        id: '1',
        ...eventData,
        timestamp: new Date(),
      }
      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)

      // Mock airdrop analytics update
      mockDb.airdropAnalytics.upsert.mockResolvedValue({
        id: 'analytics1',
        airdropId: 'airdrop1',
        date: new Date(),
        views: 1,
      } as any)

      mockDb.airdropAnalytics.findUnique.mockResolvedValue({
        id: 'analytics1',
        views: 1,
        clicks: 0,
        registrations: 0,
        completions: 0,
      } as any)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockDb.airdropAnalytics.upsert).toHaveBeenCalled()
    })

    it('should process AI analytics for behavior patterns', async () => {
      const eventData = {
        eventType: 'click',
        eventName: 'button_click',
        pageUrl: '/test',
        duration: 30,
        scrollDepth: 50,
      }

      mockRequest.json = jest.fn().mockResolvedValue(eventData)

      const mockCreatedBehavior = {
        id: '1',
        ...eventData,
        timestamp: new Date(),
      }
      mockDb.userBehavior.create.mockResolvedValue(mockCreatedBehavior)

      // Mock AI analysis
      const mockZAIInstance = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'User shows high engagement with 30s duration and 50% scroll depth',
                },
              }],
            }),
          },
        },
      }
      mockZAI.create = jest.fn().mockResolvedValue(mockZAIInstance)

      const response = await POST(mockRequest)

      expect(response.status).toBe(200)
      expect(mockZAI.create).toHaveBeenCalled()
    })

    it('should handle database errors gracefully', async () => {
      const eventData = {
        eventType: 'click',
        eventName: 'button_click',
      }

      mockRequest.json = jest.fn().mockResolvedValue(eventData)

      mockDb.userBehavior.create.mockRejectedValue(new Error('Database error'))

      const response = await POST(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to track behavior')
    })
  })

  describe('GET /api/analytics/behavior', () => {
    it('should retrieve behavior analytics', async () => {
      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior?userId=user1')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      const mockBehaviors = [
        {
          id: '1',
          userId: 'user1',
          eventType: 'click',
          eventName: 'button_click',
          timestamp: new Date(),
        },
        {
          id: '2',
          userId: 'user1',
          eventType: 'view',
          eventName: 'page_view',
          timestamp: new Date(),
        },
      ]

      mockDb.userBehavior.findMany.mockResolvedValue(mockBehaviors)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.behaviors).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.insights).toBeDefined()
    })

    it('should filter by query parameters', async () => {
      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior?eventType=click&startDate=2024-01-01&endDate=2024-01-31')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      mockDb.userBehavior.findMany.mockResolvedValue([])

      await GET(mockRequest)

      expect(mockDb.userBehavior.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          eventType: 'click',
          timestamp: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        }),
        orderBy: { timestamp: 'desc' },
        take: 100,
      })
    })

    it('should limit results', async () => {
      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior?limit=50')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      mockDb.userBehavior.findMany.mockResolvedValue([])

      await GET(mockRequest)

      expect(mockDb.userBehavior.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      )
    })

    it('should generate behavior insights using AI', async () => {
      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      const mockBehaviors = [
        {
          id: '1',
          eventType: 'click',
          eventName: 'button_click',
          pageUrl: '/test',
          duration: 30,
        },
      ]

      mockDb.userBehavior.findMany.mockResolvedValue(mockBehaviors)

      // Mock AI pattern analysis
      const mockZAIInstance = {
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'Pattern 1: User engages with interactive elements\nPattern 2: Moderate session duration',
                },
              }],
            }),
          },
        },
      }
      mockZAI.create = jest.fn().mockResolvedValue(mockZAIInstance)

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.insights.behaviorPatterns).toBeDefined()
      expect(data.insights.behaviorPatterns.length).toBeGreaterThan(0)
    })

    it('should handle errors gracefully', async () => {
      const mockUrl = new URL('http://localhost:3000/api/analytics/behavior')
      const mockRequest = {
        url: mockUrl.toString(),
      } as NextRequest

      mockDb.userBehavior.findMany.mockRejectedValue(new Error('Database error'))

      const response = await GET(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to fetch behavior analytics')
    })
  })
})