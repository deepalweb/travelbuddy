import { TripPlanSuggestion, TripPace, TravelStyle, BudgetLevel } from '../types';
import { azureOpenAIService } from './azureOpenAIService';
import { LOCAL_STORAGE_SAVED_TRIP_PLANS_KEY } from '../constants';

export class TripPlanningService {
  static async createTripPlan(params: {
    destination: string;
    duration: string;
    interests: string;
    pace: TripPace;
    travelStyles: TravelStyle[];
    budget: BudgetLevel;
  }): Promise<TripPlanSuggestion> {
    const { destination, duration, interests, pace, travelStyles, budget } = params;
    
    if (!destination?.trim() || !duration?.trim()) {
      throw new Error('Destination and duration are required');
    }

    try {
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
    } catch (error) {
      console.error('Trip creation failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create trip plan');
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
}