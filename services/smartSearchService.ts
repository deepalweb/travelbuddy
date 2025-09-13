import { GoogleGenAI } from "@google/genai";
import { Place } from '../types';
import { GEMINI_MODEL_TEXT } from '../constants';

interface SmartFilter {
  id: string;
  label: string;
  icon: string;
  filter: (place: Place) => boolean;
}

interface SortOption {
  id: string;
  label: string;
  icon: string;
  sort: (a: Place, b: Place) => number;
}

class SmartSearchService {
  private static instance: SmartSearchService;
  private ai: GoogleGenAI;

  private constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  static getInstance(): SmartSearchService {
    if (!SmartSearchService.instance) {
      SmartSearchService.instance = new SmartSearchService();
    }
    return SmartSearchService.instance;
  }

  getSmartFilters(): SmartFilter[] {
    return [
      {
        id: 'open_now',
        label: 'Open now',
        icon: '🕐',
        filter: (place) => place.opening_hours?.open_now === true
      },
      {
        id: 'kid_friendly',
        label: 'Kid-friendly',
        icon: '👶',
        filter: (place) => {
          const desc = (place.description || '').toLowerCase();
          return desc.includes('family') || desc.includes('kid') || desc.includes('child') || place.type?.includes('park');
        }
      },
      {
        id: 'free_entry',
        label: 'Free entry',
        icon: '🆓',
        filter: (place) => place.price_level === 0 || (place.description || '').toLowerCase().includes('free')
      },
      {
        id: 'good_for_groups',
        label: 'Good for groups',
        icon: '👥',
        filter: (place) => {
          const desc = (place.description || '').toLowerCase();
          return desc.includes('group') || desc.includes('large') || place.type?.includes('restaurant');
        }
      }
    ];
  }

  getSortOptions(): SortOption[] {
    return [
      {
        id: 'closest',
        label: 'Closest first',
        icon: '📍',
        sort: (a, b) => {
          const distA = parseFloat(a.distance || '999');
          const distB = parseFloat(b.distance || '999');
          return distA - distB;
        }
      },
      {
        id: 'highest_rated',
        label: 'Highest rated',
        icon: '⭐',
        sort: (a, b) => (b.rating || 0) - (a.rating || 0)
      },
      {
        id: 'hidden_gems',
        label: 'Hidden gems',
        icon: '💎',
        sort: (a, b) => {
          // High rating but low review count = hidden gem
          const scoreA = (a.rating || 0) / Math.log((a.user_ratings_total || 1) + 1);
          const scoreB = (b.rating || 0) / Math.log((b.user_ratings_total || 1) + 1);
          return scoreB - scoreA;
        }
      },
      {
        id: 'trending',
        label: 'Trending',
        icon: '🔥',
        sort: (a, b) => {
          // More recent reviews + higher rating = trending
          const scoreA = (a.rating || 0) * (a.user_ratings_total || 1);
          const scoreB = (b.rating || 0) * (b.user_ratings_total || 1);
          return scoreB - scoreA;
        }
      }
    ];
  }

  async interpretAISearch(query: string, userLocation?: { latitude: number; longitude: number }): Promise<{
    searchTerms: string[];
    filters: string[];
    intent: string;
  }> {
    try {
      const model = this.ai.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Interpret this travel search query: "${query}"

Extract:
1. Search terms (places, activities, types)
2. Applicable filters (open_now, kid_friendly, free_entry, good_for_groups)
3. User intent (what they're looking for)

Return JSON:
{
  "searchTerms": ["term1", "term2"],
  "filters": ["filter_id"],
  "intent": "brief description"
}

Examples:
"best 3 spots for sunset near me" → {"searchTerms": ["sunset", "viewpoint", "scenic"], "filters": [], "intent": "scenic sunset viewing locations"}
"free activities for kids" → {"searchTerms": ["activities", "playground", "park"], "filters": ["free_entry", "kid_friendly"], "intent": "free family activities"}`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No valid JSON found');
      
      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('AI search interpretation failed:', error);
      return {
        searchTerms: [query],
        filters: [],
        intent: 'general search'
      };
    }
  }

  getContextualSuggestions(weather: string, timeOfDay: 'morning' | 'afternoon' | 'evening'): SmartFilter[] {
    const contextFilters: SmartFilter[] = [];

    // Weather-based suggestions
    if (weather.toLowerCase().includes('rain')) {
      contextFilters.push({
        id: 'indoor',
        label: 'Indoor activities',
        icon: '🏠',
        filter: (place) => {
          const type = (place.type || '').toLowerCase();
          return type.includes('museum') || type.includes('mall') || type.includes('restaurant') || type.includes('cafe');
        }
      });
    }

    if (weather.toLowerCase().includes('sunny')) {
      contextFilters.push({
        id: 'outdoor',
        label: 'Outdoor activities',
        icon: '☀️',
        filter: (place) => {
          const type = (place.type || '').toLowerCase();
          return type.includes('park') || type.includes('beach') || type.includes('garden') || type.includes('outdoor');
        }
      });
    }

    // Time-based suggestions
    if (timeOfDay === 'morning') {
      contextFilters.push({
        id: 'breakfast',
        label: 'Breakfast spots',
        icon: '🥐',
        filter: (place) => {
          const type = (place.type || '').toLowerCase();
          const desc = (place.description || '').toLowerCase();
          return type.includes('cafe') || desc.includes('breakfast') || desc.includes('coffee');
        }
      });
    }

    if (timeOfDay === 'evening') {
      contextFilters.push({
        id: 'nightlife',
        label: 'Evening activities',
        icon: '🌙',
        filter: (place) => {
          const type = (place.type || '').toLowerCase();
          return type.includes('bar') || type.includes('restaurant') || type.includes('entertainment');
        }
      });
    }

    return contextFilters;
  }
}

export const smartSearchService = SmartSearchService.getInstance();
export type { SmartFilter, SortOption };