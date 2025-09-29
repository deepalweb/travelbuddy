# Deploy backend to Azure App Service
Write-Host "🚀 Deploying backend with Azure OpenAI integration..."

# Create deployment package
Write-Host "📦 Creating deployment package..."
cd backend
Compress-Archive -Path * -DestinationPath ../backend-deploy.zip -Force
cd ..

# Deploy using Azure CLI
Write-Host "🌐 Deploying to Azure App Service..."
az webapp deploy --resource-group travelbuddy --name travelbuddy-b2c6hgbbgeh4esdh --src-path backend-deploy.zip --type zip

# Clean up
Remove-Item backend-deploy.zip

Write-Host "Deployment complete! Backend should now use Azure OpenAI."
Write-Host "App Service will restart automatically to load new code."