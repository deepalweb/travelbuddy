import { GoogleGenAI } from "@google/genai";
import { Place, UserInterest } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

interface PersonalizedSuggestion {
  id: string;
  name: string;
  category: string;
  description: string;
  rating: number;
  distance: string;
  priceLevel: number;
  isOpen: boolean;
  photoUrl?: string;
  tags: string[];
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'anytime';
  weatherSuitable: 'indoor' | 'outdoor' | 'both';
  socialData?: {
    friendActivity?: string;
    communityRating?: {
      rating: number;
      reviewCount: number;
    };
    isTrending?: boolean;
    trendingLabel?: string;
  };
}

class PersonalizedSuggestionsService {
  private static instance: PersonalizedSuggestionsService;
  private ai: GoogleGenAI;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static getInstance(): PersonalizedSuggestionsService {
    if (!PersonalizedSuggestionsService.instance) {
      PersonalizedSuggestionsService.instance = new PersonalizedSuggestionsService();
    }
    return PersonalizedSuggestionsService.instance;
  }

  async generatePersonalizedSuggestions(
    userLocation: { latitude: number; longitude: number },
    userCity: string,
    userInterests: UserInterest[] = [],
    favoritePlaces: Place[] = [],
    timeOfDay: 'morning' | 'afternoon' | 'evening' = this.getCurrentTimeOfDay(),
    weather: string = 'sunny'
  ): Promise<PersonalizedSuggestion[]> {
    try {
      const model = this.ai.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Generate 4 personalized place suggestions for ${userCity} based on:
- User interests: ${userInterests.join(', ') || 'general travel'}
- Time: ${timeOfDay}
- Weather: ${weather}
- Previous favorites: ${favoritePlaces.map(p => p.name).join(', ') || 'none'}

Return JSON array with format:
[{
  "id": "unique_id",
  "name": "Place Name",
  "category": "food|culture|nature|shopping|entertainment",
  "description": "Brief engaging description (max 80 chars)",
  "rating": 4.5,
  "distance": "0.8km",
  "priceLevel": 2,
  "isOpen": true,
  "tags": ["tag1", "tag2"],
  "timeOfDay": "${timeOfDay}",
  "weatherSuitable": "indoor|outdoor|both"
}]

Make suggestions relevant to ${timeOfDay} and ${weather} weather.`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No valid JSON found');
      
      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions.map((s: any, index: number) => ({
        ...s,
        id: s.id || `suggestion_${Date.now()}_${index}`,
        photoUrl: this.getPlaceholderImage(s.category)
      }));
    } catch (error) {
      console.error('Failed to generate personalized suggestions:', error);
      return this.getFallbackSuggestions(userCity, timeOfDay);
    }
  }

  private getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getPlaceholderImage(category: string): string {
    const images = {
      food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
      culture: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400',
      nature: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400'
    };
    return images[category as keyof typeof images] || images.culture;
  }

  private getFallbackSuggestions(userCity: string, timeOfDay: string): PersonalizedSuggestion[] {
    return [
      {
        id: 'fallback_1',
        name: 'Local Coffee House',
        category: 'food',
        description: 'Cozy spot with artisan coffee and pastries',
        rating: 4.3,
        distance: '0.4km',
        priceLevel: 2,
        isOpen: true,
        tags: ['coffee', 'breakfast'],
        timeOfDay: timeOfDay as any,
        weatherSuitable: 'indoor',
        photoUrl: this.getPlaceholderImage('food')
      },
      {
        id: 'fallback_2',
        name: `${userCity} Cultural Center`,
        category: 'culture',
        description: 'Discover local history and art exhibitions',
        rating: 4.6,
        distance: '1.2km',
        priceLevel: 1,
        isOpen: true,
        tags: ['museum', 'art'],
        timeOfDay: timeOfDay as any,
        weatherSuitable: 'indoor',
        photoUrl: this.getPlaceholderImage('culture')
      }
    ];
  }
}

export const personalizedSuggestionsService = PersonalizedSuggestionsService.getInstance();
export type { PersonalizedSuggestion };