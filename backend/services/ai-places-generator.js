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

    const prompt = `You are a travel expert. Generate ${limit} REAL places near latitude ${latitude}, longitude ${longitude} for category: "${category}".

Return ONLY a valid JSON array with this exact structure:
[
  {
    "place_id": "unique-real-google-place-id-if-known-or-generate-unique-id",
    "name": "Real place name",
    "formatted_address": "Full real address",
    "geometry": { "location": { "lat": ${latitude}, "lng": ${longitude} } },
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
- Include accurate addresses and coordinates
- Provide realistic ratings (3.5-5.0)
- Make descriptions engaging and informative
- No explanations, ONLY the JSON array`;

    try {
      console.log(`🤖 AI generating ${limit} places for ${category} near ${latitude}, ${longitude}`);
      
      const completion = await openai.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      });

      const content = completion.choices[0].message.content;
      let places = JSON.parse(content);
      
      // Handle if AI wraps in object
      if (places.places) places = places.places;
      if (places.results) places = places.results;
      
      console.log(`✅ AI generated ${places.length} places`);
      return places;
      
    } catch (error) {
      console.error('❌ AI generation failed:', error);
      throw error;
    }
  }
}
