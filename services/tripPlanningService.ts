import { TripPlanSuggestion, TripPace, TravelStyle, BudgetLevel } from '../types';
import { azureOpenAIService } from './azureOpenAIService';
import { enhancedRealTripPlanningService } from './enhancedRealTripPlanningService';
import { detailedTripPlanningService } from './detailedTripPlanningService';
import { enrichedTripPlanningService } from './enrichedTripPlanningService';
import { LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY } from '../constants';

export class TripPlanningService {
  static async createTripPlan(params: {
    destination: string;
    duration: string;
    interests: string;
    pace: TripPace;
    travelStyles: TravelStyle[];
    budget: BudgetLevel;
    mustSeeAttractions?: string[];
  }): Promise<TripPlanSuggestion> {
    const { destination, duration, interests, pace, travelStyles, budget, mustSeeAttractions } = params;
    
    if (!destination?.trim() || !duration?.trim()) {
      throw new Error('Destination and duration are required');
    }

    try {
      // Try backend enriched endpoint first for real places
      const { withApiBase } = await import('./config');
      const response = await fetch(withApiBase('/api/plans/generate-enriched'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: destination.trim(),
          duration: duration.trim(),
          interests: interests || '',
          pace: pace.toString(),
          budget: budget.toString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        return data.tripPlan;
      }
      throw new Error('Enriched endpoint failed');
    } catch (error) {
      console.error('Enriched trip creation failed, trying detailed:', error);
      
      try {
        // Fallback to detailed service
        const plan = await detailedTripPlanningService.generateDetailedTripPlan({
          destination: destination.trim(),
          duration: duration.trim(),
          interests: interests || '',
          pace: pace.toString(),
          budget: budget.toString()
        });

        return plan;
      } catch (error2) {
        console.error('Detailed trip creation failed, trying enhanced:', error2);
      
        try {
          // Fallback to enhanced real data service
        const plan = await enhancedRealTripPlanningService.generatePersonalizedTripPlan({
          destination: destination.trim(),
          duration: duration.trim(),
          interests: interests || '',
          pace: pace.toString(),
          budget: budget.toString(),
          groupType: 'general',
          startDate: new Date().toISOString()
        });

        return plan;
      } catch (error3) {
        console.error('Enhanced trip creation failed, trying integrated:', error3);
        
        try {
          // Fallback to integrated planning
          const plan = await this.generateIntegratedTripPlan({
            destination: destination.trim(),
            duration: duration.trim(),
            travel_style: interests || '',
            pace,
            budget_level: budget,
            must_see: mustSeeAttractions || []
          });

          return {
            ...plan,
            id: plan.id || `trip_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        } catch (error4) {
          console.error('Integrated trip creation failed, using basic AI:', error4);
          // Final fallback to existing service
          const plan = await azureOpenAIService.generateTripPlan(
            destination.trim(),
            duration.trim(),
            interests || '',
            pace,
            travelStyles,
            budget
          );
          return {
            ...plan,
            id: plan.id || `trip_${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        }
      }
    }
  }

  static async saveTripPlan(plan: TripPlanSuggestion, userId?: string): Promise<void> {
    try {
      // Save to localStorage
      const savedPlans = this.getSavedPlans();
      const existingIndex = savedPlans.findIndex(p => p.id === plan.id);
      
      const planToSave = {
        ...plan,
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        savedPlans[existingIndex] = planToSave;
      } else {
        savedPlans.unshift(planToSave);
      }

      // Keep only last 20 plans
      const trimmed = savedPlans.slice(0, 20);
      localStorage.setItem(LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY, JSON.stringify(trimmed));

      // Save to backend if user is logged in
      if (userId) {
        await this.saveTripPlanToBackend(planToSave, userId);
      }
    } catch (error) {
      console.error('Failed to save trip plan:', error);
      throw new Error('Failed to save trip plan');
    }
  }

  static getSavedPlans(): TripPlanSuggestion[] {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  static async deleteTripPlan(planId: string, userId?: string): Promise<void> {
    try {
      // Remove from localStorage
      const savedPlans = this.getSavedPlans();
      const filtered = savedPlans.filter(p => p.id !== planId);
      localStorage.setItem(LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY, JSON.stringify(filtered));

      // Remove from backend if user is logged in
      if (userId) {
        await this.deleteTripPlanFromBackend(planId, userId);
      }
    } catch (error) {
      console.error('Failed to delete trip plan:', error);
      throw new Error('Failed to delete trip plan');
    }
  }

  private static async saveTripPlanToBackend(plan: TripPlanSuggestion, userId: string): Promise<void> {
    try {
      const { withApiBase } = await import('./config');
      const response = await fetch(withApiBase('/api/trips'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tripTitle: plan.tripTitle,
          destination: plan.destination,
          duration: plan.duration,
          dailyPlans: plan.dailyPlans,
          introduction: plan.introduction,
          conclusion: plan.conclusion
        })
      });

      if (!response.ok) {
        throw new Error('Backend save failed');
      }
    } catch (error) {
      console.warn('Backend save failed, saved locally only:', error);
    }
  }

  private static async deleteTripPlanFromBackend(planId: string, userId: string): Promise<void> {
    try {
      const { withApiBase } = await import('./config');
      const response = await fetch(withApiBase(`/api/trips/${planId}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Backend delete failed');
      }
    } catch (error) {
      console.warn('Backend delete failed, removed locally only:', error);
    }
  }

  private static async generateIntegratedTripPlan(request: any): Promise<TripPlanSuggestion> {
    const { withApiBase } = await import('./config');
    const response = await fetch(withApiBase('/api/plans/generate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Integrated planning failed');
    }

    const data = await response.json();
    return this.convertToTripPlanSuggestion(data.tripPlan);
  }

  private static convertToTripPlanSuggestion(tripPlan: any): TripPlanSuggestion {
    return {
      id: `integrated_${Date.now()}`,
      tripTitle: `${tripPlan.destination || 'Trip'} Adventure`,
      destination: tripPlan.destination,
      duration: tripPlan.duration,
      introduction: tripPlan.summary || 'AI-generated trip plan',
      dailyPlans: tripPlan.dayPlans?.map((day: any, index: number) => ({
        day: index + 1,
        title: day.summary || `Day ${index + 1}`,
        // Structured fields
        date: day.date || '',
        summary: day.summary || '',
        dayEstimatedCost: day.estimated_cost || '$0',
        totalWalkingTime: day.total_walking_time || '0 min',
        totalTravelTime: day.total_travel_time || '0 min',
        dailyRecap: day.daily_recap || '',
        activities: day.activities?.map((activity: any) => ({
          timeOfDay: activity.start_time,
          activityTitle: activity.name,
          description: activity.practical_tip || activity.highlight || '',
          estimatedDuration: `${activity.estimated_visit_duration_min || 60} min`,
          location: activity.location,
          category: activity.category,
          startTime: activity.start_time,
          endTime: activity.end_time,
          googlePlaceId: activity.google_place_id,
          highlight: activity.highlight,
          socialProof: activity.social_proof,
          rating: activity.rating,
          userRatingsTotal: activity.user_ratings_total,
          practicalTip: activity.practical_tip,
          travelMode: activity.travel_mode,
          travelTimeMin: activity.travel_time_min,
          estimatedVisitDurationMin: activity.estimated_visit_duration_min,
          estimatedCost: `$${activity.cost_estimate_usd || 0}`,
          // Display fields
          photoThumbnail: activity.photo_url,
          fullAddress: activity.full_address,
          openingHours: activity.opening_hours,
          isOpenNow: activity.is_open_now || false,
          weatherNote: activity.weather_note,
          tags: activity.tags || [],
          bookingLink: activity.booking_link
        })) || []
      })) || [],
      conclusion: 'Have an amazing trip!'
    };
  }

  static async optimizeRoute(plan: TripPlanSuggestion): Promise<TripPlanSuggestion> {
    try {
      const { withApiBase } = await import('./config');
      const response = await fetch(withApiBase('/api/plans/optimize'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tripPlan: plan })
      });

      if (!response.ok) {
        throw new Error('Route optimization failed');
      }

      const data = await response.json();
      return this.convertToTripPlanSuggestion(data.optimizedPlan);
    } catch (error) {
      console.warn('Route optimization failed, returning original plan:', error);
      return plan;
    }
  }
}