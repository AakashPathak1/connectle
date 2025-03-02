import { track } from '@vercel/analytics';
import { 
  ANALYTICS_ENABLED, 
  ANALYTICS_DEBUG, 
  ANALYTICS_EVENTS,
  ANALYTICS_PROPERTIES 
} from '@/config/analytics';

/**
 * Custom analytics tracking for Connectle
 */
// Define a type that matches what Vercel Analytics accepts
export type AnalyticsValue = string | number | boolean | null;

// Helper function to ensure all values are of type AnalyticsValue
const sanitizeProperties = (props: Record<string, unknown>): Record<string, AnalyticsValue> => {
  const sanitized: Record<string, AnalyticsValue> = {};
  
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) {
      sanitized[key] = null;
    } else {
      sanitized[key] = value as AnalyticsValue;
    }
  });
  
  return sanitized;
};

export const trackEvent = (eventName: string, properties?: Record<string, unknown>) => {
  // Skip tracking if analytics is disabled
  if (!ANALYTICS_ENABLED) return;
  
  try {
    // Log to console in debug mode
    if (ANALYTICS_DEBUG) {
      console.log(`📊 Analytics Event: ${eventName}`, properties);
    }
    
    // Track the event with sanitized properties
    const sanitizedProps = properties ? sanitizeProperties(properties) : undefined;
    track(eventName, sanitizedProps);
  } catch (error) {
    // Silently fail in development or if tracking fails
    if (ANALYTICS_DEBUG) {
      console.error('Analytics error:', error);
    }
  }
};

// Game-specific events
export const trackGameEvents = {
  startGame: () => 
    trackEvent(ANALYTICS_EVENTS.GAME_STARTED),
    
  completeGame: (chainLength: number, timeSpent: number) => 
    trackEvent(ANALYTICS_EVENTS.GAME_COMPLETED, { 
      [ANALYTICS_PROPERTIES.CHAIN_LENGTH]: chainLength, 
      [ANALYTICS_PROPERTIES.TIME_SPENT]: timeSpent 
    }),
    
  wordSubmitted: (word: string, isValid: boolean, similarity?: number) => 
    trackEvent(ANALYTICS_EVENTS.WORD_SUBMITTED, { 
      [ANALYTICS_PROPERTIES.WORD]: word, 
      [ANALYTICS_PROPERTIES.IS_VALID]: isValid, 
      [ANALYTICS_PROPERTIES.SIMILARITY]: similarity || null 
    }),
    
  requestHint: () => 
    trackEvent(ANALYTICS_EVENTS.HINT_REQUESTED),
    
  backtrack: (chainLength: number) => 
    trackEvent(ANALYTICS_EVENTS.BACKTRACK_USED, { 
      [ANALYTICS_PROPERTIES.CHAIN_LENGTH]: chainLength 
    }),
    
  error: (errorType: string, message: string) => 
    trackEvent(ANALYTICS_EVENTS.GAME_ERROR, { 
      [ANALYTICS_PROPERTIES.ERROR_TYPE]: errorType, 
      [ANALYTICS_PROPERTIES.MESSAGE]: message 
    }),
};

// User interaction events
export const trackUIEvents = {
  toggleTheme: (theme: 'light' | 'dark') => 
    trackEvent(ANALYTICS_EVENTS.THEME_TOGGLED, { 
      [ANALYTICS_PROPERTIES.THEME]: theme 
    }),
    
  viewRules: () => 
    trackEvent(ANALYTICS_EVENTS.RULES_VIEWED),
    
  shareGame: (platform?: string, additionalProps?: Record<string, unknown>) => 
    trackEvent(ANALYTICS_EVENTS.GAME_SHARED, { 
      [ANALYTICS_PROPERTIES.PLATFORM]: platform || null,
      ...additionalProps
    }),
};
