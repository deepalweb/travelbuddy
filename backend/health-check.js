// Simple health check script for Azure deployment
const http = require('http');
const mongoose = require('mongoose');

console.log('🔧 TravelBuddy Health Check Starting...');
console.log('📍 Port:', process.env.PORT || 8080);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Check environment variables
const requiredEnvVars = [
  'MONGO_URI',
  'GOOGLE_PLACES_API_KEY',
  'AZURE_OPENAI_API_KEY'
];

console.log('🔑 Environment Variables Check:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  console.log(`  ${envVar}: ${value ? '✅ Set' : '❌ Missing'}`);
});

// Simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url === '/health' || req.url === '/api/health') {
    res.end(JSON.stringify({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 8080,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    }));
  } else {
    res.end(JSON.stringify({
      message: 'TravelBuddy API - Health Check Mode',
      status: 'running',
      timestamp: new Date().toISOString()
    }));
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(`✅ Health check server running on port ${PORT}`);
  console.log(`🌐 Access: http://localhost:${PORT}/health`);
});

// Connect to MongoDB (optional)
if (process.env.MONGO_URI && process.env.MONGO_URI !== 'disabled') {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});