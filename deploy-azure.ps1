# Azure CLI Deployment Script (Alternative to GitHub Actions)
# Run this script to deploy manually using Azure CLI

# Variables - UPDATE THESE
$RESOURCE_GROUP = "travelbuddy"
$APP_NAME = "travelbuddy"
$LOCATION = "East US 2"
$SKU = "P2v3"          # Premium v3 plan (current)

# Login to Azure (run this once)
Write-Host "🔐 Logging into Azure..."
az login

# Create resource group
Write-Host "📁 Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create app service plan
Write-Host "📋 Creating app service plan..."
az appservice plan create --name "$APP_NAME-plan" --resource-group $RESOURCE_GROUP --sku $SKU --is-linux

# Create web app with Node.js runtime
Write-Host "🌐 Creating web app..."
az webapp create --resource-group $RESOURCE_GROUP --plan "$APP_NAME-plan" --name $APP_NAME --runtime "NODE:18-lts"

# Configure app settings
Write-Host "⚙️ Configuring app settings..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings `
    WEBSITE_NODE_DEFAULT_VERSION="18-lts" `
    SCM_DO_BUILD_DURING_DEPLOYMENT="true" `
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Build the application locally
Write-Host "🔨 Building application..."
npm run build

# Deploy the built application
Write-Host "🚀 Deploying to Azure..."
az webapp deployment source config-zip --resource-group $RESOURCE_GROUP --name $APP_NAME --src "./dist.zip"

Write-Host "✅ Deployment complete!"
Write-Host "🌍 Your app is available at: https://$APP_NAME.azurewebsites.net"
