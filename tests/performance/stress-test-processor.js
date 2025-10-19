// Custom processor for Artillery stress testing
module.exports = {
  // Custom functions for request processing
  randomString: function(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  randomEmail: function() {
    return `test${this.randomString(8)}@example.com`
  },

  randomWalletAddress: function() {
    return '0x' + this.randomString(40)
  },

  // Generate realistic user behavior data
  generateBehaviorData: function() {
    const eventTypes = ['click', 'view', 'scroll', 'form_submit', 'page_view']
    const eventNames = ['button_click', 'link_click', 'page_scroll', 'form_submit', 'page_view']
    
    return {
      eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      eventName: eventNames[Math.floor(Math.random() * eventNames.length)],
      eventData: {
        buttonId: this.randomString(10),
        linkId: this.randomString(10),
        scrollDepth: Math.floor(Math.random() * 100),
        formId: this.randomString(10),
      },
      pageUrl: `https://dropiq.com/${this.randomString(8)}`,
      pageTitle: `DropIQ - ${this.randomString(12)}`,
      sessionId: this.randomString(20),
      duration: Math.floor(Math.random() * 30000), // 0-30 seconds
      scrollDepth: Math.floor(Math.random() * 100),
      metadata: {
        source: ['organic', 'direct', 'social', 'referral'][Math.floor(Math.random() * 4)],
        device: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
        browser: ['chrome', 'firefox', 'safari', 'edge'][Math.floor(Math.random() * 4)],
      }
    }
  },

  // Generate realistic airdrop data
  generateAirdropData: function() {
    const projects = ['DeFiChain', 'NFTMarket', 'L2Network', 'Web3Protocol', 'CryptoExchange']
    const statuses = ['ACTIVE', 'UPCOMING', 'ENDED']
    const riskLevels = ['LOW', 'MEDIUM', 'HIGH']
    
    return {
      title: `${projects[Math.floor(Math.random() * projects.length)]} Airdrop`,
      project: projects[Math.floor(Math.random() * projects.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      estimatedValue: Math.floor(Math.random() * 1000) + 50,
      participants: Math.floor(Math.random() * 50000) + 1000,
      type: ['STANDARD', 'NFT', 'TOKEN', 'TESTNET'][Math.floor(Math.random() * 4)],
    }
  },

  // Process response data
  processResponse: function(requestParams, response, context, ee, userContext) {
    if (response.statusCode >= 200 && response.statusCode < 400) {
      ee.emit('counter', 'success.requests', 1)
    } else {
      ee.emit('counter', 'error.requests', 1)
    }

    // Track response time
    if (response.timings && response.timings.response) {
      ee.emit('histogram', 'response.time', response.timings.response)
    }

    // Track specific endpoint performance
    if (requestParams.name) {
      ee.emit('histogram', `response.time.${requestParams.name}`, response.timings.response)
    }
  },

  // Custom error handling
  handleError: function(requestParams, error, context, ee, userContext) {
    ee.emit('counter', 'error.requests', 1)
    ee.emit('counter', `error.${error.code || 'unknown'}`, 1)
    
    console.error(`Request failed: ${requestParams.name || 'unknown'} - ${error.message}`)
  }
}