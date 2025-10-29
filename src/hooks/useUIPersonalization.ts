'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { uiPersonalizationEngine } from '@/lib/ui-personalization'
import type { UIPersonalizationProfile } from '@/lib/ui-personalization'

interface UIPersonalizationState {
  profile: UIPersonalizationProfile | null
  uiConfig: any
  recommendations: any[]
  isLoading: boolean
  error: string | null
  isPersonalized: boolean
}

export function useUIPersonalization(page: string = 'dashboard') {
  const { data: session } = useSession()
  const [state, setState] = useState<UIPersonalizationState>({
    profile: null,
    uiConfig: null,
    recommendations: [],
    isLoading: false,
    error: null,
    isPersonalized: false
  })

  // Generate or refresh personalization profile
  const generateProfile = useCallback(async (forceRefresh = false) => {
    if (!session?.user?.id) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const profile = await uiPersonalizationEngine.generatePersonalizationProfile(session.user.id)
      const uiConfig = await uiPersonalizationEngine.getPersonalizedUIConfig(session.user.id, page)
      const recommendations = await uiPersonalizationEngine.getAdaptiveRecommendations(session.user.id)

      setState({
        profile,
        uiConfig,
        recommendations,
        isLoading: false,
        error: null,
        isPersonalized: true
      })
    } catch (error) {
      console.error('❌ Failed to generate personalization profile:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate profile',
        isPersonalized: false
      }))
    }
  }, [session?.user?.id, page])

  // Track UI interaction
  const trackInteraction = useCallback(async (interactionData: {
    type: string
    element: string
    position?: { x: number; y: number }
    duration?: number
    context?: any
    success?: boolean
  }) => {
    if (!session?.user?.id) return

    try {
      await uiPersonalizationEngine.trackUIInteraction(session.user.id, {
        ...interactionData,
        page
      })
    } catch (error) {
      console.error('❌ Failed to track UI interaction:', error)
    }
  }, [session?.user?.id, page])

  // Get personalized layout preferences
  const getLayoutPreferences = useCallback(() => {
    return state.uiConfig?.layout || {
      viewMode: 'grid',
      sidebarCollapsed: false,
      density: 'normal'
    }
  }, [state.uiConfig])

  // Get personalized content preferences
  const getContentPreferences = useCallback(() => {
    return state.uiConfig?.content || {
      sortOrder: 'trending',
      showAdvancedInfo: false,
      showSocialProof: true
    }
  }, [state.uiConfig])

  // Get adaptive features
  const getAdaptiveFeatures = useCallback(() => {
    return state.uiConfig?.features || {
      smartRecommendations: false,
      adaptiveFilters: false,
      personalizedNotifications: false
    }
  }, [state.uiConfig])

  // Check if feature is enabled for this user
  const isFeatureEnabled = useCallback((feature: string): boolean => {
    return state.uiConfig?.features?.[feature] || false
  }, [state.uiConfig])

  // Get personalized recommendations
  const getRecommendations = useCallback((type?: string) => {
    if (!type) return state.recommendations
    return state.recommendations.filter(rec => rec.type === type)
  }, [state.recommendations])

  // Update user preferences
  const updatePreferences = useCallback(async (preferences: any) => {
    if (!session?.user?.id) return false

    try {
      // This would update the profile with new preferences
      await generateProfile(true)
      return true
    } catch (error) {
      console.error('❌ Failed to update preferences:', error)
      return false
    }
  }, [session?.user?.id, generateProfile])

  // Reset personalization
  const resetPersonalization = useCallback(async () => {
    if (!session?.user?.id) return

    setState({
      profile: null,
      uiConfig: null,
      recommendations: [],
      isLoading: false,
      error: null,
      isPersonalized: false
    })
  }, [session?.user?.id])

  // Initialize personalization on mount
  useEffect(() => {
    if (session?.user?.id) {
      generateProfile()
    }
  }, [session?.user?.id, generateProfile])

  // Auto-refresh profile periodically
  useEffect(() => {
    if (!state.profile) return

    const refreshInterval = setInterval(() => {
      const lastUpdated = new Date(state.profile.lastUpdated)
      const now = new Date()
      const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

      if (hoursSinceUpdate > 24) { // Refresh every 24 hours
        generateProfile(true)
      }
    }, 60 * 60 * 1000) // Check every hour

    return () => clearInterval(refreshInterval)
  }, [state.profile, generateProfile])

  return {
    // State
    profile: state.profile,
    uiConfig: state.uiConfig,
    recommendations: state.recommendations,
    isLoading: state.isLoading,
    error: state.error,
    isPersonalized: state.isPersonalized,

    // Actions
    generateProfile,
    trackInteraction,
    updatePreferences,
    resetPersonalization,

    // Getters
    getLayoutPreferences,
    getContentPreferences,
    getAdaptiveFeatures,
    isFeatureEnabled,
    getRecommendations,

    // Computed values
    confidenceScore: state.profile?.confidenceScore || 0,
    hasAdaptiveFeatures: Object.values(state.uiConfig?.features || {}).some(Boolean),
    hasRecommendations: state.recommendations.length > 0,
    preferredViewMode: state.uiConfig?.layout?.viewMode || 'grid',
    preferredSortOrder: state.uiConfig?.content?.sortOrder || 'trending'
  }
}

// Higher-order component for automatic UI personalization
export function withUIPersonalization<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    trackClicks?: boolean
    trackViews?: boolean
    trackDuration?: boolean
    autoTrack?: boolean
  }
) {
  return function PersonalizedComponent(props: P) {
    const personalization = useUIPersonalization()
    const elementRef = React.useRef<HTMLElement>(null)
    const viewStartTime = React.useRef<number>(Date.now())

    // Track element clicks
    useEffect(() => {
      if (!options?.trackClicks || !elementRef.current || !options?.autoTrack) return

      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement
        const rect = target.getBoundingClientRect()
        
        personalization.trackInteraction({
          type: 'click',
          element: target.tagName.toLowerCase(),
          position: {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
          },
          context: {
            text: target.textContent,
            className: target.className,
            id: target.id
          }
        })
      }

      const element = elementRef.current
      element.addEventListener('click', handleClick)
      
      return () => element.removeEventListener('click', handleClick)
    }, [personalization, options?.trackClicks, options?.autoTrack])

    // Track view duration
    useEffect(() => {
      if (!options?.trackViews || !options?.autoTrack) return

      const handleViewEnd = () => {
        const duration = Date.now() - viewStartTime.current
        
        personalization.trackInteraction({
          type: 'view',
          element: 'component',
          duration,
          context: {
            componentName: Component.displayName || Component.name
          }
        })
      }

      const element = elementRef.current
      if (element) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                viewStartTime.current = Date.now()
              } else {
                handleViewEnd()
              }
            })
          },
          { threshold: 0.5 }
        )

        observer.observe(element)
        
        return () => {
          observer.unobserve(element)
          handleViewEnd()
        }
      }
    }, [personalization, options?.trackViews, options?.autoTrack])

    // Track duration on unmount
    useEffect(() => {
      if (!options?.trackDuration || !options?.autoTrack) return

      return () => {
        const duration = Date.now() - viewStartTime.current
        
        personalization.trackInteraction({
          type: 'view',
          element: 'component',
          duration,
          context: {
            componentName: Component.displayName || Component.name,
            unmount: true
          }
        })
      }
    }, [personalization, options?.trackDuration, options?.autoTrack])

    return React.createElement(Component, { 
      ref: elementRef as any, 
      ...props,
      personalization 
    })
  }
}

// Hook for A/B testing with personalization
export function usePersonalizedABTest(testName: string, variants: any[]) {
  const personalization = useUIPersonalization()
  const [assignedVariant, setAssignedVariant] = useState<any>(null)

  useEffect(() => {
    if (!personalization.isPersonalized) {
      // Fallback to random assignment if not personalized
      const randomVariant = variants[Math.floor(Math.random() * variants.length)]
      setAssignedVariant(randomVariant)
      return
    }

    // Use personalization data to assign variant
    const confidenceScore = personalization.confidenceScore
    const preferredViewMode = personalization.preferredViewMode
    
    // Simple logic: assign based on user confidence and preferences
    let selectedVariant = variants[0]
    
    if (confidenceScore > 70 && preferredViewMode === 'grid') {
      selectedVariant = variants.find(v => v.id === 'enhanced-grid') || variants[0]
    } else if (confidenceScore > 50) {
      selectedVariant = variants.find(v => v.id === 'standard') || variants[0]
    } else {
      selectedVariant = variants.find(v => v.id === 'simple') || variants[0]
    }

    setAssignedVariant(selectedVariant)

    // Track A/B test assignment
    personalization.trackInteraction({
      type: 'ab_test',
      element: testName,
      context: {
        variant: selectedVariant.id,
        confidenceScore,
        reasoning: 'personalized_assignment'
      }
    })
  }, [personalization, testName, variants])

  return {
    variant: assignedVariant,
    trackConversion: useCallback((success: boolean) => {
      if (!assignedVariant) return

      personalization.trackInteraction({
        type: 'ab_test_conversion',
        element: testName,
        success,
        context: {
          variant: assignedVariant.id,
          conversionTime: Date.now()
        }
      })
    }, [personalization, testName, assignedVariant])
  }
}