'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { useProfile } from '@/hooks/use-api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, isAuthenticated } = useAppStore();
  const { data: profileData, isLoading } = useProfile();

  useEffect(() => {
    if (profileData?.user) {
      setUser(profileData.user);
    }
  }, [profileData, setUser]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && !isAuthenticated) {
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}