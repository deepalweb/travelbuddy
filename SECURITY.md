# Security Configuration Guide

## Environment Variables Setup

### 1. Copy Environment Template
```bash
cp backend/.env.example backend/.env
```

### 2. Replace Placeholder Values
Edit `backend/.env` and replace all placeholder values with your actual credentials:

#### Required API Keys:
- **Google Places API**: Get from [Google Cloud Console](https://console.cloud.google.com/)
- **Firebase Configuration**: Get from [Firebase Console](https://console.firebase.google.com/)
- **Azure OpenAI**: Get from [Azure Portal](https://portal.azure.com/)
- **Unsplash API**: Get from [Unsplash Developers](https://unsplash.com/developers)

#### Security Keys (Generate Random):
```bash
# Generate JWT Secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)

# Generate Session Secret (32+ characters)  
SESSION_SECRET=$(openssl rand -base64 32)

# Generate Admin API Key (32+ characters)
ADMIN_API_KEY=$(openssl rand -base64 32)
```

### 3. Database Connection
Replace `MONGO_URI` with your MongoDB connection string:
```
mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

## Security Best Practices

### ✅ DO:
- Use strong, unique passwords for all services
- Enable 2FA on all cloud accounts
- Regularly rotate API keys
- Use environment variables for all secrets
- Keep `.env` files out of version control
- Use HTTPS in production
- Validate all user inputs
- Implement proper authentication

### ❌ DON'T:
- Commit `.env` files to git
- Share API keys in code or messages
- Use default/weak passwords
- Expose admin endpoints publicly
- Log sensitive information
- Use HTTP in production

## Environment Security Checklist

- [ ] All placeholder values replaced with real credentials
- [ ] `.env` file added to `.gitignore`
- [ ] Strong passwords used for all services
- [ ] 2FA enabled on cloud accounts
- [ ] API keys have proper restrictions/scopes
- [ ] Database has authentication enabled
- [ ] SSL certificates configured for production
- [ ] Admin API key is strong and secure

## Production Deployment

### Environment Variables
Set these in your production environment (Azure, AWS, etc.):
- Never use `.env` files in production
- Use platform-specific secret management
- Enable encryption at rest
- Use managed databases with authentication
- Configure proper CORS settings
- Enable rate limiting
- Set up monitoring and alerts

### Security Headers
Ensure these headers are set:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000
Content-Security-Policy: default-src 'self'
```

## Incident Response

If credentials are compromised:
1. Immediately rotate all affected API keys
2. Change database passwords
3. Review access logs
4. Update all deployed applications
5. Monitor for suspicious activity