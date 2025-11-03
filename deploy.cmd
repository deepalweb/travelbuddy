@echo off
echo Deploying to Azure App Service...
echo Setting CSP_ENABLED=false
az webapp config appsettings set --name travelbuddy-b2c6hgbbgeh4esdh --resource-group travelbuddy --settings CSP_ENABLED=false
echo Deployment complete