// Secure CORS configuration
export const getCorsOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const allowedOrigins = [
    process.env.CLIENT_URL,
    'https://travelbuddylk.com',
    'https://www.travelbuddylk.com',
    'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'
  ].filter(Boolean);

  // Only allow localhost in development
  if (!isProduction) {
    allowedOrigins.push(
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000'
    );
  }

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return callback(null, true);
      
      // Check against whitelist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // In production, reject unknown origins
      if (isProduction) {
        console.warn('CORS blocked origin:', origin);
        return callback(new Error('Not allowed by CORS'));
      }
      
      // In development, allow all
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-user-id',
      'x-firebase-uid',
      'x-csrf-token'
    ],
    maxAge: 86400 // 24 hours
  };
};
