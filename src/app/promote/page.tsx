'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle, 
  Star, 
  TrendingUp, 
  Zap, 
  ArrowRight, 
  ExternalLink,
  Info,
  Loader2,
  Search,
  Plus,
  X
} from 'lucide-react'
import { CAMPAIGN_PRICING, CampaignTier } from '@/lib/stripe'

interface Airdrop {
  id: string
  name: string
  slug: string
  description: string
  category: string
  logoUrl?: string
  websiteUrl: string
  riskScore: number
  hypeScore: number
  status: string
}

export default function PromotePage() {
  const searchParams = useSearchParams()
  const [selectedAirdrop, setSelectedAirdrop] = useState<Airdrop | null>(null)
  const [selectedTier, setSelectedTier] = useState<CampaignTier | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Airdrop[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showSubmissionForm, setShowSubmissionForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionData, setSubmissionData] = useState({
    name: '',
    description: '',
    category: '',
    websiteUrl: '',
    twitterUrl: '',
    discordUrl: '',
    telegramUrl: '',
    submittedBy: '',
    submissionNotes: ''
  })

  // Check for success/cancel from URL params
  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const status = searchParams.get('status')
    
    if (sessionId) {
      if (status === 'success') {
        setSuccess('Payment successful! Your campaign will be reviewed shortly.')
      } else if (status === 'cancel') {
        setError('Payment was cancelled. You can try again anytime.')
      }
    }
  }, [searchParams])

  const searchAirdrops = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/airdrops/search?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setSearchResults(data.airdrops || [])
    } catch (error) {
      setError('Failed to search airdrops. Please try again.')
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleCheckout = async () => {
    if (!selectedAirdrop || !selectedTier) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/campaigns/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airdropId: selectedAirdrop.id,
          tier: selectedTier,
          submittedBy: '', // Could collect this from a form
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const data = await response.json()
      
      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process payment')
    } finally {
      setIsProcessing(false)
    }
  }

  const selectAirdrop = (airdrop: Airdrop) => {
    setSelectedAirdrop(airdrop)
    setSearchResults([])
    setSearchQuery('')
    setShowSubmissionForm(false)
  }

  const handleSubmitAirdrop = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/airdrops/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Airdrop already exists
          setError(`This airdrop already exists in our database with status: ${data.existingAirdrop.status}`)
        } else {
          throw new Error(data.error || 'Failed to submit airdrop')
        }
        return
      }

      setSuccess(data.airdrop.message)
      setShowSubmissionForm(false)
      setSubmissionData({
        name: '',
        description: '',
        category: '',
        websiteUrl: '',
        twitterUrl: '',
        discordUrl: '',
        telegramUrl: '',
        submittedBy: '',
        submissionNotes: ''
      })
      setSearchQuery('')

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit airdrop')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmissionChange = (field: string, value: string) => {
    setSubmissionData(prev => ({ ...prev, [field]: value }))
  }

  const getTierFeatures = (tier: CampaignTier) => {
    const features = {
      basic: [
        '7 days featured placement',
        'Top of homepage visibility',
        'Basic analytics',
        'Email support',
      ],
      standard: [
        '14 days featured placement',
        'Premium placement (above basic)',
        'Advanced analytics',
        'Priority email support',
        'Social media mentions',
      ],
      premium: [
        '30 days featured placement',
        'Top premium placement',
        'Comprehensive analytics dashboard',
        'Dedicated support manager',
        'Social media campaign',
        'Newsletter inclusion',
      ],
    }
    return features[tier]
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">DROPIQ</span>
            </Link>
            <Link href="/home">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Star className="h-3 w-3 mr-1" />
            Promote Your Airdrop
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Get Your Airdrop in Front of Thousands of Qualified Users
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join thousands of successful projects that have used DROPIQ's promotion platform 
            to reach engaged crypto users actively looking for new opportunities.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <p className="text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">Airdrops Listed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">85%</div>
              <p className="text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-500 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Airdrop */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                1
              </div>
              Select Your Airdrop
            </CardTitle>
            <CardDescription>
              Find and select the airdrop you want to promote
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAirdrop ? (
              <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-surface">
                <div className="flex items-center space-x-4">
                  {selectedAirdrop.logoUrl && (
                    <img 
                      src={selectedAirdrop.logoUrl} 
                      alt={selectedAirdrop.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedAirdrop.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedAirdrop.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">Risk: {selectedAirdrop.riskScore}</Badge>
                      <Badge variant="outline">Hype: {selectedAirdrop.hypeScore}</Badge>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedAirdrop(null)}
                >
                  Change
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search for your airdrop by name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchAirdrops()}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={searchAirdrops} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>

                {searchResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {searchResults.map((airdrop) => (
                      <div
                        key={airdrop.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface-hover cursor-pointer transition-colors"
                        onClick={() => selectAirdrop(airdrop)}
                      >
                        <div className="flex items-center space-x-3">
                          {airdrop.logoUrl && (
                            <img 
                              src={airdrop.logoUrl} 
                              alt={airdrop.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-foreground">{airdrop.name}</h4>
                            <p className="text-sm text-muted-foreground">{airdrop.category}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && searchResults.length === 0 && !isSearching && (
                  <div className="text-center py-8">
                    <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No airdrops found</h3>
                    <p className="text-muted-foreground mb-4">
                      Your airdrop isn't listed on DROPIQ yet? No problem!
                    </p>
                    <Button 
                      onClick={() => setShowSubmissionForm(true)}
                      className="mt-2"
                    >
                      Submit Your Airdrop for Review
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Select Tier */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedAirdrop ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              Choose Your Promotion Tier
            </CardTitle>
            <CardDescription>
              Select the promotion package that best fits your needs and budget
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(Object.keys(CAMPAIGN_PRICING) as CampaignTier[]).map((tier) => {
                const pricing = CAMPAIGN_PRICING[tier];
                const features = getTierFeatures(tier);
                const isSelected = selectedTier === tier;

                return (
                  <Card 
                    key={tier}
                    className={`cursor-pointer transition-all ${
                      isSelected 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary'
                    } ${!selectedAirdrop ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => selectedAirdrop && setSelectedTier(tier)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{pricing.name}</span>
                        {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                      </CardTitle>
                      <div className="text-2xl font-bold text-primary">
                        ${(pricing.amount / 100).toFixed(0)}
                      </div>
                      <CardDescription>{pricing.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Checkout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                selectedAirdrop && selectedTier ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              Complete Your Purchase
            </CardTitle>
            <CardDescription>
              Review your selection and proceed to secure payment
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedAirdrop && selectedTier ? (
              <div className="space-y-6">
                <div className="bg-surface p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Airdrop:</span>
                      <span className="font-medium">{selectedAirdrop.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tier:</span>
                      <span className="font-medium">{CAMPAIGN_PRICING[selectedTier].name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{CAMPAIGN_PRICING[selectedTier].duration} days</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">${(CAMPAIGN_PRICING[selectedTier].amount / 100).toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Campaign Benefits</h3>
                  <ul className="space-y-2">
                    {getTierFeatures(selectedTier).map((feature, index) => (
                      <li key={index} className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Payment
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  By proceeding, you agree to our terms of service and campaign guidelines.
                  Your campaign will be reviewed by our team before going live.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Complete Your Selection</h3>
                <p className="text-muted-foreground">
                  Please select an airdrop and promotion tier to proceed with payment.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
            <CardDescription>
              Everything you need to know about promoting your airdrop
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">How long does it take for my campaign to go live?</h4>
                <p className="text-sm text-muted-foreground">
                  Most campaigns are reviewed within 24 hours. You'll receive an email once your campaign is approved.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Can I change my tier after purchase?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade your tier at any time. Contact our support team for assistance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">What if my airdrop is not approved?</h4>
                <p className="text-sm text-muted-foreground">
                  We offer full refunds for campaigns that don't meet our quality standards. 
                  Our team will provide feedback on the rejection reason.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">How are featured airdrops displayed?</h4>
                <p className="text-sm text-muted-foreground">
                  Featured airdrops appear at the top of the homepage and in dedicated 
                  sections with clear sponsorship labels.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Airdrop Submission Dialog */}
        <Dialog open={showSubmissionForm} onOpenChange={setShowSubmissionForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Submit Your Airdrop for Review
              </DialogTitle>
              <DialogDescription>
                Your airdrop will be reviewed by our team within 24-48 hours. Once approved, you can promote it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={submissionData.name}
                    onChange={(e) => handleSubmissionChange('name', e.target.value)}
                    placeholder="e.g., LayerZero"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={submissionData.category}
                    onChange={(e) => handleSubmissionChange('category', e.target.value)}
                    placeholder="e.g., DeFi, Layer 2, NFT"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={submissionData.description}
                  onChange={(e) => handleSubmissionChange('description', e.target.value)}
                  placeholder="Describe your project and what makes it unique..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="websiteUrl">Website URL *</Label>
                <Input
                  id="websiteUrl"
                  value={submissionData.websiteUrl}
                  onChange={(e) => handleSubmissionChange('websiteUrl', e.target.value)}
                  placeholder="https://yourproject.com"
                  type="url"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input
                    id="twitterUrl"
                    value={submissionData.twitterUrl}
                    onChange={(e) => handleSubmissionChange('twitterUrl', e.target.value)}
                    placeholder="https://twitter.com/yourproject"
                    type="url"
                  />
                </div>
                <div>
                  <Label htmlFor="discordUrl">Discord URL</Label>
                  <Input
                    id="discordUrl"
                    value={submissionData.discordUrl}
                    onChange={(e) => handleSubmissionChange('discordUrl', e.target.value)}
                    placeholder="https://discord.gg/yourproject"
                    type="url"
                  />
                </div>
                <div>
                  <Label htmlFor="telegramUrl">Telegram URL</Label>
                  <Input
                    id="telegramUrl"
                    value={submissionData.telegramUrl}
                    onChange={(e) => handleSubmissionChange('telegramUrl', e.target.value)}
                    placeholder="https://t.me/yourproject"
                    type="url"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="submittedBy">Your Email</Label>
                <Input
                  id="submittedBy"
                  value={submissionData.submittedBy}
                  onChange={(e) => handleSubmissionChange('submittedBy', e.target.value)}
                  placeholder="your@email.com"
                  type="email"
                />
              </div>

              <div>
                <Label htmlFor="submissionNotes">Additional Notes</Label>
                <Textarea
                  id="submissionNotes"
                  value={submissionData.submissionNotes}
                  onChange={(e) => handleSubmissionChange('submissionNotes', e.target.value)}
                  placeholder="Any additional information you'd like to share with our review team..."
                  rows={2}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Review Process:</strong> Our team will verify your project's legitimacy, 
                  tokenomics, and community engagement. Approved projects will be assigned 
                  risk and hype scores before being listed.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowSubmissionForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitAirdrop}
                  disabled={isSubmitting || !submissionData.name || !submissionData.description || !submissionData.websiteUrl}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit for Review'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}