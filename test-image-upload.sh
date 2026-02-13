#!/bin/bash

# Image Upload Test Script
# This script tests the image upload endpoint

echo "🧪 Testing Image Upload Endpoint..."
echo ""

# Backend URL
BACKEND_URL="https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net"

# Test 1: Check if backend is running
echo "1️⃣ Testing backend health..."
curl -s "$BACKEND_URL/api/health" | jq '.'
echo ""

# Test 2: Check if upload endpoint exists
echo "2️⃣ Testing upload endpoint (OPTIONS)..."
curl -X OPTIONS -s "$BACKEND_URL/api/images/upload-multiple" -v 2>&1 | grep "< HTTP"
echo ""

# Test 3: Try uploading a test image (if you have one)
if [ -f "test.jpg" ]; then
    echo "3️⃣ Testing actual upload..."
    curl -X POST "$BACKEND_URL/api/images/upload-multiple" \
      -F "images=@test.jpg" \
      -H "Content-Type: multipart/form-data" \
      -v
    echo ""
else
    echo "3️⃣ Skipping upload test (no test.jpg file found)"
    echo "   Create a test.jpg file in this directory to test actual uploads"
    echo ""
fi

# Test 4: Check uploads directory (if running locally)
if [ -d "../backend/uploads/posts" ]; then
    echo "4️⃣ Checking local uploads directory..."
    ls -lh ../backend/uploads/posts/ | tail -5
    echo ""
else
    echo "4️⃣ Local uploads directory not found (might be running on Azure)"
    echo ""
fi

echo "✅ Test complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run the mobile app: cd travel_buddy_mobile && flutter run"
echo "   2. Try creating a post with images"
echo "   3. Check the console logs for detailed upload information"
echo "   4. Verify the post appears with images"
