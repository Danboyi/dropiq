'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  ArrowUpDown,
  Calendar,
  DollarSign
} from 'lucide-react'

interface Campaign {
  id: string
  tier: string
  amount: number
  currency: string
  status: string
  paymentStatus: string
  stripeSessionId?: string
  startDate: string
  endDate: string
  submittedBy?: string
  submittedAt: string
  approvedAt?: string
  approvedBy?: string
  rejectedAt?: string
  rejectedBy?: string
  notes?: string
  airdrop: {
    id: string
    name: string
    slug: string
    category: string
    logoUrl?: string
    riskScore: number
    hypeScore: number
    status: string
  }
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentStatusFilter !== 'all' && { paymentStatus: paymentStatusFilter }),
      })
      
      const response = await fetch(`/api/admin/campaigns?${params}`)
      if (!response.ok) throw new Error('Failed to fetch campaigns')
      
      const data = await response.json()
      setCampaigns(data.campaigns)
      setTotalPages(data.pagination.pages)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [currentPage, statusFilter, paymentStatusFilter])

  const handleApprove = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: 'admin', // In real app, this would be the actual admin user
        }),
      })
      
      if (!response.ok) throw new Error('Failed to approve campaign')
      
      fetchCampaigns()
    } catch (error) {
      console.error('Error approving campaign:', error)
    }
  }

  const handleReject = async (campaignId: string) => {
    const refund = window.confirm('Do you want to issue a refund?')
    
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectedBy: 'admin', // In real app, this would be the actual admin user
          refund,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to reject campaign')
      
      fetchCampaigns()
    } catch (error) {
      console.error('Error rejecting campaign:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      paid: 'default',
      approved: 'default',
      rejected: 'destructive',
      expired: 'secondary',
    }
    return variants[status] || 'outline'
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'outline',
      paid: 'default',
      refunded: 'secondary',
      failed: 'destructive',
    }
    return variants[status] || 'outline'
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium': return '👑'
      case 'standard': return '⭐'
      case 'basic': return '🚀'
      default: return '🚀'
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.airdrop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    campaign.airdrop.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Campaign Management</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground">
            Manage and review promotional campaigns
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${(campaigns.reduce((sum, c) => sum + (c.paymentStatus === 'paid' ? c.amount : 0), 0) / 100).toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">
                  {campaigns.filter(c => c.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
          <CardDescription>
            Review and manage promotional campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {campaign.airdrop.logoUrl && (
                        <img 
                          src={campaign.airdrop.logoUrl} 
                          alt={campaign.airdrop.name}
                          className="h-8 w-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium">{campaign.airdrop.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {campaign.airdrop.category}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <span>{getTierIcon(campaign.tier)}</span>
                      <Badge variant="outline" className="text-xs">
                        {campaign.tier}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    ${(campaign.amount / 100).toFixed(0)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusBadge(campaign.paymentStatus)}>
                      {campaign.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(campaign.startDate).toLocaleDateString()}</div>
                      <div className="text-muted-foreground">
                        to {new Date(campaign.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{campaign.submittedBy || 'Anonymous'}</div>
                      <div className="text-muted-foreground">
                        {new Date(campaign.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'pending' && campaign.paymentStatus === 'paid' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(campaign.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(campaign.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}