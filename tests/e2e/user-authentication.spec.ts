import { test, expect } from '@playwright/test'

test.describe('User Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth')
  })

  test('should display authentication page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/DropIQ/)
    await expect(page.locator('h1')).toContainText('Sign In')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
  })

  test('should show validation error for invalid email', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid email address')).toBeVisible()
  })

  test('should show validation error for short password', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', '123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('input[name="password"]')
    const toggleButton = page.locator('[data-testid="password-toggle"]')
    
    await page.fill('input[name="password"]', 'password123')
    expect(await passwordInput.getAttribute('type')).toBe('password')
    
    await toggleButton.click()
    expect(await passwordInput.getAttribute('type')).toBe('text')
    
    await toggleButton.click()
    expect(await passwordInput.getAttribute('type')).toBe('password')
  })

  test('should handle successful sign in', async ({ page }) => {
    // Mock successful API response
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
          },
          token: 'mock-jwt-token'
        })
      })
    })

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/home')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should handle sign in error', async ({ page }) => {
    // Mock error response
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Invalid credentials'
        })
      })
    })

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Invalid credentials')).toBeVisible()
    await expect(page).toHaveURL('/auth')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/auth/signin', route => route.abort())
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Network error')).toBeVisible()
  })

  test('should switch to sign up mode', async ({ page }) => {
    await page.click('text=Sign Up')
    
    await expect(page.locator('h1')).toContainText('Sign Up')
    await expect(page.locator('input[name="username"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should handle sign up validation', async ({ page }) => {
    await page.click('text=Sign Up')
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="username"]', 'test')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
  })

  test('should handle successful sign up', async ({ page }) => {
    await page.click('text=Sign Up')
    
    // Mock successful API response
    await page.route('**/api/auth/signup', route => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
          },
          token: 'mock-jwt-token'
        })
      })
    })

    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="username"]', 'testuser')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/home')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should handle wallet connection authentication', async ({ page }) => {
    // Mock wallet connection
    await page.addInitScript(() => {
      window.ethereum = {
        request: async ({ method }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890']
          }
          if (method === 'eth_chainId') {
            return '0x1'
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
    
    // Should show wallet modal
    await expect(page.locator('[data-testid="wallet-modal"]')).toBeVisible()
    await page.click('text=MetaMask')
    
    // Should authenticate and redirect
    await expect(page).toHaveURL('/home')
  })

  test('should handle password reset', async ({ page }) => {
    await page.click('text=Forgot Password?')
    
    await expect(page.locator('h1')).toContainText('Reset Password')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Mock successful reset
    await page.route('**/api/auth/reset-password', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Password reset email sent'
        })
      })
    })
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=Password reset email sent')).toBeVisible()
  })

  test('should handle social authentication', async ({ page }) => {
    // Mock Google OAuth
    await page.route('**/api/auth/google', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@gmail.com',
            username: 'testuser',
          },
          token: 'mock-jwt-token'
        })
      })
    })
    
    await page.click('text=Continue with Google')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/home')
  })

  test('should maintain session persistence', async ({ page }) => {
    // Mock successful sign in
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
          },
          token: 'mock-jwt-token'
        })
      })
    })
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/home')
    
    // Reload page
    await page.reload()
    
    // Should still be logged in
    await expect(page).toHaveURL('/home')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should handle logout correctly', async ({ page }) => {
    // First sign in
    await page.route('**/api/auth/signin', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'test@example.com',
            username: 'testuser',
          },
          token: 'mock-jwt-token'
        })
      })
    })
    
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/home')
    
    // Mock logout API
    await page.route('**/api/auth/logout', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true
        })
      })
    })
    
    // Click user avatar and logout
    await page.click('[data-testid="user-avatar"]')
    await page.click('text=Log out')
    
    // Should redirect to landing page
    await expect(page).toHaveURL('/')
    await expect(page.locator('text=Sign In')).toBeVisible()
  })

  test('should handle authentication on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    
    await expect(page.locator('h1')).toContainText('Sign In')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    
    // Test mobile sign in
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should work the same as desktop
    await expect(page).toHaveURL('/home')
  })
})