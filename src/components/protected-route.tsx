'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { UpgradePrompt } from '@/components/auth/upgrade-prompt';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Lock, 
  Crown, 
  Rocket, 
  AlertTriangle,
  Gift,
  BarChart3,
  Shield
} from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireFullAccount?: boolean;
  requirePremium?: boolean;
  redirectTo?: string;
  showUpgradePrompt?: boolean;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  requireFullAccount = false,
  requirePremium = false,
  redirectTo = '/auth',
  showUpgradePrompt = true
}: ProtectedRouteProps) {
  const router = useRouter();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { isAuthenticated, user, isLoading, isGuest } = useAuthStore();

  useEffect(() => {
    if (requireAuth && !isAuthenticated && !isLoading) {
      router.push(redirectTo);
      return;
    }
  }, [isAuthenticated, isLoading, requireAuth, redirectTo, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!requireAuth) {
    return <>{children}</>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  // Check premium requirements
  if (requirePremium && user?.role !== 'premium') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Crown className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
            <CardTitle>Premium Feature</CardTitle>
            <CardDescription>
              This feature requires a premium subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Upgrade to premium to unlock advanced features, analytics, and priority support.
              </AlertDescription>
            </Alert>
            <Button className="w-full">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check full account requirements
  if (requireFullAccount && isGuest) {
    if (showUpgradePrompt) {
      return (
        <>
          <div className="min-h-screen flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 mx-auto text-blue-500 mb-2" />
                <CardTitle>Full Account Required</CardTitle>
                <CardDescription>
                  Create a free account to access this feature
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Gift className="h-4 w-4 text-green-500" />
                    <span>Save your airdrop progress</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <BarChart3 className="h-4 w-4 text-blue-500" />
                    <span>Access detailed analytics</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-purple-500" />
                    <span>Join the community</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Create Free Account
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.back()}
                  >
                    Go Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <UpgradePrompt 
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
          />
        </>
      );
    } else {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <CardTitle>Account Required</CardTitle>
              <CardDescription>
                Please create a full account to access this feature
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full"
                onClick={() => router.push('/auth')}
              >
                Sign Up / Login
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  // Show guest banner if user is in guest mode
  if (isGuest && showUpgradePrompt) {
    return (
      <>
        <div className="min-h-screen">
          {/* Guest Banner */}
          <Alert className="m-4 border-yellow-200 bg-yellow-50">
            <Shield className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                You're in guest mode with limited access. 
                {user?.wallets?.[0] && ` Connected: ${user.wallets[0].slice(0, 6)}...${user.wallets[0].slice(-4)}`}
              </span>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowUpgradeModal(true)}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Upgrade
              </Button>
            </AlertDescription>
          </Alert>

          {/* Page Content */}
          <div className="relative">
            {children}
          </div>
        </div>

        <UpgradePrompt 
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  return <>{children}</>;
}