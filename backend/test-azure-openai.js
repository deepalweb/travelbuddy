import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

console.log('Environment Variables:');
console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT || 'MISSING');
console.log('AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? 'SET' : 'MISSING');
console.log('AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'MISSING');

if (!process.env.AZURE_OPENAI_API_KEY) {
  console.log('❌ Azure OpenAI not configured');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
  defaultQuery: { 'api-version': '2024-02-15-preview' },
  defaultHeaders: {
    'api-key': process.env.AZURE_OPENAI_API_KEY,
  },
});

try {
  const completion = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 10
  });
  console.log('✅ Azure OpenAI working:', completion.choices[0].message.content);
} catch (error) {
  console.log('❌ Azure OpenAI failed:', error.message);
}