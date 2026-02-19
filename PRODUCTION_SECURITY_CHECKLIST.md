# Production Security Checklist

## ✅ Pre-Deployment

### Environment & Configuration
- [ ] All environment variables set in Azure App Settings (not in code)
- [ ] `NODE_ENV=production` set
- [ ] `ENFORCE_QUOTAS=true` enabled
- [ ] `ENFORCE_RATE_LIMIT=true` enabled
- [ ] Strong `ADMIN_API_KEY` and `ADMIN_SECRET` generated
- [ ] Firebase Admin credentials configured
- [ ] MongoDB connection string uses strong password
- [ ] All API keys are production keys (not test/dev keys)

### Code Security
- [ ] All authentication bypasses removed
- [ ] All debug endpoints disabled
- [ ] Demo tokens removed
- [ ] Development-only routes blocked
- [ ] Error messages don't expose sensitive info
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection protection enabled
- [ ] XSS protection enabled

### API Security
- [ ] Rate limiting enabled on all API routes
- [ ] CORS configured with strict whitelist
- [ ] HTTPS enforcement enabled
- [ ] Security headers configured
- [ ] API keys not exposed to frontend
- [ ] Request size limits configured

### Database Security
- [ ] MongoDB authentication enabled
- [ ] Database connection uses SSL/TLS
- [ ] Database user has minimal required permissions
- [ ] Indexes created for performance
- [ ] Connection pooling configured

### Monitoring & Logging
- [ ] Application Insights configured
- [ ] Error logging enabled
- [ ] Performance monitoring enabled
- [ ] Security alerts configured
- [ ] Health check endpoint working

## ✅ Post-Deployment

### Testing
- [ ] Authentication works correctly
- [ ] Rate limiting is enforced
- [ ] HTTPS redirects working
- [ ] CORS only allows whitelisted origins
- [ ] Error messages are generic (no stack traces)
- [ ] All API endpoints require proper auth
- [ ] Database queries are performant

### Monitoring
- [ ] Check Application Insights for errors
- [ ] Monitor API response times
- [ ] Check rate limit violations
- [ ] Monitor database connection pool
- [ ] Check memory usage
- [ ] Monitor API costs

## 🚨 Emergency Procedures

### If Security Issue Detected
1. Immediately rotate all API keys
2. Check logs for unauthorized access
3. Review recent database changes
4. Notify users if data breach suspected
5. Document incident and response

### Rollback Plan
1. Keep previous deployment package
2. Document rollback procedure
3. Test rollback in staging first
4. Have database backup ready
