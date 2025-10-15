import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-token-secret'

export interface JWTPayload {
  userId: string
  email?: string
  role: string
  walletAddress?: string
  type: 'access' | 'refresh'
}

export class AuthService {
  // Generate JWT tokens
  static generateTokens(payload: Omit<JWTPayload, 'type'>) {
    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      REFRESH_TOKEN_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return { accessToken, refreshToken }
  }

  // Verify JWT token
  static verifyToken(token: string, type: 'access' | 'refresh' = 'access'): JWTPayload {
    const secret = type === 'access' ? JWT_SECRET : REFRESH_TOKEN_SECRET
    
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload
      
      if (decoded.type !== type) {
        throw new Error('Invalid token type')
      }
      
      return decoded
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  // Compare password
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  // Generate nonce for wallet signing
  static generateNonce(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  // Verify Ethereum signature
  static verifySignature(message: string, signature: string, address: string): boolean {
    try {
      // This is a simplified verification - in production, you'd use ethers.js
      const recoveredAddress = this.recoverAddress(message, signature)
      return recoveredAddress.toLowerCase() === address.toLowerCase()
    } catch (error) {
      return false
    }
  }

  // Recover address from signature (simplified)
  private static recoverAddress(message: string, signature: string): string {
    // In production, use ethers.js recoverAddress
    // This is a placeholder implementation
    return '0x' // Placeholder
  }

  // Create wallet signature message
  static createWalletMessage(nonce: string): string {
    return `Welcome to DropIQ!

Please sign this message to authenticate your wallet.

Nonce: ${nonce}

This signature will be used to verify your identity and create a secure session.
It does not grant us permission to execute transactions on your behalf.

Timestamp: ${new Date().toISOString()}`
  }
}