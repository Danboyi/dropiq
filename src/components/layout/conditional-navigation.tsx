'use client';

import { usePathname } from 'next/navigation';
import { Navigation } from './navigation';

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Only show navigation on landing page (/)
  // Hide it from dashboard pages that have their own sidebar
  const showNavigation = pathname === '/';
  
  if (!showNavigation) {
    return null;
  }
  
  return <Navigation />;
}