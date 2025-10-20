'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Eye, 
  MousePointer, // Changed from Click to MousePointer
  Calendar,
  Settings,
  Pause,
  Play,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react'

interface Campaign {
  id: string
  title: string
  description: string
  campaignType: string
  status: string
  startDate: string
  endDate?: string
  budget: number
  currency: string
  currentParticipants: number
  maxParticipants?: number
  rewardPerAction: number
  rewardType: string
  impressions: number
  clicks: number
  conversions: number
  spent: number
  createdAt: string
  updatedAt: string
}

interface CampaignMetrics {
  impressions: number
  clicks: number
  conversions: number
  engagement: number
  reach: number
  costPerImpression: number
  costPerClick: number
  costPerConversion: number
  revenue: number
  roi: number
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    title: 'DeFi Protocol Launch',
    description: 'Promote our new DeFi lending protocol',
    campaignType: 'promotion',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-02-15',
    budget: 5000,
    currency: 'USD',
    currentParticipants: 45,
    maxParticipants: 100,
    rewardPerAction: 50,
    rewardType: 'fixed',
    impressions: 15420,
    clicks: 892,
    conversions: 45,
    spent: 2250,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-20'
  },
  {
    id: '2',
    title: 'NFT Collection Review',
    description: 'Get authentic reviews for our NFT collection',
    campaignType: 'review',
    status: 'completed',
    startDate: '2024-01-01',
    endDate: '2024-01-10',
    budget: 2000,
    currency: 'USD',
    currentParticipants: 30,
    maxParticipants: 30,
    rewardPerAction: 30,
    rewardType: 'fixed',
    impressions: 8900,
    clicks: 567,
    conversions: 30,
    spent: 900,
    createdAt: '2023-12-28',
    updatedAt: '2024-01-10'
  },
  {
    id: '3',
    title: 'Tutorial Series',
    description: 'Create educational content about our platform',
    campaignType: 'tutorial',
    status: 'draft',
    startDate: '2024-02-01',
    endDate: '2024-02-28',
    budget: 3000,
    currency: 'USD',
    currentParticipants: 0,
    maxParticipants: 50,
    rewardPerAction: 60,
    rewardType: 'fixed',
    impressions: 0,
    clicks: 0,
    conversions: 0,
    spent: 0,
    createdAt: '2024-01-18',
    updatedAt: '2024-01-18'
  }
]

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const statusIcons = {
  draft: Clock,
  active: Play,
  paused: Pause,
  completed: CheckCircle,
  cancelled: XCircle
}

export default function CampaignDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesType = typeFilter === 'all' || campaign.campaignType === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const totalBudget = campaigns.reduce((sum, campaign) => sum + campaign.budget, 0)
  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0)
  const totalParticipants = campaigns.reduce((sum, campaign) => sum + campaign.currentParticipants, 0)
  const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0)
  const totalConversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0)

  const activeCampaigns = campaigns.filter(c => c.status === 'active').length
  const completedCampaigns = campaigns.filter(c => c.status === 'completed').length

  const calculateMetrics = (campaign: Campaign): CampaignMetrics => {
    const engagement = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0
    const conversionRate = campaign.clicks > 0 ? (campaign.conversions / campaign.clicks) * 100 : 0
    const costPerImpression = campaign.impressions > 0 ? campaign.spent / campaign.impressions : 0
    const costPerClick = campaign.clicks > 0 ? campaign.spent / campaign.clicks : 0
    const costPerConversion = campaign.conversions > 0 ? campaign.spent / campaign.conversions : 0
    
    return {
      impressions: campaign.impressions,
      clicks: campaign.clicks,
      conversions: campaign.conversions,
      engagement,
      reach: campaign.currentParticipants,
      costPerImpression,
      costPerClick,
      costPerConversion,
      revenue: campaign.conversions * campaign.rewardPerAction,
      roi: campaign.spent > 0 ? ((campaign.conversions * campaign.rewardPerAction - campaign.spent) / campaign.spent) * 100 : 0
    }
  }

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    setIsLoading(true)
    try {
      // API call to update campaign status
      console.log(`Updating campaign ${campaignId} to status ${newStatus}`)
      
      setCampaigns(prev => prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, status: newStatus, updatedAt: new Date().toISOString() }
          : campaign
      ))
    } catch (error) {
      console.error('Error updating campaign status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    
    setIsLoading(true)
    try {
      // API call to delete campaign
      console.log(`Deleting campaign ${campaignId}`)
      
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId))
      if (selectedCampaign?.id === campaignId) {
        setSelectedCampaign(null)
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Title', 'Type', 'Status', 'Budget', 'Spent', 'Participants', 'Impressions', 'Clicks', 'Conversions'],
      ...filteredCampaigns.map(campaign => [
        campaign.title,
        campaign.campaignType,
        campaign.status,
        campaign.budget,
        campaign.spent,
        campaign.currentParticipants,
        campaign.impressions,
        campaign.clicks,
        campaign.conversions
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'campaigns.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Campaign Dashboard</h1>
            <p className="text-muted-foreground">
              Manage and monitor your shilling campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => window.location.href = '/marketplace/create'}>
              Create Campaign
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ${totalSpent.toLocaleString()} spent ({Math.round((totalSpent/totalBudget) * 100)}%)
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCampaigns}</div>
              <p className="text-xs text-muted-foreground">
                {completedCampaigns} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParticipants}</div>
              <p className="text-xs text-muted-foreground">
                Across all campaigns
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalConversions}</div>
              <p className="text-xs text-muted-foreground">
                {totalImpressions > 0 ? Math.round((totalConversions / totalImpressions) * 100) : 0}% conversion rate
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Campaign List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Campaigns</CardTitle>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search campaigns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 w-64"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => {
                    const StatusIcon = statusIcons[campaign.status as keyof typeof statusIcons]
                    const metrics = calculateMetrics(campaign)
                    const progress = campaign.maxParticipants 
                      ? (campaign.currentParticipants / campaign.maxParticipants) * 100 
                      : 0

                    return (
                      <div 
                        key={campaign.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                          selectedCampaign?.id === campaign.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{campaign.title}</h3>
                              <Badge className={statusColors[campaign.status as keyof typeof statusColors]}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{campaign.description}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{campaign.campaignType}</span>
                              <span>${campaign.budget} budget</span>
                              <span>{campaign.currentParticipants}/{campaign.maxParticipants} participants</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                // Handle edit
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {campaign.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(campaign.id, 'paused')
                                }}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            )}
                            {campaign.status === 'paused' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleStatusChange(campaign.id, 'active')
                                }}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCampaign(campaign.id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Eye className="h-3 w-3" />
                              Impressions
                            </div>
                            <div className="font-semibold">{campaign.impressions.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MousePointer className="h-3 w-3" />
                              Clicks
                            </div>
                            <div className="font-semibold">{campaign.clicks.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Target className="h-3 w-3" />
                              Conversions
                            </div>
                            <div className="font-semibold">{campaign.conversions}</div>
                          </div>
                          <div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              Spent
                            </div>
                            <div className="font-semibold">${campaign.spent}</div>
                          </div>
                        </div>

                        {campaign.maxParticipants && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Details */}
          <div>
            {selectedCampaign ? (
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Details</CardTitle>
                  <CardDescription>{selectedCampaign.title}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="metrics">Metrics</TabsTrigger>
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview" className="space-y-4">
                      <div>
                        <Label>Status</Label>
                        <Badge className={statusColors[selectedCampaign.status as keyof typeof statusColors]}>
                          {selectedCampaign.status}
                        </Badge>
                      </div>
                      
                      <div>
                        <Label>Budget</Label>
                        <p className="text-2xl font-bold">${selectedCampaign.budget}</p>
                        <p className="text-sm text-muted-foreground">
                          ${selectedCampaign.spent} spent ({Math.round((selectedCampaign.spent/selectedCampaign.budget) * 100)}%)
                        </p>
                      </div>

                      <div>
                        <Label>Participants</Label>
                        <p className="text-2xl font-bold">{selectedCampaign.currentParticipants}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedCampaign.maxParticipants ? `of ${selectedCampaign.maxParticipants}` : 'no limit'}
                        </p>
                      </div>

                      <div>
                        <Label>Dates</Label>
                        <p className="text-sm">
                          <strong>Start:</strong> {new Date(selectedCampaign.startDate).toLocaleDateString()}
                        </p>
                        {selectedCampaign.endDate && (
                          <p className="text-sm">
                            <strong>End:</strong> {new Date(selectedCampaign.endDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="metrics" className="space-y-4">
                      {(() => {
                        const metrics = calculateMetrics(selectedCampaign)
                        return (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Engagement Rate</Label>
                                <p className="text-xl font-bold">{metrics.engagement.toFixed(1)}%</p>
                              </div>
                              <div>
                                <Label>Conversion Rate</Label>
                                <p className="text-xl font-bold">
                                  {selectedCampaign.clicks > 0 
                                    ? ((selectedCampaign.conversions / selectedCampaign.clicks) * 100).toFixed(1)
                                    : 0}%
                                </p>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span>Cost per Impression:</span>
                                <span>${metrics.costPerImpression.toFixed(4)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Cost per Click:</span>
                                <span>${metrics.costPerClick.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Cost per Conversion:</span>
                                <span>${metrics.costPerConversion.toFixed(2)}</span>
                              </div>
                              <Separator />
                              <div className="flex justify-between font-semibold">
                                <span>ROI:</span>
                                <span className={metrics.roi >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {metrics.roi.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </TabsContent>
                    
                    <TabsContent value="settings" className="space-y-4">
                      <div>
                        <Label>Reward per Action</Label>
                        <p className="text-xl font-bold">${selectedCampaign.rewardPerAction}</p>
                        <p className="text-sm text-muted-foreground">Type: {selectedCampaign.rewardType}</p>
                      </div>
                      
                      <div>
                        <Label>Campaign Type</Label>
                        <p className="capitalize">{selectedCampaign.campaignType}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Campaign
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                        <Button variant="outline" className="w-full">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh Data
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Select a Campaign</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a campaign from the list to view detailed information
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}