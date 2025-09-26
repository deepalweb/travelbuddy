#!/bin/bash

# Exit on any error
set -e

echo "Starting deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building React application..."
npm run build

# Verify build output
if [ ! -f "dist/index.html" ]; then
    echo "ERROR: Build failed - dist/index.html not found"
    exit 1
fi

echo "Build completed successfully"
echo "Deployment finished"