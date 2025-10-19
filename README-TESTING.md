# 🧪 DropIQ Testing Guide

## Quick Start

This guide will help you get started with testing the DropIQ platform.

## 🚀 First Time Setup

```bash
# Clone the repository
git clone https://github.com/Danboyi/dropiq.git
cd dropiq

# Install dependencies
npm install

# Install testing dependencies
npm install --save-dev @playwright/test

# Install Playwright browsers
npx playwright install

# Set up the database
npm run db:generate
npm run db:push
```

## 🧪 Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Performance tests only
npm run test:performance

# Security tests only
npm run test:security
```

### Test with Coverage
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:unit -- --watch
```

## 🎯 Test Types Overview

### Unit Tests
- **What**: Test individual functions and components
- **Where**: `tests/unit/`
- **When**: Every code change
- **Why**: Fast feedback on logic

### Integration Tests
- **What**: Test how parts work together
- **Where**: `tests/integration/`
- **When**: API changes, database changes
- **Why**: Verify system integration

### E2E Tests
- **What**: Test complete user workflows
- **Where**: `tests/e2e/`
- **When**: Before releases
- **Why**: Ensure user experience

### Performance Tests
- **What**: Test system under load
- **Where**: `tests/performance/`
- **When**: Regularly, before releases
- **Why**: Maintain performance

### Security Tests
- **What**: Find security vulnerabilities
- **Where**: `tests/security/`
- **When**: Regularly, before releases
- **Why**: Protect against threats

## 🔧 Common Testing Tasks

### Adding a New Component Test
```bash
# Create test file
touch tests/unit/components/MyComponent.test.tsx

# Add test content
# See tests/unit/components/Button.test.ts for example
```

### Adding a New API Test
```bash
# Create test file
touch tests/integration/api/my-endpoint.test.ts

# Add test content
# See tests/integration/api/analytics.integration.test.ts for example
```

### Adding a New E2E Test
```bash
# Create test file
touch tests/e2e/my-feature.spec.ts

# Add test content
# See tests/e2e/landing-page.spec.ts for example
```

## 🐛 Debugging Tests

### Debug Unit Tests
```bash
# Run with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Or use VS Code debugger
```

### Debug E2E Tests
```bash
# Run with Playwright debugger
npm run test:e2e:debug

# Or run with UI mode
npm run test:e2e:ui
```

### Debug Integration Tests
```bash
# Run with verbose output
npm run test:integration -- --verbose

# Or run specific test file
npm test tests/integration/api/analytics.integration.test.ts
```

## 📊 Understanding Test Results

### Unit Test Results
```
✓ Button component renders correctly (5ms)
✓ Button handles click events (2ms)
✓ Button shows loading state (1ms)

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.234s
```

### E2E Test Results
```
✓ Landing page loads successfully
✓ User can navigate to auth page
✓ User can sign in successfully
✓ Dashboard displays correctly

  4 passed (12.3s)
```

### Coverage Report
```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   85.23 |    78.45  |   89.12 |   84.56 |                   
 src/components/ui    |   92.15 |    85.32  |   94.23 |   91.87 |                   
 src/lib/utils         |   88.76 |    82.14  |   91.45 |   87.98 |                   
----------------------|---------|----------|---------|---------|-------------------
```

## 🚨 Common Issues & Solutions

### Tests Fail with "Database Connection Error"
```bash
# Solution: Reset test database
npm run db:reset
npm run db:push
```

### E2E Tests Time Out
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60 * 1000,
```

### Tests Fail on CI but Pass Locally
```bash
# Solution: Check environment variables
echo $NODE_ENV
echo $DATABASE_URL
```

### Memory Issues in Tests
```bash
# Solution: Limit concurrent tests
npm test -- --maxWorkers=2
```

## 📈 Performance Testing

### Quick Load Test
```bash
# Run with default settings
npm run test:performance

# Run with custom settings
CONCURRENT_USERS=10 DURATION=60 npm run test:performance
```

### Benchmark
```bash
# Run performance benchmarks
node tests/performance/benchmark.js
```

### Stress Test
```bash
# Install Artillery
npm install -g artillery

# Run stress test
artillery run tests/performance/stress-test.yml
```

## 🔒 Security Testing

### Quick Security Scan
```bash
# Run security tests
npm run test:security

# Run vulnerability scan
node tests/security/vulnerability-scan.js

# Check dependencies
npm audit --audit-level=moderate
```

### Security Test Areas
- Input validation
- Authentication & authorization
- SQL injection prevention
- XSS protection
- CSRF protection

## 📱 Mobile Testing

### Mobile E2E Tests
```bash
# Run tests on mobile viewports
npx playwright test --project="Mobile Chrome" --project="Mobile Safari"
```

### Responsive Testing
```bash
# Test different screen sizes
npx playwright test --config=playwright.mobile.config.ts
```

## 🔧 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
```

### Playwright Configuration
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
})
```

## 📚 Resources

### Documentation
- [Full Testing Documentation](./docs/TESTING.md)
- [Testing Checklist](./docs/TESTING-CHECKLIST.md)
- [API Documentation](./docs/API.md)

### Tools
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

### Best Practices
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [React Testing Patterns](https://kentcdodds.com/blog/common-testing-mistakes)
- [E2E Testing Best Practices](https://playwright.dev/docs/best-practices)

## 🤝 Contributing

When contributing to the codebase:

1. **Write Tests**: Add tests for new functionality
2. **Update Coverage**: Maintain or improve test coverage
3. **Run Tests**: Ensure all tests pass before PR
4. **Documentation**: Update testing documentation
5. **Performance**: Consider performance implications

## 🆘 Getting Help

If you need help with testing:

1. Check this documentation first
2. Look at existing test files for examples
3. Ask in team channels
4. Create an issue for test infrastructure problems

---

Happy Testing! 🎉