'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  Rocket, 
  Shield, 
  Star, 
  CheckCircle, 
  Loader2,
  Gift,
  BarChart3,
  Bell,
  Users
} from 'lucide-react';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradePrompt({ isOpen, onClose }: UpgradePromptProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { upgradeGuest, user } = useAuthStore();

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgrading(true);
    setError(null);

    try {
      await upgradeGuest({
        email,
        password,
        username: username || undefined,
        displayName: displayName || undefined,
      });

      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upgrade failed');
    } finally {
      setIsUpgrading(false);
    }
  };

  const features = [
    {
      icon: <Gift className="h-5 w-5" />,
      title: 'Save Airdrop Progress',
      description: 'Track your participation history and never miss a reward',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Advanced Analytics',
      description: 'Detailed insights into your airdrop performance and earnings',
    },
    {
      icon: <Bell className="h-5 w-5" />,
      title: 'Custom Alerts',
      description: 'Get notified about new airdrops matching your profile',
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Community Features',
      description: 'Join discussions and share strategies with other hunters',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Upgrade Your Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">You're in Guest Mode</p>
                  <p className="text-sm text-yellow-600">
                    Connected: {user?.wallets?.[0]?.slice(0, 6)}...{user?.wallets?.[0]?.slice(-4)}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  Limited Access
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-green-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="text-green-600 mt-0.5">
                      {feature.icon}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Upgrade Form */}
          <form onSubmit={handleUpgrade} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="@username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <Button
                type="submit"
                disabled={isUpgrading || !email || !password}
                className="flex-1"
              >
                {isUpgrading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade to Full Account
                  </>
                )}
              </Button>

              <Button type="button" variant="outline" onClick={onClose}>
                Maybe Later
              </Button>
            </div>
          </form>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>• By upgrading, you'll unlock all features and can save your progress</p>
            <p>• Your wallet connection will be linked to your new account</p>
            <p>• No credit card required - basic features are always free</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}