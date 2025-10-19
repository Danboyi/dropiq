import { test, expect } from '@playwright/test'

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('token', 'mock-jwt-token')
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      }))
    })
    
    // Mock API responses
    await page.route('**/api/user/profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
            avatar: 'https://example.com/avatar.jpg',
          }
        })
      })
    })
    
    await page.goto('/home')
  })

  test('should display dashboard correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/DropIQ/)
    await expect(page.locator('h1')).toContainText('Dashboard')
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  })

  test('should display user information', async ({ page }) => {
    await expect(page.locator('text=Test User')).toBeVisible()
    await expect(page.locator('text=test@example.com')).toBeVisible()
    await expect(page.locator('img[alt="User Avatar"]')).toBeVisible()
  })

  test('should display sidebar navigation', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Browse Airdrops')).toBeVisible()
    await expect(page.locator('text=Marketplace')).toBeVisible()
    await expect(page.locator('text=Wallets')).toBeVisible()
    await expect(page.locator('text=Analytics')).toBeVisible()
    await expect(page.locator('text=Settings')).toBeVisible()
  })

  test('should navigate between dashboard sections', async ({ page }) => {
    // Navigate to airdrops
    await page.click('text=Browse Airdrops')
    await expect(page).toHaveURL('/airdrops')
    await expect(page.locator('h1')).toContainText('Airdrops')
    
    // Navigate to marketplace
    await page.click('text=Marketplace')
    await expect(page).toHaveURL('/marketplace')
    await expect(page.locator('h1')).toContainText('Marketplace')
    
    // Navigate back to dashboard
    await page.click('text=Dashboard')
    await expect(page).toHaveURL('/home')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should display dashboard stats', async ({ page }) => {
    // Mock stats API
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          stats: {
            totalAirdrops: 150,
            activeAirdrops: 25,
            completedAirdrops: 100,
            totalEarnings: 1250.50,
            pendingEarnings: 250.75,
          }
        })
      })
    })
    
    await expect(page.locator('text=150')).toBeVisible()
    await expect(page.locator('text=25')).toBeVisible()
    await expect(page.locator('text=100')).toBeVisible()
    await expect(page.locator('text=$1,250.50')).toBeVisible()
    await expect(page.locator('text=$250.75')).toBeVisible()
  })

  test('should display recent activity', async ({ page }) => {
    // Mock activity API
    await page.route('**/api/dashboard/activity', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          activities: [
            {
              id: '1',
              type: 'airdrop_completed',
              title: 'DeFiChain Airdrop Completed',
              description: 'Successfully received 500 DFI tokens',
              timestamp: '2024-01-01T10:00:00Z',
              amount: 500,
            },
            {
              id: '2',
              type: 'campaign_started',
              title: 'New Campaign Started',
              description: 'Started promoting NFT Marketplace',
              timestamp: '2024-01-01T09:00:00Z',
            },
          ]
        })
      })
    })
    
    await expect(page.locator('text=DeFiChain Airdrop Completed')).toBeVisible()
    await expect(page.locator('text=New Campaign Started')).toBeVisible()
    await expect(page.locator('text=Successfully received 500 DFI tokens')).toBeVisible()
  })

  test('should display recommended airdrops', async ({ page }) => {
    // Mock recommendations API
    await page.route('**/api/dashboard/recommendations', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recommendations: [
            {
              id: '1',
              title: 'Layer 2 Testnet',
              project: 'L2Network',
              status: 'ACTIVE',
              riskLevel: 'LOW',
              estimatedValue: 200,
              participants: 5230,
            },
            {
              id: '2',
              title: 'DeFi Protocol Launch',
              project: 'DeFiProtocol',
              status: 'UPCOMING',
              riskLevel: 'MEDIUM',
              estimatedValue: 300,
              participants: 0,
            },
          ]
        })
      })
    })
    
    await expect(page.locator('text=Layer 2 Testnet')).toBeVisible()
    await expect(page.locator('text=DeFi Protocol Launch')).toBeVisible()
    await expect(page.locator('text=$200')).toBeVisible()
    await expect(page.locator('text=$300')).toBeVisible()
  })

  test('should handle wallet connection in dashboard', async ({ page }) => {
    // Mock wallet connection
    await page.addInitScript(() => {
      window.ethereum = {
        request: async ({ method }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890']
          }
          return null
        },
        on: () => {},
        removeListener: () => {},
        isConnected: () => true,
        isMetaMask: true,
      }
    })
    
    await page.click('text=Connect Wallet')
    await page.click('text=MetaMask')
    
    await expect(page.locator('text=0x1234...7890')).toBeVisible()
  })

  test('should handle user profile update', async ({ page }) => {
    await page.click('[data-testid="user-avatar"]')
    await page.click('text=Settings')
    
    await expect(page).toHaveURL('/security')
    
    await page.fill('input[name="displayName"]', 'Updated Name')
    await page.click('button[type="submit"]')
    
    // Mock successful update
    await page.route('**/api/user/profile', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Updated Name',
          }
        })
      })
    })
    
    await expect(page.locator('text=Profile updated successfully')).toBeVisible()
  })

  test('should handle notifications', async ({ page }) => {
    // Mock notifications API
    await page.route('**/api/notifications', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          notifications: [
            {
              id: '1',
              title: 'New airdrop available',
              description: 'DeFiChain is offering 500 DFI tokens',
              time: '2 hours ago',
              read: false,
            },
            {
              id: '2',
              title: 'Airdrop completed',
              description: 'Successfully received tokens from Layer 2',
              time: '3 days ago',
              read: true,
            },
          ]
        })
      })
    })
    
    await page.click('[data-testid="notifications"]')
    
    await expect(page.locator('text=New airdrop available')).toBeVisible()
    await expect(page.locator('text=Airdrop completed')).toBeVisible()
    await expect(page.locator('text=Mark all as read')).toBeVisible()
  })

  test('should handle search functionality', async ({ page }) => {
    await page.fill('[data-testid="search-input"]', 'DeFi')
    await page.press('[data-testid="search-input"]', 'Enter')
    
    // Mock search API
    await page.route('**/api/search', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          results: [
            {
              id: '1',
              title: 'DeFiChain Airdrop',
              type: 'airdrop',
              description: 'Decentralized finance platform airdrop',
            },
          ]
        })
      })
    })
    
    await expect(page.locator('text=DeFiChain Airdrop')).toBeVisible()
  })

  test('should handle data refresh', async ({ page }) => {
    await page.click('[data-testid="refresh-button"]')
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible()
    
    // Should hide loading after data loads
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible()
  })

  test('should handle error states', async ({ page }) => {
    // Mock API error
    await page.route('**/api/dashboard/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to load dashboard data'
        })
      })
    })
    
    await page.reload()
    
    await expect(page.locator('text=Failed to load dashboard data')).toBeVisible()
    await expect(page.locator('text=Retry')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should collapse sidebar on mobile
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('text=Dashboard')).toBeVisible()
    await expect(page.locator('text=Browse Airdrops')).toBeVisible()
  })

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Test Ctrl+K for search
    await page.keyboard.press('Control+k')
    await expect(page.locator('[data-testid="search-input"]')).toBeFocused()
    
    // Test Escape to close modal
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="search-input"]')).not.toBeFocused()
  })

  test('should handle bulk actions', async ({ page }) => {
    // Navigate to airdrops page
    await page.click('text=Browse Airdrops')
    
    // Select multiple airdrops
    await page.check('[data-testid="airdrop-checkbox-1"]')
    await page.check('[data-testid="airdrop-checkbox-2"]')
    
    // Perform bulk action
    await page.click('text=Mark as Interested')
    
    // Should show confirmation
    await expect(page.locator('text=2 airdrops marked as interested')).toBeVisible()
  })
})