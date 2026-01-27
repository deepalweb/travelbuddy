import express from 'express';
import { AzureOpenAI } from 'openai';

const router = express.Router();

// Initialize Azure OpenAI
const openai = new AzureOpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: '2024-02-15-preview',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o'
});

// Get coordinates for activities using AI
router.post('/coordinates', async (req, res) => {
  try {
    const { activities, destination } = req.body;
    
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ 
        error: 'Activities array is required' 
      });
    }
    
    console.log(`🤖 AI Coordinate request: ${activities.length} activities in ${destination}`);
    
    // Build activities text
    const activitiesText = activities.map(a => 
      `- ${a.title}${a.address ? ` (${a.address})` : ''}`
    ).join('\n');
    
    const prompt = `You are a location expert. For each activity below in ${destination}, provide ONLY the latitude and longitude coordinates.

Activities:
${activitiesText}

Return ONLY a JSON array with this exact format (no markdown, no explanation):
[{"name":"activity name","lat":6.9271,"lng":79.8612},...]

If you cannot find exact coordinates, provide the best estimate for that location in ${destination}.`;

    // Call Azure OpenAI
    const completion = await openai.chat.completions.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      return res.status(500).json({ error: 'No response from AI' });
    }
    
    // Parse JSON response
    const jsonStr = response.trim()
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
    
    const coordinates = JSON.parse(jsonStr);
    
    console.log(`✅ AI returned ${coordinates.length} coordinates`);
    
    res.json({
      success: true,
      coordinates,
      count: coordinates.length
    });
    
  } catch (error) {
    console.error('❌ AI Coordinate error:', error);
    res.status(500).json({ 
      error: 'Failed to get coordinates',
      message: error.message 
    });
  }
});

export default router;
