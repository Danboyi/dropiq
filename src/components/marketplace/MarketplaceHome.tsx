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
  Filter,
  Gift,
  Trophy,
  Clock,
  AlertCircle,
  FileText,
  Send
} from 'lucide-react'

interface MarketplaceStats {
  totalSubmissions: number
  vettedAirdrops: number
  featuredAirdrops: number
  sponsoredAirdrops: number
  averageVettingTime: number
  successRate: number
}

interface AirdropSubmission {
  id: string
  projectName: string
  description: string
  tokenSymbol: string
  totalAmount: number
  estimatedValue: number
  submissionDate: string
  status: 'pending' | 'vetting' | 'approved' | 'featured' | 'sponsored' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  submittedBy: string
  projectType: string
  targetAudience: string
  requirements: string[]
}

const mockStats: MarketplaceStats = {
  totalSubmissions: 234,
  vettedAirdrops: 156,
  featuredAirdrops: 42,
  sponsoredAirdrops: 28,
  averageVettingTime: 2.5,
  successRate: 87
}

const mockSubmissions: AirdropSubmission[] = [
  {
    id: '1',
    projectName: 'DeFiChain Protocol',
    description: 'Next-generation DeFi lending and borrowing protocol with cross-chain capabilities',
    tokenSymbol: 'DFI',
    totalAmount: 1000000,
    estimatedValue: 500000,
    submissionDate: '2024-01-15',
    status: 'vetting',
    priority: 'high',
    submittedBy: 'DeFiChain Team',
    projectType: 'DeFi',
    targetAudience: 'DeFi users, liquidity providers',
    requirements: ['Hold $1000 in DeFi assets', 'Complete KYC', 'Join Discord']
  },
  {
    id: '2',
    projectName: 'GameFi Universe',
    description: 'Play-to-earn gaming ecosystem with NFT rewards and tournaments',
    tokenSymbol: 'GFU',
    totalAmount: 500000,
    estimatedValue: 250000,
    submissionDate: '2024-01-14',
    status: 'approved',
    priority: 'medium',
    submittedBy: 'GameFi Studios',
    projectType: 'Gaming',
    targetAudience: 'Gamers, NFT collectors',
    requirements: ['Connect wallet', 'Own at least 1 NFT', 'Play tutorial']
  },
  {
    id: '3',
    projectName: 'EcoChain Network',
    description: 'Sustainable blockchain platform focused on environmental impact tracking',
    tokenSymbol: 'ECO',
    totalAmount: 750000,
    estimatedValue: 375000,
    submissionDate: '2024-01-13',
    status: 'featured',
    priority: 'high',
    submittedBy: 'EcoChain Foundation',
    projectType: 'Environmental',
    targetAudience: 'Eco-conscious investors, institutions',
    requirements: ['Verify identity', 'Complete environmental quiz', 'Stake 100 ECO']
  }
]

export default function MarketplaceHome() {
  const [stats, setStats] = useState<MarketplaceStats>(mockStats)
  const [submissions, setSubmissions] = useState<AirdropSubmission[]>(mockSubmissions)
  const [activeTab, setActiveTab] = useState('overview')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'vetting': return 'bg-blue-100 text-blue-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'featured': return 'bg-purple-100 text-purple-800'
      case 'sponsored': return 'bg-orange-100 text-orange-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />
      case 'vetting': return <Search className="h-3 w-3" />
      case 'approved': return <CheckCircle className="h-3 w-3" />
      case 'featured': return <Trophy className="h-3 w-3" />
      case 'sponsored': return <Star className="h-3 w-3" />
      case 'rejected': return <AlertCircle className="h-3 w-3" />
      default: return <FileText className="h-3 w-3" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Airdrop Marketplace
        </h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          Submit your airdrop for professional vetting and get featured on our platform. 
          Connect with authentic users and build your community through trusted airdrop campaigns.
        </p>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/marketplace/submit">
              <Send className="h-5 w-5 mr-2" />
              Submit Airdrop
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/marketplace/campaigns">
              <Gift className="h-5 w-5 mr-2" />
              Browse Campaigns
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.vettedAirdrops} vetted
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Featured</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.featuredAirdrops}</div>
            <p className="text-xs text-muted-foreground">
              Premium placements
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sponsored</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sponsoredAirdrops}</div>
            <p className="text-xs text-muted-foreground">
              Promoted campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Approval rate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Vetting Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageVettingTime}d</div>
            <p className="text-xs text-muted-foreground">
              Review process
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$1.2M</div>
            <p className="text-xs text-muted-foreground">
              In airdrops
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-8">
          {/* Recent Submissions */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Submissions</h2>
              <Button variant="outline" asChild>
                <Link href="/marketplace/submissions">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {submissions.slice(0, 6).map((submission) => (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className={getStatusColor(submission.status)}>
                            {getStatusIcon(submission.status)}
                            <span className="ml-1 capitalize">{submission.status}</span>
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(submission.priority)}>
                            {submission.priority} priority
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{submission.projectName}</CardTitle>
                        <CardDescription className="mt-2">{submission.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Token:</span>
                        <span className="font-semibold">{submission.tokenSymbol}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Amount:</span>
                        <span className="font-semibold">{submission.totalAmount.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Est. Value:</span>
                        <span className="font-semibold">${submission.estimatedValue.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Submitted:</span>
                        <span className="font-semibold">{submission.submissionDate}</span>
                      </div>
                      
                      <Button className="w-full">
                        Review Submission
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
            <h2 className="text-2xl font-bold mb-6">How Airdrop Submission Works</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Send className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle>1. Submit Your Airdrop</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Provide detailed information about your project, tokenomics, and airdrop requirements.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Project details
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Token information
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Target audience
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                    <Search className="h-6 w-6 text-yellow-600" />
                  </div>
                  <CardTitle>2. Professional Vetting</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Our team reviews your submission for legitimacy, security, and community value.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Security audit
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Project verification
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Community assessment
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Trophy className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle>3. Get Featured</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Approved airdrops get featured on our platform with optional sponsored promotion.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Featured listing
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Community access
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Performance tracking
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="submissions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">All Submissions</h2>
            <Button>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Review and manage airdrop submissions. High-priority submissions require immediate attention.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold">{submission.projectName}</h3>
                        <Badge variant="secondary" className={getStatusColor(submission.status)}>
                          {getStatusIcon(submission.status)}
                          <span className="ml-1 capitalize">{submission.status}</span>
                        </Badge>
                        <Badge variant="outline" className={getPriorityColor(submission.priority)}>
                          {submission.priority} priority
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{submission.description}</p>
                      <div className="flex gap-6 text-sm">
                        <span><strong>Token:</strong> {submission.tokenSymbol}</span>
                        <span><strong>Amount:</strong> {submission.totalAmount.toLocaleString()}</span>
                        <span><strong>Value:</strong> ${submission.estimatedValue.toLocaleString()}</span>
                        <span><strong>Submitted:</strong> {submission.submissionDate}</span>
                        <span><strong>By:</strong> {submission.submittedBy}</span>
                      </div>
                    </div>
                    <Button variant="outline">
                      Review
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="featured" className="space-y-6">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Featured Airdrops</h2>
            <p className="text-muted-foreground mb-6">
              Premium airdrop campaigns that have passed our rigorous vetting process
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            {submissions.filter(s => s.status === 'featured' || s.status === 'sponsored').map((submission) => (
              <Card key={submission.id} className="border-2 border-yellow-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {submission.status === 'featured' && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            <Trophy className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {submission.status === 'sponsored' && (
                          <Badge className="bg-orange-100 text-orange-800">
                            <Star className="h-3 w-3 mr-1" />
                            Sponsored
                          </Badge>
                        )}
                      </div>
                      <CardTitle>{submission.projectName}</CardTitle>
                      <CardDescription>{submission.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Token Symbol:</span>
                      <span className="font-semibold">{submission.tokenSymbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount:</span>
                      <span className="font-semibold">{submission.totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Estimated Value:</span>
                      <span className="font-semibold">${submission.estimatedValue.toLocaleString()}</span>
                    </div>
                    <Button className="w-full">
                      View Details
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="campaigns" className="space-y-6">
          <div className="text-center">
            <Gift className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Campaign Management</h2>
            <p className="text-muted-foreground mb-6">
              Create and manage promotional campaigns for creators and influencers
            </p>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Campaign feature is available for content creators and influencers to promote verified airdrops.
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>For Creators</CardTitle>
                <CardDescription>
                  Earn rewards by promoting verified airdrops to your audience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Access to verified airdrops
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Performance-based rewards
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Detailed analytics
                  </li>
                </ul>
                <Button className="w-full">
                  Join as Creator
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>For Projects</CardTitle>
                <CardDescription>
                  Amplify your airdrop reach through creator partnerships
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Access to creator network
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Campaign management tools
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    ROI tracking
                  </li>
                </ul>
                <Button className="w-full">
                  Create Campaign
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}