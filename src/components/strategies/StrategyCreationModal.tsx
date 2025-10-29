'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Plus, 
  X, 
  Save, 
  Eye, 
  Upload,
  FileText,
  Lightbulb,
  Target,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import type { StrategyCategory, StrategyDifficulty, StrategyRiskLevel } from '@/types/user-profile';

interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: StrategyCategory;
  difficulty: StrategyDifficulty;
  riskLevel: StrategyRiskLevel;
  estimatedTime: number;
  potentialReward: number;
  steps: string[];
  requirements: string[];
  tips: string[];
  tags: string[];
}

const strategyTemplates: StrategyTemplate[] = [
  {
    id: 'defi-staking',
    name: 'DeFi Staking Strategy',
    description: 'A comprehensive guide to maximizing airdrop rewards through DeFi protocol staking',
    category: 'defi',
    difficulty: 'intermediate',
    riskLevel: 'medium',
    estimatedTime: 120,
    potentialReward: 5000,
    steps: [
      'Research and select promising DeFi protocols',
      'Set up wallet with sufficient gas fees',
      'Stake minimum required amounts in each protocol',
      'Maintain active participation for 30+ days',
      'Monitor for additional reward opportunities'
    ],
    requirements: [
      'MetaMask or similar wallet',
      'Minimum $100 in ETH for gas fees',
      'Initial capital of $500+',
      'Basic understanding of DeFi'
    ],
    tips: [
      'Focus on newer protocols with higher airdrop probability',
      'Diversify across multiple protocols to reduce risk',
      'Keep transaction records for tax purposes',
      'Join protocol communities for early updates'
    ],
    tags: ['staking', 'defi', 'yield', 'long-term']
  },
  {
    id: 'testnet-explorer',
    name: 'Testnet Explorer Strategy',
    description: 'Systematic approach to testnet exploration for maximum airdrop eligibility',
    category: 'testnet',
    difficulty: 'beginner',
    riskLevel: 'low',
    estimatedTime: 60,
    potentialReward: 2000,
    steps: [
      'Identify promising testnets from Layer 1/Layer 2 projects',
      'Set up testnet wallet and acquire test tokens',
      'Complete all available testnet tasks and interactions',
      'Provide meaningful feedback to project teams',
      'Maintain activity until mainnet launch'
    ],
    requirements: [
      'Discord account for community participation',
      'Testnet faucet access',
      'Basic understanding of blockchain transactions',
      'Time commitment of 1-2 hours daily'
    ],
    tips: [
      'Focus on projects with strong venture backing',
      'Document your testnet activities',
      'Engage actively in community discussions',
      'Watch for mainnet launch announcements'
    ],
    tags: ['testnet', 'exploration', 'learning', 'community']
  },
  {
    id: 'nft-minting',
    name: 'NFT Minting Strategy',
    description: 'Strategic approach to NFT minting for potential airdrop rewards',
    category: 'nft',
    difficulty: 'advanced',
    riskLevel: 'high',
    estimatedTime: 90,
    potentialReward: 8000,
    steps: [
      'Research upcoming NFT projects with strong fundamentals',
      'Join whitelists and presale opportunities',
      'Prepare wallet for minting (gas + mint price)',
      'Mint during optimal time windows',
      'Hold and stake NFTs for additional rewards'
    ],
    requirements: [
      'Experience with NFT marketplaces',
      'Capital for mint costs ($200-1000+)',
      'Understanding of gas optimization',
      'Twitter/Discord for project updates'
    ],
    tips: [
      'Research project team and roadmap thoroughly',
      'Use gas tracking tools for optimal timing',
      'Consider floor price and project potential',
      'Be aware of rug pull risks'
    ],
    tags: ['nft', 'minting', 'art', 'collectibles']
  },
  {
    id: 'layer2-bridge',
    name: 'Layer 2 Bridge Strategy',
    description: 'Maximize airdrop potential through strategic Layer 2 bridging',
    category: 'layer2',
    difficulty: 'intermediate',
    riskLevel: 'medium',
    estimatedTime: 45,
    potentialReward: 3000,
    steps: [
      'Identify promising Layer 2 solutions',
      'Bridge assets to multiple L2 networks',
      'Use native protocols on each L2',
      'Maintain minimum balances for eligibility',
      'Participate in governance if available'
    ],
    requirements: [
      'Understanding of Layer 2 concepts',
      'Assets for bridging ($100+)',
      'Multiple wallet setup experience',
      'Bridge fee budget'
    ],
    tips: [
      'Bridge during low gas periods',
      'Use official bridges to avoid risks',
      'Keep records of all transactions',
      'Monitor for bridge airdrop announcements'
    ],
    tags: ['layer2', 'bridge', 'scaling', 'ethereum']
  }
];

interface StrategyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function StrategyCreationModal({ isOpen, onClose, onSuccess }: StrategyCreationModalProps) {
  const [activeTab, setActiveTab] = useState('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<StrategyTemplate | null>(null);
  const [isPreview, setIsPreview] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'defi' as StrategyCategory,
    difficulty: 'beginner' as StrategyDifficulty,
    riskLevel: 'low' as StrategyRiskLevel,
    estimatedTime: 30,
    potentialReward: 0,
    content: '',
    requirements: [] as string[],
    steps: [] as string[],
    tips: [] as string[],
    tags: [] as string[],
    isPublic: true
  });

  const [newRequirement, setNewRequirement] = useState('');
  const [newStep, setNewStep] = useState('');
  const [newTip, setNewTip] = useState('');
  const [newTag, setNewTag] = useState('');

  const handleTemplateSelect = (template: StrategyTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      title: template.name,
      description: template.description,
      category: template.category,
      difficulty: template.difficulty,
      riskLevel: template.riskLevel,
      estimatedTime: template.estimatedTime,
      potentialReward: template.potentialReward,
      content: template.steps.join('\n\n'),
      requirements: [...template.requirements],
      steps: [...template.steps],
      tips: [...template.tips],
      tags: [...template.tags],
      isPublic: true
    });
    setActiveTab('manual');
  };

  const addRequirement = () => {
    if (newRequirement.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()]
      }));
      setNewRequirement('');
    }
  };

  const addStep = () => {
    if (newStep.trim()) {
      setFormData(prev => ({
        ...prev,
        steps: [...prev.steps, newStep.trim()]
      }));
      setNewStep('');
    }
  };

  const addTip = () => {
    if (newTip.trim()) {
      setFormData(prev => ({
        ...prev,
        tips: [...prev.tips, newTip.trim()]
      }));
      setNewTip('');
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeItem = (field: 'requirements' | 'steps' | 'tips' | 'tags', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: 'defi',
          difficulty: 'beginner',
          riskLevel: 'low',
          estimatedTime: 30,
          potentialReward: 0,
          content: '',
          requirements: [],
          steps: [],
          tips: [],
          tags: [],
          isPublic: true
        });
        setSelectedTemplate(null);
      }
    } catch (error) {
      console.error('Error creating strategy:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Create Strategy
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Manual Creation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Choose a template to get started quickly with proven strategy frameworks
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strategyTemplates.map((template) => (
                <Card 
                  key={template.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">{template.difficulty}</Badge>
                      <Badge variant="secondary">{template.riskLevel} risk</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {template.estimatedTime}m
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${template.potentialReward.toLocaleString()}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            {selectedTemplate && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Template Applied</span>
                </div>
                <p className="text-sm text-blue-700">
                  You're using the "{selectedTemplate.name}" template. Feel free to customize any aspect of this strategy.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Strategy Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a compelling title"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Briefly describe your strategy"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="defi">DeFi</SelectItem>
                        <SelectItem value="gaming">Gaming</SelectItem>
                        <SelectItem value="nft">NFT</SelectItem>
                        <SelectItem value="layer1">Layer 1</SelectItem>
                        <SelectItem value="layer2">Layer 2</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="testnet">Testnet</SelectItem>
                        <SelectItem value="mobile">Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Risk Level</Label>
                    <Select value={formData.riskLevel} onValueChange={(value) => setFormData(prev => ({ ...prev, riskLevel: value as any }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="extreme">Extreme</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="time">Estimated Time (minutes)</Label>
                    <Input
                      id="time"
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reward">Potential Reward ($)</Label>
                    <Input
                      id="reward"
                      type="number"
                      value={formData.potentialReward}
                      onChange={(e) => setFormData(prev => ({ ...prev, potentialReward: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">Strategy Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Detailed step-by-step instructions..."
                    rows={8}
                  />
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <Button onClick={addTag} size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeItem('tags', index)}>
                        {tag} <X className="w-3 h-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label>Requirements</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="Add requirement"
                    onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
                  />
                  <Button onClick={addRequirement} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="flex-1">{req}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem('requirements', index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Steps</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    placeholder="Add step"
                    onKeyPress={(e) => e.key === 'Enter' && addStep()}
                  />
                  <Button onClick={addStep} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm bg-gray-50 p-2 rounded">
                      <span className="font-medium text-blue-500">{index + 1}.</span>
                      <span className="flex-1">{step}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem('steps', index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tips</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTip}
                    onChange={(e) => setNewTip(e.target.value)}
                    placeholder="Add tip"
                    onKeyPress={(e) => e.key === 'Enter' && addTip()}
                  />
                  <Button onClick={addTip} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.tips.map((tip, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm bg-yellow-50 p-2 rounded">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      <span className="flex-1">{tip}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeItem('tips', index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreview(!isPreview)}>
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.title || !formData.description}>
              <Save className="w-4 h-4 mr-2" />
              Create Strategy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}