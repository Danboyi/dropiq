'use client'

import { useAuthStore } from '@/stores/auth.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Gift, 
  Lock, 
  Crown,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

interface DashboardStats {
  totalAirdrops: number
  completedAirdrops: number
  potentialValue: string
  activeWallets: number
}

interface Airdrop {
  id: string
  name: string
  description: string
  logoUrl?: string
  status: string
  riskLevel: string
  progress: number
  potentialValue: string
}

export function Dashboard() {
  const { user, isGuest, isUser, isPremium, isAdmin, setShowAuthModal } = useAuthStore()
  
  // Mock data - in real app, this would come from API
  const stats: DashboardStats = {
    totalAirdrops: 12,
    completedAirdrops: isGuest ? 2 : 5,
    potentialValue: isGuest ? '$200' : isPremium ? '$2,500' : '$800',
    activeWallets: isGuest ? 1 : 3
  }

  const mockAirdrops: Airdrop[] = [
    {
      id: '1',
      name: 'Arbitrum One',
      description: 'Layer 2 scaling solution',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      progress: isGuest ? 20 : 65,
      potentialValue: '$500'
    },
    {
      id: '2',
      name: 'Optimism',
      description: 'Optimistic rollup',
      status: 'ACTIVE',
      riskLevel: 'LOW',
      progress: isGuest ? 0 : 40,
      potentialValue: '$300'
    },
    {
      id: '3',
      name: 'zkSync Era',
      description: 'ZK rollup solution',
      status: 'PENDING',
      riskLevel: 'MEDIUM',
      progress: 0,
      potentialValue: '$200'
    }
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'CRITICAL': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Preview Dashboard
            </h1>
            <p className="text-slate-600">
              You're viewing a preview. Upgrade your account to unlock full features.
            </p>
          </div>

          {/* Upgrade Banner */}
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Upgrade to Full Access</h3>
                    <p className="text-sm text-blue-700">
                      Get unlimited airdrops, detailed analytics, and priority support.
                    </p>
                  </div>
                </div>
                <Button onClick={() => setShowAuthModal(true)}>
                  Upgrade Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Airdrops</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalAirdrops}</p>
                  </div>
                  <Gift className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Completed</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.completedAirdrops}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Potential Value</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.potentialValue}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Active Wallets</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.activeWallets}</p>
                  </div>
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Airdrops Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Featured Airdrops (Preview)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAirdrops.slice(0, 2).map((airdrop) => (
                  <div key={airdrop.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{airdrop.name}</h3>
                        <Badge className={getStatusColor(airdrop.status)}>
                          {airdrop.status}
                        </Badge>
                        <Badge className={getRiskColor(airdrop.riskLevel)}>
                          {airdrop.riskLevel}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{airdrop.description}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{airdrop.progress}%</span>
                          </div>
                          <Progress value={airdrop.progress} className="h-2" />
                        </div>
                        <span className="text-sm font-medium text-slate-900">
                          {airdrop.potentialValue}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-sm text-slate-600 mb-3">
                  Upgrade to see all {stats.totalAirdrops} available airdrops and get detailed analytics.
                </p>
                <Button onClick={() => setShowAuthModal(true)}>
                  Upgrade Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Dashboard
                {isPremium && <Crown className="inline-block ml-2 h-6 w-6 text-purple-500" />}
              </h1>
              <p className="text-slate-600">
                Welcome back, {user?.firstName || user?.email || 'User'}!
              </p>
            </div>
            {(isUser || isPremium) && (
              <Badge variant="secondary" className="text-sm">
                {isPremium ? 'Premium Member' : 'Full Access'}
              </Badge>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Airdrops</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalAirdrops}</p>
                </div>
                <Gift className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.completedAirdrops}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Potential Value</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.potentialValue}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Wallets</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeWallets}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Airdrops */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Active Airdrops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockAirdrops.map((airdrop) => (
                <div key={airdrop.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{airdrop.name}</h3>
                      <Badge className={getStatusColor(airdrop.status)}>
                        {airdrop.status}
                      </Badge>
                      <Badge className={getRiskColor(airdrop.riskLevel)}>
                        {airdrop.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{airdrop.description}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{airdrop.progress}%</span>
                        </div>
                        <Progress value={airdrop.progress} className="h-2" />
                      </div>
                      <span className="text-sm font-medium text-slate-900">
                        {airdrop.potentialValue}
                      </span>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}