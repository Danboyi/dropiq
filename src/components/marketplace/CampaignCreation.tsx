'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  DollarSign, 
  Target, 
  Calendar, 
  Users, 
  Star, 
  Shield, 
  Zap, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  BarChart3,
  Settings,
  FileText,
  Upload,
  Plus,
  X
} from 'lucide-react'

interface CampaignTier {
  id: string
  name: string
  description: string
  price: number
  currency: string
  duration: number
  maxParticipants?: number
  features: string[]
  visibility: string
  supportLevel: string
  customizationLevel: string
  analyticsLevel: string
}

interface CampaignFormData {
  title: string
  description: string
  campaignType: string
  projectId?: string
  airdropId?: string
  tierId?: string
  budget: number
  currency: string
  paymentMethod: string
  startDate: string
  endDate?: string
  maxParticipants?: number
  rewardPerAction: number
  rewardType: string
  requirements: string
  guidelines: string
  verificationNeeded: boolean
  autoApproval: boolean
  escrowEnabled: boolean
  tags: string[]
  targeting: string
  documents: File[]
}

const campaignTypes = [
  { value: 'promotion', label: 'Project Promotion', description: 'Promote your project to our community' },
  { value: 'review', label: 'Product Review', description: 'Get honest reviews from community members' },
  { value: 'tutorial', label: 'Tutorial Creation', description: 'Create educational content about your project' },
  { value: 'social_media', label: 'Social Media Campaign', description: 'Drive social media engagement' },
  { value: 'testing', label: 'Bug Testing', description: 'Get feedback on beta features' },
  { value: 'content_creation', label: 'Content Creation', description: 'Create blog posts, videos, or other content' }
]

const rewardTypes = [
  { value: 'fixed', label: 'Fixed Amount', description: 'Same reward for all participants' },
  { value: 'percentage', label: 'Percentage Based', description: 'Reward based on performance' },
  { value: 'tiered', label: 'Tiered Rewards', description: 'Different rewards for different quality levels' }
]

const mockTiers: CampaignTier[] = [
  {
    id: '1',
    name: 'Starter',
    description: 'Perfect for new projects getting started',
    price: 500,
    currency: 'USD',
    duration: 7,
    maxParticipants: 50,
    features: ['Basic promotion', 'Community access', 'Standard analytics'],
    visibility: 'standard',
    supportLevel: 'basic',
    customizationLevel: 'limited',
    analyticsLevel: 'basic'
  },
  {
    id: '2',
    name: 'Professional',
    description: 'Ideal for growing projects',
    price: 1500,
    currency: 'USD',
    duration: 14,
    maxParticipants: 150,
    features: ['Enhanced promotion', 'Priority support', 'Advanced analytics', 'A/B testing'],
    visibility: 'featured',
    supportLevel: 'priority',
    customizationLevel: 'standard',
    analyticsLevel: 'advanced'
  },
  {
    id: '3',
    name: 'Enterprise',
    description: 'Maximum exposure and features',
    price: 5000,
    currency: 'USD',
    duration: 30,
    maxParticipants: 500,
    features: ['Premium promotion', 'Dedicated support', 'Enterprise analytics', 'Custom branding', 'API access'],
    visibility: 'exclusive',
    supportLevel: 'dedicated',
    customizationLevel: 'full',
    analyticsLevel: 'enterprise'
  }
]

export default function CampaignCreation() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CampaignFormData>({
    title: '',
    description: '',
    campaignType: '',
    budget: 0,
    currency: 'USD',
    paymentMethod: 'crypto',
    startDate: '',
    rewardPerAction: 0,
    rewardType: 'fixed',
    requirements: '',
    guidelines: '',
    verificationNeeded: true,
    autoApproval: false,
    escrowEnabled: true,
    tags: [],
    targeting: '',
    documents: []
  })
  const [selectedTier, setSelectedTier] = useState<CampaignTier | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [estimatedReach, setEstimatedReach] = useState(0)

  const totalSteps = 5

  useEffect(() => {
    if (selectedTier) {
      setFormData(prev => ({
        ...prev,
        tierId: selectedTier.id,
        budget: selectedTier.price,
        maxParticipants: selectedTier.maxParticipants
      }))
      setEstimatedReach(selectedTier.maxParticipants || 100)
    }
  }, [selectedTier])

  const updateFormData = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const calculateEstimatedCost = () => {
    const baseCost = formData.budget
    const platformFee = baseCost * 0.1 // 10% platform fee
    const processingFee = formData.paymentMethod === 'crypto' ? baseCost * 0.02 : baseCost * 0.03
    return baseCost + platformFee + processingFee
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // API call to create campaign
      console.log('Creating campaign:', formData)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('Campaign created successfully!')
    } catch (error) {
      console.error('Error creating campaign:', error)
      alert('Error creating campaign. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Campaign Tier</h3>
              <div className="grid gap-4 md:grid-cols-3">
                {mockTiers.map((tier) => (
                  <Card 
                    key={tier.id} 
                    className={`cursor-pointer transition-all ${
                      selectedTier?.id === tier.id 
                        ? 'ring-2 ring-primary border-primary' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{tier.name}</CardTitle>
                        {tier.visibility === 'featured' && <Badge variant="secondary">Popular</Badge>}
                      </div>
                      <CardDescription>{tier.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold">${tier.price}</span>
                          <span className="text-sm text-muted-foreground">/{tier.duration} days</span>
                        </div>
                        <div className="space-y-2">
                          {tier.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>Up to {tier.maxParticipants} participants</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Campaign Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Campaign Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter campaign title"
                    value={formData.title}
                    onChange={(e) => updateFormData('title', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campaignType">Campaign Type</Label>
                  <Select value={formData.campaignType} onValueChange={(value) => updateFormData('campaignType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign type" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your campaign in detail"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Campaign Tags</h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                  className="flex-1"
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Budget & Rewards</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="budget">Total Budget ($)</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter budget"
                    value={formData.budget}
                    onChange={(e) => updateFormData('budget', parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rewardPerAction">Reward Per Action ($)</Label>
                  <Input
                    id="rewardPerAction"
                    type="number"
                    placeholder="Enter reward amount"
                    value={formData.rewardPerAction}
                    onChange={(e) => updateFormData('rewardPerAction', parseFloat(e.target.value))}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="rewardType">Reward Type</Label>
                  <Select value={formData.rewardType} onValueChange={(value) => updateFormData('rewardType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reward type" />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-muted-foreground">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => updateFormData('paymentMethod', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="fiat">Fiat (USD/EUR)</SelectItem>
                      <SelectItem value="platform_tokens">Platform Tokens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Campaign Budget:</span>
                    <span>${formData.budget}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform Fee (10%):</span>
                    <span>${(formData.budget * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee (3%):</span>
                    <span>${(formData.budget * 0.03).toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total Cost:</span>
                    <span>${calculateEstimatedCost().toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Schedule & Requirements</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => updateFormData('startDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => updateFormData('endDate', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="maxParticipants">Maximum Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  placeholder="Enter maximum number of participants"
                  value={formData.maxParticipants}
                  onChange={(e) => updateFormData('maxParticipants', parseInt(e.target.value))}
                />
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Campaign Requirements</h4>
              <Textarea
                placeholder="Describe what participants need to do to complete the campaign"
                rows={4}
                value={formData.requirements}
                onChange={(e) => updateFormData('requirements', e.target.value)}
              />
            </div>

            <div>
              <h4 className="font-medium mb-3">Guidelines</h4>
              <Textarea
                placeholder="Provide guidelines and best practices for participants"
                rows={3}
                value={formData.guidelines}
                onChange={(e) => updateFormData('guidelines', e.target.value)}
              />
            </div>

            <div>
              <h4 className="font-medium mb-3">Targeting Criteria</h4>
              <Textarea
                placeholder="Describe your target audience (e.g., experienced DeFi users, NFT collectors, etc.)"
                rows={2}
                value={formData.targeting}
                onChange={(e) => updateFormData('targeting', e.target.value)}
              />
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review & Submit</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Campaign Details</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Title:</strong> {formData.title}</div>
                        <div><strong>Type:</strong> {campaignTypes.find(t => t.value === formData.campaignType)?.label}</div>
                        <div><strong>Tier:</strong> {selectedTier?.name}</div>
                        <div><strong>Budget:</strong> ${formData.budget}</div>
                        <div><strong>Reward per Action:</strong> ${formData.rewardPerAction}</div>
                        <div><strong>Max Participants:</strong> {formData.maxParticipants}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Settings</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Verification:</strong> {formData.verificationNeeded ? 'Required' : 'Optional'}</div>
                        <div><strong>Auto Approval:</strong> {formData.autoApproval ? 'Enabled' : 'Disabled'}</div>
                        <div><strong>Escrow:</strong> {formData.escrowEnabled ? 'Enabled' : 'Disabled'}</div>
                        <div><strong>Payment Method:</strong> {formData.paymentMethod}</div>
                        <div><strong>Estimated Reach:</strong> {estimatedReach} users</div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-3 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms"
                    checked={formData.verificationNeeded}
                    onCheckedChange={(checked) => updateFormData('verificationNeeded', checked as boolean)}
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the terms and conditions
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="escrow"
                    checked={formData.escrowEnabled}
                    onCheckedChange={(checked) => updateFormData('escrowEnabled', checked as boolean)}
                  />
                  <Label htmlFor="escrow" className="text-sm">
                    I agree to use escrow for payment protection
                  </Label>
                </div>
              </div>

              <Alert className="mt-4">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your campaign will be reviewed by our team before going live. This process typically takes 24-48 hours.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Campaign</h1>
          <p className="text-muted-foreground">
            Launch your shilling campaign and reach thousands of potential users
          </p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>

        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          <Button 
            onClick={currentStep === totalSteps ? handleSubmit : nextStep}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : currentStep === totalSteps ? 'Submit Campaign' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}