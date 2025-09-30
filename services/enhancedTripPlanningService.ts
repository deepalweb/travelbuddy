import { TripPlanSuggestion, DailyTripPlan, ActivityDetail, TripPace, TravelStyle, BudgetLevel } from '../types';

interface EnhancedPlanningOptions {
  includePracticalInfo: boolean;
  includeTransportDetails: boolean;
  includeCostEstimates: boolean;
  includeTiming: boolean;
  includeAlternatives: boolean;
  travelerProfile: 'family' | 'backpacker' | 'luxury' | 'adventure' | 'general';
  weather: string;
}

class EnhancedTripPlanningService {
  private static instance: EnhancedTripPlanningService;
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

  static getInstance(): EnhancedTripPlanningService {
    if (!EnhancedTripPlanningService.instance) {
      EnhancedTripPlanningService.instance = new EnhancedTripPlanningService();
    }
    return EnhancedTripPlanningService.instance;
  }

  async generateEnhancedTripPlan(
    destination: string,
    duration: string,
    interests: string,
    pace: TripPace,
    travelStyles: TravelStyle[],
    budget: BudgetLevel,
    options: EnhancedPlanningOptions
  ): Promise<TripPlanSuggestion> {
    try {
      const prompt = this.buildEnhancedPrompt(destination, duration, interests, pace, travelStyles, budget, options);
      const planText = await this.makeAzureRequest(prompt);
      return this.parsePlanResponse(planText, destination, duration);
    } catch (error) {
      console.error('Enhanced trip planning failed:', error);
      throw new Error('Failed to generate enhanced trip plan');
    }
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
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private buildEnhancedPrompt(
    destination: string,
    duration: string,
    interests: string,
    pace: TripPace,
    travelStyles: TravelStyle[],
    budget: BudgetLevel,
    options: EnhancedPlanningOptions
  ): string {
    const profileAdjustments = this.getProfileAdjustments(options.travelerProfile);
    const weatherAdjustments = this.getWeatherAdjustments(options.weather);
    
    return `Create a TravelBuddy Trip Template for ${destination} (${duration}).

USE THIS EXACT STRUCTURE:

🌍 DESTINATION OVERVIEW
Title: [Catchy name like "${destination} ${duration} Escape: Culture, Food & Adventure"]
Pace: ${pace}
Weather: ${options.weather}
Budget Range: ${budget} ($X-Y/day)
Best For: ${options.travelerProfile} travelers
${profileAdjustments}

🗓️ DAILY STRUCTURE (for each day):
Day X – [Theme Title]

🕗 Morning – [Activity] (X hrs)
• What to do: [Clear description]
• Transport: [Mode + cost]
• Cost: $X or Free
• Best Time: [When + why]
• Insider Tip: [Local secret/hack]

🕛 Lunch – [Restaurant/Experience] (1 hr)
• Where: [2-3 options]
• Cost: $X-Y
• Good For: [Food type/dietary needs]

🕐 Afternoon – [Activity] (X hrs)
• Highlights: [Main attractions]
• Transport: [Mode + cost]
• Cost: $X or Free
• Best Time: [Optimal timing]

🌅 Evening – [Activity + Dinner] (X hrs)
• Activity: [Sunset/nightlife/show]
• Dinner Options: [2-3 restaurants]
• Cost: $X-Y
• Best Time: [When to go]

🌟 Day-End Summary: [Quick reflection]

🔑 TRIP NOTES:
• Transport Tips: [Apps, safety, fares]
• Packing: [Weather-specific items]
• Safety & Etiquette: [Cultural norms, dress codes]
${weatherAdjustments}

Return as JSON:
{
  "tripTitle": "[Catchy title]",
  "destination": "${destination}",
  "duration": "${duration}",
  "overview": {
    "pace": "${pace}",
    "weather": "${options.weather}",
    "budgetRange": "${budget}",
    "bestFor": "${options.travelerProfile} travelers"
  },
  "dailyPlans": [
    {
      "day": 1,
      "theme": "[Day theme]",
      "activities": [
        {
          "timeSlot": "Morning",
          "title": "[Activity name]",
          "duration": "X hrs",
          "description": "What to do: [description]",
          "transport": "[Mode + cost]",
          "cost": "$X or Free",
          "bestTime": "[When + why]",
          "insiderTip": "[Local tip]",
          "icon": "🕗"
        }
      ],
      "daySummary": "[Reflection]"
    }
  ],
  "tripNotes": {
    "transport": "[Tips]",
    "packing": ["items"],
    "safety": ["cultural norms"]
  }
}`;
  }

  private getProfileAdjustments(profile: string): string {
    const adjustments = {
      family: `
- Include kid-friendly activities and shorter walking distances
- Suggest family restaurants with high chairs
- Add playground/park stops between major attractions
- Recommend stroller-friendly routes`,
      
      backpacker: `
- Focus on budget accommodations and street food
- Include free walking tours and public transport
- Suggest hostels and budget guesthouses
- Add local markets and affordable activities`,
      
      luxury: `
- Recommend boutique hotels and fine dining
- Include spa treatments and premium experiences
- Suggest private tours and luxury transport
- Add exclusive venues and VIP access options`,
      
      adventure: `
- Include outdoor activities and physical challenges
- Suggest hiking trails, water sports, adventure tours
- Add adrenaline activities like zip-lining or rock climbing
- Recommend gear rental locations`,
      
      general: `
- Balance of popular attractions and local experiences
- Mix of different activity types and price ranges
- Suitable for most fitness levels and interests`
    };
    
    return adjustments[profile as keyof typeof adjustments] || adjustments.general;
  }

  private getWeatherAdjustments(weather: string): string {
    if (weather.includes('rain') || weather.includes('storm')) {
      return `
WEATHER ADAPTATIONS (Rainy):
- Prioritize indoor attractions (museums, galleries, shopping)
- Include covered markets and indoor dining
- Suggest umbrella/raincoat rental locations
- Add backup indoor alternatives for each outdoor activity`;
    }
    
    if (weather.includes('hot') || weather.includes('sunny')) {
      return `
WEATHER ADAPTATIONS (Hot/Sunny):
- Schedule outdoor activities for early morning/late afternoon
- Include air-conditioned venues during midday
- Suggest shaded walking routes and covered areas
- Add frequent water/cooling breaks`;
    }
    
    return `
WEATHER ADAPTATIONS:
- Include both indoor and outdoor options
- Mention weather-appropriate clothing
- Suggest flexible timing based on conditions`;
  }

  private parsePlanResponse(planText: string, destination: string, duration: string): TripPlanSuggestion {
    try {
      // Extract JSON from the response
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      const planData = JSON.parse(jsonMatch[0]);
      
      // Ensure required fields and add ID
      return {
        id: `plan_${Date.now()}`,
        tripTitle: planData.tripTitle || `${duration} Trip to ${destination}`,
        destination: destination,
        duration: duration,
        introduction: this.formatOverview(planData.overview, destination),
        dailyPlans: this.processDailyPlans(planData.dailyPlans || []),
        conclusion: `Have an amazing time in ${destination}!`,
        budgetConsiderations: planData.overview?.budgetRange || '',
        packingTips: planData.tripNotes?.packing || [],
        culturalEtiquette: planData.tripNotes?.safety || [],
        transportationTips: [planData.tripNotes?.transport || '']
      };
    } catch (error) {
      console.error('Failed to parse plan response:', error);
      // Return fallback plan
      return this.createFallbackPlan(destination, duration);
    }
  }

  private processDailyPlans(dailyPlans: any[]): DailyTripPlan[] {
    return dailyPlans.map((day, index) => ({
      day: day.day || index + 1,
      title: day.theme || `Day ${index + 1}`,
      theme: day.theme,
      activities: this.processActivities(day.activities || []),
      photoUrl: day.photoUrl
    }));
  }

  private processActivities(activities: any[]): ActivityDetail[] {
    return activities.map(activity => ({
      timeOfDay: activity.timeSlot || 'Morning',
      activityTitle: activity.title || 'Activity',
      description: `${activity.description || ''}

🚗 ${activity.transport || 'Walking'}
💰 ${activity.cost || 'Free'}
⏰ ${activity.bestTime || 'Anytime'}
💡 ${activity.insiderTip || ''}`,
      estimatedDuration: activity.duration || '2 hours',
      location: activity.location,
      icon: activity.icon || '📍',
      category: activity.category || 'Sightseeing',
      effortLevel: 'Easy'
    }));
  }



  private formatBudgetSummary(budgetSummary: any): string {
    if (!budgetSummary) return '';
    
    let summary = `Daily Average: ${budgetSummary.dailyAverage || 'N/A'}\n`;
    summary += `Total Estimated: ${budgetSummary.total || 'N/A'}\n`;
    
    if (budgetSummary.breakdown) {
      summary += '\nBreakdown:\n';
      Object.entries(budgetSummary.breakdown).forEach(([key, value]) => {
        summary += `• ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
      });
    }
    
    return summary;
  }

  private extractTransportTips(dailyPlans: any[]): string[] {
    const tips: string[] = [];
    
    dailyPlans.forEach(day => {
      day.activities?.forEach((activity: any) => {
        if (activity.transportInfo?.tips) {
          tips.push(activity.transportInfo.tips);
        }
      });
    });
    
    return [...new Set(tips)]; // Remove duplicates
  }

  private formatOverview(overview: any, destination: string): string {
    if (!overview) return `Welcome to your ${destination} adventure!`;
    return `🌍 **${destination} Overview**

🏃 **Pace:** ${overview.pace || 'Moderate'}
🌤️ **Weather:** ${overview.weather || 'Pleasant'}
💰 **Budget:** ${overview.budgetRange || 'Mid-range'}
🎯 **Best For:** ${overview.bestFor || 'All travelers'}`;
  }

  private createFallbackPlan(destination: string, duration: string): TripPlanSuggestion {
    return {
      id: `fallback_${Date.now()}`,
      tripTitle: `${duration} Trip to ${destination}`,
      destination,
      duration,
      introduction: `Explore the highlights of ${destination}`,
      dailyPlans: [{
        day: 1,
        title: 'Explore the City',
        activities: [{
          timeOfDay: 'Morning',
          activityTitle: 'City Center Tour',
          description: 'Discover the main attractions and local culture',
          estimatedDuration: '3 hours',
          icon: '🏛️'
        }]
      }],
      conclusion: `Have a wonderful time in ${destination}!`
    };
  }
}

export const enhancedTripPlanningService = EnhancedTripPlanningService.getInstance();