#!/bin/bash

echo "🚀 Travel Buddy Production Deployment"
echo "======================================"

# Check if production environment file exists
if [ ! -f "backend/.env.production" ]; then
    echo "❌ Error: backend/.env.production not found"
    echo "Please create it with your production credentials"
    exit 1
fi

# Check SSL certificates
if [ ! -f "backend/ssl/cert.pem" ] || [ ! -f "backend/ssl/key.pem" ]; then
    echo "⚠️  Warning: SSL certificates not found"
    echo "Creating self-signed certificates for testing..."
    cd backend/ssl
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    cd ../..
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

# Copy production environment
cp .env.production .env

# Start production server
echo "🚀 Starting production server..."
NODE_ENV=production npm start

echo "✅ Deployment complete!"
echo "🌐 Server running at: https://localhost:443"
echo "🔍 Health check: curl https://localhost:443/health"