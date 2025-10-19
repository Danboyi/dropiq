import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId?: string;
  walletAddress?: string;
  role: 'guest' | 'user' | 'premium';
  sessionId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface WalletAuthData {
  address: string;
  signature: string;
  message: string;
  walletType: string;
  chainId?: number;
}

export interface UserRegistrationData {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export class AuthService {
  /**
   * Generate JWT tokens for authentication
   */
  generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Authenticate with wallet signature
   */
  async authenticateWithWallet(data: WalletAuthData): Promise<{
    user: any;
    tokens: AuthTokens;
    isNewUser: boolean;
  }> {
    const { address, signature, message, walletType, chainId = 1 } = data;

    // Verify the signature
    const isValidSignature = await this.verifySignature(address, signature, message);
    if (!isValidSignature) {
      throw new Error('Invalid signature');
    }

    // Check if wallet exists
    let wallet = await db.wallet.findUnique({
      where: { address: address.toLowerCase() },
      include: { user: true },
    });

    let user = wallet?.user;
    let isNewUser = false;

    if (!wallet) {
      // Create new guest user and wallet
      user = await db.user.create({
        data: {
          role: 'guest',
          lastLoginAt: new Date(),
        },
      });

      wallet = await db.wallet.create({
        data: {
          userId: user.id,
          address: address.toLowerCase(),
          chainId,
          walletType,
          isPrimary: true,
          isVerified: true,
        },
      });

      isNewUser = true;
    } else if (wallet.user) {
      // Existing user with full account
      user = wallet.user;
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    } else {
      // Wallet exists but no user (guest session)
      isNewUser = true;
      user = await db.user.create({
        data: {
          role: 'guest',
          lastLoginAt: new Date(),
        },
      });

      await db.wallet.update({
        where: { id: wallet.id },
        data: { userId: user.id },
      });
    }

    // Create auth session
    const sessionId = crypto.randomUUID();
    const tokens = this.generateTokens({
      userId: user.id,
      walletAddress: address.toLowerCase(),
      role: user.role as 'guest' | 'user' | 'premium',
      sessionId,
    });

    await this.createAuthSession({
      userId: user.id,
      walletAddress: address.toLowerCase(),
      sessionId,
      tokens,
      role: user.role,
    });

    return {
      user,
      tokens,
      isNewUser,
    };
  }

  /**
   * Register new user with email/password
   */
  async registerUser(data: UserRegistrationData): Promise<{
    user: any;
    tokens: AuthTokens;
  }> {
    const { email, password, username, displayName } = data;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        username,
        displayName,
        role: 'user',
        lastLoginAt: new Date(),
      },
    });

    // Generate tokens
    const sessionId = crypto.randomUUID();
    const tokens = this.generateTokens({
      userId: user.id,
      role: 'user',
      sessionId,
    });

    // Create auth session
    await this.createAuthSession({
      userId: user.id,
      sessionId,
      tokens,
      role: 'user',
    });

    return {
      user,
      tokens,
    };
  }

  /**
   * Login with email/password
   */
  async loginUser(email: string, password: string): Promise<{
    user: any;
    tokens: AuthTokens;
  }> {
    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const sessionId = crypto.randomUUID();
    const tokens = this.generateTokens({
      userId: user.id,
      role: user.role as 'guest' | 'user' | 'premium',
      sessionId,
    });

    // Create auth session
    await this.createAuthSession({
      userId: user.id,
      sessionId,
      tokens,
      role: user.role,
    });

    return {
      user,
      tokens,
    };
  }

  /**
   * Link wallet to existing user account
   */
  async linkWalletToUser(
    userId: string,
    walletData: WalletAuthData
  ): Promise<void> {
    const { address, signature, message, walletType, chainId = 1 } = walletData;

    // Verify signature
    const isValidSignature = await this.verifySignature(address, signature, message);
    if (!isValidSignature) {
      throw new Error('Invalid signature');
    }

    // Check if wallet is already linked
    const existingWallet = await db.wallet.findUnique({
      where: { address: address.toLowerCase() },
    });

    if (existingWallet) {
      if (existingWallet.userId === userId) {
        throw new Error('Wallet already linked to this account');
      }
      throw new Error('Wallet already linked to another account');
    }

    // Create wallet
    await db.wallet.create({
      data: {
        userId,
        address: address.toLowerCase(),
        chainId,
        walletType,
        isPrimary: false,
        isVerified: true,
      },
    });
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Find session
    const session = await db.authSession.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      throw new Error('Invalid refresh token');
    }

    // Generate new tokens
    const sessionId = crypto.randomUUID();
    const tokens = this.generateTokens({
      userId: session.userId || undefined,
      walletAddress: session.walletAddress || undefined,
      role: session.role as 'guest' | 'user' | 'premium',
      sessionId,
    });

    // Update session
    await db.authSession.update({
      where: { id: session.id },
      data: {
        sessionId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        lastActiveAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return tokens;
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    await db.authSession.updateMany({
      where: { sessionId },
      data: { isActive: false },
    });
  }

  /**
   * Get user from token
   */
  async getUserFromToken(token: string): Promise<any> {
    const payload = this.verifyToken(token);

    const session = await db.authSession.findFirst({
      where: {
        sessionId: payload.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    return session.user;
  }

  /**
   * Create auth session in database
   */
  private async createAuthSession(data: {
    userId?: string;
    walletAddress?: string;
    sessionId: string;
    tokens: AuthTokens;
    role: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await db.authSession.create({
      data: {
        userId: data.userId,
        walletAddress: data.walletAddress,
        token: data.tokens.accessToken,
        refreshToken: data.tokens.refreshToken,
        role: data.role,
        sessionId: data.sessionId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }

  /**
   * Verify Ethereum signature
   */
  private async verifySignature(
    address: string,
    signature: string,
    message: string
  ): Promise<boolean> {
    try {
      // This is a simplified verification
      // In production, you would use ethers.js or web3.js to verify the signature
      
      // Recover the address from the signature
      const recoveredAddress = this.recoverAddress(message, signature);
      
      return recoveredAddress.toLowerCase() === address.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Recover address from signature (simplified)
   */
  private recoverAddress(message: string, signature: string): string {
    // This is a placeholder implementation
    // In production, use ethers.js: ethers.verifyMessage(message, signature)
    return '0x0000000000000000000000000000000000000000';
  }

  /**
   * Generate nonce for wallet signing
   */
  generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Create sign message for wallet authentication
   */
  createSignMessage(nonce: string, address: string): string {
    return `Welcome to DropIQ!

Sign this message to authenticate your wallet.

Address: ${address}
Nonce: ${nonce}
Timestamp: ${Date.now()}

This signature will be used to verify your identity and create a secure session.
No transactions will be executed.`;
  }
}