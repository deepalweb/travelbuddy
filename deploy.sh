#!/bin/bash

# Build frontend with environment variables
cd frontend
npm install
npm run build

# Copy to backend public
cp -r dist/* ../backend/public/

# Install backend dependencies
cd ../backend
npm install

echo "Deployment complete"
