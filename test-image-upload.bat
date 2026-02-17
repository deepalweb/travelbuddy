@echo off
REM Image Upload Test Script for Windows
REM This script tests the image upload endpoint

echo 🧪 Testing Image Upload Endpoint...
echo.

REM Backend URL
set BACKEND_URL=https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net

REM Test 1: Check if backend is running
echo 1️⃣ Testing backend health...
curl -s "%BACKEND_URL%/api/health"
echo.
echo.

REM Test 2: Check if upload endpoint exists
echo 2️⃣ Testing upload endpoint (OPTIONS)...
curl -X OPTIONS -s "%BACKEND_URL%/api/images/upload-multiple" -v
echo.
echo.

REM Test 3: Try uploading a test image (if you have one)
if exist test.jpg (
    echo 3️⃣ Testing actual upload...
    curl -X POST "%BACKEND_URL%/api/images/upload-multiple" -F "images=@test.jpg" -H "Content-Type: multipart/form-data" -v
    echo.
) else (
    echo 3️⃣ Skipping upload test (no test.jpg file found)
    echo    Create a test.jpg file in this directory to test actual uploads
    echo.
)

REM Test 4: Check uploads directory (if running locally)
if exist "..\backend\uploads\posts" (
    echo 4️⃣ Checking local uploads directory...
    dir /O-D "..\backend\uploads\posts" | findstr /V "^$"
    echo.
) else (
    echo 4️⃣ Local uploads directory not found (might be running on Azure)
    echo.
)

echo ✅ Test complete!
echo.
echo 📝 Next steps:
echo    1. Run the mobile app: cd travel_buddy_mobile ^&^& flutter run
echo    2. Try creating a post with images
echo    3. Check the console logs for detailed upload information
echo    4. Verify the post appears with images
echo.

pause
