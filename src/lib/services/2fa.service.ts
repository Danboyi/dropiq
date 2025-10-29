import { db } from '@/lib/db'
import { signToken, verifyToken } from '@/lib/jwt'
import crypto from 'crypto'

export interface TwoFactorSetupResult {
  success: boolean
  secret?: string
  qrCode?: string
  backupCodes?: string[]
  error?: string
}

export interface TwoFactorVerifyResult {
  success: boolean
  token?: string
  error?: string
}

export class TwoFactorAuthService {
  /**
   * Generate a secure random secret for TOTP
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('base64').replace(/[^A-Za-z0-9]/g, '').substring(0, 32)
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = []
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase())
    }
    return codes
  }

  /**
   * Setup 2FA for a user
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetupResult> {
    try {
      // Check if user exists
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Check if 2FA is already enabled
      if (user.twoFactorEnabled) {
        return { success: false, error: '2FA is already enabled' }
      }

      // Generate secret
      const secret = this.generateSecret()
      const backupCodes = this.generateBackupCodes()

      // Store temporary 2FA setup (not enabled yet)
      await db.user.update({
        where: { id: userId },
        data: {
          twoFactorSecret: secret,
          twoFactorBackupCodes: backupCodes
        }
      })

      // Generate QR code URL (in a real implementation, you'd use a library like qrcode)
      const issuer = 'DROPIQ'
      const accountName = user.email || user.name || 'user'
      const qrCodeUrl = `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`

      return {
        success: true,
        secret,
        qrCode: qrCodeUrl,
        backupCodes
      }

    } catch (error) {
      console.error('2FA setup error:', error)
      return { success: false, error: 'Failed to setup 2FA' }
    }
  }

  /**
   * Verify TOTP token and enable 2FA
   */
  async verifyAndEnableTwoFactor(
    userId: string,
    token: string
  ): Promise<TwoFactorVerifyResult> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.twoFactorSecret) {
        return { success: false, error: '2FA setup not found' }
      }

      // In a real implementation, you'd verify the TOTP token using the secret
      // For now, we'll simulate verification (accept any 6-digit code)
      const isValidToken = /^\d{6}$/.test(token)

      if (!isValidToken) {
        return { success: false, error: 'Invalid verification code' }
      }

      // Enable 2FA
      await db.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true
        }
      })

      // Generate temporary token for the session
      const sessionToken = signToken({
        userId,
        twoFactorVerified: true,
        type: '2fa_session'
      }, 15 * 60) // 15 minutes

      return {
        success: true,
        token: sessionToken
      }

    } catch (error) {
      console.error('2FA verification error:', error)
      return { success: false, error: 'Failed to verify 2FA' }
    }
  }

  /**
   * Verify 2FA during login
   */
  async verifyTwoFactorLogin(
    userId: string,
    token: string,
    backupCode?: string
  ): Promise<TwoFactorVerifyResult> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.twoFactorEnabled) {
        return { success: false, error: '2FA not enabled for this user' }
      }

      // Check backup code first
      if (backupCode) {
        const backupCodes = user.twoFactorBackupCodes as string[] || []
        const codeIndex = backupCodes.indexOf(backupCode.toUpperCase())

        if (codeIndex === -1) {
          return { success: false, error: 'Invalid backup code' }
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1)
        await db.user.update({
          where: { id: userId },
          data: {
            twoFactorBackupCodes: backupCodes
          }
        })

        const sessionToken = signToken({
          userId,
          twoFactorVerified: true,
          type: '2fa_session'
        })

        return {
          success: true,
          token: sessionToken
        }
      }

      // Verify TOTP token (simplified - in production use proper TOTP library)
      const isValidToken = /^\d{6}$/.test(token)

      if (!isValidToken) {
        return { success: false, error: 'Invalid verification code' }
      }

      const sessionToken = signToken({
        userId,
        twoFactorVerified: true,
        type: '2fa_session'
      })

      return {
        success: true,
        token: sessionToken
      }

    } catch (error) {
      console.error('2FA login verification error:', error)
      return { success: false, error: 'Failed to verify 2FA' }
    }
  }

  /**
   * Disable 2FA for a user
   */
  async disableTwoFactor(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return { success: false, error: 'User not found' }
      }

      // Verify password (for email users)
      if (user.password && password) {
        const { verifyPassword } = await import('@/lib/auth')
        const isValidPassword = await verifyPassword(password, user.password)
        
        if (!isValidPassword) {
          return { success: false, error: 'Invalid password' }
        }
      }

      // Disable 2FA
      await db.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: null
        }
      })

      return { success: true }

    } catch (error) {
      console.error('Disable 2FA error:', error)
      return { success: false, error: 'Failed to disable 2FA' }
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<{ success: boolean; codes?: string[]; error?: string }> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId }
      })

      if (!user || !user.twoFactorEnabled) {
        return { success: false, error: '2FA not enabled' }
      }

      const backupCodes = this.generateBackupCodes()

      await db.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes: backupCodes
        }
      })

      return { success: true, codes: backupCodes }

    } catch (error) {
      console.error('Regenerate backup codes error:', error)
      return { success: false, error: 'Failed to regenerate backup codes' }
    }
  }

  /**
   * Check if user needs 2FA verification
   */
  async requiresTwoFactor(userId: string): Promise<boolean> {
    try {
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { twoFactorEnabled: true }
      })

      return user?.twoFactorEnabled || false

    } catch (error) {
      console.error('Check 2FA requirement error:', error)
      return false
    }
  }

  /**
   * Verify 2FA session token
   */
  async verifyTwoFactorSession(token: string): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = verifyToken(token) as any

      if (!decoded || decoded.type !== '2fa_session' || !decoded.userId) {
        return { valid: false }
      }

      return { valid: true, userId: decoded.userId }

    } catch (error) {
      console.error('Verify 2FA session error:', error)
      return { valid: false }
    }
  }
}

// Export singleton instance
export const twoFactorAuthService = new TwoFactorAuthService()