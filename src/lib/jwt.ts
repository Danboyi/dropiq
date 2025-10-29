import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  role: string
  address?: string
  isGuest?: boolean
}

export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'dropiq',
    audience: 'dropiq-users'
  })
}

export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'dropiq',
      audience: 'dropiq-users'
    }) as JWTPayload
    
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    } else {
      throw new Error('Token verification failed')
    }
  }
}

export function decodeTokenWithoutVerification(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}