const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Azure OpenAI endpoint
app.post('/api/ai/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // Use built-in fetch (Node 18+)
    const response = await fetch(
      `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version=2025-01-01-preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a travel planning expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 2000,
          temperature: 0.7
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Azure AI failed: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    let jsonData = null;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('JSON parsing failed:', e.message);
    }

    res.json({
      text: text,
      itinerary: jsonData,
      model: 'azure-gpt-4.1',
      processingTime: Date.now() - Date.now()
    });

  } catch (error) {
    console.error('Azure AI error:', error);
    res.json({
      text: '{"activities":[{"name":"Explore City Center","type":"landmark","startTime":"09:00","endTime":"11:00","description":"Discover main attractions","cost":"Free","tips":["Start early"]}]}',
      itinerary: {"activities":[{"name":"Explore City Center","type":"landmark","startTime":"09:00","endTime":"11:00","description":"Discover main attractions","cost":"Free","tips":["Start early"]}]},
      model: 'fallback',
      processingTime: 1,
      fallback: true,
      originalError: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});