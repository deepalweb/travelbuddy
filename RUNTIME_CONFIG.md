# Runtime Configuration Implementation

This document describes the runtime configuration system implemented for the Travel Buddy application.

## Overview

The application now fetches configuration at runtime from the backend `/api/config` endpoint instead of using build-time environment variables. This allows for dynamic configuration without rebuilding the frontend.

## Implementation Details

### Backend
- **Config Endpoint**: `/api/config` in `backend/routes/config.js`
- Serves configuration from environment variables with fallback defaults
- Includes Firebase, Google Maps, and Unsplash API keys

### Frontend Changes

#### 1. Configuration Service (`src/services/configService.ts`)
- Fetches runtime config from backend
- Implements caching to avoid multiple requests
- Provides fallback to build-time env vars if fetch fails

#### 2. Configuration Context (`src/contexts/ConfigContext.tsx`)
- React context providing config throughout the app
- Handles loading states and error handling
- Used by `useConfig()` hook

#### 3. Firebase Integration (`src/lib/firebase.ts`)
- Updated to use runtime config instead of build-time vars
- Async initialization with `initializeFirebase()` function
- Used via `useFirebase()` hook

#### 4. API Service Updates (`src/lib/api.ts`)
- Modified to fetch base URL from runtime config
- Maintains backward compatibility with env vars

#### 5. Auth Context Updates (`src/contexts/AuthContext.tsx`)
- Uses runtime config for API calls
- Waits for Firebase initialization before setting up auth listeners

#### 6. App Structure (`src/App.tsx`)
- Wrapped with `ConfigProvider`
- Shows loading screen while config loads
- Error handling with retry option

## Usage

### Using Configuration in Components
```typescript
import { useConfig } from '../contexts/ConfigContext'

const MyComponent = () => {
  const { config, loading, error } = useConfig()
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  
  // Use config.apiBaseUrl, config.firebase, etc.
}
```

### Using Firebase
```typescript
import { useFirebase } from '../hooks/useFirebase'

const MyComponent = () => {
  const { firebase, loading, error } = useFirebase()
  
  if (loading) return <div>Loading Firebase...</div>
  if (error) return <div>Firebase Error: {error}</div>
  
  // Use firebase.auth, firebase.app
}
```

### Using Google Maps
```typescript
import { useGoogleMaps } from '../hooks/useGoogleMaps'

const MapComponent = () => {
  const { isLoaded, error, apiKey } = useGoogleMaps()
  
  if (!isLoaded) return <div>Loading Maps...</div>
  if (error) return <div>Maps Error: {error}</div>
  
  // Google Maps is loaded and ready
}
```

## Benefits

1. **Dynamic Configuration**: No need to rebuild frontend for config changes
2. **Environment Flexibility**: Same build works across environments
3. **Fallback Support**: Graceful degradation if runtime config fails
4. **Security**: API keys managed server-side
5. **Deployment Simplicity**: Single build for all environments

## Deployment Notes

- Ensure backend `/api/config` endpoint is accessible
- Set environment variables on the backend server
- Frontend build is environment-agnostic
- Config is fetched on app startup

## Error Handling

- Network failures fall back to build-time env vars
- Loading states prevent premature rendering
- Error boundaries provide user feedback
- Retry mechanisms for failed config loads