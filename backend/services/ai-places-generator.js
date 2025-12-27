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

IMPORTANT: Each place MUST be completely different with a unique name. NO DUPLICATES.

Return ONLY a valid JSON array with this exact structure:
[
  {
    "place_id": "unique-id-${Date.now()}-1",
    "name": "Unique Real Place Name 1",
    "formatted_address": "Full real address",
    "geometry": { "location": { "lat": ${latitude + (Math.random() - 0.5) * 0.01}, "lng": ${longitude + (Math.random() - 0.5) * 0.01} } },
    "types": ["tourist_attraction", "point_of_interest"],
    "rating": 4.2,
    "user_ratings_total": 150,
    "description": "Engaging 2-3 sentence description",
    "localTip": "Useful insider tip",
    "handyPhrase": "Common phrase tourists use here",
    "category": "attraction"
  }
]

Rules:
- All places MUST be real and located near the coordinates
- Each place MUST have a UNIQUE name - NO DUPLICATES
- Include accurate addresses and slightly varied coordinates
- Provide realistic ratings (3.5-5.0)
- Make descriptions engaging and informative
- No explanations, ONLY the JSON array`;

    try {
      console.log(`🤖 AI generating ${limit} places for ${category} near ${latitude}, ${longitude}`);
      
      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000
      });

      const content = completion.choices[0].message.content;
      
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in AI response');
        return [];
      }
      
      let places = JSON.parse(jsonMatch[0]);
      
      // Handle if AI wraps in object (shouldn't happen now)
      if (Array.isArray(places)) {
        console.log(`✅ AI generated ${places.length} places`);
        return places;
      }
      
      console.error('❌ AI response is not an array');
      return [];
      
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      throw error;
    }
  }
}
