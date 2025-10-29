'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/stores/authStore';
import { toast } from 'sonner';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedPlatforms?: string[];
  recommendedActions?: string[];
  timestamp: string;
}

export function useSecurityAlerts() {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const { token, user } = useAuth();

  const connectSocket = useCallback(() => {
    if (!token || !user) return;

    import('socket.io-client').then(({ io }) => {
      const socketInstance = io('/api/socketio', {
        auth: {
          token
        }
      });

      socketInstance.on('connect', () => {
        console.log('Connected to security alerts');
        setIsConnected(true);
        setSocket(socketInstance);
        
        // Subscribe to security alerts
        socketInstance.emit('subscribe-security-alerts');
      });

      socketInstance.on('disconnect', () => {
        console.log('Disconnected from security alerts');
        setIsConnected(false);
        setSocket(null);
      });

      socketInstance.on('authenticated', (data: any) => {
        console.log('Socket authenticated:', data);
      });

      socketInstance.on('security-alert', (alert: SecurityAlert) => {
        console.log('Received security alert:', alert);
        
        // Add to alerts list
        setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep only last 50 alerts
        
        // Show toast notification
        const toastConfig = {
          duration: alert.type === 'critical' ? 10000 : 
                     alert.type === 'high' ? 8000 : 
                     alert.type === 'medium' ? 6000 : 4000,
          position: 'top-right' as const,
        };

        let toastMessage = `${alert.title}\n${alert.message}`;
        if (alert.recommendedActions && alert.recommendedActions.length > 0) {
          toastMessage += `\n\nRecommended: ${alert.recommendedActions.join(', ')}`;
        }

        switch (alert.type) {
          case 'critical':
            toast.error(toastMessage, toastConfig);
            break;
          case 'high':
            toast.error(toastMessage, toastConfig);
            break;
          case 'medium':
            toast.warning(toastMessage, toastConfig);
            break;
          case 'low':
            toast.info(toastMessage, toastConfig);
            break;
        }
      });

      socketInstance.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error);
        setIsConnected(false);
      });

    }).catch(error => {
      console.error('Failed to load socket.io-client:', error);
    });
  }, [token, user]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.emit('unsubscribe-security-alerts');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const markAlertAsRead = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, read: true }
        : alert
    ));
  }, []);

  useEffect(() => {
    if (token && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [token, user, connectSocket, disconnectSocket]);

  return {
    isConnected,
    alerts,
    clearAlerts,
    markAlertAsRead,
    unreadCount: alerts.filter(alert => !alert.read).length
  };
}