'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store';

interface AnalyticsEvent {
  eventType: string;
  eventName?: string;
  eventData?: any;
  pageUrl?: string;
  pageTitle?: string;
  duration?: number;
  scrollDepth?: number;
}

interface AnalyticsOptions {
  enableTracking?: boolean;
  respectPrivacy?: boolean;
  debounceMs?: number;
}

export function useAnalytics(options: AnalyticsOptions = {}) {
  const {
    enableTracking = true,
    respectPrivacy = true,
    debounceMs = 1000
  } = options;

  const user = useAppStore((state) => state.user);
  const sessionId = useRef(generateSessionId());
  const pageStartTime = useRef(Date.now());
  const maxScrollDepth = useRef(0);
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Generate unique session ID
  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Track event with debouncing
  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!enableTracking) return;

    // Debounce rapid events
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        // Check privacy settings if enabled
        if (respectPrivacy && user?.id) {
          const privacyResponse = await fetch('/api/analytics/privacy', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id })
          });

          if (privacyResponse.ok) {
            const privacy = await privacyResponse.json();
            if (!privacy.privacySettings.analyticsConsent) {
              return; // User has opted out
            }
          }
        }

        const payload = {
          userId: user?.id,
          sessionId: sessionId.current,
          pageUrl: event.pageUrl || window.location.href,
          pageTitle: event.pageTitle || document.title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          ...event
        };

        await fetch('/api/analytics/behavior', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    }, debounceMs);
  }, [enableTracking, respectPrivacy, user, debounceMs]);

  // Track page view
  const trackPageView = useCallback(() => {
    trackEvent({
      eventType: 'page_view',
      eventName: 'page_load',
      pageUrl: window.location.href,
      pageTitle: document.title
    });
  }, [trackEvent]);

  // Track click events
  const trackClick = useCallback((element: HTMLElement, eventName?: string) => {
    trackEvent({
      eventType: 'click',
      eventName: eventName || 'element_click',
      eventData: {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        text: element.textContent?.substring(0, 100)
      }
    });
  }, [trackEvent]);

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, formData?: any) => {
    trackEvent({
      eventType: 'form_submit',
      eventName: formName,
      eventData: {
        formName,
        fieldCount: formData ? Object.keys(formData).length : 0
      }
    });
  }, [trackEvent]);

  // Track airdrop interactions
  const trackAirdropInteraction = useCallback((
    airdropId: string,
    action: 'view' | 'click' | 'register' | 'complete' | 'share',
    additionalData?: any
  ) => {
    trackEvent({
      eventType: 'airdrop_interact',
      eventName: action,
      eventData: {
        airdropId,
        action,
        ...additionalData
      }
    });
  }, [trackEvent]);

  // Track scroll depth
  const trackScrollDepth = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPosition = window.scrollY;
    const scrollPercentage = (scrollPosition / scrollHeight) * 100;

    if (scrollPercentage > maxScrollDepth.current) {
      maxScrollDepth.current = scrollPercentage;
      
      // Track at key milestones
      if (scrollPercentage >= 25 && scrollPercentage < 30) {
        trackEvent({
          eventType: 'scroll',
          eventName: 'scroll_25',
          scrollDepth: 25
        });
      } else if (scrollPercentage >= 50 && scrollPercentage < 55) {
        trackEvent({
          eventType: 'scroll',
          eventName: 'scroll_50',
          scrollDepth: 50
        });
      } else if (scrollPercentage >= 75 && scrollPercentage < 80) {
        trackEvent({
          eventType: 'scroll',
          eventName: 'scroll_75',
          scrollDepth: 75
        });
      } else if (scrollPercentage >= 90) {
        trackEvent({
          eventType: 'scroll',
          eventName: 'scroll_90',
          scrollDepth: 90
        });
      }
    }
  }, [trackEvent]);

  // Track session duration on page unload
  const trackSessionDuration = useCallback(() => {
    const duration = Math.floor((Date.now() - pageStartTime.current) / 1000);
    
    trackEvent({
      eventType: 'session_end',
      eventName: 'page_unload',
      duration,
      scrollDepth: maxScrollDepth.current
    });
  }, [trackEvent]);

  // Set up automatic tracking
  useEffect(() => {
    if (!enableTracking) return;

    // Track initial page view
    trackPageView();

    // Set up scroll tracking
    const handleScroll = () => {
      trackScrollDepth();
    };

    // Set up click tracking
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      trackClick(target);
    };

    // Set up form submission tracking
    const handleSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formName = form.name || form.id || 'unnamed_form';
      trackFormSubmit(formName);
    };

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('click', handleClick);
    document.addEventListener('submit', handleSubmit);

    // Track page unload
    const handleBeforeUnload = () => {
      trackSessionDuration();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClick);
      document.removeEventListener('submit', handleSubmit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Track session end on component unmount
      trackSessionDuration();
    };
  }, [enableTracking, trackPageView, trackScrollDepth, trackClick, trackFormSubmit, trackSessionDuration]);

  // Track page changes for SPA
  useEffect(() => {
    if (!enableTracking) return;

    // Listen for route changes
    const handleRouteChange = () => {
      pageStartTime.current = Date.now();
      maxScrollDepth.current = 0;
      trackPageView();
    };

    // This would integrate with Next.js router in a real implementation
    // For now, we'll just track when URL changes
    let currentUrl = window.location.href;
    const checkUrlChange = () => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        handleRouteChange();
      }
    };

    const interval = setInterval(checkUrlChange, 100);

    return () => clearInterval(interval);
  }, [enableTracking, trackPageView]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackAirdropInteraction,
    trackScrollDepth,
    sessionId: sessionId.current
  };
}

// Analytics provider component
export function AnalyticsProvider({ 
  children, 
  options 
}: { 
  children: React.ReactNode;
  options?: AnalyticsOptions;
}) {
  useAnalytics(options);
  return <>{children}</>;
}

// Higher-order component for automatic tracking
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  options?: AnalyticsOptions
) {
  return function AnalyticsWrappedComponent(props: P) {
    return (
      <AnalyticsProvider options={options}>
        <Component {...props} />
      </AnalyticsProvider>
    );
  };
}