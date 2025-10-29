"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAdaptiveUI } from '@/hooks/useAdaptiveUI'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Shield, 
  Search, 
  Wallet, 
  Brain, 
  BarChart3, 
  Settings, 
  Bell,
  MoreHorizontal,
  Star,
  Zap,
  Lock
} from 'lucide-react'

interface NavigationItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  badge?: string
  priority?: number
}

const allNavigationItems: NavigationItem[] = [
  {
    id: 'discover',
    label: 'Discover',
    href: '/home',
    icon: <Search className="h-4 w-4" />,
    priority: 1
  },
  {
    id: 'trending',
    label: 'Trending',
    href: '/home?filter=trending',
    icon: <TrendingUp className="h-4 w-4" />,
    badge: 'HOT',
    priority: 2
  },
  {
    id: 'security',
    label: 'Security',
    href: '/security',
    icon: <Shield className="h-4 w-4" />,
    priority: 3
  },
  {
    id: 'wallet',
    label: 'Wallet',
    href: '/wallet',
    icon: <Wallet className="h-4 w-4" />,
    priority: 4
  },
  {
    id: 'preferences',
    label: 'Preferences',
    href: '/preferences',
    icon: <Brain className="h-4 w-4" />,
    priority: 5
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    priority: 6
  },
  {
    id: 'progress',
    label: 'Progress',
    href: '/progress',
    icon: <Star className="h-4 w-4" />,
    priority: 7
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/settings',
    icon: <Settings className="h-4 w-4" />,
    priority: 8
  }
]

export function AdaptiveNavigation() {
  const { getFeaturePriority, trackClick, shouldShowWidget, getContentFocus } = useAdaptiveUI()
  const [isExpanded, setIsExpanded] = useState(false)
  
  const contentFocus = getContentFocus()

  // Sort navigation items based on user behavior and content focus
  const sortedItems = [...allNavigationItems].sort((a, b) => {
    const priorityA = getFeaturePriority(a.id)
    const priorityB = getFeaturePriority(b.id)
    
    // If both have priorities, use them
    if (priorityA !== -1 && priorityB !== -1) {
      return priorityA - priorityB
    }
    
    // If only one has priority, prioritize it
    if (priorityA !== -1) return -1
    if (priorityB !== -1) return 1
    
    // Boost items based on content focus
    const focusBoost: Record<string, number> = {
      'SECURITY': { security: -2, wallet: -1 },
      'EFFICIENCY': { discover: -2, trending: -1 },
      'DISCOVERY': { discover: -2, trending: -2, preferences: -1 },
      'ANALYTICS': { analytics: -2, progress: -1 }
    }
    
    const boostA = focusBoost[contentFocus]?.[a.id] || 0
    const boostB = focusBoost[contentFocus]?.[b.id] || 0
    
    if (boostA !== boostB) {
      return boostA - boostB
    }
    
    // Fall back to default priority
    return (a.priority || 999) - (b.priority || 999)
  })

  // Show top items based on layout density
  const visibleItems = sortedItems.slice(0, 5)
  const hiddenItems = sortedItems.slice(5)

  const handleNavClick = (itemId: string, itemLabel: string) => {
    trackClick(`nav-${itemId}`, 'navigation', { 
      feature: itemId,
      label: itemLabel,
      contentFocus
    })
  }

  return (
    <nav className="flex items-center space-x-1">
      {visibleItems.map((item) => (
        <Link key={item.id} href={item.href}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavClick(item.id, item.label)}
            className={cn(
              "relative items-center gap-2 transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary",
              getFeaturePriority(item.id) !== -1 && "text-primary font-medium"
            )}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-1 text-xs px-1 py-0">
                {item.badge}
              </Badge>
            )}
            {getFeaturePriority(item.id) !== -1 && (
              <Zap className="h-3 w-3 text-primary ml-1" />
            )}
          </Button>
        </Link>
      ))}

      {hiddenItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick('more', 'More navigation')}
              className="items-center gap-2"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {hiddenItems.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link 
                  href={item.href}
                  onClick={() => handleNavClick(item.id, item.label)}
                  className={cn(
                    "flex items-center gap-2",
                    getFeaturePriority(item.id) !== -1 && "text-primary font-medium"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {getFeaturePriority(item.id) !== -1 && (
                    <Zap className="h-3 w-3 text-primary ml-auto" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Adaptive shortcuts based on user preferences */}
      {shouldShowWidget('quickActions') && (
        <div className="ml-4 flex items-center gap-1 border-l pl-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavClick('quick-search', 'Quick Search')}
            className="text-muted-foreground hover:text-primary"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavClick('quick-wallet', 'Quick Wallet')}
            className="text-muted-foreground hover:text-primary"
          >
            <Wallet className="h-4 w-4" />
          </Button>
          {contentFocus === 'SECURITY' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavClick('quick-security', 'Quick Security')}
              className="text-muted-foreground hover:text-primary"
            >
              <Lock className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </nav>
  )
}