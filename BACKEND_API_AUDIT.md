# TravelBuddy Backend API Audit Report

**Report Generated:** 2024
**Scope:** Complete backend API integrations analysis
**Status:** Comprehensive inventory of all external services

---

## 📊 Executive Summary

The TravelBuddy backend integrates **8 major external APIs** across 5 service categories:
- **2 AI/ML Services** (Azure OpenAI)
- **3 Location Services** (Google Places, Nominatim, Google Geocoding)
- **2 Weather Services** (Google Weather API)
- **1 News Service** (NewsAPI)
- **2 Payment Services** (Stripe, PayPal)
- **1 Cloud Storage** (Azure Blob Storage)
- **1 Authentication** (Firebase Admin SDK)

**Total Monthly API Costs (Estimated):** $200-500
**Primary Cost Driver:** Google Places API (~$6.50/day budget mentioned)

---

## 🔌 External API Integrations

### 1. **Azure OpenAI** (AI/ML) ⭐ CRITICAL
**Purpose:** AI-powered trip generation, place description generation, embeddings
**Status:** PRIMARY AI ENGINE
**Configuration:**
```
AZURE_OPENAI_API_KEY: [Secret key for authentication]
AZURE_OPENAI_ENDPOINT: [Azure endpoint URL]
AZURE_OPENAI_DEPLOYMENT_NAME: [Model deployment name]
API_VERSION: 2024-02-15-preview
```

**Endpoints Used:**
- Chat Completions (Trip generation, place descriptions)
- Embeddings (Vector representations for similarity search)

**Usage Locations:**
- `backend/services/ai-places-generator.js` - AIPlacesGenerator class
- `backend/services/embeddingService.js` - Embedding generation
- `backend/routes/ai-trip-generator.js` - Trip planning endpoint
- `backend/server.js` - Main server integration

**Rate Limits & Costs:**
- Pay-per-use model (typically $0.002 per call)
- Cost rate configurable via `COST_RATE_OPENAI_PER_CALL_USD` env var

**Implementation Details:**
```javascript
// Initialization pattern
const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': AZURE_OPENAI_API_KEY }
});
```

**Fallback Behavior:** If Azure OpenAI unavailable, system falls back to Google Places API

---

### 2. **Google Places API** (Location Data) ⭐ CRITICAL
**Purpose:** Real-time place searches, geocoding, place details, photos
**Status:** PRIMARY LOCATION DATABASE
**Configuration:**
```
GOOGLE_PLACES_API_KEY: [API key for Places API]
```

**Endpoints Used:**
1. **Text Search** - `/maps/api/place/textsearch/json`
   - Purpose: Search places by query/category
   - Cost: $0.032 per call
   
2. **Nearby Search** - `/maps/api/place/nearbysearch/json`
   - Purpose: Find places near coordinates
   - Cost: $0.032 per call
   - Radius: Default 20km, configurable via `DEFAULT_PLACES_RADIUS_M`
   
3. **Place Details** - `/maps/api/place/details/json`
   - Purpose: Get detailed information about a place
   - Cost: $0.017 per call
   
4. **Place Photos** - `/maps/api/place/photo`
   - Purpose: Retrieve place photos
   - Cost: $0.007 per call
   
5. **Geocoding API** - `/maps/api/geocode/json`
   - Purpose: Convert addresses to coordinates and vice versa
   - Cost: Part of Places tier

**Usage Locations:**
- `backend/server.js` - Places caching & API integration
- `backend/routes/ai-trip-generator.js` - Trip generation with real places
- `backend/routes/places.js` - Main places search endpoint
- `backend/routes/enhanced-places.js` - Enhanced search functionality
- `backend/routes/geocoding.js` - Geocoding endpoint
- `backend/routes/weather.js` - Weather data retrieval

**Cost Management:**
```javascript
// CostTracker in backend/server.js
costs = {
  nearby: 0.032,      // Nearby Search
  textsearch: 0.032,  // Text Search
  details: 0.017,     // Place Details
  photos: 0.007       // Place Photos
};
budgetAlert: Daily cost > $6.50 triggers warning
```

**Caching Strategy:**
- In-memory cache with TTL (Time-To-Live)
- Default TTL: 60 minutes (configurable via `BACKEND_PLACES_CACHE_TTL`)
- Max cache entries: 500 results
- LRU eviction policy
- Cache key: `{lat}|{lng}|{query}|{radius}`

**Daily Budget Alert:**
- ⚠️ Budget: ~$6.50/day (approx $200/month)
- Daily monitoring and alerting in place
- Cost tracking logs generated daily

---

### 3. **Google Geocoding API** (Address-to-Coordinates)
**Purpose:** Convert addresses to lat/lng and reverse geocoding
**Status:** INTEGRATED
**Configuration:**
```
GOOGLE_PLACES_API_KEY: [Shared key with Places API]
```

**Endpoints:**
- Forward Geocoding: `address → lat/lng`
- Reverse Geocoding: `lat/lng → address`

**Usage Locations:**
- `backend/routes/geocoding.js` - Main geocoding endpoint
- `backend/routes/ai-trip-generator.js` - Destination coordinate lookup

---

### 4. **Google Weather API** (Weather Data)
**Purpose:** Current weather and forecasts for destinations
**Status:** IMPLEMENTED
**Configuration:**
```
GOOGLE_PLACES_API_KEY: [Shared key with Places API]
```

**Endpoints:**
1. **Current Conditions**: `weather.googleapis.com/v1/currentConditions:lookup`
   - Returns: temperature, condition, humidity, wind speed, UV index
   
2. **Forecast**: `weather.googleapis.com/v1/forecast:lookup`
   - Returns: Hourly forecasts (up to 8 hours)

**Usage Locations:**
- `backend/routes/weather.js` - Main weather endpoints

**Response Format:**
```javascript
{
  temperature: number,
  condition: string,
  humidity: number,
  windSpeed: number,
  uvIndex: number,
  feelsLike: number
}
```

---

### 5. **OpenStreetMap Nominatim API** (Free Geocoding)
**Purpose:** Free geocoding alternative to Google (used for fallback)
**Status:** IMPLEMENTED AS FALLBACK
**Configuration:**
```
NO API KEY REQUIRED (Public API)
Rate Limit: 1 request per second recommended
```

**Endpoint:** `https://nominatim.openstreetmap.org/search`
**Purpose:** Activity geocoding in trip generation
**Usage Locations:**
- `backend/routes/ai-trip-generator.js` - Activity location lookup

**Rate Limiting:**
- Implements 1-second delay between requests
- User-Agent: 'TravelBuddy'

---

### 6. **NewsAPI** (Travel News & Articles)
**Purpose:** Fetch latest travel news articles
**Status:** IMPLEMENTED
**Configuration:**
```
NEWS_API_KEY: [API key from newsapi.org]
NEWS_API_URL: 'https://newsapi.org/v2/everything'
```

**Endpoint Used:**
- `/v2/everything` - Search articles by keywords

**Query Parameters:**
```
q: Travel-related keywords (travel, tourism, vacation, hotel, flight, etc.)
sortBy: publishedAt
language: en
pageSize: configurable (default 20)
page: pagination
```

**Features:**
- Category-based news filtering
- Country-specific news (optional)
- Caching: 1-hour TTL
- Pagination support

**Usage Locations:**
- `backend/routes/travel-news.js` - News retrieval endpoints

**Cache Strategy:**
```javascript
newsCache = new Map()
CACHE_TTL = 3600000 (1 hour)
Cache key: `news_${category}_${country}_${page}`
```

---

### 7. **Stripe Payment Processing**
**Purpose:** Subscription billing and payment processing
**Status:** IMPLEMENTED
**Configuration:**
```
STRIPE_SECRET: [Secret API key for backend]
STRIPE_PUBLISHABLE_KEY: [Public key for frontend]
STRIPE_WEBHOOK_SECRET: [Webhook signature verification]
API_VERSION: 2022-11-15
```

**Endpoints:**
1. **Create Checkout Session**: `POST /stripe/create-checkout-session`
   - Purpose: Initialize subscription purchase
   - Response: Session ID and URL for redirect
   
2. **Webhook Handler**: `POST /stripe/webhook`
   - Events handled:
     - `checkout.session.completed` - Payment succeeded
     - `invoice.payment_succeeded` - Invoice paid
     - `customer.subscription.deleted` - Subscription cancelled

**Subscription Tiers:**
```
Free (Explorer): $0/month
  - 2 AI generations/month, 50 searches/day

Basic (Wanderer): $9.99/month
  - 10 AI generations/month, 200 searches/day

Premium (Adventurer): $19.99/month
  - 50 AI generations/month, 1000 searches/day

Pro (Explorer Pro): $39.99/month
  - Unlimited AI generations, unlimited searches
```

**Payment Flow:**
1. Client calls `/stripe/create-checkout-session`
2. User redirected to Stripe Checkout
3. Webhook updates subscription status on completion
4. `success_url` and `cancel_url` configurable

**Usage Locations:**
- `backend/routes/stripe.js` - Stripe integration
- `backend/routes/subscriptions.js` - Subscription tier information

---

### 8. **PayPal Payment Processing**
**Purpose:** Alternative payment method to Stripe
**Status:** IMPLEMENTED
**Configuration:**
```
PAYPAL_CLIENT_ID: [Application Client ID]
PAYPAL_CLIENT_SECRET: [Application Secret]
NODE_ENV: 'production' or 'development' (determines sandbox vs production)
```

**API Base URLs:**
- Production: `https://api.paypal.com`
- Sandbox: `https://api.sandbox.paypal.com`

**OAuth Flow:**
1. Get access token: `POST /v1/oauth2/token`
2. Verify payment: `GET /v2/checkout/orders/{paymentId}`
3. Check payment amount and status

**Integration Points:**
- `backend/routes/payments.js` - Payment verification
- Dual-provider support (Stripe + PayPal)

**Error Handling:**
- Fallback to Stripe if PayPal unavailable
- Payment verification with amount validation

---

### 9. **Azure Blob Storage** (File Storage & Images)
**Purpose:** Cloud storage for uploaded images and files
**Status:** IMPLEMENTED
**Configuration:**
```
AZURE_STORAGE_CONNECTION_STRING: [Connection string with credentials]
AZURE_STORAGE_CONTAINER_NAME: 'travelbuddy-images' (default)
```

**Features:**
- Image upload with size limits (10MB max)
- MIME type validation (images only)
- SAS (Shared Access Signature) token generation
- Private access by default
- 10-year SAS token validity

**Upload Process:**
1. File received via multipart/form-data
2. Validation: MIME type check
3. Upload to Azure Blob: `${containerClient}/blob`
4. Generate SAS URL with read-only permissions
5. Return SAS URL for image access

**File Handling:**
```javascript
blobName: `${UUID}-${originalname}`
Access: Private (requires SAS token)
TTL: 10 years
Permissions: Read-only
```

**Usage Locations:**
- `backend/services/azureStorage.js` - Upload/delete operations
- Image routes for post, trip, profile uploads

---

### 10. **Firebase Admin SDK** (Authentication & Database)
**Purpose:** User authentication and real-time database
**Status:** IMPLEMENTED (Optional fallback auth)
**Configuration:**
```
FIREBASE_ADMIN_CREDENTIALS_JSON: [Service account JSON]
VITE_FIREBASE_PROJECT_ID: [Firebase project ID]
```

**Services Used:**
1. **Authentication**
   - Token verification
   - User ID extraction from JWT
   - Development mode bypass option
   
2. **Real-time Database**
   - Optional integration for notifications/messages

**Fallback Behavior:**
- If Firebase disabled: Uses development mode with limited auth
- Allows JWT decoding without verification in dev

**Usage Locations:**
- `backend/middleware/auth.js` - Token verification
- `backend/config/firebase.js` - SDK initialization

---

## 📈 Cost Breakdown & Analysis

### Monthly Cost Estimates (USD)

| Service | Rate | Est. Monthly Cost | Notes |
|---------|------|------------------|-------|
| **Google Places API** | $0.002-0.032/call | $150-250 | Highest cost driver |
| **Azure OpenAI** | $0.002/call | $20-50 | Depends on usage |
| **Google Weather API** | Included in Places | Included | Free with Places quota |
| **Azure Blob Storage** | Pay-as-you-go | $5-20 | Storage + bandwidth |
| **Stripe** | 2.9% + $0.30/transaction | $10-50 | Transaction fee only |
| **PayPal** | 2.2% + $0.30/transaction | $5-20 | Transaction fee only |
| **NewsAPI** | Free tier available | $0-15 | Optional premium |
| **Nominatim** | Free | $0 | No cost, rate limited |
| **Firebase** | Free tier (+ pay-as-go) | $0-25 | Free tier includes quota |
| **TOTAL** | | **$190-430** | Variable based on usage |

### Cost Optimization Opportunities

1. **Google Places API** - Highest cost component
   - ✅ Already implements in-memory caching (saves ~30-50% of calls)
   - ✅ Cost tracking with daily budget alerts
   - Suggestion: Increase cache TTL from 60min to 120min
   - Suggestion: Implement predictive caching for popular destinations
   
2. **Nominatim (Free Geocoding)**
   - ✅ Already used as fallback
   - Low priority: Already optimized

3. **News API**
   - ✅ 1-hour cache implemented
   - Optional: Consider free tier (limited articles)

4. **Azure OpenAI**
   - ✅ Used selectively for complex tasks
   - Suggestion: Cache AI-generated trips for common routes

---

## 🔐 Security Considerations

### API Key Management
- ⚠️ **Critical**: All API keys stored in environment variables
- ✅ Firebase credentials optional (allows local development)
- ✅ PayPal/Stripe use OAuth with secret keys (never exposed)

### Best Practices Implemented
✅ API rate limiting configured
✅ Caching prevents unnecessary API calls
✅ Cost tracking prevents runaway charges
✅ Development mode fallbacks for offline testing
✅ Payment provider webhook signature verification

### Security Recommendations
1. **Secrets Management**: Migrate from `.env` to Azure Key Vault
2. **API Key Rotation**: Implement quarterly rotation policy
3. **Rate Limiting**: Add per-user rate limits
4. **Audit Logging**: Log all API usage to database
5. **Budget Alerts**: Implement email alerts when approaching limits

---

## 📋 Environment Variables Required

### Critical (Required for Production)
```
# Azure OpenAI
AZURE_OPENAI_API_KEY=<key>
AZURE_OPENAI_ENDPOINT=<endpoint>
AZURE_OPENAI_DEPLOYMENT_NAME=<model>

# Google APIs
GOOGLE_PLACES_API_KEY=<key>

# Stripe
STRIPE_SECRET=<key>
STRIPE_WEBHOOK_SECRET=<key>

# Database
MONGO_URI=<connection_string>

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=<connection_string>
AZURE_STORAGE_CONTAINER_NAME=travelbuddy-images
```

### Optional (Nice-to-Have)
```
# PayPal
PAYPAL_CLIENT_ID=<id>
PAYPAL_CLIENT_SECRET=<secret>

# News
NEWS_API_KEY=<key>

# Firebase (optional for auth)
FIREBASE_ADMIN_CREDENTIALS_JSON=<json>

# Configuration
BACKEND_PLACES_CACHE_TTL=3600000      # 1 hour default
DEFAULT_PLACES_RADIUS_M=20000         # 20km default
COST_RATE_OPENAI_PER_CALL_USD=0.002
COST_RATE_MAPS_PER_CALL_USD=0.005
COST_RATE_PLACES_PER_CALL_USD=0.002
```

---

## 📊 API Usage Statistics & Monitoring

### Metrics Tracked
1. **Daily API Call Counts** - Per service
2. **Daily Costs** - Real-time tracking
3. **Cache Hit Rate** - Caching effectiveness
4. **Error Rates** - Failed API calls
5. **Response Times** - Performance monitoring

### Cost Tracking Implementation
```javascript
class CostTracker {
  dailyCalls: number
  dailyCost: number
  cacheHits: number
  cacheMisses: number
  
  metrics: {
    monthlyCostProjection: dailyCost * 30
    cacheHitRate: (hits / total) * 100
    budgetAlert: dailyCost > 6.50
  }
}
```

### Monitoring Endpoints
- `/api/admin/costs` - Get current day's cost
- `/api/admin/stats` - API statistics dashboard
- Console logs: Daily summaries printed to stdout

---

## 🚀 API Performance Optimization

### Current Optimizations
✅ **In-Memory Caching**: Places results cached for 60 minutes
✅ **Request Batching**: Multiple places fetched in single call
✅ **Cost Tracking**: Real-time monitoring prevents budget overrun
✅ **Fallback Chain**: Multiple geocoding options (Google → Nominatim)
✅ **Lazy Loading**: Stripe loaded only when needed

### Recommended Enhancements
1. **Database Caching**: Cache popular places in MongoDB
2. **CDN for Images**: Use CDN for Unsplash image URLs
3. **Batch Operations**: Combine multiple Google Places calls
4. **Predictive Caching**: Pre-cache frequent destination queries
5. **Response Compression**: gzip compression for API responses

---

## 🔄 API Integration Architecture

```
Frontend (React)
    ↓
Express Backend (Node.js)
    ├→ Azure OpenAI (AI generation)
    ├→ Google Places (Location data)
    ├→ Google Weather (Weather data)
    ├→ Google Geocoding (Coordinates)
    ├→ Nominatim (Free geocoding fallback)
    ├→ NewsAPI (Travel news)
    ├→ Stripe (Payment processing)
    ├→ PayPal (Alternative payments)
    ├→ Azure Blob Storage (Image storage)
    ├→ Firebase (Optional auth)
    └→ MongoDB (Local data storage)
```

---

## 📅 Maintenance & Updates

### Regular Tasks
- **Weekly**: Monitor cost trends
- **Monthly**: Review API usage patterns
- **Quarterly**: Update API versions and SDKs
- **Annually**: Audit API integrations and alternatives

### Known Issues & Workarounds
1. **Azure OpenAI Fallback**: System gracefully falls back to Google Places if unavailable
2. **Nominatim Rate Limits**: 1-second delay enforced between requests
3. **News API Caching**: 1-hour cache prevents duplicate requests
4. **Payment Webhooks**: Minimal event handling (TODO: full implementation)

---

## 🎯 Next Steps & Recommendations

### High Priority
1. Implement comprehensive API error handling
2. Add database caching for places data
3. Set up automated cost alerts via email/SMS
4. Implement API usage dashboard

### Medium Priority
1. Evaluate alternative geocoding services
2. Optimize image storage strategy
3. Implement GraphQL for batched requests
4. Add rate limiting per user/IP

### Low Priority
1. Migrate to newer Weather API
2. Evaluate AI alternatives to Azure OpenAI
3. Consider webhook retry mechanisms
4. Implement API versioning strategy

---

## 📞 Support & Contacts

### API Provider Support
- **Google Cloud**: [console.cloud.google.com](https://console.cloud.google.com)
- **Azure**: [portal.azure.com](https://portal.azure.com)
- **Stripe**: [stripe.com/support](https://stripe.com/support)
- **PayPal**: [developer.paypal.com](https://developer.paypal.com)
- **Firebase**: [console.firebase.google.com](https://console.firebase.google.com)
- **NewsAPI**: [newsapi.org](https://newsapi.org)

---

**Document Version:** 1.0
**Last Updated:** 2024
**Author:** Backend API Audit Report
**Confidentiality:** Internal Use Only
