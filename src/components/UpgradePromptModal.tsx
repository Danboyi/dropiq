'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, Check, ArrowRight } from 'lucide-react';

interface UpgradePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function UpgradePromptModal({ isOpen, onClose, featureName }: UpgradePromptModalProps) {
  const handleViewPricing = () => {
    onClose();
    window.location.href = '/pricing';
  };

  const premiumFeatures = [
    'Multiple wallet tracking',
    'Advanced portfolio analytics',
    'Priority security alerts',
    'Ad-free experience',
    'Priority support',
    'Early access to new features'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            <DialogTitle>Premium Feature</DialogTitle>
          </div>
          <DialogDescription>
            {featureName ? `${featureName} is available for Premium members only.` : 'This feature is available for Premium members only.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to unlock advanced features and take your airdrop hunting to the next level.
            </p>
            
            <div className="inline-flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              $15/month
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">What you'll get:</h4>
            <div className="grid grid-cols-1 gap-2">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleViewPricing}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              View Pricing
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}