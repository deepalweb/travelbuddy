# Security Patches Integration Guide

## 🚀 Quick Start

### Step 1: Update server.js

Add this at the TOP of your server.js file (after imports):

```javascript
import { applySecurityPatches } from './config/security-patches.js';

// Apply security patches BEFORE any routes
const { errorHandler, notFoundHandler, corsOptions } = applySecurityPatches(app);

// Replace existing CORS with secure version
app.use(cors(corsOptions));
```

### Step 2: Update Error Handling

At the END of server.js, REPLACE existing error handlers with:

```javascript
// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);
```

### Step 3: Remove Debug Endpoints

Search and REMOVE these endpoints from server.js:
- `/api/debug/*`
- `/api/test-*`
- `/api/firebase-debug`
- `/api/cors-test`
- `/api/*/test-key`

### Step 4: Update Auth Middleware

The auth.js file has been updated. Make sure all routes use:
- `requireAuth` for protected endpoints
- `requireAdmin` for admin endpoints
- Remove any `devBypass` usage

### Step 5: Configure Environment

1. Copy `.env.production.template` to `.env`
2. Fill in ALL required values
3. In Azure App Settings, add all environment variables
4. Set `NODE_ENV=production`

### Step 6: Test Locally

```bash
# Set production mode
export NODE_ENV=production

# Start server
npm start

# Test authentication (should fail without valid token)
curl http://localhost:8080/api/users

# Test rate limiting (should block after 100 requests)
for i in {1..150}; do curl http://localhost:8080/api/health; done
```

### Step 7: Deploy to Azure

```bash
# Commit changes
git add .
git commit -m "Apply production security patches"
git push origin master

# Deployment will trigger automatically via GitHub Actions
```

### Step 8: Verify Production

After deployment, test:

1. **HTTPS Enforcement**
   ```bash
   curl -I http://your-domain.com
   # Should redirect to https://
   ```

2. **Authentication**
   ```bash
   curl https://your-domain.com/api/users
   # Should return 401 Unauthorized
   ```

3. **Rate Limiting**
   ```bash
   # Make 150 requests quickly
   # Should get 429 Too Many Requests
   ```

4. **Debug Endpoints Disabled**
   ```bash
   curl https://your-domain.com/api/debug/test
   # Should return 404
   ```

5. **Error Messages**
   ```bash
   curl https://your-domain.com/api/invalid-endpoint
   # Should NOT show stack traces
   ```

## 🔧 Configuration Options

### Rate Limiting

Adjust in `security-enhanced.js`:
```javascript
windowMs: 15 * 60 * 1000,  // Time window
max: 100,                   // Max requests per window
```

### CORS Origins

Add domains in `cors.js`:
```javascript
const allowedOrigins = [
  'https://your-domain.com',
  'https://www.your-domain.com'
];
```

### Input Validation

Customize in `security-enhanced.js`:
```javascript
obj[key] = obj[key].substring(0, 10000); // Max length
```

## ⚠️ Important Notes

1. **Never commit .env files** - Use Azure App Settings
2. **Test in staging first** - Don't deploy directly to production
3. **Monitor logs** - Check Application Insights after deployment
4. **Have rollback ready** - Keep previous deployment package
5. **Rotate keys regularly** - Change API keys every 90 days

## 🆘 Troubleshooting

### "Authentication service unavailable"
- Check Firebase Admin credentials in Azure App Settings
- Verify FIREBASE_ADMIN_CREDENTIALS_JSON is valid JSON

### "Rate limit exceeded"
- Increase limits in `getRateLimitConfig()`
- Or whitelist specific IPs

### "CORS blocked"
- Add origin to allowedOrigins in `cors.js`
- Check origin is exactly matching (including protocol)

### "Environment variable missing"
- Check all required vars in Azure App Settings
- Restart app after adding variables
