import { test, expect } from '@playwright/test'

test.describe('Landing Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load landing page successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/DropIQ/)
    await expect(page.locator('h1')).toContainText('Discover & Track')
    await expect(page.locator('text=AI-Powered Airdrop Intelligence')).toBeVisible()
  })

  test('should display navigation menu correctly', async ({ page }) => {
    // Check main navigation
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Features')).toBeVisible()
    await expect(page.locator('text=How It Works')).toBeVisible()
    await expect(page.locator('text=Pricing')).toBeVisible()
    await expect(page.locator('text=About')).toBeVisible()
    await expect(page.locator('text=Contact')).toBeVisible()

    // Check logo
    await expect(page.locator('text=DropIQ')).toBeVisible()
  })

  test('should show sign in and get started buttons for non-logged users', async ({ page }) => {
    await expect(page.locator('text=Sign In')).toBeVisible()
    await expect(page.locator('text=Get Started')).toBeVisible()
  })

  test('should navigate to features section when clicking Features link', async ({ page }) => {
    await page.click('text=Features')
    
    // Wait for scroll to complete
    await page.waitForTimeout(1000)
    
    // Check if we're in the features section
    const featuresSection = page.locator('text=Why Choose DropIQ?')
    await expect(featuresSection).toBeVisible()
  })

  test('should navigate to auth page when clicking Get Started', async ({ page }) => {
    await page.click('text=Get Started')
    
    await expect(page).toHaveURL('/auth')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should navigate to auth page when clicking Sign In', async ({ page }) => {
    await page.click('text=Sign In')
    
    await expect(page).toHaveURL('/auth')
    await expect(page.locator('h1')).toContainText('Sign In')
  })

  test('should display hero section content correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Discover & Track')
    await expect(page.locator('h1')).toContainText('Valuable Airdrops')
    await expect(page.locator('text=Monetize Your Influence')).toBeVisible()
    await expect(page.locator('text=AI-powered insights')).toBeVisible()
  })

  test('should display stats section', async ({ page }) => {
    await page.scrollIntoViewIfNeeded('text=Total Airdrop Value')
    
    await expect(page.locator('text=$2.5M+')).toBeVisible()
    await expect(page.locator('text=150+')).toBeVisible()
    await expect(page.locator('text=50K+')).toBeVisible()
    await expect(page.locator('text=98%')).toBeVisible()
  })

  test('should display features section', async ({ page }) => {
    await page.scrollIntoViewIfNeeded('text=Why Choose DropIQ?')
    
    await expect(page.locator('text=AI-Powered Analysis')).toBeVisible()
    await expect(page.locator('text=Risk Assessment')).toBeVisible()
    await expect(page.locator('text=Real-Time Updates')).toBeVisible()
    await expect(page.locator('text=Community Insights')).toBeVisible()
    await expect(page.locator('text=Value Tracking')).toBeVisible()
    await expect(page.locator('text=Secure & Private')).toBeVisible()
  })

  test('should display featured airdrops section', async ({ page }) => {
    await page.scrollIntoViewIfNeeded('text=Featured Airdrops')
    
    await expect(page.locator('text=Featured Airdrops')).toBeVisible()
    await expect(page.locator('text=Hand-picked opportunities')).toBeVisible()
    
    // Check for airdrop cards
    const airdropCards = page.locator('[data-testid="airdrop-card"]')
    await expect(airdropCards).toHaveCount(3)
  })

  test('should display CTA section', async ({ page }) => {
    await page.scrollIntoViewIfNeeded('text=Ready to Maximize Your Airdrop Returns?')
    
    await expect(page.locator('text=Ready to Maximize Your Airdrop Returns?')).toBeVisible()
    await expect(page.locator('text=Start Free Trial')).toBeVisible()
    await expect(page.locator('text=Schedule Demo')).toBeVisible()
  })

  test('should handle theme toggle', async ({ page }) => {
    const themeButton = page.locator('[data-testid="theme-toggle"]')
    await expect(themeButton).toBeVisible()
    
    // Get initial theme
    const htmlElement = page.locator('html')
    const initialTheme = await htmlElement.getAttribute('class')
    
    // Toggle theme
    await themeButton.click()
    await page.waitForTimeout(500)
    
    // Check if theme changed
    const newTheme = await htmlElement.getAttribute('class')
    expect(newTheme).not.toBe(initialTheme)
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('text=Features')).toBeVisible()
    await expect(page.locator('text=How It Works')).toBeVisible()
    
    // Check mobile hero section
    await expect(page.locator('h1')).toContainText('Discover & Track')
  })

  test('should handle wallet connection', async ({ page }) => {
    const walletButton = page.locator('text=Connect Wallet')
    await expect(walletButton).toBeVisible()
    
    // Click wallet connect button
    await walletButton.click()
    
    // Check if wallet modal appears
    await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible()
    await expect(page.locator('text=MetaMask')).toBeVisible()
    await expect(page.locator('text=WalletConnect')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Test Enter key on navigation
    await page.focus('text=Features')
    await page.keyboard.press('Enter')
    await page.waitForTimeout(1000)
    
    const featuresSection = page.locator('text=Why Choose DropIQ?')
    await expect(featuresSection).toBeVisible()
  })

  test('should handle scroll animations', async ({ page }) => {
    // Scroll to features section
    await page.scrollIntoViewIfNeeded('text=Why Choose DropIQ?')
    await page.waitForTimeout(1000)
    
    // Check if feature cards are visible
    const featureCards = page.locator('[data-testid="feature-card"]')
    await expect(featureCards.first()).toBeVisible()
    
    // Scroll to airdrops section
    await page.scrollIntoViewIfNeeded('text=Featured Airdrops')
    await page.waitForTimeout(1000)
    
    // Check if airdrop cards are visible
    const airdropCards = page.locator('[data-testid="airdrop-card"]')
    await expect(airdropCards.first()).toBeVisible()
  })

  test('should handle external links correctly', async ({ page }) => {
    // Test external link handling
    const externalLink = page.locator('a[href*="http"]')
    if (await externalLink.count() > 0) {
      const [newPage] = await Promise.all([
        page.context().waitForEvent('page'),
        externalLink.first().click()
      ])
      await newPage.waitForLoadState()
      expect(newPage.url()).toContain('http')
      await newPage.close()
    }
  })

  test('should handle error states gracefully', async ({ page }) => {
    // Test network error handling
    await page.route('**/api/**', route => route.abort())
    
    // Try to interact with API-dependent features
    await page.click('text=Browse Airdrops')
    
    // Should handle error gracefully
    await page.waitForTimeout(2000)
    // Check if error message is displayed or if it fails gracefully
  })

  test('should maintain performance standards', async ({ page }) => {
    // Measure page load time
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const vitals = {}
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime
            } else if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime
            } else if (entry.entryType === 'layout-shift') {
              vitals.cls = entry.value
            }
          })
          resolve(vitals)
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      })
    })
    
    // LCP should be under 2.5 seconds
    expect(metrics.lcp).toBeLessThan(2500)
  })
})