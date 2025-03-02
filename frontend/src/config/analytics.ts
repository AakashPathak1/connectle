/**
 * Analytics configuration
 * 
 * This file contains configuration for analytics tracking.
 * It allows for enabling/disabling analytics based on environment.
 */

// Whether analytics is enabled
export const ANALYTICS_ENABLED = process.env.NODE_ENV === 'production' || 
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true';

// Debug mode for analytics (logs events to console)
export const ANALYTICS_DEBUG = process.env.NODE_ENV === 'development' || 
  process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true';

// Analytics events
export const ANALYTICS_EVENTS = {
  // Game events
  GAME_STARTED: 'game_started',
  GAME_COMPLETED: 'game_completed',
  WORD_SUBMITTED: 'word_submitted',
  HINT_REQUESTED: 'hint_requested',
  BACKTRACK_USED: 'backtrack_used',
  GAME_ERROR: 'game_error',
  
  // UI events
  THEME_TOGGLED: 'theme_toggled',
  RULES_VIEWED: 'rules_viewed',
  GAME_SHARED: 'game_shared',
  
  // Page events
  PAGE_VIEW: 'page_view',
  
  // Error events
  ERROR: 'error',
};

// Analytics properties
export const ANALYTICS_PROPERTIES = {
  // Game properties
  CHAIN_LENGTH: 'chain_length',
  TIME_SPENT: 'time_spent',
  WORD: 'word',
  IS_VALID: 'is_valid',
  SIMILARITY: 'similarity',
  ERROR_TYPE: 'error_type',
  MESSAGE: 'message',
  
  // UI properties
  THEME: 'theme',
  PLATFORM: 'platform',
  
  // Page properties
  PATH: 'path',
  REFERRER: 'referrer',
  SEARCH: 'search',
  TITLE: 'title',
};
