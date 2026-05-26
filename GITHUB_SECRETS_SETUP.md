# GitHub Secrets Setup for Azure Deployment

## Required GitHub Secrets

Go to your GitHub repository: `https://github.com/deepalweb/travelbuddy/settings/secrets/actions`

Click **"New repository secret"** for each of the following:

### 1. AZURE_WEBAPP_PUBLISH_PROFILE
**How to get it:**
1. Go to Azure Portal: https://portal.azure.com
2. Navigate to your App Service: `travelbuddy`
3. Click **"Get publish profile"** (Download publish profile)
4. Open the downloaded `.PublishSettings` file in a text editor
5. Copy the ENTIRE contents of the file
6. Paste it as the secret value

### 2. VITE_API_BASE_URL
```
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net
```

### 3. VITE_FIREBASE_API_KEY
```
AIzaSyCuJr5N0ytr1h_Aq_5qQazNL0wQUnsZlAw
```

### 4. VITE_FIREBASE_AUTH_DOMAIN
```
travelbuddy-2d1c5.firebaseapp.com
```

### 5. VITE_FIREBASE_PROJECT_ID
```
travelbuddy-2d1c5
```

### 6. VITE_FIREBASE_STORAGE_BUCKET
```
travelbuddy-2d1c5.firebasestorage.app
```

### 7. VITE_FIREBASE_MESSAGING_SENDER_ID
```
45425409967
```

### 8. VITE_FIREBASE_APP_ID
```
1:45425409967:web:782638c65a40dcb156b95a
```

## Steps to Add Secrets

1. Go to: https://github.com/deepalweb/travelbuddy/settings/secrets/actions
2. Click **"New repository secret"**
3. Enter the **Name** (e.g., `VITE_API_BASE_URL`)
4. Enter the **Value** (copy from above)
5. Click **"Add secret"**
6. Repeat for all 8 secrets

## Verify Deployment

After adding all secrets:

1. Go to: https://github.com/deepalweb/travelbuddy/actions
2. Click on **"Deploy TravelBuddy to Azure"** workflow
3. Click **"Run workflow"** → Select `master` branch → Click **"Run workflow"**
4. Watch the deployment progress
5. Check for any errors in the logs

## Troubleshooting

### If deployment fails:
- Check the Actions logs for specific error messages
- Verify all secrets are added correctly (no extra spaces)
- Ensure Azure App Service `travelbuddy` exists and is running
- Check if the publish profile is valid (not expired)

### To manually trigger deployment:
```bash
# From your local repository
git commit --allow-empty -m "Trigger deployment"
git push origin master
```

## Azure App Service Configuration

Make sure your Azure App Service has:
- **Runtime**: Node 20 LTS
- **Platform**: Linux or Windows (workflow uses web.config for Windows)
- **Always On**: Enabled (recommended)
- **App Settings**: Backend environment variables configured in Azure Portal
