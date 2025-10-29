"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, TrendingUp, Shield, Clock, CheckCircle, User, Wallet, LogOut, Crown, Bell, Settings } from "lucide-react"
import { AirdropTable } from "@/components/airdrop-table"
import { FeaturedAirdrops } from "@/components/featured-airdrops"
import { ConnectWalletButton } from "@/components/auth/ConnectWalletButton"
import { useAuth } from "@/stores/authStore"
import { usePremium } from "@/hooks/usePremium.tsx"
import { useBehaviorTracking } from "@/hooks/ml/useBehaviorTrackingClient"
// import { useAirdropRecommendations } from "@/hooks/ml/useMLPrediction" // Temporarily disabled
import { useAdaptiveUI } from "@/hooks/useAdaptiveUI"
import { AdaptiveLayout } from "@/components/ui/AdaptiveLayout"
import { AdaptiveNavigation } from "@/components/ui/AdaptiveNavigation"
import { AdaptiveDashboard } from "@/components/ui/AdaptiveDashboard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  
  const { isAuthenticated, user, logout, hasWallet, connectedWallet } = useAuth()
  const { isPremium, isNotPremium, UpgradePromptModal } = usePremium()
  
  const { 
    trackClick, 
    trackView, 
    trackSearch, 
    trackFilter,
    getAdaptiveClasses,
    shouldShowWidget,
    getContentFocus 
  } = useAdaptiveUI()

  // ML hooks
  const tracking = useBehaviorTracking()
  // const { recommendations, isLoading: recommendationsLoading } = useAirdropRecommendations(isAuthenticated)
  const recommendations = [] // Mock empty recommendations for now
  const recommendationsLoading = false

  // Handle initial auth state loading
  useEffect(() => {
    // Give a brief moment for auth state to load from localStorage
    const timer = setTimeout(() => {
      setIsAuthLoading(false)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  // Redirect to landing page if not authenticated (after loading)
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, isAuthLoading, router])

  // Track search behavior
  useEffect(() => {
    if (searchQuery.length > 2) {
      trackSearch(searchQuery, 0, { category: selectedCategory, status: selectedStatus })
    }
  }, [searchQuery, selectedCategory, selectedStatus, trackSearch])

  // Track filter usage
  useEffect(() => {
    if (selectedCategory !== 'all') {
      trackFilter('category', selectedCategory, { page: 'home' })
    }
  }, [selectedCategory, trackFilter])

  useEffect(() => {
    if (selectedStatus !== 'all') {
      trackFilter('status', selectedStatus, { page: 'home' })
    }
  }, [selectedStatus, trackFilter])

  // Mock stats - in real app these would come from API
  const stats = {
    totalAirdrops: 156,
    inProgress: 12,
    completed: 8,
    highRisk: 23
  }

  const handleLogout = () => {
    tracking.trackFeatureUsage('auth', 'logout', { page: 'home' })
    logout()
    router.push('/')
  }

  const handleManageSubscription = async () => {
    tracking.trackFeatureUsage('premium', 'manage_subscription', { page: 'home' })
    try {
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Portal error:', error);
      tracking.trackError('subscription_portal', error instanceof Error ? error.message : 'Unknown error', { page: 'home' })
    }
  }

  const handleAirdropClick = (airdropId: string, airdropName: string) => {
    tracking.trackAirdropInteraction(airdropId, 'click', { airdropName, source: 'home_page' })
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    tracking.trackFilterUsage('category', category, 'airdrop_discovery')
  }

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status)
    tracking.trackFilterUsage('status', status, 'airdrop_discovery')
  }

  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isAuthLoading ? 'Loading...' : 'Redirecting to login...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <AdaptiveLayout section="home" className="space-y-6">
      {/* Adaptive Navigation */}
      <div className="mb-6">
        <AdaptiveNavigation />
      </div>

      {/* Show Adaptive Dashboard for users with enough behavior data */}
      {shouldShowWidget('adaptive-dashboard') ? (
        <AdaptiveDashboard />
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-primary">Airdrop Discovery</h1>
              <p className="text-muted-foreground">
                Discover and track vetted cryptocurrency airdrops
                {getContentFocus() !== 'DISCOVERY' && (
                  <span className="ml-2">
                    • Focused on {getContentFocus().toLowerCase()}
                  </span>
                )}
              </p>
            </div>
            
            {/* AI Recommendations Badge */}
            {recommendations.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  AI Personalized
                </Badge>
                {recommendationsLoading && <Skeleton className="w-16 h-4" />}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className={getAdaptiveClasses("grid gap-4 md:grid-cols-2 lg:grid-cols-4")}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Airdrops</CardTitle>
                <TrendingUp className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAirdrops}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  Active tasks
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Successfully claimed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Risk</CardTitle>
                <Shield className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{stats.highRisk}</div>
                <p className="text-xs text-muted-foreground">
                  Requires caution
                </p>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  AI Recommendations For You
                </CardTitle>
                <CardDescription>
                  Based on your activity and preferences, you might be interested in these airdrop categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {recommendations.map((rec: any, index: number) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => handleCategoryChange(rec.category)}
                    >
                      {rec.category} ({Math.round(rec.confidence * 100)}%)
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Featured Airdrops - Only show for non-premium users */}
          {isNotPremium && <FeaturedAirdrops />}

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Refine your airdrop discovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search airdrops..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      onClick={() => trackClick('search_input', 'search')}
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="layer2">Layer 2</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline"
                  onClick={() => trackClick('more_filters', 'filters')}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Airdrops Table */}
          <AirdropTable 
            searchQuery={searchQuery}
            category={selectedCategory}
            status={selectedStatus}
            onAirdropClick={handleAirdropClick}
          />
        </>
      )}
      
      {/* Wallet Connect Modal */}
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Wallet</DialogTitle>
            <DialogDescription>
              Connect your wallet to track airdrops and save your progress
            </DialogDescription>
          </DialogHeader>
          <div className="p-4">
            <ConnectWalletButton onClose={() => setShowWalletModal(false)} />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal />
    </AdaptiveLayout>
  )
}