@echo off
echo Starting Travel Buddy Admin Portal with Azure Backend...
echo.

echo Admin Portal connecting to Azure Backend...
echo Azure Backend: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net

echo Starting Admin Portal...
start "Admin Portal" cmd /k "cd admin && npm run dev"

echo.
echo Admin Portal is starting...
echo Azure Backend: https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net
echo Admin Portal: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul