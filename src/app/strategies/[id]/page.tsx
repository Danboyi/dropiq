'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { StrategyDetailView } from '@/components/strategies/StrategyDetailView';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type { Strategy } from '@/types/user-profile';

export default function StrategyDetailPage() {
  const params = useParams();
  const [strategy, setStrategy] = useState<Strategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        const response = await fetch(`/api/strategies/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setStrategy(data.strategy);
        } else {
          setError('Strategy not found');
        }
      } catch (error) {
        setError('Failed to load strategy');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchStrategy();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-32" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !strategy) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Strategy not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <StrategyDetailView strategy={strategy} />;
}