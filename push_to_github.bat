@echo off
REM Git Push Script - Pre-Launch Changes

echo 🚀 Pushing Pre-Launch Changes to GitHub
echo =========================================
echo.

cd /d c:\Users\DeepalRupasinghe\travelbuddy-2

echo 📝 Staging all changes...
git add .

echo.
echo 💬 Committing changes...
git commit -m "Pre-launch: Add legal routes, deployment guides, and app store asset guides

- Added privacy policy and terms of service HTML pages
- Created backend legal routes (/privacy and /terms)
- Updated app_info.json with correct URLs and package name
- Created comprehensive deployment guide (DEPLOY.md)
- Added screenshot capture scripts (Windows and Unix)
- Created feature graphic design guide
- Created app icon generation guide
- Added pre-launch checklist with all remaining tasks
- Fixed package name consistency (com.travelbuddylk.app)
- Created store assets guide with specifications

Ready for: Backend deployment, API key configuration, and asset generation"

echo.
echo 📤 Pushing to GitHub...
git push origin main

echo.
echo ✅ Successfully pushed to GitHub!
echo.
echo Next steps:
echo 1. Deploy backend to Azure
echo 2. Add Google Places API key to Azure
echo 3. Generate screenshots and assets
echo.
pause
