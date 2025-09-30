import { TripPlanSuggestion, DailyTripPlan, ActivityDetail, TripPace, TravelStyle, BudgetLevel } from '../types';
import { withApiBase } from './config';

class AzureOpenAIService {
  private static instance: AzureOpenAIService;

  private constructor() {}

  static getInstance(): AzureOpenAIService {
    if (!AzureOpenAIService.instance) {
      AzureOpenAIService.instance = new AzureOpenAIService();
    }
    return AzureOpenAIService.instance;
  }

  private async makeTripPlanRequest(
    destination: string,
    duration: string,
    interests: string,
    pace: TripPace,
    travelStyles: TravelStyle[],
    budget: BudgetLevel
  ): Promise<TripPlanSuggestion> {
    const response = await fetch(withApiBase('/api/ai/generate-trip-plan'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        destination,
        duration,
        interests,
        pace,
        travelStyles,
        budget
      })
    });

    if (!response.ok) {
      throw new Error(`Backend AI API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  async generateTripPlan(
    destination: string,
    duration: string,
    interests: string,
    pace: TripPace,
    travelStyles: TravelStyle[],
    budget: BudgetLevel
  ): Promise<TripPlanSuggestion> {
    const prompt = `Create a detailed trip plan for ${destination} (${duration}) with rich local insights.

User preferences:
- Interests: ${interests}
- Pace: ${pace}
- Travel styles: ${travelStyles.join(', ')}
- Budget: ${budget}

Return JSON with this structure:
{
  "tripTitle": "Creative title with theme: Duration in Destination",
  "destination": "${destination}",
  "duration": "${duration}",
  "introduction": "Engaging 2-3 sentence introduction",
  "dailyPlans": [
    {
      "day": 1,
      "title": "Day 1: Descriptive theme",
      "theme": "Daily theme like 'Historic Charm & Local Flavors'",
      "activities": [
        {
          "timeOfDay": "Morning/Afternoon/Evening with duration (2-3 hours)",
          "activityTitle": "Specific activity with location",
          "description": "Rich description with practical tips, transport info, costs, timing advice. Include emojis for transport 🚗, costs 💰, timing ⏰. Format: Main description. 🚗 Transport: Details 💰 Cost: Amount 🏛️ Best Time: When | Avoid: When not to go.",
          "estimatedDuration": "2-3 hours",
          "icon": "🏛️",
          "category": "Sightseeing",
          "effortLevel": "Easy"
        }
      ]
    }
  ],
  "conclusion": "Warm closing message"
}

Make descriptions detailed with local tips, transport, costs, and timing advice like the reference format.`;

    try {
      const tripPlan = await this.makeTripPlanRequest(
        destination,
        duration,
        interests,
        pace,
        travelStyles,
        budget
      );
      
      // Process the response to ensure it matches our interface
      return {
        ...tripPlan,
        dailyPlans: this.processDailyPlans(tripPlan.dailyPlans || [])
      };
    } catch (error) {
      console.error('Trip plan generation failed:', error);
      return this.createFallbackPlan(destination, duration);
    }
  }

  private processDailyPlans(dailyPlans: any[]): DailyTripPlan[] {
    return dailyPlans.map((day, index) => ({
      day: day.day || index + 1,
      title: day.title || `Day ${index + 1}`,
      theme: day.theme,
      activities: this.processActivities(day.activities || [])
    }));
  }

  private processActivities(activities: any[]): ActivityDetail[] {
    return activities.map(activity => ({
      timeOfDay: activity.timeOfDay || 'Morning',
      activityTitle: activity.activityTitle || 'Activity',
      description: activity.description || 'Explore and enjoy',
      estimatedDuration: activity.estimatedDuration || '2 hours',
      icon: activity.icon || '📍',
      category: activity.category || 'Sightseeing',
      effortLevel: activity.effortLevel || 'Easy'
    }));
  }

  private createFallbackPlan(destination: string, duration: string): TripPlanSuggestion {
    return {
      id: `fallback_${Date.now()}`,
      tripTitle: `Essential ${duration} in ${destination}`,
      destination,
      duration,
      introduction: `Discover the must-see highlights of ${destination} with this essential itinerary`,
      dailyPlans: [{
        day: 1,
        title: 'Day 1: City Highlights',
        theme: 'Essential Sights & Local Culture',
        activities: [{
          timeOfDay: 'Morning (3-4 hours)',
          activityTitle: 'Historic City Center Exploration',
          description: `Start your ${destination} adventure by exploring the historic city center. Walk through the main squares, admire the architecture, and soak in the local atmosphere. 🚗 Transport: Walking or local transport 💰 Cost: Free-$10 ⏰ Best Time: 9:00 AM - 12:00 PM | Avoid: Midday heat in summer`,
          estimatedDuration: '3-4 hours',
          icon: '🏛️',
          category: 'Sightseeing',
          effortLevel: 'Easy'
        }]
      }],
      conclusion: `Enjoy your memorable time exploring ${destination}!`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

export const azureOpenAIService = AzureOpenAIService.getInstance();