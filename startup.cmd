@echo off
echo Starting TravelBuddy deployment...

REM Check if dist folder exists
if not exist "dist\index.html" (
    echo Building React application...
    call npm run build
    if errorlevel 1 (
        echo Build failed!
        exit /b 1
    )
)

REM Copy dist files to Azure expected locations
if exist "dist" (
    echo Copying build files...
    if not exist "D:\home\site\wwwroot\dist" mkdir "D:\home\site\wwwroot\dist"
    xcopy "dist\*" "D:\home\site\wwwroot\dist\" /E /Y /Q >nul 2>&1
    echo Build files copied
)

echo Starting Node.js server...
node server.js