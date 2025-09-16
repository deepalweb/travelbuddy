# GitHub Secrets Setup

## Required Secrets

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

Add these secrets:

### Azure Deployment
```
AZURE_WEBAPP_PUBLISH_PROFILE
```
**Value**: Copy the entire publish profile XML (the one you provided)

### API Keys
```
VITE_GEMINI_API_KEY=AIzaSyD370YJUT-_gvsVV9Sf-KJUJyNxt3Wok3g
VITE_GOOGLE_MAPS_API_KEY=AIzaSyA89E6gkU7-nUMYk9JPt6xxYHVV4Yevtio
VITE_UNSPLASH_ACCESS_KEY=J4khiSIy9hN7kZabjiTdQR-SG_FgxNX25icqGuleqhs
VITE_UNSPLASH_SECRET_KEY=aY-3XCFIX18vb34Y-jAlPdUo1eG8CkaIcvma57PMxRo
MONGO_URI=mongodb+srv://deepalr:qn7q9Y64AOjrdLbe@cluster0.oybjzf7.mongodb.net/travelbuddy?retryWrites=true&w=majority&appName=Cluster0
```

## Your App URL
https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net

## Next Steps
1. Add all secrets to GitHub
2. Push code to trigger deployment
3. Delete this file after setup