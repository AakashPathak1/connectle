"use client"

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { track } from '@vercel/analytics';

/**
 * Inner component that uses searchParams
 */
function PageViewTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Only track if the path has changed
    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    if (currentPath !== previousPathRef.current) {
      // Track page view
      track('page_view', {
        path: pathname || '',
        referrer: document.referrer || '',
        search: searchParams?.toString() || '',
        title: document.title || '',
      });
      
      // Update the previous path
      previousPathRef.current = currentPath;
    }
  }, [pathname, searchParams]);

  // This component doesn't render anything
  return null;
}

/**
 * Component that automatically tracks page views
 * This should be included in the layout or on pages where you want to track views
 */
export default function PageViewTracker() {
  return (
    <Suspense fallback={null}>
      <PageViewTrackerInner />
    </Suspense>
  );
}
