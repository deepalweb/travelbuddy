@echo off
echo Starting TravelBuddy Admin Panel...
cd admin
start "Admin Panel" cmd /k "npm run dev"
echo Admin panel starting on http://localhost:5173
echo.
echo Click the "Real Admin Panel" button on your homepage to access it!
pause