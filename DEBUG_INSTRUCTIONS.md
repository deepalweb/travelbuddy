# Debug Mode Instructions

## Frontend Debug Logging

By default, debug logs are now hidden to reduce console noise.

### Enable Debug Logging
Open browser console and run:
```javascript
localStorage.setItem('debug', 'true')
```
Then refresh the page.

### Disable Debug Logging
```javascript
localStorage.removeItem('debug')
```
Then refresh the page.

## Backend Debug Logging

### Enable Request Logging
Set environment variable:
```bash
DEBUG_REQUESTS=true
```

### What's Still Logged
- **Errors**: Always logged (important for debugging issues)
- **Warnings**: Always logged (important for potential problems)
- **Info logs**: Only when debug mode is enabled

## Quick Debug Commands

### Check if debug is enabled:
```javascript
localStorage.getItem('debug')
```

### Enable all debugging:
```javascript
localStorage.setItem('debug', 'true')
window.location.reload()
```

### Clean console and disable debug:
```javascript
localStorage.removeItem('debug')
console.clear()
window.location.reload()
```