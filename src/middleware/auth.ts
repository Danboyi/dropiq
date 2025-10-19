import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/lib/auth-service';
import { db } from '@/lib/db';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role: 'guest' | 'user' | 'premium';
    wallets?: string[];
  };
  sessionId?: string;
  walletAddress?: string;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;

    // Get token from header or cookie
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : cookieToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify token
    const authService = new AuthService();
    const payload = authService.verifyToken(token);

    // Find session
    const session = await db.authSession.findFirst({
      where: {
        sessionId: payload.sessionId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      res.status(401).json({ error: 'Invalid session' });
      return;
    }

    // Update last active
    await db.authSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    // Get user wallets
    const wallets = await db.wallet.findMany({
      where: { userId: session.userId },
      select: { address: true },
    });

    req.user = {
      id: session.userId || payload.sessionId,
      email: session.user?.email,
      role: session.role as 'guest' | 'user' | 'premium',
      wallets: wallets.map(w => w.address),
    };

    req.sessionId = payload.sessionId;
    req.walletAddress = payload.walletAddress;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid authentication credentials' });
  }
};

export const requireRole = (role: 'guest' | 'user' | 'premium') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const roleHierarchy = { guest: 0, user: 1, premium: 2 };
    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const requiredRoleLevel = roleHierarchy[role] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({ 
        error: 'Insufficient role',
        required: role,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

export const requireMinimumRole = (minimumRole: 'guest' | 'user' | 'premium') => {
  const roleHierarchy = { guest: 0, user: 1, premium: 2 };

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userRoleLevel = roleHierarchy[req.user.role] || 0;
    const requiredRoleLevel = roleHierarchy[minimumRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      res.status(403).json({ 
        error: 'Insufficient role level',
        required: minimumRole,
        current: req.user.role
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;

    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : cookieToken;

    if (token) {
      const authService = new AuthService();
      const payload = authService.verifyToken(token);

      const session = await db.authSession.findFirst({
        where: {
          sessionId: payload.sessionId,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (session) {
        const wallets = await db.wallet.findMany({
          where: { userId: session.userId },
          select: { address: true },
        });

        req.user = {
          id: session.userId || payload.sessionId,
          email: session.user?.email,
          role: session.role as 'guest' | 'user' | 'premium',
          wallets: wallets.map(w => w.address),
        };

        req.sessionId = payload.sessionId;
        req.walletAddress = payload.walletAddress;
      }
    }

    next();
  } catch (error) {
    // Optional auth means we continue even if authentication fails
    next();
  }
};

export const requireWallet = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  if (!req.walletAddress) {
    res.status(401).json({ error: 'Wallet connection required' });
    return;
  }

  next();
};