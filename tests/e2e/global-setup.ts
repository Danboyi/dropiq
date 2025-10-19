import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')
  
  // Set up test database
  const { execSync } = require('child_process')
  try {
    execSync('npm run db:reset', { stdio: 'inherit' })
    console.log('✅ Test database reset completed')
  } catch (error) {
    console.error('❌ Failed to reset test database:', error)
  }

  // Set up test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api'
  process.env.DATABASE_URL = 'file:./test.db'

  // Create test user if needed
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    await page.goto('http://localhost:3000/api/health')
    const health = await page.textContent('body')
    if (health?.includes('Good!')) {
      console.log('✅ Server is healthy and ready for testing')
    } else {
      console.error('❌ Server health check failed')
    }
  } catch (error) {
    console.error('❌ Failed to connect to server:', error)
  } finally {
    await context.close()
    await browser.close()
  }

  console.log('✅ E2E test setup completed')
}

export default globalSetup