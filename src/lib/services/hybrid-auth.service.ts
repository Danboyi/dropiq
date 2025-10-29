import { db } from '@/lib/db'
import { hashPassword, verifyPassword, generateNonce } from '@/lib/auth'
import { signToken, verifyToken } from '@/lib/jwt'
import { verifySignature, normalizeAddress, isValidEthereumAddress } from '@/lib/auth'
import type { User, Wallet } from '@prisma/client'

export interface AuthResult {
  success: boolean
  user?: {
    id: string
    email?: string
    name?: string
    role: string
    isGuest: boolean
    authMethod: 'wallet' | 'email'
    wallets?: Array<{
      address: string
      isPrimary: boolean
    }>
  }
  token?: string
  isNewUser?: boolean
  message?: string
  error?: string
}

export interface LinkAccountResult {
  success: boolean
  message?: string
  error?: string
}

export class HybridAuthService {
  /**
   * Authenticate with wallet signature
   */
  async authenticateWithWallet(
    address: string,
    signature: string,
    message: string
  ): Promise<AuthResult> {
    try {
      // Validate address
      if (!isValidEthereumAddress(address)) {
        return { success: false, error: 'Invalid wallet address' }
      }

      const normalizedAddress = normalizeAddress(address)

      // Find wallet and associated user
      const wallet = await db.wallet.findUnique({
        where: { address: normalizedAddress },
        include: { user: true }
      })

      if (!wallet) {
        return { success: false, error: 'Wallet not found. Please request a nonce first.' }
      }

      // Verify signature
      if (!verifySignature(message, signature, normalizedAddress)) {
        return { success: false, error: 'Invalid signature' }
      }

      let user = wallet.user
      let isNewUser = false

      // If no user exists, create a guest user
      if (!user) {
        user = await db.user.create({
          data: {
            isGuest: true,
            role: 'user'
          }
        })

        await db.wallet.update({
          where: { id: wallet.id },
          data: { userId: user.id }
        })

        isNewUser = true
      }

      // Update wallet usage
      await db.wallet.update({
        where: { id: wallet.id },
        data: {
          lastUsedAt: new Date(),
          nonce: generateNonce()
        }
      })

      // Get all user wallets
      const userWallets = await db.wallet.findMany({
        where: { userId: user.id },
        select: {
          address: true,
          isPrimary: true
        }
      })

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        role: user.role,
        address: normalizedAddress,
        isGuest: user.isGuest,
        authMethod: 'wallet'
      })

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email || undefined,
          name: user.name || undefined,
          role: user.role,
          isGuest: user.isGuest,
          authMethod: 'wallet',
          wallets: userWallets
        },
        isNewUser,
        message: isNewUser 
          ? 'Guest account created. Link an email account to save your progress.'
          : 'Welcome back!'
      }

    } catch (error) {
      console.error('Wallet authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * Authenticate with email and password
   */
  async authenticateWithEmail(
    email: string,
    password: string
  ): Promise<AuthResult> {
    try {
      // Find user with wallets
      const user = await db.user.findUnique({
        where: { email },
        include: { wallets: true }
      })

      if (!user || !user.password) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Verify password
      const isPasswordValid = await verifyPassword(password, user.password)
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid email or password' }
      }

      // Get user wallets
      const userWallets = user.wallets.map(wallet => ({
        address: wallet.address,
        isPrimary: wallet.isPrimary
      }))

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        isGuest: user.isGuest,
        authMethod: 'email'
      })

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email || undefined,
          name: user.name || undefined,
          role: user.role,
          isGuest: user.isGuest,
          authMethod: 'email',
          wallets: userWallets
        },
        message: 'Welcome back!'
      }

    } catch (error) {
      console.error('Email authentication error:', error)
      return { success: false, error: 'Authentication failed' }
    }
  }

  /**
   * Register new user with email and password
   */
  async registerWithEmail(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await db.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return { success: false, error: 'User with this email already exists' }
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create user
      const user = await db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          isGuest: false,
          role: 'user'
        }
      })

      // Generate JWT token
      const token = signToken({
        userId: user.id,
        role: user.role,
        email: user.email,
        isGuest: user.isGuest,
        authMethod: 'email'
      })

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email || undefined,
          name: user.name || undefined,
          role: user.role,
          isGuest: user.isGuest,
          authMethod: 'email',
          wallets: []
        },
        isNewUser: true,
        message: 'Account created successfully!'
      }

    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Registration failed' }
    }
  }

  /**
   * Link wallet to existing email account
   */
  async linkWalletToAccount(
    userId: string,
    address: string,
    signature: string,
    message: string
  ): Promise<LinkAccountResult> {
    try {
      // Validate address
      if (!isValidEthereumAddress(address)) {
        return { success: false, error: 'Invalid wallet address' }
      }

      const normalizedAddress = normalizeAddress(address)

      // Find user
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Find wallet
      const wallet = await db.wallet.findUnique({
        where: { address: normalizedAddress }
      })

      if (!wallet) {
        return { success: false, error: 'Wallet not found. Please request a nonce first.' }
      }

      // Verify signature
      if (!verifySignature(message, signature, normalizedAddress)) {
        return { success: false, error: 'Invalid signature' }
      }

      // Check if wallet is already linked to another user
      if (wallet.userId && wallet.userId !== userId) {
        return { success: false, error: 'Wallet is already linked to another account' }
      }

      // Link wallet to user
      await db.wallet.update({
        where: { id: wallet.id },
        data: {
          userId,
          lastUsedAt: new Date(),
          nonce: generateNonce()
        }
      })

      // Update user to non-guest if they were a guest
      if (user.isGuest) {
        await db.user.update({
          where: { id: userId },
          data: { isGuest: false }
        })
      }

      return {
        success: true,
        message: 'Wallet successfully linked to your account!'
      }

    } catch (error) {
      console.error('Link wallet error:', error)
      return { success: false, error: 'Failed to link wallet' }
    }
  }

  /**
   * Link email to existing guest account
   */
  async linkEmailToAccount(
    userId: string,
    email: string,
    password: string,
    name?: string
  ): Promise<LinkAccountResult> {
    try {
      // Find user
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Check if email already exists
      const existingUser = await db.user.findUnique({
        where: { email }
      })

      if (existingUser && existingUser.id !== userId) {
        return { success: false, error: 'Email is already in use' }
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Update user with email and password
      await db.user.update({
        where: { id: userId },
        data: {
          email,
          password: hashedPassword,
          name: name || user.name,
          isGuest: false
        }
      })

      return {
        success: true,
        message: 'Email successfully linked to your account!'
      }

    } catch (error) {
      console.error('Link email error:', error)
      return { success: false, error: 'Failed to link email' }
    }
  }

  /**
   * Get user profile with authentication info
   */
  async getUserProfile(userId: string) {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          wallets: {
            select: {
              address: true,
              isPrimary: true,
              lastUsedAt: true,
              createdAt: true
            },
            orderBy: { lastUsedAt: 'desc' }
          }
        }
      })

      if (!user) {
        return null
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isGuest: user.isGuest,
        wallets: user.wallets,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }

    } catch (error) {
      console.error('Get user profile error:', error)
      return null
    }
  }

  /**
   * Verify JWT token and get user info
   */
  async verifyToken(token: string) {
    try {
      const decoded = verifyToken(token) as any
      
      if (!decoded || !decoded.userId) {
        return null
      }

      const user = await this.getUserProfile(decoded.userId)
      
      if (!user) {
        return null
      }

      return {
        ...user,
        authMethod: decoded.authMethod,
        tokenPayload: decoded
      }

    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

  /**
   * Change password for email-authenticated users
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.password) {
        return { success: false, error: 'User not found or no password set' }
      }

      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password)
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' }
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword)

      // Update password
      await db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      })

      return { success: true }

    } catch (error) {
      console.error('Change password error:', error)
      return { success: false, error: 'Failed to change password' }
    }
  }

  /**
   * Remove wallet from user account
   */
  async unlinkWallet(userId: string, address: string): Promise<LinkAccountResult> {
    try {
      const normalizedAddress = normalizeAddress(address)

      // Find wallet
      const wallet = await db.wallet.findUnique({
        where: { address: normalizedAddress }
      })

      if (!wallet || wallet.userId !== userId) {
        return { success: false, error: 'Wallet not found or not linked to your account' }
      }

      // Check if user has other wallets
      const userWalletCount = await db.wallet.count({
        where: { userId }
      })

      if (userWalletCount <= 1) {
        return { success: false, error: 'Cannot remove the only wallet linked to your account' }
      }

      // Unlink wallet
      await db.wallet.update({
        where: { id: wallet.id },
        data: {
          userId: null,
          isPrimary: false
        }
      })

      return {
        success: true,
        message: 'Wallet successfully unlinked from your account'
      }

    } catch (error) {
      console.error('Unlink wallet error:', error)
      return { success: false, error: 'Failed to unlink wallet' }
    }
  }
}

// Export singleton instance
export const hybridAuthService = new HybridAuthService()