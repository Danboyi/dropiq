import {
  validateEmail,
  validateWalletAddress,
  validateUsername,
  validatePassword,
  validateAirdrop,
  validateCampaign,
  isValidUrl,
  isValidHexColor,
  sanitizeHtml,
  formatCurrency,
  formatLargeNumber,
  timeAgo,
  generateId,
  debounce,
  throttle,
} from '@/lib/utils/validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ]

      validEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(email)
        }
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        'test@.com',
        'test@example.',
        '',
      ]

      invalidEmails.forEach(email => {
        const result = validateEmail(email)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid email address')
        }
      })
    })
  })

  describe('validateWalletAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      const validAddresses = [
        '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b',
        '0x1234567890123456789012345678901234567890',
        '0xabcdefABCDEF1234567890123456789012345678',
      ]

      validAddresses.forEach(address => {
        const result = validateWalletAddress(address)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(address.toLowerCase())
        }
      })
    })

    it('should reject invalid Ethereum addresses', () => {
      const invalidAddresses = [
        '0x123', // Too short
        '1234567890123456789012345678901234567890', // Missing 0x
        '0xGHIJKL123456789012345678901234567890', // Invalid characters
        '0x1234567890123456789012345678901234567890123', // Too long
        '',
      ]

      invalidAddresses.forEach(address => {
        const result = validateWalletAddress(address)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid Ethereum address')
        }
      })
    })
  })

  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = [
        'user123',
        'test_user',
        'alice',
        'bob_the_builder',
        'user123456789012345', // 18 characters
      ]

      validUsernames.forEach(username => {
        const result = validateUsername(username)
        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.data).toBe(username)
        }
      })
    })

    it('should reject invalid usernames', () => {
      const invalidUsernames = [
        'us', // Too short
        'user', // Too short
        'user1234567890123456', // Too long (21 characters)
        'user-name', // Invalid character
        'user@name', // Invalid character
        'user name', // Invalid character
        '',
      ]

      invalidUsernames.forEach(username => {
        const result = validateUsername(username)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MySecure@Pass',
        'Str0ng#Password',
        'Complex$Pass123',
      ]

      strongPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.success).toBe(true)
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // No uppercase, number, special
        'PASSWORD', // No lowercase, number, special
        '12345678', // No letters, special
        'Password', // No number, special
        'Password123', // No special character
        'Pass1!', // Too short
        '',
      ]

      weakPasswords.forEach(password => {
        const result = validatePassword(password)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('validateAirdrop', () => {
    it('should validate correct airdrop data', () => {
      const validAirdrop = {
        title: 'Test Airdrop',
        description: 'This is a test airdrop with sufficient description',
        totalAmount: 10000,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        projectWebsite: 'https://example.com',
      }

      const result = validateAirdrop(validAirdrop)
      expect(result.success).toBe(true)
    })

    it('should reject invalid airdrop data', () => {
      const invalidAirdrops = [
        { title: '', description: 'Test', totalAmount: 1000 }, // Empty title
        { title: 'Test', description: 'Short', totalAmount: 1000 }, // Short description
        { title: 'Test', description: 'Valid description', totalAmount: -100 }, // Negative amount
        { title: 'Test', description: 'Valid description', totalAmount: 1000, projectWebsite: 'invalid-url' }, // Invalid URL
      ]

      invalidAirdrops.forEach(airdrop => {
        const result = validateAirdrop(airdrop)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('validateCampaign', () => {
    it('should validate correct campaign data', () => {
      const validCampaign = {
        title: 'Test Campaign',
        description: 'This is a test campaign with sufficient description',
        budget: 5000,
        rewardPerAction: 10.50,
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
      }

      const result = validateCampaign(validCampaign)
      expect(result.success).toBe(true)
    })

    it('should reject invalid campaign data', () => {
      const invalidCampaigns = [
        { title: '', description: 'Test', budget: 1000, rewardPerAction: 10 }, // Empty title
        { title: 'Test', description: 'Short', budget: 1000, rewardPerAction: 10 }, // Short description
        { title: 'Test', description: 'Valid description', budget: 0, rewardPerAction: 10 }, // Zero budget
        { title: 'Test', description: 'Valid description', budget: 1000, rewardPerAction: 0 }, // Zero reward
      ]

      invalidCampaigns.forEach(campaign => {
        const result = validateCampaign(campaign)
        expect(result.success).toBe(false)
      })
    })
  })
})

describe('Utility Functions', () => {
  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://localhost:3000',
        'https://subdomain.example.com/path',
        'ftp://example.com',
      ]

      validUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(true)
      })
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'example.com',
        'http://',
        'https://',
        '',
      ]

      invalidUrls.forEach(url => {
        expect(isValidUrl(url)).toBe(false)
      })
    })
  })

  describe('isValidHexColor', () => {
    it('should validate correct hex colors', () => {
      const validColors = [
        '#ffffff',
        '#000000',
        '#ff0000',
        '#00ff00',
        '#0000ff',
        '#abc',
        '#123',
      ]

      validColors.forEach(color => {
        expect(isValidHexColor(color)).toBe(true)
      })
    })

    it('should reject invalid hex colors', () => {
      const invalidColors = [
        'ffffff', // Missing #
        '#gggggg', // Invalid hex
        '#ffff', // Wrong length
        '#12345', // Wrong length
        '',
      ]

      invalidColors.forEach(color => {
        expect(isValidHexColor(color)).toBe(false)
      })
    })
  })

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const html = '<div><script>alert("xss")</script>Content</div>'
      const sanitized = sanitizeHtml(html)
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("xss")')
    })

    it('should remove iframe tags', () => {
      const html = '<div><iframe src="evil.com"></iframe>Content</div>'
      const sanitized = sanitizeHtml(html)
      expect(sanitized).not.toContain('<iframe>')
    })

    it('should remove javascript: protocols', () => {
      const html = '<a href="javascript:alert(\'xss\')">Link</a>'
      const sanitized = sanitizeHtml(html)
      expect(sanitized).not.toContain('javascript:')
    })

    it('should remove event handlers', () => {
      const html = '<div onclick="alert(\'xss\')">Content</div>'
      const sanitized = sanitizeHtml(html)
      expect(sanitized).not.toContain('onclick')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(0)).toBe('$0.00')
      expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    })

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56')
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56')
    })
  })

  describe('formatLargeNumber', () => {
    it('should format large numbers correctly', () => {
      expect(formatLargeNumber(500)).toBe('500')
      expect(formatLargeNumber(1500)).toBe('1.5K')
      expect(formatLargeNumber(2500000)).toBe('2.5M')
      expect(formatLargeNumber(1500000000)).toBe('1.5B')
    })
  })

  describe('timeAgo', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should calculate time ago correctly', () => {
      expect(timeAgo('2024-01-01T11:59:00Z')).toBe('just now')
      expect(timeAgo('2024-01-01T11:30:00Z')).toBe('30 minutes ago')
      expect(timeAgo('2024-01-01T08:00:00Z')).toBe('4 hours ago')
      expect(timeAgo('2023-12-30T12:00:00Z')).toBe('2 days ago')
      expect(timeAgo('2023-11-01T12:00:00Z')).toBe('2 months ago')
      expect(timeAgo('2022-01-01T12:00:00Z')).toBe('2 years ago')
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      
      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^[a-z0-9]{9}$/)
      expect(id2).toMatch(/^[a-z0-9]{9}$/)
    })
  })

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should debounce function calls', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      // Call multiple times quickly
      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // Should not be called yet
      expect(mockFn).not.toHaveBeenCalled()

      // Fast forward time
      jest.advanceTimersByTime(100)

      // Should be called once with last argument
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })
  })

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should throttle function calls', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      // Call multiple times quickly
      throttledFn('arg1')
      throttledFn('arg2')
      throttledFn('arg3')

      // Should be called only once immediately
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      // Fast forward time
      jest.advanceTimersByTime(100)

      // Call again
      throttledFn('arg4')

      // Should be called again
      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenCalledWith('arg4')
    })
  })
})