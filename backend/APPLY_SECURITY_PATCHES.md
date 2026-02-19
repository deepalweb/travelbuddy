# 🔒 Apply Security Patches - Quick Guide

## ✅ **What's Been Done**

I've created these security files for you:
1. `config/env-validator.js` - Environment validation
2. `config/cors.js` - Secure CORS configuration  
3. `config/security-patches.js` - Main security orchestrator
4. `middleware/security-enhanced.js` - Input validation & rate limiting
5. `middleware/error-handler-secure.js` - Production-safe error handling
6. `middleware/auth.js` - **UPDATED** (removed bypasses)

## 🚀 **Quick Integration (5 Steps)**

### Step 1: Add Security Patches to server.js

**At the TOP of server.js** (after all imports, before `const app = express()`), add:

```javascript
import { applySecurityPatches } from './config/security-patches.js';
```

**Right AFTER** `const app = express();`, add:

```javascript
// Apply security patches
const { errorHandler, notFoundHandler, corsOptions } = applySecurityPatches(app);
```

**REPLACE the existing CORS setup** (around line 150-200) with:

```javascript
app.use(cors(corsOptions));
```

**At the VERY END of server.js** (before `httpServer.listen`), REPLACE error handlers with:

```javascript
// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);
```

### Step 2: Remove Debug Endpoints

**Search and DELETE** these endpoints from server.js:
- `/api/debug/*` routes
- `/api/test-*` routes  
- `/api/firebase-debug`
- `/api/cors-test`
- `/api/*/test-key` routes

### Step 3: Update Environment Variables

In **Azure App Settings**, add:
```
NODE_ENV=production
ENFORCE_QUOTAS=true
ENFORCE_RATE_LIMIT=true
```

### Step 4: Remove devBypass Usage

Search server.js for `devBypass` and remove any usage (it's already removed from auth.js).

### Step 5: Test & Deploy

```bash
# Test locally
set NODE_ENV=production
npm start

# Deploy
git add .
git commit -m "Apply production security patches"
git push origin master
```

## ✅ **Verification Checklist**

After deployment, test:

- [ ] HTTPS redirect works: `curl -I http://your-domain.com`
- [ ] Auth required: `curl https://your-domain.com/api/users` (should return 401)
- [ ] Rate limiting works: Make 150 requests quickly (should get 429)
- [ ] Debug endpoints disabled: `curl https://your-domain.com/api/debug/test` (should return 404)
- [ ] No stack traces in errors

## 🆘 **If Something Breaks**

1. Check Azure logs for errors
2. Verify all environment variables are set
3. Ensure Firebase Admin credentials are valid JSON
4. Rollback: `git revert HEAD && git push`

## 📞 **Need Help?**

Check `PRODUCTION_SECURITY_CHECKLIST.md` for the complete checklist.
