import { GoogleGenAI } from "@google/genai";
import { Place } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

interface PlaceEnhancement {
  aiSummary: string;
  badges: string[];
  highlights: string[];
  bestTimeToVisit: string;
  crowdLevel: 'Low' | 'Medium' | 'High';
  budgetLevel: 'Budget' | 'Mid-range' | 'Expensive';
}

class PlaceEnhancementService {
  private static instance: PlaceEnhancementService;
  private ai: GoogleGenAI;
  private cache = new Map<string, PlaceEnhancement>();

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static getInstance(): PlaceEnhancementService {
    if (!PlaceEnhancementService.instance) {
      PlaceEnhancementService.instance = new PlaceEnhancementService();
    }
    return PlaceEnhancementService.instance;
  }

  async enhancePlace(place: Place): Promise<PlaceEnhancement> {
    const cacheKey = place.id || place.name;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const model = this.ai.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Enhance this place with traveler insights:
Name: ${place.name}
Type: ${place.type}
Rating: ${place.rating}
Description: ${place.description || 'No description'}

Generate JSON:
{
  "aiSummary": "Engaging 60-char summary for travelers",
  "badges": ["Hidden Gem", "Local Favorite", "Instagram Worthy", "Family Friendly", "Budget Friendly"],
  "highlights": ["Key feature 1", "Key feature 2", "Key feature 3"],
  "bestTimeToVisit": "Morning/Afternoon/Evening/Anytime",
  "crowdLevel": "Low/Medium/High",
  "budgetLevel": "Budget/Mid-range/Expensive"
}

Focus on what makes this place special for travelers.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found');
      
      const enhancement = JSON.parse(jsonMatch[0]);
      
      // Validate and clean the response
      const cleanEnhancement: PlaceEnhancement = {
        aiSummary: enhancement.aiSummary?.slice(0, 80) || this.getFallbackSummary(place),
        badges: (enhancement.badges || []).slice(0, 3),
        highlights: (enhancement.highlights || []).slice(0, 3),
        bestTimeToVisit: enhancement.bestTimeToVisit || 'Anytime',
        crowdLevel: ['Low', 'Medium', 'High'].includes(enhancement.crowdLevel) ? enhancement.crowdLevel : 'Medium',
        budgetLevel: ['Budget', 'Mid-range', 'Expensive'].includes(enhancement.budgetLevel) ? enhancement.budgetLevel : 'Mid-range'
      };

      this.cache.set(cacheKey, cleanEnhancement);
      return cleanEnhancement;
    } catch (error) {
      console.error('Failed to enhance place:', error);
      return this.getFallbackEnhancement(place);
    }
  }

  private getFallbackSummary(place: Place): string {
    const type = place.type?.toLowerCase() || '';
    if (type.includes('restaurant') || type.includes('food')) {
      return 'Great dining experience with local flavors';
    }
    if (type.includes('museum') || type.includes('culture')) {
      return 'Rich cultural experience and historical insights';
    }
    if (type.includes('park') || type.includes('nature')) {
      return 'Beautiful natural setting perfect for relaxation';
    }
    return 'Interesting place worth visiting';
  }

  private getFallbackEnhancement(place: Place): PlaceEnhancement {
    const badges = [];
    if (place.rating && place.rating >= 4.5) badges.push('Highly Rated');
    if (place.user_ratings_total && place.user_ratings_total < 100) badges.push('Hidden Gem');
    if (place.price_level === 0) badges.push('Budget Friendly');

    return {
      aiSummary: this.getFallbackSummary(place),
      badges: badges.slice(0, 2),
      highlights: ['Popular destination', 'Worth visiting', 'Good reviews'],
      bestTimeToVisit: 'Anytime',
      crowdLevel: 'Medium',
      budgetLevel: place.price_level === 0 ? 'Budget' : place.price_level >= 3 ? 'Expensive' : 'Mid-range'
    };
  }

  getBadgeColor(badge: string): string {
    const colors = {
      'Hidden Gem': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'Local Favorite': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Instagram Worthy': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      'Family Friendly': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Budget Friendly': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Highly Rated': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return colors[badge as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export const placeEnhancementService = PlaceEnhancementService.getInstance();
export type { PlaceEnhancement };