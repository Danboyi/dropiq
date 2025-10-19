import { GET } from '@/app/api/health/route'
import { NextResponse } from 'next/server'

describe('Health API', () => {
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const response = await GET()
      const data = await response.json()

      expect(response).toBeInstanceOf(NextResponse)
      expect(data).toEqual({ message: 'Good!' })
      expect(response.status).toBe(200)
    })

    it('should have correct content-type header', async () => {
      const response = await GET()
      
      expect(response.headers.get('content-type')).toBe('application/json')
    })

    it('should respond quickly', async () => {
      const startTime = Date.now()
      await GET()
      const endTime = Date.now()

      // Health check should respond within 100ms
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, () => GET())
      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })
})