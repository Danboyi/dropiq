'use client';

import { AuthForms } from '@/components/forms/auth-forms';
import { ProtectedRoute } from '@/components/protected-route';
import { useAppStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthPage() {
  const { isAuthenticated } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <ProtectedRoute requireAuth={false}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="w-full max-w-md">
          <AuthForms />
        </div>
      </div>
    </ProtectedRoute>
  );
}