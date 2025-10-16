import { TripPlanSuggestion, DailyTripPlan, Activity } from '../types';

interface WeatherContext {
  condition: string;
  temperature: number;
  forecast: string[];
}

interface RouteOptimization {
  totalDistance: string;
  totalTime: string;
  transportModes: string[];
  optimizedOrder: number[];
}

class SmartPlanningService {
  private static instance: SmartPlanningService;
  private config: {
    endpoint: string;
    apiKey: string;
    deploymentName: string;
  };

  private constructor() {
    this.config = {
      endpoint: import.meta.env.VITE_AZURE_OPENAI_ENDPOINT || process.env.AZURE_OPENAI_ENDPOINT || '',
      apiKey: import.meta.env.VITE_AZURE_OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY || '',
      deploymentName: import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4'
    };
  }

  static getInstance(): SmartPlanningService {
    if (!SmartPlanningService.instance) {
      SmartPlanningService.instance = new SmartPlanningService();
    }
    return SmartPlanningService.instance;
  }

  private async makeAzureRequest(prompt: string): Promise<string> {
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=2024-02-15-preview`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'You are an expert travel planner. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  // Dynamic weather-based plan adjustments
  async adaptPlanForWeather(
    originalPlan: TripPlanSuggestion, 
    weather: WeatherContext
  ): Promise<TripPlanSuggestion> {
    try {
      const prompt = `Adapt this trip plan for ${weather.condition} weather (${weather.temperature}°C):

Original Plan: ${JSON.stringify(originalPlan.dailyPlans)}

Weather Forecast: ${weather.forecast.join(', ')}

Rules:
- Replace outdoor activities with indoor alternatives when raining
- Suggest covered/indoor venues for extreme temperatures
- Keep the same time slots and duration
- Maintain the trip's theme and interests

Return JSON with adapted dailyPlans array only.`;

      const result = await this.makeAzureRequest(prompt);
      const adaptedPlans = JSON.parse(result);
      
      return {
        ...originalPlan,
        dailyPlans: adaptedPlans
      };
    } catch (error) {
      console.error('Weather adaptation failed:', error);
      return originalPlan;
    }
  }

  // Generate alternative activities for any time slot
  async generateAlternatives(
    originalActivity: Activity,
    location: string,
    budget: number,
    weather: string
  ): Promise<Activity[]> {
    try {
      const prompt = `Generate 3 alternative activities for:
Original: ${originalActivity.activityTitle} - ${originalActivity.description}
Location: ${location}
Time: ${originalActivity.timeOfDay}
Duration: ${originalActivity.estimatedDuration}
Weather: ${weather}
Budget: $${budget}

Requirements:
- Same time slot and duration
- Weather-appropriate for ${weather}
- Budget-conscious alternatives
- Different activity types (indoor/outdoor/cultural/food)

Return JSON array: [{"activityTitle": "", "description": "", "icon": "", "timeOfDay": "", "estimatedDuration": "", "budgetImpact": 0}]`;

      const result = await this.makeAzureRequest(prompt);
      const alternatives = JSON.parse(result);
      
      return alternatives.map((alt: any) => ({
        ...originalActivity,
        ...alt
      }));
    } catch (error) {
      console.error('Alternative generation failed:', error);
      return [];
    }
  }

  // Optimize route between activities
  async optimizeRoute(
    activities: Activity[],
    startLocation: { lat: number; lng: number }
  ): Promise<RouteOptimization> {
    try {
      // Simulate route optimization (in real app, use Google Maps Directions API)
      const totalActivities = activities.length;
      const estimatedDistance = `${(totalActivities * 2.5).toFixed(1)}km`;
      const estimatedTime = `${Math.ceil(totalActivities * 0.5)}h ${Math.ceil(totalActivities * 15)}min`;
      
      return {
        totalDistance: estimatedDistance,
        totalTime: estimatedTime,
        transportModes: ['walking', 'public_transport'],
        optimizedOrder: activities.map((_, index) => index) // Keep original order for now
      };
    } catch (error) {
      console.error('Route optimization failed:', error);
      return {
        totalDistance: 'Unknown',
        totalTime: 'Unknown', 
        transportModes: ['walking'],
        optimizedOrder: []
      };
    }
  }

  // Budget-aware plan adjustments
  async adjustForBudget(
    plan: TripPlanSuggestion,
    targetBudget: number,
    currentSpend: number
  ): Promise<TripPlanSuggestion> {
    if (currentSpend <= targetBudget) return plan;

    try {
      const prompt = `Adjust this trip plan to fit budget of $${targetBudget} (currently $${currentSpend}):

${JSON.stringify(plan.dailyPlans)}

Strategies:
- Replace expensive activities with budget alternatives
- Suggest free/low-cost options
- Keep must-do experiences, optimize optional ones
- Maintain trip quality and experience

Return JSON with adjusted dailyPlans array.`;

      const result = await this.makeAzureRequest(prompt);
      const adjustedPlans = JSON.parse(result);
      
      return {
        ...plan,
        dailyPlans: adjustedPlans
      };
    } catch (error) {
      console.error('Budget adjustment failed:', error);
      return plan;
    }
  }

  // Real-time context suggestions
  generateContextualSuggestions(
    currentLocation: { lat: number; lng: number },
    timeOfDay: string,
    weather: string,
    nearbyEvents: string[]
  ): string[] {
    const suggestions: string[] = [];
    
    // Time-based suggestions
    if (timeOfDay === 'morning') {
      suggestions.push('🌅 Perfect time for sunrise photography');
      suggestions.push('☕ Local cafes are less crowded now');
    } else if (timeOfDay === 'evening') {
      suggestions.push('🌆 Great time for sunset views');
      suggestions.push('🍽️ Dinner reservations recommended');
    }

    // Weather-based suggestions  
    if (weather.includes('rain')) {
      suggestions.push('☔ Consider indoor museums or shopping');
      suggestions.push('🏛️ Perfect weather for cultural sites');
    } else if (weather.includes('sunny')) {
      suggestions.push('🌞 Ideal for outdoor activities');
      suggestions.push('🏞️ Great day for parks and gardens');
    }

    // Event-based suggestions
    nearbyEvents.forEach(event => {
      suggestions.push(`🎉 ${event} happening nearby`);
    });

    return suggestions;
  }

  // Activity tagging system
  tagActivity(activity: Activity): { priority: 'must-do' | 'optional' | 'flexible'; tags: string[] } {
    const description = activity.description.toLowerCase();
    const title = activity.activityTitle.toLowerCase();
    
    let priority: 'must-do' | 'optional' | 'flexible' = 'optional';
    const tags: string[] = [];

    // Priority detection
    if (description.includes('famous') || description.includes('iconic') || title.includes('must')) {
      priority = 'must-do';
      tags.push('iconic');
    } else if (description.includes('if time') || description.includes('optional')) {
      priority = 'flexible';
      tags.push('time-permitting');
    }

    // Activity type tags
    if (description.includes('museum') || description.includes('gallery')) tags.push('cultural');
    if (description.includes('food') || description.includes('restaurant')) tags.push('dining');
    if (description.includes('outdoor') || description.includes('park')) tags.push('outdoor');
    if (description.includes('shopping') || description.includes('market')) tags.push('shopping');

    return { priority, tags };
  }
}

export const smartPlanningService = SmartPlanningService.getInstance();
export type { WeatherContext, RouteOptimization };