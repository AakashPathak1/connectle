import { useCallback } from 'react';
import { trackEvent, trackGameEvents, trackUIEvents, type AnalyticsValue } from '../utils/analytics';
import { ANALYTICS_EVENTS, ANALYTICS_PROPERTIES } from '@/config/analytics';

/**
 * Custom hook for tracking analytics events
 * 
 * This hook provides a convenient way to track analytics events
 * throughout the application.
 */
export function useAnalytics() {
  // Generic event tracking
  const track = useCallback((eventName: string, properties?: Record<string, AnalyticsValue>) => {
    trackEvent(eventName, properties);
  }, []);

  // Game-specific event tracking
  const trackGame = {
    start: useCallback(() => {
      trackGameEvents.startGame();
    }, []),
    
    complete: useCallback((chainLength: number, timeSpent: number) => {
      trackGameEvents.completeGame(chainLength, timeSpent);
    }, []),
    
    wordSubmitted: useCallback((word: string, isValid: boolean, similarity?: number) => {
      trackGameEvents.wordSubmitted(word, isValid, similarity);
    }, []),
    
    requestHint: useCallback(() => {
      trackGameEvents.requestHint();
    }, []),
    
    backtrack: useCallback((chainLength: number) => {
      trackGameEvents.backtrack(chainLength);
    }, []),
    
    error: useCallback((errorType: string, message: string) => {
      trackGameEvents.error(errorType, message);
    }, []),
  };

  // UI event tracking
  const trackUI = {
    toggleTheme: useCallback((theme: 'light' | 'dark') => {
      trackUIEvents.toggleTheme(theme);
    }, []),
    
    viewRules: useCallback(() => {
      trackUIEvents.viewRules();
    }, []),
    
    shareGame: useCallback((platform?: string, additionalProps?: Record<string, unknown>) => {
      trackUIEvents.shareGame(platform, additionalProps);
    }, []),
  };

  // Page tracking
  const trackPage = useCallback((path: string, referrer?: string, title?: string) => {
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, {
      [ANALYTICS_PROPERTIES.PATH]: path,
      [ANALYTICS_PROPERTIES.REFERRER]: referrer || document.referrer || '',
      [ANALYTICS_PROPERTIES.TITLE]: title || document.title || '',
    });
  }, []);

  // Error tracking
  const trackError = useCallback((error: Error, info?: unknown) => {
    trackEvent(ANALYTICS_EVENTS.ERROR, {
      [ANALYTICS_PROPERTIES.ERROR_TYPE]: error.name || '',
      [ANALYTICS_PROPERTIES.MESSAGE]: error.message || '',
      stack: error.stack || '',
      info: info ? JSON.stringify(info) : '',
    });
  }, []);

  return {
    track,
    trackGame,
    trackUI,
    trackPage,
    trackError,
  };
}
