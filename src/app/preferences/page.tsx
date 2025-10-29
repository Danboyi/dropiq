'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Settings,
  Activity,
  Link2,
  BarChart3,
  ArrowLeft,
  User
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import UserPreferenceDashboard from '@/components/dashboard/user-preference-dashboard';

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (status === 'loading' || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-surface">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="space-y-4">
              <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Authentication Required</h1>
              <p className="text-muted-foreground">
                Please sign in to access your preference profile and personalized insights.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                  <TrendingUp className="size-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold text-primary">DROPIQ</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Preferences</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <UserPreferenceDashboard />
      </div>
    </div>
  );
}