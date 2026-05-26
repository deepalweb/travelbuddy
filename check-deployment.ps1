# Azure Deployment Verification Script
# Run this to check your deployment setup

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Azure Deployment Setup Checker" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Git status
Write-Host "[1/5] Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  You have uncommitted changes" -ForegroundColor Yellow
} else {
    Write-Host "✅ Git working directory is clean" -ForegroundColor Green
}
Write-Host ""

# Check 2: Remote repository
Write-Host "[2/5] Checking remote repository..." -ForegroundColor Yellow
$remote = git remote get-url origin
Write-Host "Remote: $remote" -ForegroundColor White
if ($remote -match "github.com") {
    Write-Host "✅ GitHub remote configured" -ForegroundColor Green
} else {
    Write-Host "❌ GitHub remote not found" -ForegroundColor Red
}
Write-Host ""

# Check 3: Workflow file exists
Write-Host "[3/5] Checking GitHub Actions workflow..." -ForegroundColor Yellow
if (Test-Path ".github\workflows\azure-deploy.yml") {
    Write-Host "✅ Workflow file exists" -ForegroundColor Green
} else {
    Write-Host "❌ Workflow file not found" -ForegroundColor Red
}
Write-Host ""

# Check 4: Frontend .env file
Write-Host "[4/5] Checking frontend environment..." -ForegroundColor Yellow
if (Test-Path "frontend\.env") {
    Write-Host "✅ Frontend .env exists" -ForegroundColor Green
    $envContent = Get-Content "frontend\.env" -Raw
    if ($envContent -match "VITE_FIREBASE_API_KEY") {
        Write-Host "✅ Firebase config found" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Frontend .env not found" -ForegroundColor Yellow
}
Write-Host ""

# Check 5: Latest commit
Write-Host "[5/5] Checking latest commit..." -ForegroundColor Yellow
$latestCommit = git log -1 --oneline
Write-Host "Latest: $latestCommit" -ForegroundColor White
Write-Host ""

# Summary
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Add GitHub Secrets:" -ForegroundColor White
Write-Host "   https://github.com/deepalweb/travelbuddy/settings/secrets/actions" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Check GitHub Actions:" -ForegroundColor White
Write-Host "   https://github.com/deepalweb/travelbuddy/actions" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Get Azure Publish Profile:" -ForegroundColor White
Write-Host "   https://portal.azure.com" -ForegroundColor Gray
Write-Host "   → App Services → travelbuddy → Get publish profile" -ForegroundColor Gray
Write-Host ""
Write-Host "4. See GITHUB_SECRETS_SETUP.md for detailed instructions" -ForegroundColor White
Write-Host ""
