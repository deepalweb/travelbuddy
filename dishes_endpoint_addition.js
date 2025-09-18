// Add this to your existing server.js file

// 1. ADD GEMINI AI IMPORT (add to top of file)
import { GoogleGenerativeAI } from '@google/generative-ai';

// 2. INITIALIZE GEMINI (add after other initializations)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. ADD DISHES ENDPOINT (add with your other routes)
app.post('/api/dishes/generate', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    // Get location name using existing Google Maps integration
    const locationResponse = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    );
    const locationData = await locationResponse.json();
    const locationName = locationData.results?.[0]?.formatted_address || 'Unknown Location';

    // Generate dishes with Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Generate 6 popular local dishes for ${locationName}.
    Return ONLY a JSON array with this exact structure:
    [
      {
        "name": "dish name",
        "description": "brief description under 50 chars",
        "price": "local currency price",
        "priceRange": "budget|mid-range|fine-dining",
        "restaurant": "popular restaurant name",
        "cuisine": "cuisine type",
        "rating": 4.5,
        "dietaryTags": ["vegetarian", "halal", etc],
        "culturalNote": "cultural significance under 60 chars"
      }
    ]`;

    const result = await model.generateContent(prompt);
    const dishesText = result.response.text();
    
    // Parse JSON response
    let dishes;
    try {
      dishes = JSON.parse(dishesText);
    } catch (parseError) {
      // Fallback: extract JSON from response if wrapped in markdown
      const jsonMatch = dishesText.match(/\[[\s\S]*\]/);
      dishes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    }

    // Record successful API usage
    recordUsage({
      api: 'gemini',
      action: 'generate_dishes',
      status: 'success',
      durationMs: Date.now() - startTime,
      meta: { location: locationName, dishCount: dishes.length }
    });

    res.json({
      dishes,
      location: locationName,
      generatedAt: new Date().toISOString(),
      count: dishes.length
    });

  } catch (error) {
    console.error('❌ Error generating dishes:', error);
    
    // Record failed API usage
    recordUsage({
      api: 'gemini',
      action: 'generate_dishes',
      status: 'error',
      durationMs: Date.now() - startTime,
      meta: { error: error.message }
    });

    res.status(500).json({
      error: 'Failed to generate dishes',
      message: error.message
    });
  }
});

// 4. ADD TO PACKAGE.JSON DEPENDENCIES
/*
Add this to your package.json dependencies:
"@google/generative-ai": "^0.2.0"

Then run: npm install @google/generative-ai
*/

// 5. ADD TO .ENV FILE
/*
Add this to your .env file:
GEMINI_API_KEY=your_gemini_api_key_here
*/