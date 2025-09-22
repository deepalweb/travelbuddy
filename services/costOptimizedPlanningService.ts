import { TripPlanSuggestion, Place } from '../types.ts';
import { aiCache } from './aiCacheService.ts';
import { generateContentWithRetry } from './geminiService.ts';
import { GEMINI_MODEL_TEXT } from '../constants.ts';

class CostOptimizedPlanningService {
  // Use templates for common scenarios to reduce AI calls
  private static readonly PLAN_TEMPLATES = {
    'city-1day': {
      morning: 'Historic city center exploration',
      lunch: 'Local restaurant experience', 
      afternoon: 'Cultural museum visit',
      evening: 'Scenic viewpoint for sunset'
    },
    'nature-1day': {
      morning: 'National park hiking trail',
      lunch: 'Picnic in scenic area',
      afternoon: 'Wildlife observation',
      evening: 'Campfire or stargazing'
    }
  };

  static async generateOptimizedPlan(
    destination: string,
    duration: string,
    interests: string,
    places: Place[]
  ): Promise<TripPlanSuggestion> {
    
    // Check cache first
    const cacheKey = aiCache.generateKey('trip', { destination, duration, interests });
    const cached = aiCache.get<TripPlanSuggestion>(cacheKey);
    if (cached) {
      console.log('🎯 Using cached trip plan');
      return cached;
    }

    // Try template-based generation first (no AI cost)
    const templatePlan = this.tryTemplateGeneration(destination, duration, interests, places);
    if (templatePlan) {
      aiCache.set(cacheKey, templatePlan, 'itinerary');
      return templatePlan;
    }

    // Fallback to AI with minimal prompt
    const minimalPrompt = `Create 1-day plan for ${destination}. Interests: ${interests}. 
    Return JSON: {"title":"","dailyPlans":[{"day":1,"title":"","activities":[{"timeOfDay":"Morning","activityTitle":"","description":"","estimatedDuration":"2h"}]}]}`;

    try {
      const response = await generateContentWithRetry({
        model: GEMINI_MODEL_TEXT,
        contents: minimalPrompt,
        config: { responseMimeType: 'application/json' }
      });

      const plan = JSON.parse(response.text || '{}');
      const fullPlan: TripPlanSuggestion = {
        id: `plan_${Date.now()}`,
        tripTitle: plan.title || `${duration} in ${destination}`,
        destination,
        duration,
        introduction: `Explore ${destination} with this optimized itinerary.`,
        dailyPlans: plan.dailyPlans || [],
        conclusion: `Enjoy your time in ${destination}!`
      };

      aiCache.set(cacheKey, fullPlan, 'itinerary');
      return fullPlan;
    } catch (error) {
      return this.getFallbackPlan(destination, duration);
    }
  }

  private static tryTemplateGeneration(
    destination: string, 
    duration: string, 
    interests: string,
    places: Place[]
  ): TripPlanSuggestion | null {
    
    const templateKey = interests.includes('nature') ? 'nature-1day' : 'city-1day';
    const template = this.PLAN_TEMPLATES[templateKey];
    
    if (!template || places.length < 3) return null;

    return {
      id: `template_${Date.now()}`,
      tripTitle: `${duration} ${destination} Adventure`,
      destination,
      duration,
      introduction: `Discover ${destination} with this curated ${duration} experience.`,
      dailyPlans: [{
        day: 1,
        title: 'Full Day Exploration',
        activities: [
          {
            timeOfDay: 'Morning',
            activityTitle: places[0]?.name || template.morning,
            description: places[0]?.description || 'Start your day with exploration',
            estimatedDuration: '2-3 hours'
          },
          {
            timeOfDay: 'Afternoon', 
            activityTitle: places[1]?.name || template.afternoon,
            description: places[1]?.description || 'Continue your adventure',
            estimatedDuration: '2-3 hours'
          },
          {
            timeOfDay: 'Evening',
            activityTitle: places[2]?.name || template.evening,
            description: places[2]?.description || 'End your day perfectly',
            estimatedDuration: '1-2 hours'
          }
        ]
      }],
      conclusion: `Have a wonderful time exploring ${destination}!`
    };
  }

  private static getFallbackPlan(destination: string, duration: string): TripPlanSuggestion {
    return {
      id: `fallback_${Date.now()}`,
      tripTitle: `${duration} in ${destination}`,
      destination,
      duration,
      introduction: `Explore the highlights of ${destination}.`,
      dailyPlans: [{
        day: 1,
        title: 'City Exploration',
        activities: [{
          timeOfDay: 'All Day',
          activityTitle: `Discover ${destination}`,
          description: 'Explore the main attractions and local culture',
          estimatedDuration: '6-8 hours'
        }]
      }],
      conclusion: `Enjoy your visit to ${destination}!`
    };
  }
}

export const costOptimizedPlanning = CostOptimizedPlanningService;