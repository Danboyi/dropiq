"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAdaptiveUI } from '@/hooks/useAdaptiveUI'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Shield, 
  Brain, 
  BarChart3, 
  Star, 
  Zap,
  Bell,
  Target,
  Activity,
  Eye,
  Settings
} from 'lucide-react'

interface WidgetProps {
  title: string
  description: string
  icon: React.ReactNode
  children: React.ReactNode
  priority?: number
  className?: string
}

function AdaptiveWidget({ title, description, icon, children, priority, className }: WidgetProps) {
  const { trackClick } = useAdaptiveUI()

  const handleInteraction = (action: string) => {
    trackClick(`widget-${action}`, 'dashboard', { 
      widget: title,
      priority 
    })
  }

  return (
    <Card 
      className={cn(
        "transition-all duration-300 hover:shadow-lg",
        priority !== undefined && priority < 3 && "ring-2 ring-primary/20",
        className
      )}
      onClick={() => handleInteraction('view')}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
            {priority !== undefined && priority < 3 && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Priority
              </Badge>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleInteraction('settings')
            }}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent onClick={() => handleInteraction('interact')}>
        {children}
      </CardContent>
    </Card>
  )
}

export function AdaptiveDashboard() {
  const { 
    shouldShowWidget, 
    getFeaturePriority, 
    getContentFocus,
    getNotificationLevel,
    trackView 
  } = useAdaptiveUI()
  
  const [viewStartTime] = useState(Date.now())

  useEffect(() => {
    const duration = Date.now() - viewStartTime
    trackView('dashboard', duration, { section: 'main-dashboard' })
  }, [viewStartTime, trackView])

  const contentFocus = getContentFocus()
  const notificationLevel = getNotificationLevel()

  // Define all available widgets
  const allWidgets = [
    {
      id: 'trending-airdrops',
      title: 'Trending Airdrops',
      description: 'Hot opportunities right now',
      icon: <TrendingUp className="h-5 w-5 text-primary" />,
      priority: getFeaturePriority('trending'),
      component: (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">LayerZero Labs</span>
            <Badge variant="default">HOT</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Arbitrum One</span>
            <Badge variant="secondary">NEW</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Base Network</span>
            <Badge variant="outline">TRENDING</Badge>
          </div>
        </div>
      )
    },
    {
      id: 'security-alerts',
      title: 'Security Alerts',
      description: 'Important security updates',
      icon: <Shield className="h-5 w-5 text-destructive" />,
      priority: getFeaturePriority('security'),
      component: (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>New scam detected in DeFi space</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Review wallet permissions</span>
          </div>
        </div>
      )
    },
    {
      id: 'recommendations',
      title: 'AI Recommendations',
      description: 'Personalized for you',
      icon: <Brain className="h-5 w-5 text-blue-500" />,
      priority: getFeaturePriority('recommendations'),
      component: (
        <div className="space-y-2">
          <div className="text-sm">
            <p className="font-medium">Based on your profile:</p>
            <ul className="mt-1 space-y-1 text-muted-foreground">
              <li>• Focus on low-risk DeFi airdrops</li>
              <li>• Complete 2 more tasks for eligibility</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'progress-overview',
      title: 'Progress Overview',
      description: 'Your airdrop journey',
      icon: <Star className="h-5 w-5 text-yellow-500" />,
      priority: getFeaturePriority('progress'),
      component: (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completed Tasks</span>
            <span className="font-medium">12/20</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
          </div>
          <div className="flex justify-between text-sm">
            <span>Potential Reward</span>
            <span className="font-medium text-green-600">$2,500</span>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Performance insights',
      icon: <BarChart3 className="h-5 w-5 text-purple-500" />,
      priority: getFeaturePriority('analytics'),
      component: (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Success Rate</p>
              <p className="font-medium text-green-600">85%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Time</p>
              <p className="font-medium">2.5 days</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      description: 'Common tasks',
      icon: <Zap className="h-5 w-5 text-orange-500" />,
      priority: getFeaturePriority('quick-actions'),
      component: (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Check Eligibility
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Target className="h-3 w-3 mr-1" />
            Set Goals
          </Button>
        </div>
      )
    },
    {
      id: 'activity-feed',
      title: 'Activity Feed',
      description: 'Recent actions',
      icon: <Activity className="h-5 w-5 text-cyan-500" />,
      priority: getFeaturePriority('activity'),
      component: (
        <div className="space-y-2">
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-muted-foreground">Completed LayerZero task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">Connected new wallet</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Updates and alerts',
      icon: <Bell className="h-5 w-5 text-indigo-500" />,
      priority: getFeaturePriority('notifications'),
      component: (
        <div className="space-y-2">
          {notificationLevel === 'VERBOSE' && (
            <div className="text-sm space-y-1">
              <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                <p className="font-medium">Welcome back!</p>
                <p className="text-muted-foreground">You have 3 new opportunities</p>
              </div>
            </div>
          )}
          {notificationLevel === 'NORMAL' && (
            <div className="text-sm space-y-1">
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-xs">
                <p className="font-medium">2 new airdrops match your profile</p>
              </div>
            </div>
          )}
          {notificationLevel === 'MINIMAL' && (
            <div className="text-sm text-muted-foreground">
              <p>All caught up! Check back later.</p>
            </div>
          )}
        </div>
      )
    }
  ]

  // Filter and sort widgets based on user preferences
  const visibleWidgets = allWidgets
    .filter(widget => shouldShowWidget(widget.id))
    .sort((a, b) => {
      const priorityA = a.priority
      const priorityB = b.priority
      
      // If both have priorities, use them
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB
      }
      
      // If only one has priority, prioritize it
      if (priorityA !== -1) return -1
      if (priorityB !== -1) return 1
      
      // Default ordering based on content focus
      const focusOrder: Record<string, string[]> = {
        'SECURITY': ['security-alerts', 'progress-overview', 'recommendations'],
        'EFFICIENCY': ['quick-actions', 'trending-airdrops', 'progress-overview'],
        'DISCOVERY': ['trending-airdrops', 'recommendations', 'analytics'],
        'ANALYTICS': ['analytics', 'progress-overview', 'activity-feed']
      }
      
      const order = focusOrder[contentFocus] || []
      const indexA = order.indexOf(a.id)
      const indexB = order.indexOf(b.id)
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB
      }
      if (indexA !== -1) return -1
      if (indexB !== -1) return 1
      
      return 0
    })

  // Determine grid layout based on content focus
  const getGridCols = () => {
    switch (contentFocus) {
      case 'SECURITY':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case 'EFFICIENCY':
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'
      case 'ANALYTICS':
        return 'grid-cols-1 lg:grid-cols-2'
      default:
        return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Personalized for your {contentFocus.toLowerCase()} focus
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Brain className="h-3 w-3 mr-1" />
          Adaptive UI
        </Badge>
      </div>

      {/* Widgets Grid */}
      <div className={cn("grid gap-4", getGridCols())}>
        {visibleWidgets.map((widget) => (
          <AdaptiveWidget
            key={widget.id}
            title={widget.title}
            description={widget.description}
            icon={widget.icon}
            priority={widget.priority}
          >
            {widget.component}
          </AdaptiveWidget>
        ))}
      </div>

      {/* Empty state for no widgets */}
      {visibleWidgets.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Adaptive UI Learning</h3>
            <p className="text-muted-foreground mb-4">
              Start using the platform to see personalized widgets appear here.
            </p>
            <Button>Explore Airdrops</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}