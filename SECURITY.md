# Security Configuration Guide

## 🔒 Environment Variables Setup

### 1. Backend Configuration
Copy `backend/.env.template` to `backend/.env` and fill in your actual values:

```bash
cp backend/.env.template backend/.env
```

### 2. Required API Keys & Credentials

#### Google APIs
- **Google Places API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/)
- **Google Maps API Key**: Same as Places API or separate key
- Enable APIs: Places API, Maps JavaScript API, Geocoding API

#### Firebase
- **Project Configuration**: Get from Firebase Console > Project Settings
- **Service Account**: Download JSON from Firebase Console > Service Accounts
- **Mobile App**: Use `google-services.json.template` for Android

#### Azure OpenAI
- **Endpoint**: Your Azure OpenAI resource endpoint
- **API Key**: From Azure Portal > Your OpenAI Resource > Keys
- **Deployment**: Your GPT model deployment name

#### Database
- **MongoDB**: Connection string from MongoDB Atlas or your MongoDB instance

#### Third-party Services
- **Unsplash**: For image services (optional)
- **PayPal**: For payment processing (optional)

### 3. Security Best Practices

#### Environment Files
- ✅ Never commit `.env` files to version control
- ✅ Use `.env.template` for documentation
- ✅ Rotate API keys regularly
- ✅ Use different keys for development/production

#### API Key Security
- ✅ Restrict API keys by domain/IP in provider consoles
- ✅ Enable only required APIs/services
- ✅ Monitor API usage for anomalies
- ✅ Use environment-specific keys

#### Firebase Security
- ✅ Configure Firebase Security Rules
- ✅ Use service account for backend
- ✅ Restrict client SDK permissions
- ✅ Enable App Check for production

### 4. Production Deployment

#### Azure App Service
Set environment variables in Azure Portal:
1. Go to Configuration > Application Settings
2. Add each environment variable
3. Restart the app service

#### Environment Variables Checklist
- [ ] GOOGLE_PLACES_API_KEY
- [ ] MONGO_URI
- [ ] AZURE_OPENAI_API_KEY
- [ ] AZURE_OPENAI_ENDPOINT
- [ ] FIREBASE_ADMIN_CREDENTIALS_JSON
- [ ] JWT_SECRET
- [ ] ADMIN_API_KEY

### 5. Mobile App Security

#### Android
- Use `google-services.json.template`
- Configure Firebase App Check
- Enable ProGuard for release builds
- Use certificate pinning for API calls

#### iOS
- Use `GoogleService-Info.plist.template`
- Configure App Transport Security
- Enable code obfuscation
- Implement jailbreak detection

## 🚨 Security Issues Found

The following security vulnerabilities were identified and need immediate attention:

### Critical Issues
1. **Hardcoded Credentials**: API keys exposed in source code
2. **Missing Authentication**: API endpoints without proper auth
3. **CSRF Vulnerabilities**: Missing CSRF protection
4. **XSS Vulnerabilities**: Unescaped user input
5. **Path Traversal**: Unsafe file operations

### Immediate Actions Required
1. Move all credentials to environment variables
2. Implement proper authentication middleware
3. Add CSRF tokens to forms
4. Sanitize all user inputs
5. Validate file paths and operations

## 📞 Security Contact

For security issues, please contact:
- Email: security@travelbuddy.com
- Create private GitHub issue
- Follow responsible disclosure practices