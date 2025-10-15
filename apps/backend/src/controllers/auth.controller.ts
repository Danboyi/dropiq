import { Request, Response } from 'express'
import { z } from 'zod'
import { AuthService } from '../services/auth.service'
import { prisma } from '../lib/db'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

// Validation schemas
const connectWalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string(),
  message: z.string(),
  chainId: z.number().default(1)
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

const linkWalletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string(),
  message: z.string(),
  chainId: z.number().default(1)
})

export class AuthController {
  // Connect wallet endpoint
  static async connectWallet(req: Request, res: Response) {
    try {
      const { address, signature, message, chainId } = connectWalletSchema.parse(req.body)

      // Verify signature
      const isValidSignature = AuthService.verifySignature(message, signature, address)
      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid signature'
          }
        })
      }

      // Check if wallet already exists
      let wallet = await prisma.wallet.findUnique({
        where: { address: address.toLowerCase() },
        include: { user: true }
      })

      let user
      let isNewUser = false

      if (wallet) {
        // Wallet exists, get the user
        user = wallet.user
        
        // Update last connected time
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { 
            lastConnectedAt: new Date(),
            chainId 
          }
        })
      } else {
        // Create new guest user
        user = await prisma.user.create({
          data: {
            role: 'GUEST',
            isActive: true
          }
        })

        // Create wallet for the user
        wallet = await prisma.wallet.create({
          data: {
            address: address.toLowerCase(),
            chainId,
            isPrimary: true,
            userId: user.id
          }
        })

        isNewUser = true
      }

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        role: user.role,
        walletAddress: address.toLowerCase()
      })

      // Create session
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

      await prisma.session.create({
        data: {
          token: accessToken,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt,
          userId: user.id
        }
      })

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            isNewUser
          },
          wallet: {
            address: wallet.address,
            chainId: wallet.chainId,
            isPrimary: wallet.isPrimary
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: isNewUser ? 'Guest account created successfully' : 'Wallet connected successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        })
      }

      console.error('Wallet connection error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }

  // Register endpoint
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = registerSchema.parse(req.body)

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'User with this email already exists'
          }
        })
      }

      // Hash password
      const passwordHash = await AuthService.hashPassword(password)

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role: 'USER',
          isActive: true
        }
      })

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      })

      // Create session
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await prisma.session.create({
        data: {
          token: accessToken,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt,
          userId: user.id
        }
      })

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: 'User registered successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        })
      }

      console.error('Registration error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }

  // Login endpoint
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body)

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      })

      if (!user || !user.passwordHash) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
      }

      // Verify password
      const isValidPassword = await AuthService.comparePassword(password, user.passwordHash)
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password'
          }
        })
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'ACCOUNT_DISABLED',
            message: 'Account is disabled'
          }
        })
      }

      // Generate tokens
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role
      })

      // Create session
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await prisma.session.create({
        data: {
          token: accessToken,
          refreshToken,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          expiresAt,
          userId: user.id
        }
      })

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar
          },
          tokens: {
            accessToken,
            refreshToken
          }
        },
        message: 'Login successful'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        })
      }

      console.error('Login error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }

  // Link wallet to existing user
  static async linkWallet(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        })
      }

      const { address, signature, message, chainId } = linkWalletSchema.parse(req.body)

      // Verify signature
      const isValidSignature = AuthService.verifySignature(message, signature, address)
      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Invalid signature'
          }
        })
      }

      // Check if wallet is already linked to another user
      const existingWallet = await prisma.wallet.findUnique({
        where: { address: address.toLowerCase() }
      })

      if (existingWallet && existingWallet.userId !== req.user.id) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'WALLET_LINKED',
            message: 'Wallet is already linked to another account'
          }
        })
      }

      // Check if user already has this wallet
      const userWallet = await prisma.wallet.findFirst({
        where: {
          userId: req.user.id,
          address: address.toLowerCase()
        }
      })

      if (userWallet) {
        // Update existing wallet
        await prisma.wallet.update({
          where: { id: userWallet.id },
          data: {
            chainId,
            lastConnectedAt: new Date()
          }
        })
      } else {
        // Create new wallet
        await prisma.wallet.create({
          data: {
            address: address.toLowerCase(),
            chainId,
            isPrimary: false, // Don't make it primary by default
            userId: req.user.id
          }
        })
      }

      res.json({
        success: true,
        data: {
          wallet: {
            address: address.toLowerCase(),
            chainId,
            isPrimary: userWallet?.isPrimary || false
          }
        },
        message: 'Wallet linked successfully'
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors
          }
        })
      }

      console.error('Link wallet error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }

  // Refresh token endpoint
  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'MISSING_REFRESH_TOKEN',
            message: 'Refresh token required'
          }
        })
      }

      // Verify refresh token
      const decoded = AuthService.verifyToken(refreshToken, 'refresh')

      // Check if session exists
      const session = await prisma.session.findUnique({
        where: { refreshToken },
        include: { user: true }
      })

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_REFRESH_TOKEN',
            message: 'Invalid or expired refresh token'
          }
        })
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = AuthService.generateTokens({
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        walletAddress: decoded.walletAddress
      })

      // Update session
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: accessToken,
          refreshToken: newRefreshToken,
          expiresAt
        }
      })

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken
          }
        },
        message: 'Token refreshed successfully'
      })
    } catch (error) {
      console.error('Refresh token error:', error)
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'Invalid or expired refresh token'
        }
      })
    }
  }

  // Logout endpoint
  static async logout(req: AuthenticatedRequest, res: Response) {
    try {
      const authHeader = req.headers.authorization
      const token = authHeader && authHeader.split(' ')[1]

      if (token) {
        // Deactivate session
        await prisma.session.updateMany({
          where: { token },
          data: { isActive: false }
        })
      }

      res.json({
        success: true,
        message: 'Logout successful'
      })
    } catch (error) {
      console.error('Logout error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }

  // Get current user
  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required'
          }
        })
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          wallets: {
            where: { isPrimary: true }
          }
        }
      })

      if (!user) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found'
          }
        })
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            bio: user.bio,
            emailNotifications: user.emailNotifications,
            pushNotifications: user.pushNotifications,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            primaryWallet: user.wallets[0] || null
          }
        }
      })
    } catch (error) {
      console.error('Get current user error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }

  // Get nonce for wallet signing
  static async getNonce(req: Request, res: Response) {
    try {
      const { address } = req.query

      if (!address || typeof address !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ADDRESS',
            message: 'Valid wallet address required'
          }
        })
      }

      const nonce = AuthService.generateNonce()
      const message = AuthService.createWalletMessage(nonce)

      res.json({
        success: true,
        data: {
          nonce,
          message
        }
      })
    } catch (error) {
      console.error('Get nonce error:', error)
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      })
    }
  }
}