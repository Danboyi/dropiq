const { performance } = require('perf_hooks')
const fs = require('fs')

class PerformanceBenchmark {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      benchmarks: [],
    }
  }

  async benchmarkFunction(name, fn, iterations = 1000) {
    console.log(`🏃 Benchmarking ${name}...`)
    
    // Warm up
    for (let i = 0; i < 100; i++) {
      await fn()
    }
    
    // Benchmark
    const times = []
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await fn()
      const end = performance.now()
      times.push(end - start)
    }
    
    const stats = this.calculateStats(times)
    
    this.results.benchmarks.push({
      name,
      iterations,
      ...stats,
    })
    
    console.log(`   ✅ ${name}: ${stats.mean.toFixed(2)}ms ± ${stats.stdDev.toFixed(2)}ms`)
    
    return stats
  }

  calculateStats(times) {
    const mean = times.reduce((a, b) => a + b, 0) / times.length
    const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length
    const stdDev = Math.sqrt(variance)
    const min = Math.min(...times)
    const max = Math.max(...times)
    const median = this.percentile(times, 50)
    const p95 = this.percentile(times, 95)
    const p99 = this.percentile(times, 99)
    
    return { mean, stdDev, min, max, median, p95, p99 }
  }

  percentile(arr, p) {
    const sorted = arr.slice().sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[index]
  }

  async runBenchmarks() {
    console.log('🚀 Starting performance benchmarks...')
    console.log('')

    // Database operation benchmarks
    await this.benchmarkFunction('Database User Create', async () => {
      // Mock database operation
      await new Promise(resolve => setTimeout(resolve, 1))
    }, 100)

    await this.benchmarkFunction('Database User Query', async () => {
      // Mock database query
      await new Promise(resolve => setTimeout(resolve, 0.5))
    }, 1000)

    // API endpoint benchmarks
    await this.benchmarkFunction('API Health Check', async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 2))
    }, 100)

    await this.benchmarkFunction('API Analytics Track', async () => {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 5))
    }, 100)

    // Utility function benchmarks
    await this.benchmarkFunction('Email Validation', async () => {
      const email = 'test@example.com'
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      regex.test(email)
    }, 10000)

    await this.benchmarkFunction('Wallet Address Validation', async () => {
      const address = '0x1234567890123456789012345678901234567890'
      const regex = /^0x[a-fA-F0-9]{40}$/
      regex.test(address)
    }, 10000)

    await this.benchmarkFunction('Currency Formatting', async () => {
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(1234.56)
    }, 10000)

    await this.benchmarkFunction('Time Ago Calculation', async () => {
      const now = new Date()
      const past = new Date(now.getTime() - 3600000) // 1 hour ago
      const diff = Math.floor((now.getTime() - past.getTime()) / 1000)
      diff
    }, 10000)

    // String operation benchmarks
    await this.benchmarkFunction('String Sanitization', async () => {
      const html = '<div><script>alert("xss")</div>'
      html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    }, 10000)

    await this.benchmarkFunction('JSON Parsing', async () => {
      const json = '{"test": "data", "number": 123}'
      JSON.parse(json)
    }, 10000)

    await this.benchmarkFunction('JSON Stringification', async () => {
      const obj = { test: 'data', number: 123, array: [1, 2, 3] }
      JSON.stringify(obj)
    }, 10000)

    // Array operation benchmarks
    await this.benchmarkFunction('Array Sort', async () => {
      const arr = Array.from({ length: 1000 }, () => Math.random())
      arr.sort((a, b) => a - b)
    }, 100)

    await this.benchmarkFunction('Array Filter', async () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i)
      arr.filter(x => x % 2 === 0)
    }, 100)

    await this.benchmarkFunction('Array Map', async () => {
      const arr = Array.from({ length: 1000 }, (_, i) => i)
      arr.map(x => x * 2)
    }, 100)

    // Cryptographic operation benchmarks
    await this.benchmarkFunction('Hash Generation', async () => {
      const crypto = require('crypto')
      crypto.createHash('sha256').update('test data').digest('hex')
    }, 1000)

    await this.benchmarkFunction('Random ID Generation', async () => {
      Math.random().toString(36).substr(2, 9)
    }, 10000)

    console.log('')
    this.generateReport()
  }

  generateReport() {
    console.log('📊 Benchmark Results:')
    console.log('')

    this.results.benchmarks.forEach(benchmark => {
      console.log(`${benchmark.name}:`)
      console.log(`  Mean: ${benchmark.mean.toFixed(4)}ms`)
      console.log(`  Std Dev: ${benchmark.stdDev.toFixed(4)}ms`)
      console.log(`  Min: ${benchmark.min.toFixed(4)}ms`)
      console.log(`  Max: ${benchmark.max.toFixed(4)}ms`)
      console.log(`  Median: ${benchmark.median.toFixed(4)}ms`)
      console.log(`  95th: ${benchmark.p95.toFixed(4)}ms`)
      console.log(`  99th: ${benchmark.p99.toFixed(4)}ms`)
      console.log('')
    })

    // Performance analysis
    this.analyzePerformance()
    
    // Save results
    this.saveResults()
  }

  analyzePerformance() {
    console.log('🎯 Performance Analysis:')
    console.log('')

    const slowOperations = this.results.benchmarks.filter(b => b.mean > 10)
    const fastOperations = this.results.benchmarks.filter(b => b.mean < 1)

    if (slowOperations.length > 0) {
      console.log('🐌 Slow Operations (>10ms):')
      slowOperations.forEach(op => {
        console.log(`  - ${op.name}: ${op.mean.toFixed(2)}ms`)
      })
      console.log('')
    }

    if (fastOperations.length > 0) {
      console.log('⚡ Fast Operations (<1ms):')
      fastOperations.forEach(op => {
        console.log(`  - ${op.name}: ${op.mean.toFixed(4)}ms`)
      })
      console.log('')
    }

    // Recommendations
    console.log('💡 Recommendations:')
    console.log('')

    slowOperations.forEach(op => {
      if (op.name.includes('Database')) {
        console.log(`  - Consider adding indexes for ${op.name}`)
      } else if (op.name.includes('API')) {
        console.log(`  - Consider caching for ${op.name}`)
      } else if (op.name.includes('Hash')) {
        console.log(`  - Consider using faster hashing for ${op.name}`)
      } else {
        console.log(`  - Optimize ${op.name} for better performance`)
      }
    })

    console.log('')
  }

  saveResults() {
    const reportPath = `test-results/benchmark-report-${Date.now()}.json`
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2))
      console.log(`📄 Benchmark results saved to: ${reportPath}`)
    } catch (error) {
      console.error(`❌ Failed to save benchmark results: ${error.message}`)
    }
  }
}

// Run benchmarks if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark()
  benchmark.runBenchmarks().catch(console.error)
}

module.exports = PerformanceBenchmark