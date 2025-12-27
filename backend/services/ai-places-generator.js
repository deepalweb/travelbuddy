import OpenAI from 'openai';

// Initialize Azure OpenAI
const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_API_KEY },
}) : null;

export class AIPlacesGenerator {
  static async generatePlaces(latitude, longitude, category = 'tourist attractions', limit = 20) {
    if (!openai) {
      throw new Error('Azure OpenAI not configured');
    }

    const prompt = `You are a travel expert. Generate ${limit} DIFFERENT and UNIQUE REAL places near latitude ${latitude}, longitude ${longitude} for category: "${category}".

IMPORTANT: Each place MUST be completely different with a unique name. NO DUPLICATES. Keep descriptions SHORT (1-2 sentences max).

Return ONLY a valid JSON array:
[
  {
    "place_id": "unique-id-1",
    "name": "Unique Place Name",
    "formatted_address": "Address",
    "geometry": { "location": { "lat": ${latitude + (Math.random() - 0.5) * 0.01}, "lng": ${longitude + (Math.random() - 0.5) * 0.01} } },
    "types": ["tourist_attraction"],
    "rating": 4.2,
    "user_ratings_total": 150,
    "description": "Short 1-2 sentence description",
    "localTip": "Quick tip",
    "handyPhrase": "Useful phrase",
    "category": "attraction"
  }
]

Rules:
- All places MUST be real and near coordinates
- Each MUST have UNIQUE name - NO DUPLICATES
- Keep ALL text SHORT
- ONLY return JSON array, no explanations`;

    try {
      console.log(`🤖 AI generating ${limit} places for ${category} near ${latitude}, ${longitude}`);
      
      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const content = completion.choices[0].message.content;
      console.log(`📝 AI response length: ${content.length} chars`);
      
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in AI response');
        console.error('Response preview:', content.substring(0, 200));
        return [];
      }
      
      let places = JSON.parse(jsonMatch[0]);
      
      // Handle if AI wraps in object (shouldn't happen now)
      if (!Array.isArray(places)) {
        console.error('❌ AI response is not an array');
        return [];
      }
      
      // Deduplicate by name (case-insensitive)
      const seen = new Set();
      const uniquePlaces = [];
      for (const place of places) {
        const key = place.name?.toLowerCase().trim();
        if (key && !seen.has(key)) {
          seen.add(key);
          // Ensure unique ID
          place.place_id = `ai_${Date.now()}_${uniquePlaces.length}`;
          uniquePlaces.push(place);
        }
      }
      
      console.log(`✅ AI generated ${places.length} places, ${uniquePlaces.length} unique`);
      return uniquePlaces;
      
    } catch (error) {
      console.error('❌ AI generation failed:', error.message);
      console.error('Error type:', error.constructor.name);
      if (error.response) {
        console.error('API response:', error.response.status, error.response.data);
      }
      throw error;
    }
  }
}
