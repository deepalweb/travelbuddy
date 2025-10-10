# Azure PayPal Sandbox Configuration

## 1. Get PayPal Sandbox Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Create sandbox app: "Travel Buddy Azure Test"
3. Copy **Client ID** and **Secret**

## 2. Configure Azure App Service Environment Variables

Go to Azure Portal → Your App Service → Configuration → Application Settings

Add these variables:

```
PAYPAL_CLIENT_ID = YOUR_SANDBOX_CLIENT_ID
PAYPAL_SECRET = YOUR_SANDBOX_SECRET  
PAYPAL_ENVIRONMENT = sandbox
PAYPAL_BASE_URL = https://api.sandbox.paypal.com
PAYPAL_WEBHOOK_SECRET = your-webhook-secret-here
```

## 3. Update Mobile App Environment

```dart
// In travel_buddy_mobile/lib/config/environment.dart
static const String paypalClientId = 'YOUR_SANDBOX_CLIENT_ID';
static const String paypalSecret = 'YOUR_SANDBOX_SECRET';
static const String paypalEnvironment = 'sandbox';
```

## 4. Test with Azure Backend

### Mobile App Testing:
```bash
cd travel_buddy_mobile
flutter pub get
flutter run
```

### Test Flow:
1. App connects to Azure backend: `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net`
2. PayPal payments use sandbox: `https://api.sandbox.paypal.com`
3. Webhooks sent to: `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/webhooks/paypal`

## 5. PayPal Webhook Configuration

In PayPal Developer Dashboard:
1. Go to your sandbox app
2. Add webhook URL: `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/webhooks/paypal/webhook`
3. Select events:
   - Payment capture completed
   - Payment capture denied
   - Billing subscription created
   - Billing subscription cancelled

## 6. Test Payment Process

1. **Mobile App** → Subscription Plans → Select Plan
2. **PayPal API** → Creates payment via Azure backend
3. **Browser** → Opens PayPal sandbox login
4. **Test Account** → Complete payment with sandbox credentials
5. **Webhook** → PayPal notifies Azure backend
6. **Database** → Subscription updated in MongoDB

## 7. Monitoring & Debugging

### Azure Logs:
```bash
# View live logs
az webapp log tail --name travelbuddy-b2c6hgbbgeh4esdh --resource-group your-resource-group
```

### PayPal Sandbox:
- Check Developer Dashboard → Sandbox → Accounts
- View transaction history
- Monitor webhook deliveries

## 8. Production Checklist

When ready for live payments:
1. Create live PayPal app
2. Update Azure environment variables with live credentials
3. Change `PAYPAL_ENVIRONMENT=live`
4. Update webhook URLs to live endpoints
5. Test with small real payments first