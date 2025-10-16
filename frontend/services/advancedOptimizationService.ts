import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';
import { Place } from '../types';

export interface OptimizationRequest {
  places: Place[];
  userLocation: { latitude: number; longitude: number };
  preferences: {
    budget: number;
    timeAvailable: number; // hours
    transportMode: 'walking' | 'driving' | 'public_transport' | 'mixed';
    interests: string[];
    groupSize: number;
    accessibility?: boolean;
  };
  constraints: {
    startTime?: string;
    endTime?: string;
    mustVisit?: string[]; // place IDs
    avoid?: string[]; // place IDs or types
  };
}

export interface OptimizedRoute {
  totalDistance: number;
  totalTime: number;
  totalCost: number;
  efficiency: number; // 0-100 score
  route: OptimizedStop[];
  alternatives: OptimizedRoute[];
  insights: RouteInsights;
}

export interface OptimizedStop {
  place: Place;
  arrivalTime: string;
  departureTime: string;
  duration: number; // minutes
  travelTimeToNext: number; // minutes
  cost: number;
  priority: number; // 1-10
  reasoning: string;
}

export interface RouteInsights {
  bestTimeToStart: string;
  crowdLevels: { [placeId: string]: 'low' | 'medium' | 'high' };
  weatherConsiderations: string[];
  budgetBreakdown: {
    transport: number;
    activities: number;
    food: number;
    total: number;
  };
  timeOptimization: string;
  alternativeOptions: string[];
}

export interface BudgetOptimization {
  originalCost: number;
  optimizedCost: number;
  savings: number;
  recommendations: BudgetRecommendation[];
  alternatives: BudgetAlternative[];
}

export interface BudgetRecommendation {
  type: 'discount' | 'timing' | 'alternative' | 'group_deal';
  description: string;
  savings: number;
  effort: 'low' | 'medium' | 'high';
}

export interface BudgetAlternative {
  name: string;
  description: string;
  cost: number;
  quality: number; // 1-10
  placeId?: string;
}

class AdvancedOptimizationService {
  private genAI: GoogleGenAI;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async optimizeRoute(request: OptimizationRequest): Promise<OptimizedRoute> {
    const cacheKey = this.generateCacheKey('route', request);
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Optimize a travel route with these parameters:

User Location: ${request.userLocation.latitude}, ${request.userLocation.longitude}
Budget: $${request.preferences.budget}
Time Available: ${request.preferences.timeAvailable} hours
Transport: ${request.preferences.transportMode}
Group Size: ${request.preferences.groupSize}
Interests: ${request.preferences.interests.join(', ')}

Places to Consider:
${request.places.map(p => `- ${p.name} (${p.type}) - Rating: ${p.rating} - ${p.vicinity || p.formatted_address}`).join('\n')}

Must Visit: ${request.constraints.mustVisit?.join(', ') || 'None'}
Avoid: ${request.constraints.avoid?.join(', ') || 'None'}

Create an optimized route considering:
1. Travel time and distance
2. Opening hours and crowd levels
3. Budget constraints
4. Interest alignment
5. Logical flow and efficiency

Provide detailed reasoning for each stop and timing.

Format as JSON with fields: route, totalTime, totalCost, efficiency, insights`;

      const result = await model.generateContent(prompt);
      const aiResponse = JSON.parse(result.response.text());

      // Process and enhance AI response
      const optimizedRoute = this.processRouteOptimization(aiResponse, request);
      
      // Cache result for 30 minutes
      setTimeout(() => this.cache.delete(cacheKey), 30 * 60 * 1000);
      this.cache.set(cacheKey, optimizedRoute);

      return optimizedRoute;
    } catch (error) {
      console.error('Route optimization error:', error);
      return this.createFallbackRoute(request);
    }
  }

  async optimizeBudget(
    places: Place[],
    targetBudget: number,
    currency: string = 'USD'
  ): Promise<BudgetOptimization> {
    const cacheKey = this.generateCacheKey('budget', { places, targetBudget, currency });
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const totalEstimatedCost = places.reduce((sum, place) => {
        return sum + this.estimatePlaceCost(place);
      }, 0);

      const prompt = `Optimize travel budget for these places:

Target Budget: ${targetBudget} ${currency}
Current Estimated Cost: ${totalEstimatedCost} ${currency}

Places:
${places.map(p => `- ${p.name} (${p.type}) - Est. Cost: $${this.estimatePlaceCost(p)}`).join('\n')}

Provide budget optimization strategies:
1. Discount opportunities (student, group, senior, etc.)
2. Timing optimizations (off-peak, early bird, etc.)
3. Alternative options with similar value
4. Free or low-cost alternatives
5. Package deals and combinations

Format as JSON with fields: recommendations, alternatives, totalSavings`;

      const result = await model.generateContent(prompt);
      const aiResponse = JSON.parse(result.response.text());

      const budgetOptimization: BudgetOptimization = {
        originalCost: totalEstimatedCost,
        optimizedCost: totalEstimatedCost - (aiResponse.totalSavings || 0),
        savings: aiResponse.totalSavings || 0,
        recommendations: aiResponse.recommendations || [],
        alternatives: aiResponse.alternatives || []
      };

      // Cache result
      setTimeout(() => this.cache.delete(cacheKey), 60 * 60 * 1000);
      this.cache.set(cacheKey, budgetOptimization);

      return budgetOptimization;
    } catch (error) {
      console.error('Budget optimization error:', error);
      return this.createFallbackBudgetOptimization(places, targetBudget);
    }
  }

  async optimizeForAccessibility(
    places: Place[],
    accessibilityNeeds: string[]
  ): Promise<{
    accessiblePlaces: Place[];
    modifications: string[];
    alternatives: Place[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Evaluate accessibility for these places:

Accessibility Needs: ${accessibilityNeeds.join(', ')}

Places:
${places.map(p => `- ${p.name} (${p.type}) at ${p.vicinity || p.formatted_address}`).join('\n')}

Provide:
1. Accessibility assessment for each place
2. Recommended modifications or preparations
3. Alternative accessible options nearby

Format as JSON with fields: accessiblePlaces, modifications, alternatives`;

      const result = await model.generateContent(prompt);
      const aiResponse = JSON.parse(result.response.text());

      return {
        accessiblePlaces: aiResponse.accessiblePlaces || places,
        modifications: aiResponse.modifications || [],
        alternatives: aiResponse.alternatives || []
      };
    } catch (error) {
      console.error('Accessibility optimization error:', error);
      return {
        accessiblePlaces: places,
        modifications: ['Please verify accessibility features directly with venues'],
        alternatives: []
      };
    }
  }

  async optimizeForWeather(
    places: Place[],
    weatherCondition: string,
    date: string
  ): Promise<{
    indoorOptions: Place[];
    weatherAppropriate: Place[];
    recommendations: string[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Optimize places for weather conditions:

Weather: ${weatherCondition}
Date: ${date}

Places:
${places.map(p => `- ${p.name} (${p.type})`).join('\n')}

Categorize places and provide weather-specific recommendations.

Format as JSON with fields: indoorOptions, weatherAppropriate, recommendations`;

      const result = await model.generateContent(prompt);
      const aiResponse = JSON.parse(result.response.text());

      return {
        indoorOptions: aiResponse.indoorOptions || [],
        weatherAppropriate: aiResponse.weatherAppropriate || places,
        recommendations: aiResponse.recommendations || []
      };
    } catch (error) {
      console.error('Weather optimization error:', error);
      return {
        indoorOptions: places.filter(p => p.type?.includes('museum') || p.type?.includes('mall')),
        weatherAppropriate: places,
        recommendations: ['Check weather conditions before visiting outdoor attractions']
      };
    }
  }

  async optimizeForCrowds(
    places: Place[],
    timeOfDay: string,
    dayOfWeek: string
  ): Promise<{
    crowdLevels: { [placeId: string]: 'low' | 'medium' | 'high' };
    bestTimes: { [placeId: string]: string };
    alternatives: string[];
  }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Analyze crowd levels and optimal visit times:

Current Time: ${timeOfDay}
Day: ${dayOfWeek}

Places:
${places.map(p => `- ${p.name} (${p.type})`).join('\n')}

Provide crowd level predictions and best visit times for each place.

Format as JSON with fields: crowdLevels, bestTimes, alternatives`;

      const result = await model.generateContent(prompt);
      const aiResponse = JSON.parse(result.response.text());

      return {
        crowdLevels: aiResponse.crowdLevels || {},
        bestTimes: aiResponse.bestTimes || {},
        alternatives: aiResponse.alternatives || []
      };
    } catch (error) {
      console.error('Crowd optimization error:', error);
      return {
        crowdLevels: {},
        bestTimes: {},
        alternatives: ['Consider visiting popular attractions early morning or late afternoon']
      };
    }
  }

  private processRouteOptimization(aiResponse: any, request: OptimizationRequest): OptimizedRoute {
    const route: OptimizedStop[] = (aiResponse.route || []).map((stop: any, index: number) => ({
      place: request.places.find(p => p.name === stop.placeName) || request.places[index],
      arrivalTime: stop.arrivalTime || '09:00',
      departureTime: stop.departureTime || '10:00',
      duration: stop.duration || 60,
      travelTimeToNext: stop.travelTimeToNext || 15,
      cost: stop.cost || this.estimatePlaceCost(request.places[index]),
      priority: stop.priority || 5,
      reasoning: stop.reasoning || 'Recommended based on your interests'
    }));

    return {
      totalDistance: aiResponse.totalDistance || 10,
      totalTime: aiResponse.totalTime || request.preferences.timeAvailable * 60,
      totalCost: route.reduce((sum, stop) => sum + stop.cost, 0),
      efficiency: aiResponse.efficiency || 75,
      route,
      alternatives: [],
      insights: {
        bestTimeToStart: aiResponse.insights?.bestTimeToStart || '09:00',
        crowdLevels: aiResponse.insights?.crowdLevels || {},
        weatherConsiderations: aiResponse.insights?.weatherConsiderations || [],
        budgetBreakdown: {
          transport: 20,
          activities: route.reduce((sum, stop) => sum + stop.cost, 0) * 0.7,
          food: route.reduce((sum, stop) => sum + stop.cost, 0) * 0.3,
          total: route.reduce((sum, stop) => sum + stop.cost, 0)
        },
        timeOptimization: aiResponse.insights?.timeOptimization || 'Route optimized for minimal travel time',
        alternativeOptions: aiResponse.insights?.alternativeOptions || []
      }
    };
  }

  private createFallbackRoute(request: OptimizationRequest): OptimizedRoute {
    const route: OptimizedStop[] = request.places.slice(0, 5).map((place, index) => ({
      place,
      arrivalTime: `${9 + index * 2}:00`,
      departureTime: `${10 + index * 2}:00`,
      duration: 60,
      travelTimeToNext: 15,
      cost: this.estimatePlaceCost(place),
      priority: 5,
      reasoning: 'Basic route optimization'
    }));

    return {
      totalDistance: 15,
      totalTime: request.preferences.timeAvailable * 60,
      totalCost: route.reduce((sum, stop) => sum + stop.cost, 0),
      efficiency: 60,
      route,
      alternatives: [],
      insights: {
        bestTimeToStart: '09:00',
        crowdLevels: {},
        weatherConsiderations: [],
        budgetBreakdown: {
          transport: 20,
          activities: route.reduce((sum, stop) => sum + stop.cost, 0) * 0.7,
          food: route.reduce((sum, stop) => sum + stop.cost, 0) * 0.3,
          total: route.reduce((sum, stop) => sum + stop.cost, 0)
        },
        timeOptimization: 'Basic time optimization applied',
        alternativeOptions: []
      }
    };
  }

  private createFallbackBudgetOptimization(places: Place[], targetBudget: number): BudgetOptimization {
    const originalCost = places.reduce((sum, place) => sum + this.estimatePlaceCost(place), 0);
    
    return {
      originalCost,
      optimizedCost: Math.min(originalCost, targetBudget),
      savings: Math.max(0, originalCost - targetBudget),
      recommendations: [
        {
          type: 'timing',
          description: 'Visit during off-peak hours for potential discounts',
          savings: originalCost * 0.1,
          effort: 'low'
        },
        {
          type: 'group_deal',
          description: 'Look for group discounts if traveling with others',
          savings: originalCost * 0.15,
          effort: 'medium'
        }
      ],
      alternatives: []
    };
  }

  private estimatePlaceCost(place: Place): number {
    const type = place.type?.toLowerCase() || '';
    
    if (type.includes('museum')) return 15;
    if (type.includes('restaurant')) return 25;
    if (type.includes('park')) return 5;
    if (type.includes('attraction')) return 20;
    if (type.includes('shopping')) return 30;
    
    return 10; // Default cost
  }

  private generateCacheKey(type: string, data: any): string {
    return `${type}_${JSON.stringify(data).slice(0, 100)}_${Date.now()}`;
  }

  // Performance monitoring
  getOptimizationStats(): {
    cacheHitRate: number;
    averageResponseTime: number;
    totalOptimizations: number;
  } {
    return {
      cacheHitRate: 0.75, // Mock data
      averageResponseTime: 1200, // ms
      totalOptimizations: this.cache.size
    };
  }
}

export const advancedOptimizationService = new AdvancedOptimizationService();