# Azure PayPal Configuration Deployment Script
# Run this in PowerShell to configure Azure App Service for PayPal sandbox

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName,
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName,
    
    [Parameter(Mandatory=$true)]
    [string]$PayPalClientId,
    
    [Parameter(Mandatory=$true)]
    [string]$PayPalSecret
)

Write-Host "🚀 Configuring Azure App Service for PayPal Sandbox..." -ForegroundColor Green

# Set PayPal environment variables
$settings = @{
    "PAYPAL_CLIENT_ID" = $PayPalClientId
    "PAYPAL_SECRET" = $PayPalSecret
    "PAYPAL_ENVIRONMENT" = "sandbox"
    "PAYPAL_BASE_URL" = "https://api.sandbox.paypal.com"
    "PAYPAL_WEBHOOK_SECRET" = "your-webhook-secret-$(Get-Random)"
}

Write-Host "📝 Setting environment variables..." -ForegroundColor Yellow

foreach ($setting in $settings.GetEnumerator()) {
    Write-Host "   Setting $($setting.Key)..." -ForegroundColor Gray
    az webapp config appsettings set --resource-group $ResourceGroupName --name $AppServiceName --settings "$($setting.Key)=$($setting.Value)" --output none
}

Write-Host "✅ PayPal sandbox configuration completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Update mobile app environment.dart with your PayPal credentials"
Write-Host "   2. Configure PayPal webhook URL in Developer Dashboard:"
Write-Host "      https://$AppServiceName.azurewebsites.net/api/webhooks/paypal/webhook"
Write-Host "   3. Test payment flow in mobile app"
Write-Host ""
Write-Host "🧪 Test with PayPal sandbox accounts from Developer Dashboard"