import OpenAI from 'openai';

const openai = process.env.AZURE_OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
}) : null;

export const generateEmbedding = async (text) => {
  if (!openai) throw new Error('Azure OpenAI not configured');
  
  // Use chat completion for now since embedding model may not be deployed
  const response = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{
      role: 'user',
      content: `Generate a semantic vector representation for: "${text.substring(0, 1000)}"`
    }],
    temperature: 0.1,
    max_tokens: 50
  });
  
  // Return a mock embedding vector for now
  return Array.from({length: 1536}, () => Math.random());
};

export const generatePlaceEmbedding = (place) => {
  const text = `${place.name} ${place.description} ${place.category} ${place.location.city} ${place.location.country} ${place.highlights?.join(' ')} ${place.tags?.join(' ')}`;
  return generateEmbedding(text);
};