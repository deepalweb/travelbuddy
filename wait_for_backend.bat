@echo off
echo Waiting for backend to start after deployment...
echo This may take 2-3 minutes...
echo.

:loop
timeout /t 10 /nobreak >nul
curl -s https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo.
    echo ✅ Backend is UP!
    echo.
    echo Testing privacy page:
    curl -s -I https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/privacy | findstr "HTTP"
    echo.
    echo Testing terms page:
    curl -s -I https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/terms | findstr "HTTP"
    echo.
    echo URLs:
    echo Privacy: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/privacy
    echo Terms: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/terms
    pause
    exit
) else (
    echo Still starting... (checking every 10 seconds)
    goto loop
)
