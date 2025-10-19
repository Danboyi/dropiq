'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Star, 
  TrendingUp, 
  Eye, 
  Click, 
  Calendar,
  ExternalLink,
  Shield,
  Zap,
  DollarSign,
  Users,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronRight,
  Heart,
  Share2,
  Bookmark
} from 'lucide-react'

interface FeaturedContent {
  id: string
  title: string
  description: string
  contentType: 'airdrop' | 'campaign' | 'project' | 'tutorial'
  contentId: string
  priority: number
  startDate: string
  endDate?: string
  isActive: boolean
  isSponsored: boolean
  sponsorName?: string
  sponsorLink?: string
  sponsorLogo?: string
  clickTracking: boolean
  impressionTracking: boolean
  maxImpressions?: number
  currentImpressions: number
  maxClicks?: number
  currentClicks: number
  budget?: number
  spent: number
  targeting?: any
  metadata?: any
  createdAt: string
  updatedAt: string
}

interface Airdrop {
  id: string
  title: string
  description: string
  tokenSymbol: string
  totalAmount: number
  trustScore: number
  status: string
  startDate: string
  endDate?: string
  project: {
    name: string
    logo?: string
    website: string
    category: string
  }
}

interface Campaign {
  id: string
  title: string
  description: string
  campaignType: string
  budget: number
  rewardPerAction: number
  currentParticipants: number
  maxParticipants?: number
  status: string
  creator: {
    displayName: string
    avatar?: string
  }
}

const mockFeaturedContent: FeaturedContent[] = [
  {
    id: '1',
    title: 'DeFi Yield Protocol Airdrop',
    description: 'Earn tokens by providing liquidity and staking in our new DeFi protocol',
    contentType: 'airdrop',
    contentId: 'airdrop_1',
    priority: 10,
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    isActive: true,
    isSponsored: true,
    sponsorName: 'DeFi Yield Protocol',
    sponsorLink: 'https://defiyield.example.com',
    sponsorLogo: '/logos/defiyield.png',
    clickTracking: true,
    impressionTracking: true,
    maxImpressions: 100000,
    currentImpressions: 45230,
    maxClicks: 10000,
    currentClicks: 1234,
    budget: 5000,
    spent: 2276.50,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'Gaming NFT Project Launch',
    description: 'Get exclusive NFTs and early access to our gaming platform',
    contentType: 'campaign',
    contentId: 'campaign_1',
    priority: 8,
    startDate: '2024-01-12',
    endDate: '2024-01-30',
    isActive: true,
    isSponsored: false,
    clickTracking: true,
    impressionTracking: true,
    maxImpressions: 50000,
    currentImpressions: 23450,
    maxClicks: 5000,
    currentClicks: 890,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-20'
  },
  {
    id: '3',
    title: 'Layer 2 Scaling Solution',
    description: 'Experience fast and cheap transactions on our innovative L2 network',
    contentType: 'project',
    contentId: 'project_1',
    priority: 9,
    startDate: '2024-01-18',
    isActive: true,
    isSponsored: true,
    sponsorName: 'SpeedChain',
    sponsorLink: 'https://speedchain.example.com',
    clickTracking: true,
    impressionTracking: true,
    maxImpressions: 75000,
    currentImpressions: 34560,
    maxClicks: 7500,
    currentClicks: 1567,
    budget: 3000,
    spent: 1382.40,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20'
  }
]

const mockAirdrops: Airdrop[] = [
  {
    id: '1',
    title: 'DeFi Yield Protocol',
    description: 'Earn YIELD tokens by providing liquidity',
    tokenSymbol: 'YIELD',
    totalAmount: 1000000,
    trustScore: 85,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    project: {
      name: 'DeFi Yield Protocol',
      logo: '/logos/defiyield.png',
      website: 'https://defiyield.example.com',
      category: 'defi'
    }
  },
  {
    id: '2',
    title: 'GameFi Universe',
    description: 'Get GAME tokens for early adopters',
    tokenSymbol: 'GAME',
    totalAmount: 500000,
    trustScore: 72,
    status: 'upcoming',
    startDate: '2024-01-25',
    project: {
      name: 'GameFi Universe',
      logo: '/logos/gamefi.png',
      website: 'https://gamefi.example.com',
      category: 'gaming'
    }
  }
]

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'Social Media Buzz Campaign',
    description: 'Create engaging content about our DeFi protocol',
    campaignType: 'social_media',
    budget: 2000,
    rewardPerAction: 25,
    currentParticipants: 45,
    maxParticipants: 80,
    status: 'active',
    creator: {
      displayName: 'DeFi Yield Protocol',
      avatar: '/logos/defiyield.png'
    }
  }
]

export default function FeaturedContent() {
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>(mockFeaturedContent)
  const [airdrops, setAirdrops] = useState<Airdrop[]>(mockAirdrops)
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [activeTab, setActiveTab] = useState('featured')

  const handleContentClick = async (content: FeaturedContent) => {
    try {
      // Track click
      if (content.clickTracking) {
        await fetch('/api/marketplace/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: content.id,
            action: 'click',
            contentType: content.contentType
          })
        })
      }

      // Navigate to content
      if (content.contentType === 'airdrop') {
        window.location.href = `/airdrops/${content.contentId}`
      } else if (content.contentType === 'campaign') {
        window.location.href = `/marketplace/campaigns/${content.contentId}`
      } else if (content.contentType === 'project') {
        window.location.href = `/projects/${content.contentId}`
      }
    } catch (error) {
      console.error('Error tracking click:', error)
    }
  }

  const handleImpression = async (content: FeaturedContent) => {
    if (content.impressionTracking) {
      try {
        await fetch('/api/marketplace/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: content.id,
            action: 'impression',
            contentType: content.contentType
          })
        })
      } catch (error) {
        console.error('Error tracking impression:', error)
      }
    }
  }

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrustScoreLabel = (score: number) => {
    if (score >= 80) return 'High Trust'
    if (score >= 60) return 'Medium Trust'
    return 'Low Trust'
  }

  const renderFeaturedCard = (content: FeaturedContent) => {
    const progress = content.maxImpressions 
      ? (content.currentImpressions / content.maxImpressions) * 100 
      : 0

    return (
      <Card 
        key={content.id} 
        className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
        onClick={() => handleContentClick(content)}
      >
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {content.isSponsored && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    <Star className="h-3 w-3 mr-1" />
                    Sponsored
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">
                  {content.contentType}
                </Badge>
              </div>
              <CardTitle className="text-lg">{content.title}</CardTitle>
              <CardDescription className="mt-2">{content.description}</CardDescription>
            </div>
            {content.sponsorLogo && (
              <img 
                src={content.sponsorLogo} 
                alt={content.sponsorName}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {content.isSponsored && content.sponsorName && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-blue-800">
                <Info className="h-4 w-4" />
                <span>Promoted by {content.sponsorName}</span>
                {content.sponsorLink && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-auto p-0 text-blue-600 hover:text-blue-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(content.sponsorLink, '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span>{content.currentImpressions.toLocaleString()} views</span>
            </div>
            <div className="flex items-center gap-2">
              <Click className="h-4 w-4 text-muted-foreground" />
              <span>{content.currentClicks.toLocaleString()} clicks</span>
            </div>
          </div>

          {content.maxImpressions && (
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Ad Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4 pt-3 border-t">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Bookmark className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="h-3 w-3 mr-1" />
                  Share
                </Button>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAirdropCard = (airdrop: Airdrop) => (
    <Card key={airdrop.id} className="cursor-pointer transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          {airdrop.project.logo && (
            <img 
              src={airdrop.project.logo} 
              alt={airdrop.project.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{airdrop.title}</CardTitle>
            <CardDescription>{airdrop.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Token:</span>
            <div className="font-semibold">{airdrop.tokenSymbol}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Total Amount:</span>
            <div className="font-semibold">{airdrop.totalAmount.toLocaleString()}</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className={`text-sm font-medium ${getTrustScoreColor(airdrop.trustScore)}`}>
              {getTrustScoreLabel(airdrop.trustScore)} ({airdrop.trustScore}%)
            </span>
          </div>
          <Badge 
            variant={airdrop.status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {airdrop.status}
          </Badge>
        </div>

        <Separator className="my-4" />

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Do Your Own Research:</strong> Always verify project legitimacy before participating. 
            This is not financial advice.
          </AlertDescription>
        </Alert>

        <Button className="w-full mt-4">
          View Details
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )

  const renderCampaignCard = (campaign: Campaign) => (
    <Card key={campaign.id} className="cursor-pointer transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          {campaign.creator.avatar && (
            <img 
              src={campaign.creator.avatar} 
              alt={campaign.creator.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <CardTitle className="text-lg">{campaign.title}</CardTitle>
            <CardDescription>{campaign.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Reward:</span>
            <div className="font-semibold">${campaign.rewardPerAction}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Type:</span>
            <div className="font-semibold capitalize">{campaign.campaignType.replace('_', ' ')}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Participants</span>
            <span>{campaign.currentParticipants}/{campaign.maxParticipants}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ 
                width: `${campaign.maxParticipants 
                  ? (campaign.currentParticipants / campaign.maxParticipants) * 100 
                  : 0}%` 
              }}
            />
          </div>
        </div>

        <Button className="w-full mt-4" variant="outline">
          Participate Now
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Featured Opportunities</h1>
          <p className="text-muted-foreground">
            Discover hand-picked airdrops, campaigns, and projects from trusted partners
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="airdrops">Trending Airdrops</TabsTrigger>
            <TabsTrigger value="campaigns">Active Campaigns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="featured" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredContent.map(renderFeaturedCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="airdrops" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {airdrops.map(renderAirdropCard)}
            </div>
          </TabsContent>
          
          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {campaigns.map(renderCampaignCard)}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your Safety Matters</h3>
            <p className="text-muted-foreground mb-4">
              We verify all featured content, but always do your own research before participating.
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