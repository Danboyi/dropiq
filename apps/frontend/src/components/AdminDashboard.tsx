'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Play, 
  RefreshCw, 
  Search, 
  Trash2, 
  XCircle 
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { api } from '@/lib/api'

interface DiscoveredAirdrop {
  id: string
  name: string
  description: string
  status: string
  priority: string
  discoveredAt: string
  source: {
    name: string
    type: string
  }
  vettingJobs: Array<{
    id: string
    type: string
    status: string
    progress: number
  }>
  _count: {
    vettingJobs: number
  }
}

interface VettingJob {
  id: string
  type: string
  status: string
  progress: number
  discoveredAirdrop: {
    name: string
    source: {
      name: string
    }
  }
}

interface DashboardStats {
  discovery: {
    total: number
    pending: number
    approvedToday: number
    rejectedToday: number
  }
  jobs: {
    active: number
    completed: number
    failed: number
  }
}

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [discoveredAirdrops, setDiscoveredAirdrops] = useState<DiscoveredAirdrop[]>([])
  const [vettingJobs, setVettingJobs] = useState<VettingJob[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAirdrop, setSelectedAirdrop] = useState<DiscoveredAirdrop | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [airdropData, setAirdropData] = useState({
    name: '',
    description: '',
    category: '',
    blockchain: '',
    requirements: '',
    eligibility: ''
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Check if user is admin
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [statsRes, discoveredRes, jobsRes] = await Promise.all([
        api.get('/api/admin/dashboard'),
        api.get('/api/admin/discovered-airdrops'),
        api.get('/api/admin/vetting-jobs')
      ])

      setStats(statsRes.data.data)
      setDiscoveredAirdrops(discoveredRes.data.data.discoveredAirdrops)
      setVettingJobs(jobsRes.data.data.vettingJobs)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveAirdrop = async () => {
    if (!selectedAirdrop) return

    try {
      await api.post('/api/admin/approve-airdrop', {
        discoveredAirdropId: selectedAirdrop.id,
        airdropData: {
          name: airdropData.name || selectedAirdrop.name,
          description: airdropData.description || selectedAirdrop.description,
          category: airdropData.category || 'General',
          blockchain: airdropData.blockchain || 'Ethereum',
          requirements: airdropData.requirements ? JSON.parse(airdropData.requirements) : [],
          eligibility: airdropData.eligibility ? JSON.parse(airdropData.eligibility) : {}
        }
      })

      setApproveDialogOpen(false)
      setSelectedAirdrop(null)
      loadDashboardData()
    } catch (error) {
      console.error('Error approving airdrop:', error)
    }
  }

  const handleRejectAirdrop = async () => {
    if (!selectedAirdrop) return

    try {
      await api.post('/api/admin/reject-airdrop', {
        discoveredAirdropId: selectedAirdrop.id,
        reason: rejectionReason
      })

      setRejectDialogOpen(false)
      setSelectedAirdrop(null)
      setRejectionReason('')
      loadDashboardData()
    } catch (error) {
      console.error('Error rejecting airdrop:', error)
    }
  }

  const handleTriggerScraping = async (sourceType: string) => {
    try {
      await api.post('/api/admin/trigger-scraping', { sourceType })
      loadDashboardData()
    } catch (error) {
      console.error('Error triggering scraping:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      DISCOVERED: { variant: 'secondary', icon: <Search className="h-3 w-3" /> },
      PROCESSING: { variant: 'default', icon: <Clock className="h-3 w-3" /> },
      VETTING: { variant: 'outline', icon: <Eye className="h-3 w-3" /> },
      APPROVED: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      REJECTED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
      PENDING: { variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
      RUNNING: { variant: 'default', icon: <Play className="h-3 w-3" /> },
      COMPLETED: { variant: 'default', icon: <CheckCircle className="h-3 w-3" /> },
      FAILED: { variant: 'destructive', icon: <XCircle className="h-3 w-3" /> }
    }

    const config = variants[status] || { variant: 'secondary', icon: null }
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage airdrop discovery and vetting</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discovered">Discovered</TabsTrigger>
          <TabsTrigger value="vetting">Vetting Jobs</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Discovered</CardTitle>
                  <Search className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.discovery.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.discovery.pending} pending review
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.discovery.approvedToday}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.discovery.rejectedToday} rejected today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
                  <Play className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.jobs.active}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.jobs.completed} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
                  <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.jobs.failed}</div>
                  <p className="text-xs text-muted-foreground">
                    Requires attention
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Trigger manual discovery and vetting processes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleTriggerScraping('TWITTER')}>
                  <Search className="h-4 w-4 mr-2" />
                  Scrape Twitter
                </Button>
                <Button onClick={() => handleTriggerScraping('WEBSITE')} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Scrape Websites
                </Button>
                <Button onClick={() => handleTriggerScraping('REDDIT')} variant="outline">
                  <Search className="h-4 w-4 mr-2" />
                  Scrape Reddit
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovered" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discovered Airdrops</CardTitle>
              <CardDescription>Review and manage discovered airdrops</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Jobs</TableHead>
                      <TableHead>Discovered</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discoveredAirdrops.map((airdrop) => (
                      <TableRow key={airdrop.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{airdrop.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {airdrop.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{airdrop.source.name}</div>
                            <div className="text-sm text-gray-500">{airdrop.source.type}</div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(airdrop.status)}</TableCell>
                        <TableCell>
                          <Badge variant={airdrop.priority === 'HIGH' ? 'destructive' : 'secondary'}>
                            {airdrop.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {airdrop._count.vettingJobs} jobs
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(airdrop.discoveredAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {airdrop.status === 'DISCOVERED' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setSelectedAirdrop(airdrop)
                                    setAirdropData({
                                      name: airdrop.name,
                                      description: airdrop.description,
                                      category: '',
                                      blockchain: '',
                                      requirements: '',
                                      eligibility: ''
                                    })
                                    setApproveDialogOpen(true)
                                  }}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedAirdrop(airdrop)
                                    setRejectDialogOpen(true)
                                  }}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vetting" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vetting Jobs</CardTitle>
              <CardDescription>Monitor background vetting processes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Airdrop</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vettingJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.type}</TableCell>
                        <TableCell>{job.discoveredAirdrop.name}</TableCell>
                        <TableCell>{job.discoveredAirdrop.source.name}</TableCell>
                        <TableCell>{getStatusBadge(job.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-500">
                              {Math.round(job.progress)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discovery Sources</CardTitle>
              <CardDescription>Manage sources for airdrop discovery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <p>Discovery sources management coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Approve Airdrop</DialogTitle>
            <DialogDescription>
              Convert this discovered airdrop into an official airdrop listing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={airdropData.name}
                onChange={(e) => setAirdropData({ ...airdropData, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={airdropData.description}
                onChange={(e) => setAirdropData({ ...airdropData, description: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Input
                id="category"
                value={airdropData.category}
                onChange={(e) => setAirdropData({ ...airdropData, category: e.target.value })}
                className="col-span-3"
                placeholder="e.g., DeFi, Gaming, NFT"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="blockchain" className="text-right">
                Blockchain
              </Label>
              <Input
                id="blockchain"
                value={airdropData.blockchain}
                onChange={(e) => setAirdropData({ ...airdropData, blockchain: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Ethereum, Polygon"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleApproveAirdrop}>
              Approve Airdrop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Airdrop</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this airdrop.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="col-span-3"
                placeholder="Explain why this airdrop is being rejected..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleRejectAirdrop}>
              Reject Airdrop
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}