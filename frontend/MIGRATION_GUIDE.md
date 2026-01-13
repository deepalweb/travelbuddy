# Refactoring Migration Guide

## Overview
This guide helps you migrate from the old implementation to the refactored code.

## 1. Authentication Context

### Old Way (AuthContext.tsx)
```typescript
import { useAuth } from './contexts/AuthContext'
```

### New Way (AuthContextRefactored.tsx)
```typescript
// Same import, but internally uses hooks
import { useAuth } from './contexts/AuthContextRefactored'
```

### Migration Steps
1. Replace `AuthContext.tsx` with `AuthContextRefactored.tsx`
2. Update import in `App.tsx`:
   ```typescript
   import { AuthProvider } from './contexts/AuthContextRefactored'
   ```
3. No changes needed in components using `useAuth()`

### Benefits
- Separated concerns (Firebase, user sync, demo auth)
- Easier to test individual pieces
- Cleaner code (~150 lines vs ~400 lines)
- Better error handling

## 2. API Services

### Old Way (api.ts)
```typescript
import { apiService } from './lib/api'

// All methods on one object
apiService.login(email, password)
apiService.getNearbyPlaces(lat, lng)
apiService.getUserTrips()
```

### New Way (apiRefactored.ts + domain services)
```typescript
// Option 1: Use unified service (backward compatible)
import { apiService } from './lib/apiRefactored'
apiService.login(email, password) // Works the same

// Option 2: Use domain-specific services (recommended)
import { authApiService } from './services/authApiService'
import { placesApiService } from './services/placesApiService'
import { tripsApiService } from './services/tripsApiService'

authApiService.login(email, password)
placesApiService.getNearbyPlaces(lat, lng)
tripsApiService.getUserTrips()
```

### Migration Steps
1. **Quick Migration** (no code changes):
   - Replace `./lib/api.ts` with `./lib/apiRefactored.ts`
   - Rename `apiRefactored.ts` to `api.ts`
   - All existing code continues to work

2. **Gradual Migration** (recommended):
   - Keep both files temporarily
   - Update imports file by file:
     ```typescript
     // Before
     import { apiService } from './lib/api'
     
     // After
     import { placesApiService } from './services/placesApiService'
     ```
   - Remove old `api.ts` when done

### Benefits
- Smaller, focused service files
- Better code organization
- Easier to maintain and test
- Clear separation of concerns

## 3. Logging

### Old Way (debug.ts)
```typescript
import { debug } from './utils/debug'
debug.log('message', data)
debug.error('error', error)
```

### New Way (logger.ts)
```typescript
import { logger } from './utils/logger'
logger.info('message', data)
logger.error('error', error)
logger.debug('debug message', data) // Only in dev mode
```

### Migration Steps
1. Find and replace across project:
   - `debug.log` → `logger.info`
   - `debug.error` → `logger.error`
2. Remove `debug.ts` file
3. Update imports

### Benefits
- Standard log levels (info, warn, error, debug)
- Automatic dev/prod filtering
- Timestamps on all logs
- Cleaner API

## 4. Error Boundaries

### New Addition
```typescript
// In App.tsx
import ErrorBoundary from './components/ErrorBoundaryNew'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <ConfigProvider>
        <AuthProvider>
          <Router>
            <RouteErrorBoundary>
              <Routes>
                {/* routes */}
              </Routes>
            </RouteErrorBoundary>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </ErrorBoundary>
  )
}
```

### Benefits
- Catches React errors gracefully
- Prevents white screen of death
- Better user experience
- Helpful error messages in dev mode

## 5. Custom Hooks

### New Hooks Available
```typescript
// Firebase authentication
import { useFirebaseAuth } from './hooks/useFirebaseAuth'

// User synchronization
import { useUserSync } from './hooks/useUserSync'

// Demo authentication
import { useDemoAuth } from './hooks/useDemoAuth'
```

### Usage
These hooks are used internally by `AuthContextRefactored`, but you can use them directly if needed:

```typescript
function MyComponent() {
  const { firebaseUser, loginWithEmail } = useFirebaseAuth()
  const { user, syncUser } = useUserSync()
  
  // Your logic
}
```

## Complete Migration Checklist

- [ ] Replace `AuthContext.tsx` with `AuthContextRefactored.tsx`
- [ ] Update `App.tsx` to use new error boundaries
- [ ] Replace `api.ts` with `apiRefactored.ts` (or migrate gradually)
- [ ] Replace `debug` with `logger` throughout codebase
- [ ] Test authentication flows (email, Google, demo)
- [ ] Test API calls in all features
- [ ] Verify error boundaries catch errors
- [ ] Remove old files:
  - [ ] `contexts/AuthContext.tsx` (old)
  - [ ] `lib/api.ts` (old)
  - [ ] `utils/debug.ts` (old)

## Testing After Migration

1. **Authentication**
   - [ ] Email login works
   - [ ] Email registration works
   - [ ] Google sign-in works
   - [ ] Demo login works
   - [ ] Logout works
   - [ ] Session persistence works

2. **API Calls**
   - [ ] Places search works
   - [ ] Trip creation works
   - [ ] User profile updates work
   - [ ] Favorites work

3. **Error Handling**
   - [ ] Errors show friendly messages
   - [ ] App doesn't crash on errors
   - [ ] Logs appear in console (dev mode)

## Rollback Plan

If issues occur:
1. Revert `App.tsx` changes
2. Restore old `AuthContext.tsx`
3. Restore old `api.ts`
4. Keep new error boundaries (they're safe)
5. Keep new logger (it's backward compatible)

## Support

For issues or questions:
1. Check error logs in browser console
2. Verify all imports are correct
3. Ensure no circular dependencies
4. Check that all environment variables are set
