# PayPal Sandbox Testing Setup

## 1. Get Your Sandbox Credentials

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Navigate to "My Apps & Credentials"
4. Under "Sandbox", click "Create App"
5. Fill in:
   - App Name: "Travel Buddy Test"
   - Merchant: Select your sandbox business account
   - Features: Check "Accept Payments"
6. Copy your **Client ID** and **Secret**

## 2. Update Configuration Files

### Mobile App (`travel_buddy_mobile/lib/config/environment.dart`):
```dart
static const String paypalClientId = 'YOUR_SANDBOX_CLIENT_ID_HERE';
static const String paypalSecret = 'YOUR_SANDBOX_SECRET_HERE';
```

### Azure App Service (Environment Variables):
```
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID_HERE
PAYPAL_SECRET=YOUR_SANDBOX_SECRET_HERE
PAYPAL_ENVIRONMENT=sandbox
PAYPAL_BASE_URL=https://api.sandbox.paypal.com
```

## 3. Create Test PayPal Accounts

1. In PayPal Developer Dashboard, go to "Sandbox" > "Accounts"
2. You'll see default test accounts:
   - **Personal Account** (buyer): Use this to make test payments
   - **Business Account** (seller): This receives the payments

### Default Test Credentials:
- **Buyer Email**: `sb-xxxxx@personal.example.com`
- **Seller Email**: `sb-xxxxx@business.example.com`
- **Password**: Usually `password123` or similar

## 4. Configure Azure Backend

### Option A: Azure Portal (Manual)
1. Go to Azure Portal → Your App Service → Configuration
2. Add Application Settings:
   - `PAYPAL_CLIENT_ID` = Your sandbox client ID
   - `PAYPAL_SECRET` = Your sandbox secret
   - `PAYPAL_ENVIRONMENT` = sandbox
   - `PAYPAL_BASE_URL` = https://api.sandbox.paypal.com

### Option B: PowerShell Script (Automated)
```powershell
.\deploy_azure_paypal.ps1 -ResourceGroupName "your-rg" -AppServiceName "travelbuddy-b2c6hgbbgeh4esdh" -PayPalClientId "YOUR_CLIENT_ID" -PayPalSecret "YOUR_SECRET"
```

### Run Mobile App:
```bash
cd travel_buddy_mobile
flutter pub get
flutter run
```

### Test Payment Flow:
1. Open app and go to subscription plans
2. Select a paid plan (Basic, Premium, or Pro)
3. Tap "Subscribe" - this will:
   - Create PayPal payment
   - Open browser with PayPal login
   - Use test buyer credentials to login
   - Complete payment
   - Return to app with success/failure

## 5. Verify Payments

1. Check PayPal Developer Dashboard > Sandbox > Accounts
2. Click on your business account > "View/edit account"
3. Go to "Notifications" tab to see payment webhooks
4. Check your backend logs for payment verification

## 6. Test Scenarios

### Successful Payment:
- Use valid sandbox buyer account
- Complete payment flow
- Verify subscription is activated

### Failed Payment:
- Cancel payment on PayPal page
- Use invalid credentials
- Verify app handles failure gracefully

### Webhook Testing:
- PayPal webhook URL: `https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/webhooks/paypal/webhook`
- Configure in PayPal Developer Dashboard
- Monitor Azure App Service logs for webhook events

## 7. Common Issues

### "Client ID not found":
- Double-check your sandbox Client ID
- Ensure you're using sandbox credentials, not live ones

### "Payment creation failed":
- Check backend logs for detailed error
- Verify PayPal API credentials are correct
- Ensure backend is running on correct port

### "Browser not opening":
- Check if `url_launcher` package is properly installed
- Test on physical device if emulator has issues

## 8. Production Deployment

When ready for production:
1. Create live PayPal app in Developer Dashboard
2. Update credentials in environment files
3. Change `isProduction = true` in environment.dart
4. Update `PAYPAL_ENVIRONMENT=live` in backend .env
5. Test with real PayPal account (small amounts)

## 9. Security Notes

- Never commit real PayPal credentials to version control
- Use environment variables for all sensitive data
- Implement proper webhook signature verification
- Add rate limiting to payment endpoints
- Log all payment attempts for audit trail