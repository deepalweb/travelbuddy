# Security Setup Guide

## Required GitHub Secrets

Go to: GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

```
AZURE_CLIENT_ID=<your-azure-client-id>
AZURE_TENANT_ID=<your-azure-tenant-id>
AZURE_SUBSCRIPTION_ID=<your-azure-subscription-id>
AZURE_WEBAPP_PUBLISH_PROFILE=<your-publish-profile>
VITE_GEMINI_API_KEY=AIzaSyD370YJUT-_gvsVV9Sf-KJUJyNxt3Wok3g
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA89E6gkU7-nUMYk9JPt6xxYHVV4Yevtio
VITE_UNSPLASH_ACCESS_KEY=J4khiSIy9hN7kZabjiTdQR-SG_FgxNX25icqGuleqhs
VITE_UNSPLASH_SECRET_KEY=aY-3XCFIX18vb34Y-jAlPdUo1eG8CkaIcvma57PMxRo
MONGO_URI=mongodb+srv://deepalr:qn7q9Y64AOjrdLbe@cluster0.oybjzf7.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=Cluster0
```

## Azure App Service Configuration

Add these in Azure Portal → App Service → Configuration:

```
VITE_GEMINI_API_KEY
VITE_GOOGLE_MAPS_API_KEY  
VITE_UNSPLASH_ACCESS_KEY
VITE_UNSPLASH_SECRET_KEY
MONGO_URI
WEBSITE_NODE_DEFAULT_VERSION=20
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```