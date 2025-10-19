import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { User, UserRole, ApiKey } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
  private static readonly JWT_EXPIRES_IN = '15m';
  private static readonly JWT_REFRESH_EXPIRES_IN = '7d';

  // Role-based permissions mapping
  private static readonly ROLE_PERMISSIONS = {
    [UserRole.USER]: [
      'read:profile', 'update:profile', 'read:airdrops', 'participate:airdrops',
      'read:wallet', 'create:wallet', 'update:wallet', 'read:analytics:own'
    ],
    [UserRole.VERIFIED_USER]: [
      ...[UserRole.USER].map(r => AuthService.ROLE_PERMISSIONS[r] || []),
      'create:shilling', 'read:shilling', 'update:shilling:own', 'report:scam'
    ],
    [UserRole.PREMIUM_USER]: [
      ...[UserRole.VERIFIED_USER].map(r => AuthService.ROLE_PERMISSIONS[r] || []),
      'read:analytics:advanced', 'read:airdrops:premium', 'export:data'
    ],
    [UserRole.MODERATOR]: [
      ...[UserRole.PREMIUM_USER].map(r => AuthService.ROLE_PERMISSIONS[r] || []),
      'moderate:content', 'verify:users', 'manage:reports', 'read:analytics:moderator'
    ],
    [UserRole.ADMIN]: [
      ...[UserRole.MODERATOR].map(r => AuthService.ROLE_PERMISSIONS[r] || []),
      'manage:users', 'manage:system', 'read:analytics:all', 'manage:api_keys'
    ]
  };

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateTokens(user: User): AuthTokens {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getPermissionsForRole(user.role)
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
      issuer: 'dropiq-api',
      audience: 'dropiq-client'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, tokenVersion: user.tokenVersion },
      this.JWT_REFRESH_SECRET,
      {
        expiresIn: this.JWT_REFRESH_EXPIRES_IN,
        issuer: 'dropiq-api',
        audience: 'dropiq-client'
      }
    );

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET, {
        issuer: 'dropiq-api',
        audience: 'dropiq-client'
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static async verifyRefreshToken(token: string): Promise<{ userId: string; tokenVersion: number }> {
    try {
      const decoded = jwt.verify(token, this.JWT_REFRESH_SECRET, {
        issuer: 'dropiq-api',
        audience: 'dropiq-client'
      }) as { userId: string; tokenVersion: number };

      const user = await db.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new Error('Invalid refresh token');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static getPermissionsForRole(role: UserRole): string[] {
    return this.ROLE_PERMISSIONS[role] || [];
  }

  static hasPermission(userRole: UserRole, permission: string): boolean {
    const permissions = this.getPermissionsForRole(userRole);
    return permissions.includes(permission);
  }

  static async invalidateUserTokens(userId: string): Promise<void> {
    await db.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });
  }

  // API Key Management
  static async generateApiKey(userId: string, name: string, permissions: string[]): Promise<ApiKey> {
    const keyId = crypto.randomBytes(8).toString('hex');
    const keySecret = crypto.randomBytes(32).toString('hex');
    const hashedKeySecret = crypto.createHash('sha256').update(keySecret).digest('hex');

    const apiKey = await db.apiKey.create({
      data: {
        keyId,
        hashedKeySecret,
        name,
        permissions,
        userId,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      }
    });

    // Return the full key (only shown once)
    return {
      ...apiKey,
      keySecret: `${keyId}.${keySecret}`
    } as ApiKey;
  }

  static async verifyApiKey(apiKey: string): Promise<{ user: User; permissions: string[] } | null> {
    const [keyId, keySecret] = apiKey.split('.');
    
    if (!keyId || !keySecret) {
      return null;
    }

    const hashedKeySecret = crypto.createHash('sha256').update(keySecret).digest('hex');

    const keyRecord = await db.apiKey.findUnique({
      where: {
        keyId_hashedKeySecret: {
          keyId,
          hashedKeySecret
        }
      },
      include: {
        user: true
      }
    });

    if (!keyRecord || !keyRecord.isActive || keyRecord.expiresAt < new Date()) {
      return null;
    }

    // Update last used timestamp
    await db.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    });

    return {
      user: keyRecord.user,
      permissions: keyRecord.permissions
    };
  }

  static async revokeApiKey(keyId: string, userId: string): Promise<void> {
    await db.apiKey.updateMany({
      where: { keyId, userId },
      data: { isActive: false }
    });
  }

  static async rotateApiKey(keyId: string, userId: string): Promise<ApiKey> {
    const existingKey = await db.apiKey.findFirst({
      where: { keyId, userId }
    });

    if (!existingKey) {
      throw new Error('API key not found');
    }

    // Generate new key secret
    const newKeySecret = crypto.randomBytes(32).toString('hex');
    const newHashedKeySecret = crypto.createHash('sha256').update(newKeySecret).digest('hex');

    const updatedKey = await db.apiKey.update({
      where: { id: existingKey.id },
      data: {
        hashedKeySecret: newHashedKeySecret,
        lastRotatedAt: new Date()
      }
    });

    return {
      ...updatedKey,
      keySecret: `${keyId}.${newKeySecret}`
    } as ApiKey;
  }
}