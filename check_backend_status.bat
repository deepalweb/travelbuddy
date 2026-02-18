@echo off
echo Checking backend server status...
echo.

echo Testing health endpoint:
curl -s https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api/health
echo.
echo.

echo Testing privacy page:
curl -s -I https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/privacy
echo.
echo.

echo Testing terms page:
curl -s -I https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/terms
echo.

pause
