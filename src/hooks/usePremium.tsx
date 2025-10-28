'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/stores/authStore';
import { useRouter } from 'next/navigation';

interface UsePremiumReturn {
  isPremium: boolean;
  isNotPremium: boolean;
  isLoading: boolean;
  showUpgradePrompt: (featureName?: string) => void;
  UpgradePromptModal: () => JSX.Element;
}

export function usePremium(): UsePremiumReturn {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [featureName, setFeatureName] = useState<string>('');

  const isPremium = user?.role === 'premium';
  const isNotPremium = !isPremium && !authLoading;
  const isLoading = authLoading;

  const showUpgradePrompt = useCallback((feature?: string) => {
    setFeatureName(feature || 'this premium feature');
    setShowModal(true);
  }, []);

  const handleViewPricing = useCallback(() => {
    setShowModal(false);
    router.push('/pricing');
  }, [router]);

  const handleGoBack = useCallback(() => {
    setShowModal(false);
  }, []);

  const UpgradePromptModal = useCallback(() => {
    if (!showModal) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-background border rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-6">
              {featureName} is available for Premium members only. Upgrade to unlock advanced features and take your airdrop hunting to the next level.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Multiple wallet tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Advanced portfolio analytics</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Priority security alerts</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 rounded bg-green-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span>Ad-free experience</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleViewPricing}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                View Pricing
              </button>
              <button
                onClick={handleGoBack}
                className="flex-1 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }, [showModal, featureName, handleViewPricing, handleGoBack]);

  return {
    isPremium,
    isNotPremium,
    isLoading,
    showUpgradePrompt,
    UpgradePromptModal,
  };
}