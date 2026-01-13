# Quick Reference - Refactored Code

## 🔐 Authentication

```typescript
// Use auth context (same as before)
import { useAuth } from './contexts/AuthContextRefactored'

function MyComponent() {
  const { user, login, logout, isLoading } = useAuth()
  
  // Login with email
  await login('email@example.com', 'password')
  
  // Login with Google
  await loginWithGoogle()
  
  // Demo login
  await loginDemo()
  
  // Logout
  await logout()
}
```

## 🌐 API Calls

### Option 1: Unified Service (Backward Compatible)
```typescript
import { apiService } from './lib/apiRefactored'

// Works exactly like before
const places = await apiService.getNearbyPlaces(lat, lng)
const trips = await apiService.getUserTrips()
```

### Option 2: Domain Services (Recommended)
```typescript
import { placesApiService } from './services/placesApiService'
import { tripsApiService } from './services/tripsApiService'
import { userApiService } from './services/userApiService'

// Places
const places = await placesApiService.getNearbyPlaces(lat, lng)
const details = await placesApiService.getPlaceDetails(placeId)
const weather = await placesApiService.getWeather(lat, lng)

// Trips
const trips = await tripsApiService.getUserTrips()
const trip = await tripsApiService.createTrip(tripData)
await tripsApiService.updateTrip(tripId, updates)

// User
const favorites = await userApiService.getUserFavoriteIds()
await userApiService.togglePlaceFavorite(placeId)
const prefs = await userApiService.getPreferences()
```

## 📝 Logging

```typescript
import { logger } from './utils/logger'

// Info (always shown)
logger.info('User logged in', { userId: user.id })

// Warning (always shown)
logger.warn('API rate limit approaching', { remaining: 10 })

// Error (always shown)
logger.error('Failed to load data', error)

// Debug (dev only)
logger.debug('Component rendered', { props })
```

## 🛡️ Error Boundaries

### App Level
```typescript
// In App.tsx
import ErrorBoundary from './components/ErrorBoundaryNew'

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  )
}
```

### Route Level
```typescript
import { RouteErrorBoundary } from './components/RouteErrorBoundary'

<Router>
  <RouteErrorBoundary>
    <Routes>
      {/* Your routes */}
    </Routes>
  </RouteErrorBoundary>
</Router>
```

### Custom Fallback
```typescript
<ErrorBoundary 
  fallback={<CustomErrorUI />}
  onError={(error, info) => {
    // Custom error handling
  }}
>
  <YourComponent />
</ErrorBoundary>
```

## 🎣 Custom Hooks

### Firebase Auth (if needed directly)
```typescript
import { useFirebaseAuth } from './hooks/useFirebaseAuth'

const { firebaseUser, loading, loginWithEmail } = useFirebaseAuth()
```

### User Sync (if needed directly)
```typescript
import { useUserSync } from './hooks/useUserSync'

const { user, syncUser, clearUser } = useUserSync(apiBaseUrl)
```

### Demo Auth (if needed directly)
```typescript
import { useDemoAuth } from './hooks/useDemoAuth'

const { demoUser, loginDemo, logoutDemo } = useDemoAuth(apiBaseUrl)
```

## 🔄 Common Patterns

### Protected Component
```typescript
function ProtectedComponent() {
  const { user, isLoading } = useAuth()
  
  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" />
  
  return <YourContent />
}
```

### API Call with Error Handling
```typescript
import { placesApiService } from './services/placesApiService'
import { logger } from './utils/logger'

async function loadPlaces() {
  try {
    const places = await placesApiService.getNearbyPlaces(lat, lng)
    setPlaces(places)
  } catch (error) {
    logger.error('Failed to load places', error)
    setError('Could not load places. Please try again.')
  }
}
```

### Authenticated API Call
```typescript
import { tripsApiService } from './services/tripsApiService'

// Token is automatically added from localStorage
const trips = await tripsApiService.getUserTrips()
```

## 📦 Available Services

| Service | Import | Purpose |
|---------|--------|---------|
| Auth | `authApiService` | Login, register, profile |
| Places | `placesApiService` | Search, details, weather |
| Trips | `tripsApiService` | Trip CRUD, AI generation |
| User | `userApiService` | Favorites, preferences |
| Community | `communityApiService` | Posts, deals |
| Subscription | `subscriptionService` | Subscription management |

## 🚨 Error Handling Best Practices

```typescript
// ✅ Good
try {
  const data = await apiService.getData()
  setData(data)
} catch (error) {
  logger.error('Failed to load data', error)
  setError('Something went wrong')
}

// ❌ Bad
const data = await apiService.getData() // No error handling
setData(data)
```

## 🔍 Debugging

```typescript
// Development only logs
logger.debug('Component state', { state })

// Check if in dev mode
if (import.meta.env.DEV) {
  console.log('Dev only message')
}
```

## 📱 Environment Variables

```typescript
// API base URL
const apiUrl = import.meta.env.VITE_API_BASE_URL

// Check environment
const isDev = import.meta.env.DEV
const isProd = import.meta.env.PROD
```

## 🎯 Quick Tips

1. **Always use logger instead of console.log**
2. **Wrap routes in RouteErrorBoundary**
3. **Use domain services for new code**
4. **Handle errors in async functions**
5. **Check isLoading before rendering**
6. **Use TypeScript types for API responses**

## 🆘 Troubleshooting

### Auth not working?
- Check if Firebase is initialized
- Verify token in localStorage
- Check logger output for errors

### API calls failing?
- Check network tab in DevTools
- Verify API base URL in config
- Check if token is being sent

### Errors not caught?
- Ensure ErrorBoundary wraps component
- Check if error is thrown in render
- Verify error boundary is mounted

---

**Need Help?** Check `MIGRATION_GUIDE.md` for detailed migration steps.
