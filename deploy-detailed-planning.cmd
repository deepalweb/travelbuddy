@echo off
echo Deploying Enhanced Trip Planning to Azure...

echo Step 1: Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    exit /b 1
)

echo Step 2: Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Backend dependencies failed!
    exit /b 1
)

echo Step 3: Testing detailed planning service...
node -e "
const service = require('./routes/detailedPlanning.js');
console.log('Detailed planning service loaded successfully');
"
if %errorlevel% neq 0 (
    echo Service test failed!
    exit /b 1
)

cd ..

echo Step 4: Deploying to Azure...
call az webapp deployment source config-zip --resource-group travelbuddy-rg --name travelbuddy-app --src dist.zip

echo Step 5: Restarting Azure App Service...
call az webapp restart --resource-group travelbuddy-rg --name travelbuddy-app

echo Deployment complete! Enhanced trip planning is now live.
echo Test the new service at: https://travelbuddy-app.azurewebsites.net/api/plans/generate-detailed