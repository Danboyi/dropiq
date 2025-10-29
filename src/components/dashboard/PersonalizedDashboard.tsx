'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUIPersonalization } from '@/hooks/useUIPersonalization'
import { useBehaviorTracking } from '@/hooks/ml/useBehaviorTrackingClient'
import { 
  Grid3X3, 
  List, 
  Layout, 
  Settings, 
  TrendingUp, 
  Clock, 
  Target,
  Lightbulb,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'

interface PersonalizedDashboardProps {
  userId: string
  className?: string
}

export function PersonalizedDashboard({ userId, className }: PersonalizedDashboardProps) {
  const personalization = useUIPersonalization('dashboard')
  const behaviorTracking = useBehaviorTracking()
  const [showPersonalizationInsights, setShowPersonalizationInsights] = useState(true)
  const [isCustomizing, setIsCustomizing] = useState(false)

  const layoutPreferences = personalization.getLayoutPreferences()
  const contentPreferences = personalization.getContentPreferences()
  const adaptiveFeatures = personalization.getAdaptiveFeatures()

  // Track dashboard view
  useEffect(() => {
    behaviorTracking.trackPageView('personalized_dashboard', {
      isPersonalized: personalization.isPersonalized,
      confidenceScore: personalization.confidenceScore,
      viewMode: layoutPreferences.viewMode
    })
  }, [behaviorTracking, personalization.isPersonalized, personalization.confidenceScore, layoutPreferences.viewMode])

  // Handle view mode change
  const handleViewModeChange = (newMode: 'grid' | 'list' | 'cards') => {
    personalization.trackInteraction({
      type: 'click',
      element: 'view_mode_selector',
      context: { 
        oldMode: layoutPreferences.viewMode,
        newMode,
        source: 'dashboard'
      }
    })

    // This would update the user's preferences
    personalization.updatePreferences({
      layout: {
        ...layoutPreferences,
        preferredViewMode: newMode
      }
    })
  }

  // Handle feature toggle
  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    personalization.trackInteraction({
      type: 'click',
      element: 'feature_toggle',
      context: { 
        feature,
        enabled,
        source: 'dashboard_settings'
      }
    })

    personalization.updatePreferences({
      features: {
        ...adaptiveFeatures,
        [feature]: enabled
      }
    })
  }

  // Render personalized recommendations
  const renderRecommendations = () => {
    const recommendations = personalization.getRecommendations()
    
    if (recommendations.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No personalized recommendations available yet.</p>
          <p className="text-sm">Continue using the platform to get tailored insights.</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <Button 
                    size="sm" 
                    onClick={() => {
                      personalization.trackInteraction({
                        type: 'click',
                        element: 'recommendation_action',
                        context: { 
                          recommendationId: index,
                          action: rec.action,
                          type: rec.type
                        },
                        success: true
                      })
                    }}
                  >
                    Apply Recommendation
                  </Button>
                </div>
                <div className="ml-4">
                  <Badge variant="outline" className="text-xs">
                    {rec.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Render personalization insights
  const renderPersonalizationInsights = () => {
    if (!personalization.profile) return null

    const { confidenceScore, successPatterns, interactionPatterns } = personalization.profile

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confidence Score</p>
                <p className="text-2xl font-bold">{confidenceScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Patterns</p>
                <p className="text-2xl font-bold">{successPatterns.successfulAirdropTypes.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Interactions Tracked</p>
                <p className="text-2xl font-bold">{interactionPatterns.clickPatterns.length}</p>
              </div>
              <Layout className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Optimal Time</p>
                <p className="text-2xl font-bold">
                  {successPatterns.optimalTimeSlots[0]?.startHour || '--'}:00
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render adaptive features controls
  const renderAdaptiveFeatures = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Adaptive Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Smart Recommendations</label>
              <p className="text-xs text-muted-foreground">
                Get AI-powered airdrop suggestions based on your behavior
              </p>
            </div>
            <Switch
              checked={adaptiveFeatures.smartRecommendations}
              onCheckedChange={(checked) => handleFeatureToggle('smartRecommendations', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Adaptive Filters</label>
              <p className="text-xs text-muted-foreground">
                Filters that automatically adjust based on your preferences
              </p>
            </div>
            <Switch
              checked={adaptiveFeatures.adaptiveFilters}
              onCheckedChange={(checked) => handleFeatureToggle('adaptiveFilters', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Personalized Notifications</label>
              <p className="text-xs text-muted-foreground">
                Receive notifications tailored to your activity patterns
              </p>
            </div>
            <Switch
              checked={adaptiveFeatures.personalizedNotifications}
              onCheckedChange={(checked) => handleFeatureToggle('personalizedNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Smart Sorting</label>
              <p className="text-xs text-muted-foreground">
                Content automatically sorted by relevance to you
              </p>
            </div>
            <Switch
              checked={adaptiveFeatures.smartSorting}
              onCheckedChange={(checked) => handleFeatureToggle('smartSorting', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Contextual Help</label>
              <p className="text-xs text-muted-foreground">
                Get help tips based on your current activity
              </p>
            </div>
            <Switch
              checked={adaptiveFeatures.contextualHelp}
              onCheckedChange={(checked) => handleFeatureToggle('contextualHelp', checked)}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (personalization.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading personalized experience...</span>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Personalization Status Bar */}
      <Card className="border-l-4 border-l-green-500">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {personalization.isPersonalized ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">Personalized Experience Active</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full" />
                    <span className="text-sm font-medium">Learning Your Preferences</span>
                  </>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Confidence: {personalization.confidenceScore}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPersonalizationInsights(!showPersonalizationInsights)}
              >
                {showPersonalizationInsights ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPersonalizationInsights ? 'Hide' : 'Show'} Insights
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCustomizing(!isCustomizing)}
              >
                <Settings className="h-4 w-4" />
                {isCustomizing ? 'Done' : 'Customize'}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => personalization.generateProfile(true)}
                disabled={personalization.isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${personalization.isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalization Insights */}
      {showPersonalizationInsights && renderPersonalizationInsights()}

      {/* View Mode Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">View Mode:</span>
        <div className="flex gap-2">
          <Button
            variant={layoutPreferences.viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4 mr-2" />
            Grid
          </Button>
          <Button
            variant={layoutPreferences.viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={layoutPreferences.viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('cards')}
          >
            <Layout className="h-4 w-4 mr-2" />
            Cards
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-4">
          {renderRecommendations()}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Success Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Your Success Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {personalization.profile?.successPatterns.successfulAirdropTypes.length > 0 ? (
                  <div className="space-y-2">
                    {personalization.profile.successPatterns.successfulAirdropTypes.map((type, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm font-medium">{type}</span>
                        <Badge variant="secondary">Successful</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No success patterns identified yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Interaction Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Interaction Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {personalization.profile?.interactionPatterns.clickPatterns.length > 0 ? (
                  <div className="space-y-2">
                    {personalization.profile.interactionPatterns.clickPatterns.slice(0, 5).map((pattern, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">{pattern.elementType}</span>
                        <Badge variant="outline">{pattern.frequency} clicks</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Building interaction patterns...</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {renderAdaptiveFeatures()}
        </TabsContent>
      </Tabs>
    </div>
  )
}