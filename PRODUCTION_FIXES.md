# 🚨 URGENT Production Fixes Required

## 1. **Security Issues** (Fix Immediately)

### API Key Exposure
```javascript
// ❌ REMOVE from server.js line ~2847
app.get('/api/config/firebase', (req, res) => {
  const firebaseConfig = {
    apiKey: 'AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw', // EXPOSED!
```

**Fix**: Use environment variables:
```javascript
app.get('/api/config/firebase', (req, res) => {
  res.json({
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID
  });
});
```

## 2. **Cost Protection** (Critical)

### OpenAI Usage Limits
```javascript
// Add before OpenAI calls
const DAILY_AI_LIMIT = process.env.DAILY_AI_LIMIT || 50;
const userCalls = await getDailyCount(userKey, 'openai');
if (userCalls >= DAILY_AI_LIMIT) {
  return res.status(429).json({ error: 'Daily AI limit exceeded' });
}
```

### Google Places Quotas
```javascript
// Monitor Places API costs
const PLACES_DAILY_LIMIT = process.env.PLACES_DAILY_LIMIT || 1000;
```

## 3. **Error Handling** (High Priority)

### Global Error Handler
```javascript
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  // Don't exit in production - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});
```

## 4. **Performance Issues**

### Memory Leaks
```javascript
// Clear caches periodically
setInterval(() => {
  if (placesCache.size > 1000) {
    placesCache.clear();
  }
}, 60 * 60 * 1000); // Every hour
```

### Database Connections
```javascript
// Add connection pooling
mongoose.set('maxPoolSize', 10);
mongoose.set('serverSelectionTimeoutMS', 5000);
```

## 5. **Monitoring & Alerts**

### Health Check Enhancement
```javascript
app.get('/api/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: mongoose.connection.readyState === 1,
      openai: !!process.env.AZURE_OPENAI_API_KEY,
      places: !!process.env.GOOGLE_PLACES_API_KEY,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  const allHealthy = Object.values(health.services).every(s => 
    typeof s === 'boolean' ? s : true
  );
  
  res.status(allHealthy ? 200 : 503).json(health);
});
```

## 6. **Security Headers**

### Add Production Headers
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

## 7. **Rate Limiting**

### Enhanced Rate Limits
```javascript
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);
```

## 8. **Logging**

### Production Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 9. **Environment Validation**

### Startup Checks
```javascript
const requiredEnvVars = [
  'MONGO_URI',
  'GOOGLE_PLACES_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'FIREBASE_ADMIN_CREDENTIALS_JSON'
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});
```

## 10. **Backup Strategy**

### Database Backups
- Enable MongoDB Atlas automated backups
- Set up point-in-time recovery
- Test restore procedures

### Code Deployment
- Use Azure deployment slots
- Implement blue-green deployment
- Set up rollback procedures

---

## ⚡ **Quick Fix Priority**

1. **IMMEDIATE**: Remove hardcoded Firebase config
2. **TODAY**: Add OpenAI cost limits
3. **THIS WEEK**: Implement proper logging
4. **THIS MONTH**: Set up monitoring alerts

## 📊 **Monitoring Setup**

### Azure Application Insights
```javascript
const appInsights = require('applicationinsights');
appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING);
appInsights.start();
```

### Custom Metrics
```javascript
// Track business metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Log to Application Insights
    appInsights.defaultClient.trackRequest({
      name: `${req.method} ${req.path}`,
      url: req.url,
      duration,
      resultCode: res.statusCode,
      success: res.statusCode < 400
    });
  });
  next();
});
```