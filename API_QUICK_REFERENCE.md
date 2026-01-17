# TravelBuddy Backend API - Quick Reference

## 📊 All APIs at a Glance

### 🔴 CRITICAL (Required for core functionality)

| API | Purpose | Cost | Status | Fallback |
|-----|---------|------|--------|----------|
| **Azure OpenAI** | AI trip generation, embeddings | $0.002/call | ✅ Active | Google Places |
| **Google Places** | Real-time place search, photos | $0.002-$0.032/call | ✅ Active | Cached results |

### 🟡 IMPORTANT (Enhanced features)

| API | Purpose | Cost | Status | Fallback |
|-----|---------|------|--------|----------|
| **Google Weather** | Weather forecasts | Included in Places | ✅ Active | Mock data |
| **Google Geocoding** | Address ↔ Coordinates | $0.005/call | ✅ Active | Nominatim |
| **NewsAPI** | Travel news articles | Free (+ $99/mo premium) | ✅ Active | Cached news |
| **Stripe** | Subscription billing | 2.9% + $0.30 | ✅ Active | PayPal |
| **PayPal** | Alternative payments | 2.2% + $0.30 | ✅ Active | Stripe |

### 🟢 SUPPORTING (Infrastructure)

| API | Purpose | Cost | Status |
|-----|---------|------|--------|
| **Azure Blob Storage** | Image storage | Pay-as-you-go | ✅ Active |
| **Nominatim** | Free geocoding | Free | ✅ Fallback |
| **Firebase Admin** | Authentication | Free tier | ✅ Optional |

---

## 💰 Monthly Cost Summary

```
Total Budget:     ~$200-430/month
Primary Driver:   Google Places API (~$150-250)
Secondary:        Azure OpenAI + Storage + Payment fees
Optimization:     In-memory caching saves ~30-50% of Places API calls
```

---

## 🔑 Environment Variables (Production)

**MUST HAVE:**
```
AZURE_OPENAI_API_KEY
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_DEPLOYMENT_NAME
GOOGLE_PLACES_API_KEY
STRIPE_SECRET
STRIPE_WEBHOOK_SECRET
MONGO_URI
AZURE_STORAGE_CONNECTION_STRING
```

**SHOULD HAVE:**
```
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
NEWS_API_KEY
FIREBASE_ADMIN_CREDENTIALS_JSON
```

**OPTIONAL:**
```
BACKEND_PLACES_CACHE_TTL=3600000
DEFAULT_PLACES_RADIUS_M=20000
COST_RATE_OPENAI_PER_CALL_USD=0.002
COST_INCLUDE_ERRORS=false
```

---

## 📍 API Endpoints Map

### Places & Location
- `GET /api/places/search` - Search places by query
- `GET /api/places/nearby` - Find places near coordinates
- `GET /api/places/details` - Get detailed place info
- `GET /api/geocoding/geocode` - Address to coordinates
- `GET /api/places/cache-stats` - Cache performance metrics

### AI Features
- `POST /api/ai-trip-generator/generate` - Generate AI itinerary
- `GET /api/ai-places` - AI-generated places list
- `POST /api/ai-places/generate-places` - Generate specific places

### Weather & News
- `GET /api/weather/current` - Current weather
- `GET /api/weather/forecast` - Weather forecast
- `GET /api/travel-news/latest` - Latest travel news

### Payments & Subscriptions
- `POST /api/stripe/create-checkout-session` - Start payment
- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/payments/verify` - Verify payment
- `GET /api/subscriptions/status` - Check subscription
- `GET /api/subscriptions/tiers` - Available plans

### Admin & Monitoring
- `GET /api/admin/costs` - Daily cost tracking
- `GET /api/admin/stats` - API statistics

---

## ⚙️ Configuration Files

| File | Purpose |
|------|---------|
| `backend/config/firebase.js` | Firebase Admin SDK init |
| `backend/config/subscriptionPlans.js` | Subscription tier definitions |
| `backend/config/security.js` | Security & feature flags |
| `backend/services/costTracker.js` | Cost monitoring |
| `backend/services/azureStorage.js` | Image upload to Azure |
| `backend/services/embeddingService.js` | Vector embeddings |
| `backend/services/ai-places-generator.js` | AI place generation |
| `backend/middleware/subscriptionCheck.js` | Quota enforcement |

---

## 🔄 Request/Response Flow Examples

### Trip Generation Flow
```
Client
  ↓
POST /api/ai-trip-generator/generate
  {destination, duration, budget, interests}
  ↓
Backend checks: Azure OpenAI status
  ↓
Azure OpenAI generates itinerary (with prompts for REAL places)
  ↓
Calls Google Places API to verify/enhance place data
  ↓
Returns structured itinerary with:
  - Daily plans with activities
  - Real place names & addresses
  - Estimated costs & duration
  - Weather forecast
```

### Place Search Flow
```
Client
  ↓
GET /api/places/search?q=restaurants&lat=X&lng=Y
  ↓
Backend checks in-memory cache (TTL: 60 min)
  ↓
Cache HIT → Return cached results ✅
Cache MISS → Call Google Places API + cache results
  ↓
Cost tracker logs: $0.032 cost + daily budget check
  ↓
Return top 10 results with:
  - Name, address, rating
  - Photos (if available)
  - Distance from center
  - Business hours
```

### Payment Flow
```
Client clicks "Upgrade"
  ↓
POST /api/stripe/create-checkout-session
  ↓
Stripe creates session with:
  - Price ID (selected plan)
  - Success URL
  - Cancel URL
  ↓
Client redirected to Stripe Checkout
  ↓
User completes payment
  ↓
Stripe webhook → /stripe/webhook
  ↓
Backend updates subscription status in database
  ↓
User can access premium features
```

---

## 🚨 Common Issues & Solutions

### "Google Places API not configured"
- ✅ **Fix**: Add `GOOGLE_PLACES_API_KEY` to environment
- Check: `console.log` shows "🗝️ Google API: not configured"

### "Azure OpenAI not configured"
- ✅ **Fix**: Add Azure credentials, system falls back to Google Places
- Check: `console.log` shows "🤖 OpenAI: not configured"

### "Daily cost exceeded $6.50 budget"
- ⚠️ **Alert**: Daily spending tracking active
- Check: `costTracker.getStats()` for breakdown
- Action: Review cache hit rate, consider cache TTL increase

### "Payment verification failed"
- ✅ **Fix**: Verify `STRIPE_SECRET` and `STRIPE_WEBHOOK_SECRET`
- Check: PayPal credentials for fallback

### "Azure Blob Storage not configured"
- ✅ **Fix**: Add `AZURE_STORAGE_CONNECTION_STRING`
- Fallback: Images not stored in cloud (local only)

---

## 📈 Performance Benchmarks

| Metric | Current | Target |
|--------|---------|--------|
| Places API Cache Hit Rate | 30-50% | >60% |
| Avg Response Time (cached) | <100ms | <50ms |
| Avg Response Time (API call) | 200-500ms | <300ms |
| Daily API Calls | ~150-200 | <150 |
| Monthly Cost | $200-430 | <$300 |

---

## 🔐 Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] API keys rotated quarterly
- [ ] Payment webhooks verified with signatures
- [ ] Rate limiting implemented per user
- [ ] Cost limits enforced (daily + monthly)
- [ ] Audit logs for API usage
- [ ] Error messages don't expose API details
- [ ] Firebase credentials optional for dev mode
- [ ] CORS properly configured
- [ ] HTTPS required in production

---

## 📚 Resources & Documentation

### Official API Docs
- [Google Places API](https://developers.google.com/maps/documentation/places)
- [Azure OpenAI](https://learn.microsoft.com/en-us/azure/cognitive-services/openai/)
- [Stripe API](https://stripe.com/docs/api)
- [PayPal API](https://developer.paypal.com/api/rest/)
- [NewsAPI](https://newsapi.org/docs)

### Monitoring & Tracking
- Google Cloud Console: Cost tracking
- Azure Portal: API usage metrics
- Stripe Dashboard: Payment analytics
- Local console: Cost tracker logs

---

## 🎯 Cost Optimization Checklist

- ✅ In-memory caching (60-min TTL)
- ✅ Daily cost alerts
- ⚠️ Could increase cache TTL to 120 min (save ~10%)
- ⚠️ Could implement database caching for popular places (save ~20%)
- ⚠️ Could use Nominatim more for free geocoding (save ~5%)
- ⚠️ Could batch Google Places API calls (save ~10%)

**Estimated Additional Savings: 30-45%** (to ~$120-250/month)

---

## 🚀 Quick Start for New Developers

1. Copy `.env.example` to `.env.local`
2. Add all CRITICAL environment variables
3. Optional: Add IMPORTANT variables for full features
4. Start server: `npm start`
5. Check console for API status:
   ```
   🌍 Environment: development
   🔗 MongoDB: configured
   🗝️ Google API: configured
   🤖 OpenAI: configured
   ```

---

**Last Updated:** 2024
**Version:** 1.0
**Maintainer:** Backend Team
