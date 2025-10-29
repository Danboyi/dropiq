import { useEffect, useRef, useCallback } from 'react';
import React from 'react';

interface BehaviorEventData {
  eventType: string;
  eventName: string;
  eventData?: any;
  duration?: number;
}

export function useBehaviorTracking() {
  const sessionStartTime = useRef<number>(Date.now());
  const pageStartTime = useRef<number>(Date.now());
  const currentSessionId = useRef<string>(generateSessionId());

  // Generate unique session ID
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Track user behavior (client-side only - sends to API)
  const trackBehavior = useCallback(async (eventData: BehaviorEventData) => {
    try {
      // Send to API endpoint instead of direct infrastructure
      await fetch('/api/ml/track-behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          sessionId: currentSessionId.current,
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          duration: eventData.duration,
          timestamp: Date.now(),
        }),
      });
    } catch (error) {
      console.error('❌ Failed to track behavior:', error);
    }
  }, []);

  // Track page view
  const trackPageView = useCallback((pageName: string, additionalData?: any) => {
    trackBehavior({
      eventType: 'page_view',
      eventName: pageName,
      eventData: {
        page: pageName,
        url: window.location.href,
        timestamp: Date.now(),
        ...additionalData,
      },
    });
  }, [trackBehavior]);

  // Track click events
  const trackClick = useCallback((elementName: string, additionalData?: any) => {
    trackBehavior({
      eventType: 'click',
      eventName: elementName,
      eventData: {
        element: elementName,
        page: window.location.pathname,
        ...additionalData,
      },
    });
  }, [trackBehavior]);

  // Track wallet connection
  const trackWalletConnect = useCallback((walletAddress: string, walletType: string) => {
    trackBehavior({
      eventType: 'wallet_connect',
      eventName: 'wallet_connected',
      eventData: {
        walletAddress,
        walletType,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track airdrop interactions
  const trackAirdropInteraction = useCallback((
    airdropId: string,
    interactionType: string,
    additionalData?: any
  ) => {
    trackBehavior({
      eventType: 'airdrop_interact',
      eventName: interactionType,
      eventData: {
        airdropId,
        interactionType,
        timestamp: Date.now(),
        ...additionalData,
      },
    });
  }, [trackBehavior]);

  // Track task completion
  const trackTaskCompletion = useCallback((
    taskType: string,
    taskId: string,
    duration: number,
    success: boolean,
    additionalData?: any
  ) => {
    trackBehavior({
      eventType: 'task_complete',
      eventName: taskType,
      duration,
      eventData: {
        taskType,
        taskId,
        success,
        duration,
        timestamp: Date.now(),
        ...additionalData,
      },
    });
  }, [trackBehavior]);

  // Track search behavior
  const trackSearch = useCallback((query: string, resultsCount: number, filters?: any) => {
    trackBehavior({
      eventType: 'search',
      eventName: 'search_performed',
      eventData: {
        query,
        resultsCount,
        filters,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track filter usage
  const trackFilterUsage = useCallback((filterType: string, filterValue: any, context?: string) => {
    trackBehavior({
      eventType: 'filter_use',
      eventName: filterType,
      eventData: {
        filterType,
        filterValue,
        context,
        page: window.location.pathname,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track time spent on page
  const trackPageDuration = useCallback(() => {
    const duration = Date.now() - pageStartTime.current;
    trackBehavior({
      eventType: 'page_duration',
      eventName: 'page_time_spent',
      duration,
      eventData: {
        page: window.location.pathname,
        duration,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track session duration
  const trackSessionDuration = useCallback(() => {
    const duration = Date.now() - sessionStartTime.current;
    trackBehavior({
      eventType: 'session_duration',
      eventName: 'session_time_spent',
      duration,
      eventData: {
        sessionId: currentSessionId.current,
        duration,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track form interactions
  const trackFormInteraction = useCallback((
    formName: string,
    fieldType: string,
    fieldName: string,
    action: 'focus' | 'blur' | 'change' | 'submit'
  ) => {
    trackBehavior({
      eventType: 'form_interaction',
      eventName: `${formName}_${action}`,
      eventData: {
        formName,
        fieldType,
        fieldName,
        action,
        page: window.location.pathname,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track error events
  const trackError = useCallback((errorType: string, errorMessage: string, context?: any) => {
    trackBehavior({
      eventType: 'error',
      eventName: errorType,
      eventData: {
        errorType,
        errorMessage,
        context,
        page: window.location.pathname,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Track feature usage
  const trackFeatureUsage = useCallback((featureName: string, action: string, data?: any) => {
    trackBehavior({
      eventType: 'feature_use',
      eventName: featureName,
      eventData: {
        featureName,
        action,
        data,
        page: window.location.pathname,
        timestamp: Date.now(),
      },
    });
  }, [trackBehavior]);

  // Auto-track page views on route changes
  useEffect(() => {
    const pageName = window.location.pathname.replace(/^\//, '') || 'home';
    trackPageView(pageName);
    pageStartTime.current = Date.now();

    // Track page duration when user leaves
    const handlePageUnload = () => {
      trackPageDuration();
    };

    window.addEventListener('beforeunload', handlePageUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handlePageUnload);
      trackPageDuration();
    };
  }, [trackPageView, trackPageDuration]);

  // Track session duration
  useEffect(() => {
    const handleSessionEnd = () => {
      trackSessionDuration();
    };

    // Track session end on page unload
    window.addEventListener('beforeunload', handleSessionEnd);
    
    return () => {
      window.removeEventListener('beforeunload', handleSessionEnd);
      trackSessionDuration();
    };
  }, [trackSessionDuration]);

  // Track visibility changes (user switching tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from the tab
        trackBehavior({
          eventType: 'visibility_change',
          eventName: 'tab_hidden',
          eventData: {
            page: window.location.pathname,
            timestamp: Date.now(),
          },
        });
      } else {
        // User returned to the tab
        trackBehavior({
          eventType: 'visibility_change',
          eventName: 'tab_visible',
          eventData: {
            page: window.location.pathname,
            timestamp: Date.now(),
          },
        });
        pageStartTime.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [trackBehavior]);

  return {
    trackBehavior,
    trackPageView,
    trackClick,
    trackWalletConnect,
    trackAirdropInteraction,
    trackTaskCompletion,
    trackSearch,
    trackFilterUsage,
    trackPageDuration,
    trackSessionDuration,
    trackFormInteraction,
    trackError,
    trackFeatureUsage,
    sessionId: currentSessionId.current,
  };
}