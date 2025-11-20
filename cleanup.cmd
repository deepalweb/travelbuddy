@echo off
echo 🧹 Starting TravelBuddy Project Cleanup
echo =====================================

echo.
echo 📁 Removing root debug/test files...
if exist "check-azure-openai.js" del "check-azure-openai.js"
if exist "delete-deals.js" del "delete-deals.js"
if exist "health-check.js" del "health-check.js"
if exist "test-api.js" del "test-api.js"
if exist "test-connectivity.js" del "test-connectivity.js"
if exist "test-cors-fix.html" del "test-cors-fix.html"
if exist "test-cors.html" del "test-cors.html"
if exist "test-deals-api.js" del "test-deals-api.js"
if exist "test-deals-cors.html" del "test-deals-cors.html"
if exist "verify-azure-status.js" del "verify-azure-status.js"
if exist "start-server.js" del "start-server.js"
if exist "api-config.js" del "api-config.js"
if exist "status-dashboard.html" del "status-dashboard.html"

echo.
echo 📄 Removing outdated documentation...
if exist "DEBUG_INSTRUCTIONS.md" del "DEBUG_INSTRUCTIONS.md"
if exist "PRODUCTION_FIXES.md" del "PRODUCTION_FIXES.md"
if exist "PRODUCTION_READY.md" del "PRODUCTION_READY.md"
if exist "PROFILE_UPLOAD_README.md" del "PROFILE_UPLOAD_README.md"
if exist "SUBSCRIPTION_IMPLEMENTATION.md" del "SUBSCRIPTION_IMPLEMENTATION.md"
if exist "MOBILE_TRANSPORT_AGENT_PLAN.md" del "MOBILE_TRANSPORT_AGENT_PLAN.md"

echo.
echo 🔧 Removing backend debug files...
if exist "backend\debug-deals.js" del "backend\debug-deals.js"
if exist "backend\delete-deals.js" del "backend\delete-deals.js"
if exist "backend\health-check.js" del "backend\health-check.js"
if exist "backend\test-api.js" del "backend\test-api.js"
if exist "backend\test-azure-openai.js" del "backend\test-azure-openai.js"
if exist "backend\test-deals.js" del "backend\test-deals.js"

echo.
echo 🛤️ Removing backend test routes...
if exist "backend\routes\demo-auth.js" del "backend\routes\demo-auth.js"
if exist "backend\routes\role-test.js" del "backend\routes\role-test.js"
if exist "backend\routes\test.js" del "backend\routes\test.js"
if exist "backend\routes\setup.js" del "backend\routes\setup.js"

echo.
echo 📱 Removing mobile debug files...
if exist "travel_buddy_mobile\lib\check_backend.dart" del "travel_buddy_mobile\lib\check_backend.dart"
if exist "travel_buddy_mobile\lib\debug_create_post.dart" del "travel_buddy_mobile\lib\debug_create_post.dart"
if exist "travel_buddy_mobile\lib\debug_network.dart" del "travel_buddy_mobile\lib\debug_network.dart"
if exist "travel_buddy_mobile\lib\debug_user_posts.dart" del "travel_buddy_mobile\lib\debug_user_posts.dart"
if exist "travel_buddy_mobile\lib\main_complex.dart" del "travel_buddy_mobile\lib\main_complex.dart"
if exist "travel_buddy_mobile\debug_user_ownership.dart" del "travel_buddy_mobile\debug_user_ownership.dart"
if exist "travel_buddy_mobile\DEBUG_CLEANUP.md" del "travel_buddy_mobile\DEBUG_CLEANUP.md"
if exist "travel_buddy_mobile\REMOVED_FILES.md" del "travel_buddy_mobile\REMOVED_FILES.md"

echo.
echo 🗂️ Removing build caches...
if exist "travel_buddy_mobile\.dart_tool" rmdir /s /q "travel_buddy_mobile\.dart_tool"
if exist "travel_buddy_mobile\android\.gradle" rmdir /s /q "travel_buddy_mobile\android\.gradle"
if exist "travel_buddy_mobile\android\.kotlin" rmdir /s /q "travel_buddy_mobile\android\.kotlin"

echo.
echo ✅ Cleanup completed!
echo.
echo 📊 Summary:
echo - Removed debug/test files
echo - Removed outdated documentation
echo - Removed build caches
echo - Kept all production files
echo.
echo 💡 Note: Build caches will be regenerated automatically
pause