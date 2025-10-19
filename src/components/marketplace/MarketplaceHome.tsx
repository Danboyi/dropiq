'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Star, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Shield,
  Zap,
  Eye,
  Target,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Plus,
  Search,
  Filter
} from 'lucide-react'

interface MarketplaceStats {
  totalCampaigns: number
  activeCampaigns: number
  totalParticipants: number
  totalRevenue: number
  averageRating: number
  verifiedProjects: number
}

interface FeaturedCampaign {
  id: string
  title: string
  description: string
  budget: number
  rewardPerAction: number
  participants: number
  maxParticipants?: number
  rating: number
  isVerified: boolean
  isSponsored: boolean
  type: string
}

const mockStats: MarketplaceStats = {
  totalCampaigns: 156,
  activeCampaigns: 42,
  totalParticipants: 3847,
  totalRevenue: 284500,
  averageRating: 4.6,
  verifiedProjects: 89
}

const mockFeaturedCampaigns: FeaturedCampaign[] = [
  {
    id: '1',
    title: 'DeFi Protocol Promotion',
    description: 'Promote our innovative DeFi lending protocol to the crypto community',
    budget: 5000,
    rewardPerAction: 50,
    participants: 45,
    maxParticipants: 100,
    rating: 4.8,
    isVerified: true,
    isSponsored: true,
    type: 'promotion'
  },
  {
    id: '2',
    title: 'NFT Collection Reviews',
    description: 'Create authentic reviews for our new gaming NFT collection',
    budget: 2000,
    rewardPerAction: 30,
    participants: 28,
    maxParticipants: 50,
    rating: 4.5,
    isVerified: true,
    isSponsored: false,
    type: 'review'
  },
  {
    id: '3',
    title: 'Tutorial Creation Series',
    description: 'Create educational content about Web3 development and blockchain',
    budget: 3000,
    rewardPerAction: 75,
    participants: 15,
    maxParticipants: 40,
    rating: 4.9,
    isVerified: true,
    isSponsored: true,
    type: 'tutorial'
  }
]

export default function MarketplaceHome() {
  const [stats, setStats] = useState<MarketplaceStats>(mockStats)
  const [featuredCampaigns, setFeaturedCampaigns] = useState<FeaturedCampaign[]>(mockFeaturedCampaigns)
  const [activeTab, setActiveTab] = useState('overview')

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating})</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Shilling Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            Connect projects with authentic promoters. Earn rewards by creating genuine content 
            and helping great Web3 projects reach their audience.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/marketplace/create">
                <Plus className="h-5 w-5 mr-2" />
                Create Campaign
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/marketplace/campaigns">
                <Search className="h-5 w-5 mr-2" />
                Browse Campaigns
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeCampaigns} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active promoters
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Platform earnings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                User satisfaction
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedProjects}</div>
              <p className="text-xs text-muted-foreground">
                Trusted projects
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94%</div>
              <p className="text-xs text-muted-foreground">
                Campaign completion
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="creators">For Creators</TabsTrigger>
            <TabsTrigger value="projects">For Projects</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            {/* Featured Campaigns */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Featured Campaigns</h2>
                <Button variant="outline" asChild>
                  <Link href="/marketplace/campaigns">
                    View All
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featuredCampaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {campaign.isVerified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                            {campaign.isSponsored && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <Star className="h-3 w-3 mr-1" />
                                Sponsored
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg">{campaign.title}</CardTitle>
                          <CardDescription className="mt-2">{campaign.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Reward:</span>
                          <span className="font-semibold">${campaign.rewardPerAction}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Participants:</span>
                          <span className="font-semibold">
                            {campaign.participants}/{campaign.maxParticipants}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Rating:</span>
                          {renderStars(campaign.rating)}
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${campaign.maxParticipants 
                                ? (campaign.participants / campaign.maxParticipants) * 100 
                                : 0}%` 
                            }}
                          />
                        </div>
                        
                        <Button className="w-full">
                          View Campaign
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* How It Works */}
            <div>
              <h2 className="text-2xl font-bold mb-6">How It Works</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Target className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle>For Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Create campaigns to promote your project to authentic Web3 enthusiasts.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Set your budget and requirements
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Get verified by our team
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Track performance in real-time
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle>For Creators</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Earn rewards by creating genuine content for verified Web3 projects.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Browse verified campaigns
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Create authentic content
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Get paid securely via escrow
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>Safety & Trust</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      We prioritize safety with verification, escrow, and transparent reviews.
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Project verification
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Secure payment escrow
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Community reviews
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Browse Campaigns</h2>
              <p className="text-muted-foreground mb-6">
                Discover and participate in verified campaigns from trusted projects
              </p>
              <Button size="lg" asChild>
                <Link href="/marketplace/campaigns">
                  <Search className="h-5 w-5 mr-2" />
                  Explore Campaigns
                </Link>
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="creators">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">For Content Creators</h2>
              <p className="text-muted-foreground mb-6">
                Monetize your influence and help great projects grow
              </p>
              <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Start Earning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Browse campaigns and start earning rewards for authentic content creation
                    </p>
                    <Button className="w-full">Browse Campaigns</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Build Reputation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Complete campaigns successfully to build your reputation and unlock better opportunities
                    </p>
                    <Button variant="outline" className="w-full">Learn More</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="projects">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">For Projects</h2>
              <p className="text-muted-foreground mb-6">
                Reach thousands of potential users through authentic community promotion
              </p>
              <div className="grid gap-4 md:grid-cols-2 max-w-2xl mx-auto">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Campaign</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Launch your campaign and connect with authentic promoters in the Web3 space
                    </p>
                    <Button className="w-full">Create Campaign</Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Get Verified</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      Build trust with our community through project verification and transparency
                    </p>
                    <Button variant="outline" className="w-full">Start Verification</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Trust & Safety Section */}
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Trust & Safety First</h3>
            <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
              Every campaign and project on our platform goes through rigorous verification. 
              We use escrow for payments, AI-powered fraud detection, and community moderation 
              to ensure a safe environment for everyone.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline">Learn About Safety</Button>
              <Button variant="outline">Report Issues</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}