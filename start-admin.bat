@echo off
echo Starting Travel Buddy Admin Portal...
echo.

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting Admin Portal...
start "Admin Portal" cmd /k "cd admin && npm run dev"

echo.
echo Admin Portal is starting...
echo Azure Backend: https://travelbuddy.azurewebsites.net
echo Admin Portal: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul