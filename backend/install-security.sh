#!/bin/bash
echo "🔒 Installing security packages..."

# Remove package-lock.json to force fresh install
rm -f package-lock.json

# Install updated packages
npm install

echo "✅ Security packages installed"
echo "🔧 Run 'npm audit' to verify no vulnerabilities"
echo "🚀 Ready for secure deployment"