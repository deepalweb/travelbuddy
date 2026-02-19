// Environment variable validation for production
export const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'GOOGLE_PLACES_API_KEY',
    'FIREBASE_ADMIN_CREDENTIALS_JSON'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    console.error('❌ Missing required environment variables:', missing);
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  // Validate API keys format
  if (process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACES_API_KEY.length < 20) {
    throw new Error('Invalid GOOGLE_PLACES_API_KEY format');
  }

  console.log('✅ Environment variables validated');
};

export const isProduction = () => process.env.NODE_ENV === 'production';
