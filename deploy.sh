#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Install backend dependencies
cd backend
npm install --production

# Install frontend dependencies and build
cd ../frontend
npm install
npm run build

# Copy frontend build to backend
mkdir -p ../backend/dist
cp -r dist/* ../backend/dist/

echo "Deployment completed successfully!"