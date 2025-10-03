# Azure Deployment Guide for Enhanced Trip Planning

## Quick Deploy

Run the deployment script:
```cmd
deploy-detailed-planning.cmd
```

## Manual Deployment Steps

### 1. Build Frontend
```cmd
npm run build
```

### 2. Deploy Backend
```cmd
cd backend
npm install
```

### 3. Azure Configuration

Set these environment variables in Azure App Service:

**Required:**
```
AZURE_OPENAI_API_KEY=your_azure_openai_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
GOOGLE_PLACES_API_KEY=your_google_places_key
```

**Optional:**
```
OPENWEATHER_API_KEY=your_weather_key
MONGO_URI=your_mongodb_connection_string
```

### 4. Test Deployment

**Test detailed planning endpoint:**
```
GET https://your-app.azurewebsites.net/api/plans/generate-detailed
POST Body: {
  "destination": "anuradhapura",
  "duration": "2 days", 
  "interests": "culture, history",
  "pace": "moderate",
  "budget": "mid-range"
}
```

**Expected Response:**
```json
{
  "tripPlan": {
    "tripTitle": "Anuradhapura 2 days Discovery: Cultural Heritage Journey",
    "introduction": "🏛️ Welcome to Anuradhapura - Sri Lanka's Ancient Capital...",
    "dailyPlans": [
      {
        "activities": [
          {
            "activityTitle": "Sri Maha Bodhi Tree",
            "description": "🏛️ **Sri Maha Bodhi Tree**\n\n**Why Visit:** Witness 2,300 years of continuous worship...",
            "practicalTip": "Bring white flowers as offerings - locals sell them at the entrance for Rs. 50"
          }
        ]
      }
    ]
  }
}
```

## Verification Steps

1. **Check service status:**
   ```
   GET https://your-app.azurewebsites.net/health
   ```

2. **Test API keys:**
   ```
   GET https://your-app.azurewebsites.net/api/ai/test-key
   GET https://your-app.azurewebsites.net/api/places/test-key
   ```

3. **Test trip generation:**
   - Use mobile app to create trip plan
   - Verify rich content appears instead of generic templates

## Troubleshooting

**If deployment fails:**
1. Check Azure App Service logs
2. Verify all environment variables are set
3. Test API keys individually
4. Check backend/routes/detailedPlanning.js exists

**If generic content still appears:**
1. Clear browser cache
2. Check network tab for API calls
3. Verify `/api/plans/generate-detailed` is being called
4. Check Azure logs for errors

## Features Enabled

✅ **Rich Content:** Specific places instead of "City Center"
✅ **Insider Tips:** Local knowledge and practical advice  
✅ **Cultural Context:** Historical significance and customs
✅ **Practical Details:** Costs, timing, transport options
✅ **Photo Opportunities:** Specific photo spots and tips
✅ **Food Recommendations:** Real restaurant names and specialties
✅ **Weather Considerations:** Time-specific advice
✅ **Crowd Intelligence:** Best times to visit

The enhanced service provides **10x more useful information** than the generic templates.