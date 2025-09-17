import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testAILocalDishes() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found in environment');
    return;
  }

  const lat = 40.7128; // New York
  const lng = -74.0060;
  const limit = 5;

  const prompt = `Based on the location coordinates ${lat}, ${lng}, suggest ${limit} popular local dishes from this area. For each dish, provide:

1. Name of the dish
2. Brief description (1-2 sentences)
3. Cuisine type
4. Price range (budget/mid-range/fine-dining)
5. Average price in USD
6. Typical restaurant name where it's found
7. Dietary tags (vegetarian, vegan, gluten-free, etc.)
8. Cultural significance or note

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Dish Name",
    "description": "Description",
    "cuisine": "Cuisine Type",
    "priceRange": "mid-range",
    "averagePrice": "$12-15",
    "restaurantName": "Restaurant Name",
    "dietaryTags": ["tag1", "tag2"],
    "culturalNote": "Cultural note"
  }
]`;

  try {
    console.log('Testing Gemini AI for local dishes...');
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log('Raw AI Response:');
    console.log(text);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }

    const aiDishes = JSON.parse(jsonMatch[0]);
    
    // Transform to mobile app format
    const mobileDishes = aiDishes.map(dish => ({
      id: Math.random().toString(36).substr(2, 9),
      name: dish.name,
      description: dish.description,
      priceRange: dish.priceRange || 'mid-range',
      averagePrice: dish.averagePrice || '$10-15',
      cuisine: dish.cuisine || 'Local',
      restaurantName: dish.restaurantName || 'Local Restaurant',
      restaurantId: 'ai-' + Math.random().toString(36).substr(2, 9),
      imageUrl: '',
      rating: 4.0 + Math.random() * 1.0,
      dietaryTags: dish.dietaryTags || [],
      culturalNote: dish.culturalNote || 'A local specialty'
    }));

    console.log('\nFormatted Mobile Dishes:');
    console.log(JSON.stringify(mobileDishes, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAILocalDishes();