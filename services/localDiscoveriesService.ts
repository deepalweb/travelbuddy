import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';

interface LocalDiscovery {
  hiddenGem: {
    name: string;
    description: string;
  };
  foodCulture: {
    name: string;
    description: string;
    location: string;
  };
  insiderTip: string;
}

class LocalDiscoveriesService {
  private static instance: LocalDiscoveriesService;
  private ai: GoogleGenAI;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static getInstance(): LocalDiscoveriesService {
    if (!LocalDiscoveriesService.instance) {
      LocalDiscoveriesService.instance = new LocalDiscoveriesService();
    }
    return LocalDiscoveriesService.instance;
  }

  async generateLocalDiscoveries(userCity: string): Promise<LocalDiscovery> {
    try {
      const model = this.ai.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Generate local discoveries for ${userCity}. Return JSON with format:
{
  "hiddenGem": {
    "name": "Actual hidden gem place name",
    "description": "Brief description (max 80 chars)"
  },
  "foodCulture": {
    "name": "Local food/dish name",
    "description": "Brief description (max 60 chars)",
    "location": "Specific restaurant/place name"
  },
  "insiderTip": "Practical local tip (max 100 chars)"
}

Focus on authentic, lesser-known places and genuine local insights for ${userCity}.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found');
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Failed to generate local discoveries:', error);
      return this.getFallbackDiscoveries(userCity);
    }
  }

  private getFallbackDiscoveries(userCity: string): LocalDiscovery {
    return {
      hiddenGem: {
        name: `${userCity} Local Park`,
        description: "A peaceful spot often overlooked by tourists"
      },
      foodCulture: {
        name: "Local Street Food",
        description: "Traditional dish popular with locals",
        location: "Local Market Area"
      },
      insiderTip: `Visit ${userCity}'s main attractions early morning to avoid crowds`
    };
  }
}

export const localDiscoveriesService = LocalDiscoveriesService.getInstance();
export type { LocalDiscovery };