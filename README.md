# Travel Buddy Mobile App

AI-powered travel planning app with subscription-based features.

## 🚀 Features

- **AI Travel Planning**: Generate personalized itineraries
- **Local Recommendations**: Discover places, food, and activities
- **Subscription Plans**: Free, Basic ($4.99), Premium ($9.99), Pro ($19.99)
- **PayPal Integration**: Secure sandbox payment processing
- **Real-time Weather**: Location-based weather forecasts
- **Emergency Services**: Find nearby police and hospitals

## 💳 Payment Integration

- **PayPal Sandbox**: Full testing environment
- **Azure Backend**: Production-ready payment processing
- **Subscription Management**: Trial periods and plan upgrades

## 🛠️ Setup

### Prerequisites
- Flutter SDK
- Node.js (for backend)
- PayPal Developer Account
- Azure App Service

### Quick Start
```bash
# Clone repository
git clone https://github.com/yourusername/travelbuddy-2.git
cd travelbuddy-2

# Setup mobile app
cd travel_buddy_mobile
flutter pub get
flutter run

# Setup backend (if running locally)
cd ../backend
npm install
npm start
```

### PayPal Configuration
See [PAYPAL_SANDBOX_SETUP.md](PAYPAL_SANDBOX_SETUP.md) for detailed setup instructions.

## 📱 Architecture

- **Frontend**: Flutter mobile app
- **Backend**: Node.js/Express with MongoDB
- **Payment**: PayPal REST API
- **Hosting**: Azure App Service
- **Database**: MongoDB Atlas

## 🧪 Testing

```bash
# Test PayPal integration
node test_azure_paypal.js YOUR_CLIENT_ID YOUR_SECRET

# Run mobile app tests
cd travel_buddy_mobile
flutter test
```

## 📚 Documentation

- [PayPal Sandbox Setup](PAYPAL_SANDBOX_SETUP.md)
- [Azure Configuration](AZURE_PAYPAL_CONFIG.md)

## 🔒 Security

- Environment variables for all credentials
- PayPal webhook signature verification
- No sensitive data in repository

## 📄 License

MIT License - see LICENSE file for details.