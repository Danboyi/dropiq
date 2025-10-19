import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test cleanup...')
  
  // Clean up test database
  const { execSync } = require('child_process')
  try {
    execSync('rm -f test.db', { stdio: 'inherit' })
    console.log('✅ Test database cleaned up')
  } catch (error) {
    console.error('❌ Failed to clean up test database:', error)
  }

  // Clean up test artifacts
  try {
    execSync('rm -rf test-results', { stdio: 'inherit' })
    console.log('✅ Test artifacts cleaned up')
  } catch (error) {
    console.error('❌ Failed to clean up test artifacts:', error)
  }

  console.log('✅ E2E test cleanup completed')
}

export default globalTeardown