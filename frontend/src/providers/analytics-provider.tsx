"use client"

import React, { createContext, useContext, ReactNode } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';

// Create a context for analytics
const AnalyticsContext = createContext<ReturnType<typeof useAnalytics> | undefined>(undefined);

// Provider component
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const analytics = useAnalytics();
  
  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Custom hook to use analytics context
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}
