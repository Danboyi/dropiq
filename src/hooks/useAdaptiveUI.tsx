"use client"

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/stores/authStore'
import { adaptiveUIService, type UIAdaptationConfig } from '@/lib/adaptive-ui'
import { type UserBehavior } from '@/types/adaptive-ui'

export function useAdaptiveUI() {
  const { user, isAuthenticated } = useAuth()
  const [uiConfig, setUIConfig] = useState<UIAdaptationConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [adaptationHistory, setAdaptationHistory] = useState<any[]>([])

  // Load UI preferences on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUIPreferences()
    } else {
      setIsLoading(false)
    }
  }, [isAuthenticated, user])

  const loadUIPreferences = async () => {
    try {
      setIsLoading(true)
      const config = await adaptiveUIService.getUIPreferences(user!.id)
      setUIConfig(config)
    } catch (error) {
      console.error('Error loading UI preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Track user behavior
  const trackBehavior = useCallback(async (
    action: UserBehavior['action'],
    element: string,
    section: string,
    duration?: number,
    metadata?: any
  ) => {
    if (!isAuthenticated || !user) return

    try {
      await adaptiveUIService.trackUserBehavior(user.id, {
        action,
        element,
        section,
        duration,
        metadata: {
          ...metadata,
          device: getDeviceType(),
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Error tracking behavior:', error)
    }
  }, [isAuthenticated, user])

  // Track click events
  const trackClick = useCallback((element: string, section: string, metadata?: any) => {
    trackBehavior('click', element, section, undefined, metadata)
  }, [trackBehavior])

  // Track view events
  const trackView = useCallback((section: string, duration?: number, metadata?: any) => {
    trackBehavior('view', 'section', section, duration, metadata)
  }, [trackBehavior])

  // Track search events
  const trackSearch = useCallback((query: string, resultsCount: number, metadata?: any) => {
    trackBehavior('search', 'search-bar', 'search', undefined, {
      query,
      resultsCount,
      ...metadata
    })
  }, [trackBehavior])

  // Track filter events
  const trackFilter = useCallback((filterType: string, filterValue: string, metadata?: any) => {
    trackBehavior('filter', filterType, 'filters', undefined, {
      filterValue,
      ...metadata
    })
  }, [trackBehavior])

  // Get CSS classes based on UI config
  const getAdaptiveClasses = useCallback((baseClasses: string) => {
    if (!uiConfig) return baseClasses

    let adaptiveClasses = baseClasses

    // Layout density classes
    switch (uiConfig.layoutDensity) {
      case 'COMPACT':
        adaptiveClasses += ' gap-2 p-2'
        break
      case 'COMFORTABLE':
        adaptiveClasses += ' gap-4 p-4'
        break
      case 'SPACIOUS':
        adaptiveClasses += ' gap-6 p-6'
        break
    }

    // Color scheme classes
    switch (uiConfig.colorScheme) {
      case 'HIGH_CONTRAST':
        adaptiveClasses += ' contrast-125'
        break
      case 'DARK':
        adaptiveClasses += ' dark'
        break
    }

    return adaptiveClasses
  }, [uiConfig])

  // Check if a widget should be shown
  const shouldShowWidget = useCallback((widgetName: string) => {
    return uiConfig?.widgetConfiguration?.[widgetName] ?? false
  }, [uiConfig])

  // Get keyboard shortcut for a feature
  const getShortcut = useCallback((feature: string) => {
    return uiConfig?.shortcutPreferences?.[feature]
  }, [uiConfig])

  // Get feature priority
  const getFeaturePriority = useCallback((feature: string) => {
    if (!uiConfig?.featurePrioritization) return -1
    return uiConfig.featurePrioritization.indexOf(feature)
  }, [uiConfig])

  // Check if automation is enabled
  const isAutomationEnabled = useCallback((level: 'MANUAL' | 'ASSISTED' | 'AUTOMATED') => {
    return uiConfig?.automationLevel === level
  }, [uiConfig])

  // Get notification level
  const getNotificationLevel = useCallback(() => {
    return uiConfig?.notificationLevel || 'NORMAL'
  }, [uiConfig])

  // Get content focus
  const getContentFocus = useCallback(() => {
    return uiConfig?.contentFocus || 'DISCOVERY'
  }, [uiConfig])

  return {
    // State
    uiConfig,
    isLoading,
    adaptationHistory,
    
    // Tracking methods
    trackBehavior,
    trackClick,
    trackView,
    trackSearch,
    trackFilter,
    
    // UI helpers
    getAdaptiveClasses,
    shouldShowWidget,
    getShortcut,
    getFeaturePriority,
    isAutomationEnabled,
    getNotificationLevel,
    getContentFocus,
    
    // Actions
    refreshPreferences: loadUIPreferences
  }
}

// Helper function to detect device type
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}