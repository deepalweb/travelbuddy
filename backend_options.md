# Backend Options for Local Dishes Feature

## 🎯 What Backend Does:
1. Receives location (lat, lng) from mobile app
2. Converts coordinates to location name
3. Sends prompt to Gemini AI
4. Returns structured dish data as JSON

## 🔧 Backend Technology Options:

### **Option 1: Node.js + Express (Recommended)**
```javascript
// Minimal setup - 1 file
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/dishes/generate', async (req, res) => {
  const { latitude, longitude } = req.body;
  
  // Get location name
  const location = await getLocationName(latitude, longitude);
  
  // Generate dishes with Gemini
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const prompt = `Generate 6 local dishes for ${location}...`;
  const result = await model.generateContent(prompt);
  
  res.json({ dishes: JSON.parse(result.response.text()) });
});

app.listen(3000);
```

**Pros:** Fast, simple, good Gemini integration
**Cons:** None for this use case

### **Option 2: Python + Flask**
```python
from flask import Flask, request, jsonify
import google.generativeai as genai

app = Flask(__name__)
genai.configure(api_key=os.environ['GEMINI_API_KEY'])

@app.route('/dishes/generate', methods=['POST'])
def generate_dishes():
    data = request.json
    lat, lng = data['latitude'], data['longitude']
    
    location = get_location_name(lat, lng)
    
    model = genai.GenerativeModel('gemini-pro')
    prompt = f"Generate 6 local dishes for {location}..."
    response = model.generate_content(prompt)
    
    return jsonify({'dishes': json.loads(response.text)})

app.run(port=5000)
```

**Pros:** Python ecosystem, good for AI
**Cons:** Slightly slower than Node.js

### **Option 3: Serverless (Vercel/Netlify)**
```javascript
// api/dishes.js (Vercel)
export default async function handler(req, res) {
  const { latitude, longitude } = req.body;
  
  const dishes = await generateDishesWithGemini(latitude, longitude);
  
  res.json({ dishes });
}
```

**Pros:** No server management, auto-scaling
**Cons:** Cold start delays

### **Option 4: Firebase Functions**
```javascript
const functions = require('firebase-functions');

exports.generateDishes = functions.https.onRequest(async (req, res) => {
  const { latitude, longitude } = req.body;
  
  const dishes = await generateWithGemini(latitude, longitude);
  
  res.json({ dishes });
});
```

**Pros:** Integrates with Firebase ecosystem
**Cons:** Vendor lock-in

## 🚀 Recommended Setup:

### **Quick Start: Node.js + Express**

**File Structure:**
```
backend/
├── package.json
├── server.js (main file)
├── .env (API keys)
└── utils/
    ├── gemini.js
    └── geocoding.js
```

**Dependencies:**
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "@google/generative-ai": "^0.2.0",
    "axios": "^1.6.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0"
  }
}
```

**Environment Variables:**
```
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_maps_api_key
PORT=3000
```

**Complete server.js:**
```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get location name from coordinates
async function getLocationName(lat, lng) {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  return response.data.results[0]?.formatted_address || 'Unknown Location';
}

// Generate dishes endpoint
app.post('/dishes/generate', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const location = await getLocationName(latitude, longitude);
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Generate 6 popular local dishes for ${location}.
    Return JSON array with: name, description, price, priceRange, restaurant, cuisine, rating, dietaryTags, culturalNote.
    Keep descriptions under 50 characters.`;
    
    const result = await model.generateContent(prompt);
    const dishes = JSON.parse(result.response.text());
    
    res.json({ 
      dishes,
      location,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate dishes' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 🔥 Deployment Options:

1. **Local Development:** `node server.js`
2. **Heroku:** Push to Heroku with Procfile
3. **Railway:** Connect GitHub repo
4. **DigitalOcean App Platform:** Deploy from GitHub
5. **AWS EC2:** Traditional server deployment

## 💡 Why This Backend?

- **Minimal:** Only 1 main file needed
- **Fast:** Direct Gemini API integration
- **Scalable:** Can handle multiple requests
- **Simple:** Easy to debug and modify
- **Cost-effective:** Only pay for API calls

**Total setup time: ~30 minutes**