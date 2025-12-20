@echo off
echo ========================================
echo TravelBuddy Localhost Development
echo ========================================
echo.

REM Check if config.local.js exists
if not exist "frontend\public\config.local.js" (
    echo ERROR: config.local.js not found!
    echo Please create frontend\public\config.local.js with your settings
    pause
    exit
)

REM Backup production config
copy /Y "frontend\public\config.js" "frontend\public\config.prod.js" >nul 2>&1

REM Use local config
copy /Y "frontend\public\config.local.js" "frontend\public\config.js" >nul 2>&1

echo Starting Backend on http://localhost:5000
start "TravelBuddy Backend" cmd /k "cd backend && node server.js"

timeout /t 3 >nul

echo Starting Frontend on http://localhost:5173
start "TravelBuddy Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to stop servers...
pause >nul

REM Restore production config
copy /Y "frontend\public\config.prod.js" "frontend\public\config.js" >nul 2>&1
del "frontend\public\config.prod.js" >nul 2>&1

taskkill /FI "WindowTitle eq TravelBuddy Backend*" /F >nul 2>&1
taskkill /FI "WindowTitle eq TravelBuddy Frontend*" /F >nul 2>&1

echo Servers stopped. Production config restored.
