# Connectle Analytics Guide

This document provides information on how to use the analytics features in the Connectle application.

## Overview

Connectle uses Vercel Analytics to track user interactions and game events. This helps us understand how users are playing the game and identify areas for improvement.

## Analytics Components

The analytics implementation consists of the following components:

1. **Vercel Analytics**: Core analytics tracking provided by Vercel
2. **Vercel Speed Insights**: Performance monitoring for the application
3. **Custom Analytics Utilities**: Custom tracking for game-specific events
4. **Error Tracking**: Automatic error tracking and reporting

## Environment Configuration

Analytics can be configured using environment variables:

- `NODE_ENV`: Set to 'production' to enable analytics in production environments
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: Set to 'true' to enable analytics in any environment
- `NEXT_PUBLIC_ANALYTICS_DEBUG`: Set to 'true' to enable debug logging of analytics events

## Tracked Events

### Game Events

- `game_started`: When a new game is started
- `game_completed`: When a game is completed
- `word_submitted`: When a word is submitted
- `hint_requested`: When a hint is requested
- `backtrack_used`: When a user backtracks in the word chain
- `game_error`: When an error occurs during gameplay

### UI Events

- `theme_toggled`: When the theme is toggled
- `rules_viewed`: When the rules are viewed
- `game_shared`: When the game is shared

### Page Events

- `page_view`: When a page is viewed

### Error Events

- `error`: When an error occurs
- `error_boundary_caught`: When an error is caught by the ErrorBoundary component

## How to Use Analytics in Components

### Using the Analytics Provider

The application is wrapped with an `AnalyticsProvider` that provides access to analytics functions through the `useAnalyticsContext` hook:

```tsx
import { useAnalyticsContext } from '@/providers/analytics-provider';

function MyComponent() {
  const { trackGame, trackUI } = useAnalyticsContext();
  
  const handleClick = () => {
    // Track a game event
    trackGame.start();
    
    // Track a UI event
    trackUI.viewRules();
  };
  
  return (
    <button onClick={handleClick}>Start Game</button>
  );
}
```

### Direct Usage

You can also use the analytics utilities directly:

```tsx
import { trackGameEvents } from '@/utils/analytics';

function MyComponent() {
  const handleClick = () => {
    // Track a game event
    trackGameEvents.startGame();
  };
  
  return (
    <button onClick={handleClick}>Start Game</button>
  );
}
```

## Viewing Analytics Data

Analytics data can be viewed in the Vercel Analytics dashboard. To access the dashboard:

1. Log in to your Vercel account
2. Navigate to your project
3. Click on the "Analytics" tab

## Adding New Events

To add a new event:

1. Add the event name to the `ANALYTICS_EVENTS` object in `src/config/analytics.ts`
2. Add any new properties to the `ANALYTICS_PROPERTIES` object
3. Create a tracking function in the appropriate tracking object in `src/utils/analytics.ts`
4. Add the function to the appropriate tracking object in `src/hooks/useAnalytics.ts`

## Best Practices

- Use descriptive event names that clearly indicate what action was taken
- Include relevant properties with each event to provide context
- Don't track personally identifiable information (PII)
- Test analytics in development mode with `NEXT_PUBLIC_ANALYTICS_DEBUG=true`
- Group related events together (e.g., all game events under `trackGame`)
