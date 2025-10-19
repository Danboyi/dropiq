const { performance } = require('perf_hooks')
const http = require('http')

// Performance testing configuration
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  concurrentUsers: parseInt(process.env.CONCURRENT_USERS) || 10,
  duration: parseInt(process.env.DURATION) || 30, // seconds
  rampUpTime: parseInt(process.env.RAMP_UP_TIME) || 5, // seconds
  requests: [
    { path: '/', weight: 40 },
    { path: '/api/health', weight: 20 },
    { path: '/api/analytics/behavior', weight: 15, method: 'POST', body: { eventType: 'click', eventName: 'test' } },
    { path: '/auth', weight: 10 },
    { path: '/home', weight: 10 },
    { path: '/airdrops', weight: 5 },
  ]
}

class PerformanceTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null,
    }
  }

  async makeRequest(path, method = 'GET', body = null) {
    return new Promise((resolve) => {
      const startTime = performance.now()
      
      const options = {
        hostname: new URL(config.baseUrl).hostname,
        port: new URL(config.baseUrl).port || 80,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DropIQ-Performance-Test/1.0',
        },
      }

      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => data += chunk)
        res.on('end', () => {
          const endTime = performance.now()
          const responseTime = endTime - startTime
          
          this.results.totalRequests++
          this.results.responseTimes.push(responseTime)
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            this.results.successfulRequests++
          } else {
            this.results.failedRequests++
            this.results.errors.push({
              path,
              method,
              statusCode: res.statusCode,
              error: `HTTP ${res.statusCode}`,
            })
          }
          
          resolve({
            statusCode: res.statusCode,
            responseTime,
            success: res.statusCode >= 200 && res.statusCode < 400,
          })
        })
      })

      req.on('error', (error) => {
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        this.results.totalRequests++
        this.results.failedRequests++
        this.results.responseTimes.push(responseTime)
        this.results.errors.push({
          path,
          method,
          error: error.message,
        })
        
        resolve({
          responseTime,
          success: false,
          error: error.message,
        })
      })

      if (body) {
        req.write(JSON.stringify(body))
      }
      
      req.end()
    })
  }

  async runUserSession(userId) {
    const startTime = performance.now()
    const sessionResults = {
      userId,
      requests: [],
      startTime,
      endTime: null,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
    }

    // Simulate user session with realistic delays
    while (performance.now() - startTime < config.duration * 1000) {
      // Select a random request based on weights
      const request = this.selectWeightedRequest()
      
      try {
        const result = await this.makeRequest(request.path, request.method, request.body)
        sessionResults.requests.push(result)
        sessionResults.totalRequests++
        
        if (result.success) {
          sessionResults.successfulRequests++
        } else {
          sessionResults.failedRequests++
        }
      } catch (error) {
        sessionResults.requests.push({ error: error.message })
        sessionResults.totalRequests++
        sessionResults.failedRequests++
      }

      // Add realistic delay between requests (1-3 seconds)
      await this.sleep(Math.random() * 2000 + 1000)
    }

    sessionResults.endTime = performance.now()
    return sessionResults
  }

  selectWeightedRequest() {
    const totalWeight = config.requests.reduce((sum, req) => sum + req.weight, 0)
    let random = Math.random() * totalWeight
    
    for (const request of config.requests) {
      random -= request.weight
      if (random <= 0) {
        return request
      }
    }
    
    return config.requests[0]
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async runLoadTest() {
    console.log(`🚀 Starting performance test...`)
    console.log(`📊 Configuration:`)
    console.log(`   - Base URL: ${config.baseUrl}`)
    console.log(`   - Concurrent Users: ${config.concurrentUsers}`)
    console.log(`   - Duration: ${config.duration} seconds`)
    console.log(`   - Ramp-up Time: ${config.rampUpTime} seconds`)
    console.log(``)

    this.results.startTime = performance.now()

    // Start users with ramp-up
    const userPromises = []
    const rampUpDelay = (config.rampUpTime * 1000) / config.concurrentUsers

    for (let i = 0; i < config.concurrentUsers; i++) {
      setTimeout(() => {
        const userPromise = this.runUserSession(i + 1)
        userPromises.push(userPromise)
      }, i * rampUpDelay)
    }

    // Wait for all users to complete
    const userSessions = await Promise.all(userPromises)
    this.results.endTime = performance.now()

    // Calculate statistics
    this.calculateStatistics(userSessions)
    this.printResults()
    this.generateReport()
  }

  calculateStatistics(userSessions) {
    const responseTimes = this.results.responseTimes
    const totalTime = this.results.endTime - this.results.startTime
    
    this.results.stats = {
      totalTime: totalTime,
      totalRequests: this.results.totalRequests,
      successfulRequests: this.results.successfulRequests,
      failedRequests: this.results.failedRequests,
      requestsPerSecond: (this.results.totalRequests / totalTime) * 1000,
      successRate: (this.results.successfulRequests / this.results.totalRequests) * 100,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p50ResponseTime: this.percentile(responseTimes, 50),
      p95ResponseTime: this.percentile(responseTimes, 95),
      p99ResponseTime: this.percentile(responseTimes, 99),
      userSessions: userSessions,
    }
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index]
  }

  printResults() {
    const stats = this.results.stats
    
    console.log(`📈 Performance Test Results:`)
    console.log(``)
    console.log(`🕐 Total Test Time: ${(stats.totalTime / 1000).toFixed(2)} seconds`)
    console.log(`📊 Total Requests: ${stats.totalRequests}`)
    console.log(`✅ Successful Requests: ${stats.successfulRequests}`)
    console.log(`❌ Failed Requests: ${stats.failedRequests}`)
    console.log(`📈 Requests/Second: ${stats.requestsPerSecond.toFixed(2)}`)
    console.log(`🎯 Success Rate: ${stats.successRate.toFixed(2)}%`)
    console.log(``)
    console.log(`⚡ Response Times:`)
    console.log(`   - Average: ${stats.averageResponseTime.toFixed(2)}ms`)
    console.log(`   - Min: ${stats.minResponseTime.toFixed(2)}ms`)
    console.log(`   - Max: ${stats.maxResponseTime.toFixed(2)}ms`)
    console.log(`   - 50th percentile: ${stats.p50ResponseTime.toFixed(2)}ms`)
    console.log(`   - 95th percentile: ${stats.p95ResponseTime.toFixed(2)}ms`)
    console.log(`   - 99th percentile: ${stats.p99ResponseTime.toFixed(2)}ms`)
    console.log(``)

    // Performance benchmarks
    this.evaluatePerformance(stats)
  }

  evaluatePerformance(stats) {
    console.log(`🎯 Performance Evaluation:`)
    
    const benchmarks = {
      requestsPerSecond: { excellent: 100, good: 50, poor: 20 },
      successRate: { excellent: 99, good: 95, poor: 90 },
      averageResponseTime: { excellent: 200, good: 500, poor: 1000 },
      p95ResponseTime: { excellent: 500, good: 1000, poor: 2000 },
    }

    let overallScore = 0
    let totalMetrics = 0

    Object.entries(benchmarks).forEach(([metric, thresholds]) => {
      const value = stats[metric]
      let score = 0
      
      if (metric === 'successRate') {
        if (value >= thresholds.excellent) score = 100
        else if (value >= thresholds.good) score = 75
        else if (value >= thresholds.poor) score = 50
        else score = 25
      } else {
        if (value <= thresholds.excellent) score = 100
        else if (value <= thresholds.good) score = 75
        else if (value <= thresholds.poor) score = 50
        else score = 25
      }

      overallScore += score
      totalMetrics++

      let status = '🔴 Poor'
      if (score >= 90) status = '🟢 Excellent'
      else if (score >= 70) status = '🟡 Good'
      else if (score >= 50) status = '🟠 Fair'

      console.log(`   ${metric}: ${status} (${value.toFixed(2)} - Score: ${score}/100)`)
    })

    const finalScore = overallScore / totalMetrics
    let finalGrade = '🔴 Needs Improvement'
    if (finalScore >= 90) finalGrade = '🟢 Excellent'
    else if (finalScore >= 70) finalGrade = '🟡 Good'
    else if (finalGrade >= 50) finalGrade = '🟠 Fair'

    console.log(``)
    console.log(`🏆 Overall Performance: ${finalGrade} (${finalScore.toFixed(1)}/100)`)
    console.log(``)
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      config: config,
      results: this.results,
      stats: this.results.stats,
    }

    // Save report to file
    const fs = require('fs')
    const reportPath = `test-results/performance-report-${Date.now()}.json`
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
      console.log(`📄 Detailed report saved to: ${reportPath}`)
    } catch (error) {
      console.error(`❌ Failed to save report: ${error.message}`)
    }

    // Generate HTML report
    this.generateHtmlReport(report)
  }

  generateHtmlReport(report) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>DropIQ Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; color: #007bff; }
        .errors { background: #fff5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #dc3545; }
        .chart { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
    </style>
</head>
<body>
    <div class="header">
        <h1>DropIQ Performance Test Report</h1>
        <p><strong>Test Date:</strong> ${new Date(report.timestamp).toLocaleString()}</p>
        <p><strong>Configuration:</strong> ${report.config.concurrentUsers} concurrent users for ${report.config.duration} seconds</p>
    </div>

    <div class="metrics">
        <div class="metric">
            <h3>Total Requests</h3>
            <div class="value">${report.stats.totalRequests}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${report.stats.successRate.toFixed(2)}%</div>
        </div>
        <div class="metric">
            <h3>Requests/Second</h3>
            <div class="value">${report.stats.requestsPerSecond.toFixed(2)}</div>
        </div>
        <div class="metric">
            <h3>Avg Response Time</h3>
            <div class="value">${report.stats.averageResponseTime.toFixed(2)}ms</div>
        </div>
        <div class="metric">
            <h3>95th Percentile</h3>
            <div class="value">${report.stats.p95ResponseTime.toFixed(2)}ms</div>
        </div>
        <div class="metric">
            <h3>99th Percentile</h3>
            <div class="value">${report.stats.p99ResponseTime.toFixed(2)}ms</div>
        </div>
    </div>

    <h2>Response Time Distribution</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value (ms)</th>
        </tr>
        <tr>
            <td>Minimum</td>
            <td>${report.stats.minResponseTime.toFixed(2)}</td>
        </tr>
        <tr>
            <td>50th Percentile</td>
            <td>${report.stats.p50ResponseTime.toFixed(2)}</td>
        </tr>
        <tr>
            <td>95th Percentile</td>
            <td>${report.stats.p95ResponseTime.toFixed(2)}</td>
        </tr>
        <tr>
            <td>99th Percentile</td>
            <td>${report.stats.p99ResponseTime.toFixed(2)}</td>
        </tr>
        <tr>
            <td>Maximum</td>
            <td>${report.stats.maxResponseTime.toFixed(2)}</td>
        </tr>
    </table>

    ${report.results.errors.length > 0 ? `
    <div class="errors">
        <h2>Errors (${report.results.errors.length})</h2>
        <table>
            <tr>
                <th>Path</th>
                <th>Method</th>
                <th>Error</th>
            </tr>
            ${report.results.errors.slice(0, 10).map(error => `
                <tr>
                    <td>${error.path}</td>
                    <td>${error.method}</td>
                    <td>${error.error}</td>
                </tr>
            `).join('')}
        </table>
        ${report.results.errors.length > 10 ? `<p>... and ${report.results.errors.length - 10} more errors</p>` : ''}
    </div>
    ` : ''}
</body>
</html>
    `

    const fs = require('fs')
    const htmlPath = `test-results/performance-report-${Date.now()}.html`
    
    try {
      fs.writeFileSync(htmlPath, html)
      console.log(`🌐 HTML report saved to: ${htmlPath}`)
    } catch (error) {
      console.error(`❌ Failed to save HTML report: ${error.message}`)
    }
  }
}

// Run the performance test
if (require.main === module) {
  const tester = new PerformanceTester()
  tester.runLoadTest().catch(console.error)
}

module.exports = PerformanceTester