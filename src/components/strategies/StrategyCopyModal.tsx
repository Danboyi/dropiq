'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Copy, 
  Settings, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  Target, 
  Zap, 
  Shield,
  TrendingUp,
  Calendar,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';
import type { Strategy, StrategyDifficulty, StrategyRiskLevel } from '@/types/user-profile';

interface StrategyCopyModalProps {
  strategy: Strategy | null;
  isOpen: boolean;
  onClose: () => void;
  onCopyComplete: (copiedStrategy: Strategy) => void;
}

interface CopySettings {
  title: string;
  description: string;
  riskAdjustment: 'conservative' | 'moderate' | 'aggressive';
  timelineMultiplier: number;
  budgetMultiplier: number;
  includeTips: boolean;
  includeRequirements: boolean;
  adaptToUser: boolean;
  customNotes: string;
}

export function StrategyCopyModal({ 
  strategy, 
  isOpen, 
  onClose, 
  onCopyComplete 
}: StrategyCopyModalProps) {
  const [isCopying, setIsCopying] = useState(false);
  const [copySettings, setCopySettings] = useState<CopySettings>({
    title: strategy ? `${strategy.title} (Personalized)` : '',
    description: strategy ? `Personalized version of ${strategy.title}` : '',
    riskAdjustment: 'moderate',
    timelineMultiplier: 1,
    budgetMultiplier: 1,
    includeTips: true,
    includeRequirements: true,
    adaptToUser: true,
    customNotes: ''
  });

  const resetSettings = () => {
    setCopySettings({
      title: strategy ? `${strategy.title} (Personalized)` : '',
      description: strategy ? `Personalized version of ${strategy.title}` : '',
      riskAdjustment: 'moderate',
      timelineMultiplier: 1,
      budgetMultiplier: 1,
      includeTips: true,
      includeRequirements: true,
      adaptToUser: true,
      customNotes: ''
    });
  };

  const handleCopy = async () => {
    if (!strategy) return;

    setIsCopying(true);
    try {
      const response = await fetch('/api/strategies/copy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalStrategyId: strategy.id,
          settings: copySettings
        }),
      });

      if (response.ok) {
        const copiedStrategy = await response.json();
        onCopyComplete(copiedStrategy);
        onClose();
        resetSettings();
      } else {
        throw new Error('Failed to copy strategy');
      }
    } catch (error) {
      console.error('Error copying strategy:', error);
    } finally {
      setIsCopying(false);
    }
  };

  const getRiskAdjustmentColor = (adjustment: string) => {
    switch (adjustment) {
      case 'conservative':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'aggressive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateNewRiskLevel = (originalRisk: StrategyRiskLevel, adjustment: string): StrategyRiskLevel => {
    const riskLevels: StrategyRiskLevel[] = ['low', 'medium', 'high', 'extreme'];
    const currentIndex = riskLevels.indexOf(originalRisk);
    
    switch (adjustment) {
      case 'conservative':
        return riskLevels[Math.max(0, currentIndex - 1)];
      case 'aggressive':
        return riskLevels[Math.min(riskLevels.length - 1, currentIndex + 1)];
      default:
        return originalRisk;
    }
  };

  const calculateNewTime = (originalTime: number, multiplier: number) => {
    return Math.round(originalTime * multiplier);
  };

  const calculateNewReward = (originalReward: number | undefined, multiplier: number) => {
    return originalReward ? Math.round(originalReward * multiplier) : undefined;
  };

  if (!strategy) return null;

  const newRiskLevel = calculateNewRiskLevel(strategy.riskLevel, copySettings.riskAdjustment);
  const newTime = calculateNewTime(strategy.estimatedTime, copySettings.timelineMultiplier);
  const newReward = calculateNewReward(strategy.potentialReward, copySettings.budgetMultiplier);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copy & Personalize Strategy
          </DialogTitle>
          <DialogDescription>
            Create a personalized version of this strategy tailored to your preferences
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original Strategy Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Original Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm">{strategy.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{strategy.description}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{strategy.category}</Badge>
                  <Badge className={getRiskAdjustmentColor(strategy.riskLevel)}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {strategy.riskLevel}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {newTime} min
                  </Badge>
                </div>

                {strategy.potentialReward && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">
                      ${strategy.potentialReward.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span>{strategy.metrics.successRate}% success rate</span>
                </div>
              </CardContent>
            </Card>

            {/* Personalization Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Your Personalized Version
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm">{copySettings.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{copySettings.description}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{strategy.category}</Badge>
                  <Badge className={getRiskAdjustmentColor(newRiskLevel)}>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {newRiskLevel}
                  </Badge>
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {newTime} min
                  </Badge>
                </div>

                {newReward && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-green-600">
                      ${newReward.toLocaleString()}
                    </span>
                    {copySettings.budgetMultiplier !== 1 && (
                      <span className="text-xs text-muted-foreground">
                        ({copySettings.budgetMultiplier > 1 ? '+' : ''}{Math.round((copySettings.budgetMultiplier - 1) * 100)}%)
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Risk adjusted to {copySettings.riskAdjustment}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span>Timeline {copySettings.timelineMultiplier > 1 ? 'extended' : copySettings.timelineMultiplier < 1 ? 'compressed' : 'maintained'}</span>
                  </div>
                  {copySettings.adaptToUser && (
                    <div className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      <span>Adapted to your profile</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personalization Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Personalization Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="title">Strategy Title</Label>
                  <Input
                    id="title"
                    value={copySettings.title}
                    onChange={(e) => setCopySettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter a title for your copy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={copySettings.description}
                    onChange={(e) => setCopySettings(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your personalized approach"
                    rows={2}
                  />
                </div>

                {/* Risk Adjustment */}
                <div className="space-y-2">
                  <Label>Risk Adjustment</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['conservative', 'moderate', 'aggressive'] as const).map((option) => (
                      <Button
                        key={option}
                        variant={copySettings.riskAdjustment === option ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCopySettings(prev => ({ ...prev, riskAdjustment: option }))}
                        className="capitalize"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {copySettings.riskAdjustment === 'conservative' && 'Lower risk, more conservative approach'}
                    {copySettings.riskAdjustment === 'moderate' && 'Balanced risk approach'}
                    {copySettings.riskAdjustment === 'aggressive' && 'Higher risk, potentially higher rewards'}
                  </p>
                </div>

                {/* Timeline Multiplier */}
                <div className="space-y-2">
                  <Label>Timeline Adjustment</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[copySettings.timelineMultiplier]}
                      onValueChange={([value]) => setCopySettings(prev => ({ ...prev, timelineMultiplier: value }))}
                      min={0.5}
                      max={2}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50% faster</span>
                      <span>{Math.round(copySettings.timelineMultiplier * 100)}% of original</span>
                      <span>2x longer</span>
                    </div>
                  </div>
                </div>

                {/* Budget Multiplier */}
                <div className="space-y-2">
                  <Label>Budget Adjustment</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[copySettings.budgetMultiplier]}
                      onValueChange={([value]) => setCopySettings(prev => ({ ...prev, budgetMultiplier: value }))}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>50% budget</span>
                      <span>{Math.round(copySettings.budgetMultiplier * 100)}% of original</span>
                      <span>3x budget</span>
                    </div>
                  </div>
                </div>

                {/* Include Options */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="include-tips" className="text-sm">Include Tips & Tricks</Label>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <Switch
                      id="include-tips"
                      checked={copySettings.includeTips}
                      onCheckedChange={(checked) => setCopySettings(prev => ({ ...prev, includeTips: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="include-requirements" className="text-sm">Include Requirements</Label>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <Switch
                      id="include-requirements"
                      checked={copySettings.includeRequirements}
                      onCheckedChange={(checked) => setCopySettings(prev => ({ ...prev, includeRequirements: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="adapt-to-user" className="text-sm">Adapt to My Profile</Label>
                      <Sparkles className="w-3 h-3 text-blue-500" />
                    </div>
                    <Switch
                      id="adapt-to-user"
                      checked={copySettings.adaptToUser}
                      onCheckedChange={(checked) => setCopySettings(prev => ({ ...prev, adaptToUser: checked }))}
                    />
                  </div>
                </div>

                {/* Custom Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Custom Notes</Label>
                  <Textarea
                    id="notes"
                    value={copySettings.customNotes}
                    onChange={(e) => setCopySettings(prev => ({ ...prev, customNotes: e.target.value }))}
                    placeholder="Add your personal notes and modifications..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={isCopying || !copySettings.title.trim()}
            className="flex items-center gap-2"
          >
            {isCopying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Copying...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Create Personalized Copy
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}