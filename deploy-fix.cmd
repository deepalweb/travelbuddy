@echo off
echo 🚀 TravelBuddy Quick Deployment Fix
echo =====================================

echo 📦 Installing dependencies...
cd backend
call npm install --production

echo 🔧 Creating production environment...
copy .env .env.production

echo 📁 Setting up public directory...
if not exist "public" mkdir public
echo ^<html^>^<body^>^<h1^>TravelBuddy Loading...^</h1^>^</body^>^</html^> > public\index.html

echo 🌐 Testing server locally...
timeout /t 2 /nobreak > nul
node ../start-server.js &

echo ✅ Deployment fix completed!
echo 🔗 Your app should be available at: https://travelbuddylk.com
echo 🏥 Health check: https://travelbuddylk.com/health

pause