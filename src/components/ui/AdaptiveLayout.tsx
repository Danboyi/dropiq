"use client"

import { useEffect, useState, ReactNode } from 'react'
import { useAdaptiveUI } from '@/hooks/useAdaptiveUI'
import { cn } from '@/lib/utils'

interface AdaptiveLayoutProps {
  children: ReactNode
  className?: string
  section?: string
}

export function AdaptiveLayout({ children, className, section = 'unknown' }: AdaptiveLayoutProps) {
  const { uiConfig, getAdaptiveClasses, trackView } = useAdaptiveUI()
  const [viewStartTime, setViewStartTime] = useState(Date.now())

  // Track view duration when component unmounts or section changes
  useEffect(() => {
    return () => {
      const duration = Date.now() - viewStartTime
      trackView(section, duration)
    }
  }, [section, viewStartTime, trackView])

  // Update view start time when section changes
  useEffect(() => {
    setViewStartTime(Date.now())
  }, [section])

  const adaptiveClasses = getAdaptiveClasses(className || '')

  return (
    <div 
      className={cn(adaptiveClasses)}
      data-section={section}
      data-layout-density={uiConfig?.layoutDensity}
      data-color-scheme={uiConfig?.colorScheme}
      data-content-focus={uiConfig?.contentFocus}
    >
      {children}
    </div>
  )
}