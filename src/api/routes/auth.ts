import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '@/lib/auth-service';
import { db } from '@/lib/db';
import { asyncHandler } from '@/middleware/errorHandler';
import { validateRequest } from '@/middleware/validation';
import { authenticateToken, requireRole, optionalAuth } from '@/middleware/auth';
import { authRateLimiter } from '@/middleware/rateLimiter';
import { ValidationError, ConflictError, AuthenticationError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const router = Router();

// Validation schemas
const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
    displayName: z.string().min(1).max(100).optional(),
  })
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1)
  })
};

const walletAuthSchema = {
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    signature: z.string().min(1),
    message: z.string().min(1),
    walletType: z.enum(['metamask', 'walletconnect', 'coinbase', 'ledger']),
    chainId: z.number().int().positive().optional(),
  })
};

const linkWalletSchema = {
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
    signature: z.string().min(1),
    message: z.string().min(1),
    walletType: z.enum(['metamask', 'walletconnect', 'coinbase', 'ledger']),
    chainId: z.number().int().positive().optional(),
  })
};

// Generate nonce for wallet signing
router.post('/nonce',
  authRateLimiter,
  asyncHandler(async (req: any, res: any) => {
    const { address } = req.body;

    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ValidationError('Valid wallet address is required');
    }

    const authService = new AuthService();
    const nonce = authService.generateNonce();
    const message = authService.createSignMessage(nonce, address);

    res.json({
      nonce,
      message,
    });
  })
);

// Authenticate with wallet
router.post('/connect-wallet',
  authRateLimiter,
  validateRequest(walletAuthSchema),
  asyncHandler(async (req: any, res: any) => {
    const authService = new AuthService();
    const result = await authService.authenticateWithWallet(req.body);

    // Set HTTP-only cookie
    res.cookie('token', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.info('Wallet authenticated', {
      userId: result.user.id,
      address: req.body.address,
      role: result.user.role,
      isNewUser: result.isNewUser,
    });

    res.json({
      message: result.isNewUser ? 'Guest session created' : 'Wallet connected successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        isGuest: result.user.role === 'guest',
      },
      tokens: result.tokens,
      isNewUser: result.isNewUser,
    });
  })
);

// Register new user
router.post('/register', 
  authRateLimiter,
  validateRequest(registerSchema),
  asyncHandler(async (req: any, res: any) => {
    const authService = new AuthService();
    const result = await authService.registerUser(req.body);

    // Set HTTP-only cookie
    res.cookie('token', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.info('User registered', {
      userId: result.user.id,
      email: result.user.email,
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        displayName: result.user.displayName,
        role: result.user.role,
      },
      tokens: result.tokens,
    });
  })
);

// Login user
router.post('/login',
  authRateLimiter,
  validateRequest(loginSchema),
  asyncHandler(async (req: any, res: any) => {
    const authService = new AuthService();
    const result = await authService.loginUser(req.body.email, req.body.password);

    // Set HTTP-only cookie
    res.cookie('token', result.tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.info('User logged in', {
      userId: result.user.id,
      email: result.user.email,
    });

    res.json({
      message: 'Login successful',
      user: {
        id: result.user.id,
        email: result.user.email,
        username: result.user.username,
        displayName: result.user.displayName,
        role: result.user.role,
      },
      tokens: result.tokens,
    });
  })
);

// Link wallet to existing user
router.post('/link-wallet',
  authenticateToken,
  validateRequest(linkWalletSchema),
  asyncHandler(async (req: any, res: any) => {
    const authService = new AuthService();
    await authService.linkWalletToUser(req.user.id, req.body);

    logger.info('Wallet linked to user', {
      userId: req.user.id,
      address: req.body.address,
    });

    res.json({
      message: 'Wallet linked successfully',
    });
  })
);

// Refresh token
router.post('/refresh',
  validateRequest({
    body: z.object({
      refreshToken: z.string().min(1)
    })
  }),
  asyncHandler(async (req: any, res: any) => {
    const authService = new AuthService();
    const tokens = await authService.refreshToken(req.body.refreshToken);

    // Set new HTTP-only cookie
    res.cookie('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      message: 'Token refreshed successfully',
      tokens,
    });
  })
);

// Logout user
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const authService = new AuthService();
    await authService.logout(req.sessionId);

    // Clear cookie
    res.clearCookie('token');

    logger.info('User logged out', {
      userId: req.user.id,
    });

    res.json({
      message: 'Logout successful',
    });
  })
);

// Get current user profile
router.get('/profile',
  authenticateToken,
  asyncHandler(async (req: any, res: any) => {
    const user = await db.user.findUnique({
      where: { id: req.user.id },
      include: {
        wallets: {
          select: {
            id: true,
            address: true,
            chainId: true,
            walletType: true,
            isPrimary: true,
            nickname: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new ValidationError('User not found');
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        isGuest: user.role === 'guest',
        wallets: user.wallets,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
    });
  })
);

// Upgrade guest to full user
router.post('/upgrade',
  authenticateToken,
  requireRole('guest'),
  validateRequest(registerSchema),
  asyncHandler(async (req: any, res: any) => {
    const { email, password, username, displayName } = req.body;

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Upgrade guest user to full user
    const authService = new AuthService();
    const passwordHash = await bcrypt.hash(password, 12);

    const updatedUser = await db.user.update({
      where: { id: req.user.id },
      data: {
        email,
        passwordHash,
        username,
        displayName,
        role: 'user',
      },
    });

    logger.info('Guest user upgraded', {
      userId: req.user.id,
      email,
    });

    res.json({
      message: 'Account upgraded successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
      },
    });
  })
);

export default router;