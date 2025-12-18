# Security Checklist for TravelBuddy

## ✅ Already Secure
- [x] Environment files (.env) not committed to GitHub
- [x] Secrets stored in GitHub Secrets
- [x] Build process uses secrets without exposing them in repo

## ⚠️ Firebase Security (CRITICAL - DO THIS NOW)

### 1. Firebase Security Rules
Firebase API keys are public by design. Security comes from rules:

**Firestore Rules** (Firebase Console → Firestore → Rules):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read, authenticated write
    match /trips/{tripId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

**Authentication Rules** (Firebase Console → Authentication → Settings):
- Enable Email Enumeration Protection
- Set password policy (min 8 chars)
- Enable email verification requirement

### 2. Firebase App Check (Recommended)
Prevents unauthorized apps from accessing your Firebase:
- Firebase Console → App Check
- Register your domain
- Blocks requests from unauthorized domains

### 3. API Key Restrictions (Google Cloud Console)
- Go to: https://console.cloud.google.com/apis/credentials
- Find your Firebase API key
- Add restrictions:
  - HTTP referrers: `https://yourdomain.com/*`, `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/*`
  - APIs: Only enable Firebase Auth, Firestore

### 4. Backend API Security
- [x] JWT token validation
- [ ] Rate limiting (add express-rate-limit)
- [ ] CORS whitelist (only your domain)
- [ ] Input validation on all endpoints

## 🔒 Additional Recommendations

### Rate Limiting
Add to backend:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

### CORS Whitelist
```javascript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
```

### Environment Variables to Keep Secret
- ✅ Backend MongoDB connection string
- ✅ Backend JWT secret
- ✅ Payment gateway keys (Stripe, PayPal)
- ✅ Email service credentials (SendGrid, etc.)
- ⚠️ Firebase keys (public, but restrict with rules)

## Summary
**Firebase keys in frontend = NORMAL**
**Real security = Firebase Rules + App Check + API restrictions**
