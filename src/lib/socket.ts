import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from './db';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Global variable to store the Socket.IO server instance
let ioInstance: Server | null = null;

export const setServer = (io: Server) => {
  ioInstance = io;
};

export const getServer = (): Server | null => {
  return ioInstance;
};

export const setupSocket = (io: Server) => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: any, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Get user from database
      const user = await db.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected:`, socket.id);
    
    // Join user to their personal room
    socket.join(`user:${socket.userId}`);
    
    // Join admins to admin room
    if (socket.userRole === 'admin') {
      socket.join('admins');
      console.log(`Admin ${socket.userId} joined admin room`);
    }

    // Handle security alert subscription
    socket.on('subscribe-security-alerts', () => {
      socket.join('security-alerts');
      console.log(`User ${socket.userId} subscribed to security alerts`);
    });

    // Handle unsubscribe from security alerts
    socket.on('unsubscribe-security-alerts', () => {
      socket.leave('security-alerts');
      console.log(`User ${socket.userId} unsubscribed from security alerts`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected:`, socket.id);
    });

    // Send welcome message
    socket.emit('authenticated', {
      message: 'Successfully connected to DROPIQ security alerts',
      userId: socket.userId,
      role: socket.userRole
    });
  });
};

// Helper function to broadcast security alerts
export const broadcastSecurityAlert = (io: Server, alert: {
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedPlatforms?: string[];
  recommendedActions?: string[];
}) => {
  io.to('security-alerts').emit('security-alert', {
    ...alert,
    timestamp: new Date().toISOString(),
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });
  
  console.log(`Security alert broadcasted: ${alert.title}`);
};

// Helper function to send targeted alerts
export const sendTargetedAlert = (io: Server, userId: string, alert: {
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
}) => {
  io.to(`user:${userId}`).emit('security-alert', {
    ...alert,
    timestamp: new Date().toISOString(),
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  });
  
  console.log(`Targeted alert sent to user ${userId}: ${alert.title}`);
};