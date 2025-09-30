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

# Copy build files to Azure App Service locations
echo "Copying build files to Azure locations..."
if [ -d "dist" ]; then
    # Create Azure directories if they don't exist
    mkdir -p /home/site/wwwroot/dist
    mkdir -p /home/site/dist
    
    # Copy to both locations
    cp -r dist/* /home/site/wwwroot/dist/ 2>/dev/null || echo "Could not copy to wwwroot (may not exist)"
    cp -r dist/* /home/site/dist/ 2>/dev/null || echo "Could not copy to site (may not exist)"
    
    echo "Build files copied to Azure locations"
fi

echo "Build completed successfully"
echo "Deployment finished"