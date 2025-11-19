@echo off
echo 🔄 Restoring TravelBuddy to commit ad04b3d
echo ========================================

echo 📍 Current status:
git log --oneline -5

echo.
echo 🔄 Restoring to commit ad04b3d...
git reset --hard ad04b3d

echo.
echo ✅ Restoration complete!
echo 📍 Current commit:
git log --oneline -1

echo.
echo 🚀 Pushing changes to trigger deployment...
git push --force-with-lease origin main

echo.
echo ✅ Done! GitHub Actions will redeploy the restored version.
pause