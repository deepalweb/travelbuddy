import { GoogleGenAI } from "@google/genai";
import { GEMINI_MODEL_TEXT } from '../constants';

export interface CollaborativeTripPlan {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  collaborators: TripCollaborator[];
  activities: CollaborativeActivity[];
  budget: CollaborativeBudget;
  status: 'planning' | 'confirmed' | 'active' | 'completed';
  createdBy: string;
  createdAt: string;
  lastModified: string;
}

export interface TripCollaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'invited' | 'accepted' | 'declined';
  preferences: {
    budget: number;
    interests: string[];
    dietaryRestrictions?: string[];
  };
}

export interface CollaborativeActivity {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  time: string;
  duration: number;
  cost: number;
  votes: ActivityVote[];
  suggestedBy: string;
  status: 'proposed' | 'voting' | 'approved' | 'rejected';
  alternatives?: CollaborativeActivity[];
}

export interface ActivityVote {
  userId: string;
  vote: 'yes' | 'no' | 'maybe';
  comment?: string;
  timestamp: string;
}

export interface CollaborativeBudget {
  total: number;
  currency: string;
  breakdown: {
    accommodation: number;
    food: number;
    activities: number;
    transport: number;
    other: number;
  };
  contributions: BudgetContribution[];
}

export interface BudgetContribution {
  userId: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'paid';
}

export interface RealTimeUpdate {
  type: 'activity_added' | 'activity_voted' | 'budget_updated' | 'collaborator_joined' | 'message_sent';
  data: any;
  userId: string;
  timestamp: string;
}

class RealTimeCollaborationService {
  private genAI: GoogleGenAI;
  private wsConnections: Map<string, any> = new Map();
  private tripPlans: Map<string, CollaborativeTripPlan> = new Map();

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  // Trip Management
  async createCollaborativeTrip(
    title: string,
    destination: string,
    startDate: string,
    endDate: string,
    creatorId: string,
    creatorName: string
  ): Promise<CollaborativeTripPlan> {
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const trip: CollaborativeTripPlan = {
      id: tripId,
      title,
      destination,
      startDate,
      endDate,
      collaborators: [{
        id: creatorId,
        name: creatorName,
        email: '',
        role: 'owner',
        status: 'accepted',
        preferences: {
          budget: 1000,
          interests: []
        }
      }],
      activities: [],
      budget: {
        total: 0,
        currency: 'USD',
        breakdown: {
          accommodation: 0,
          food: 0,
          activities: 0,
          transport: 0,
          other: 0
        },
        contributions: []
      },
      status: 'planning',
      createdBy: creatorId,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.tripPlans.set(tripId, trip);
    return trip;
  }

  async inviteCollaborator(
    tripId: string,
    inviterName: string,
    collaboratorEmail: string,
    role: 'editor' | 'viewer' = 'editor'
  ): Promise<boolean> {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return false;

    const collaboratorId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newCollaborator: TripCollaborator = {
      id: collaboratorId,
      name: collaboratorEmail.split('@')[0],
      email: collaboratorEmail,
      role,
      status: 'invited',
      preferences: {
        budget: 500,
        interests: []
      }
    };

    trip.collaborators.push(newCollaborator);
    trip.lastModified = new Date().toISOString();

    // Broadcast update
    this.broadcastUpdate(tripId, {
      type: 'collaborator_joined',
      data: { collaborator: newCollaborator, inviterName },
      userId: 'system',
      timestamp: new Date().toISOString()
    });

    return true;
  }

  // Activity Management
  async suggestActivity(
    tripId: string,
    userId: string,
    activityName: string,
    location: string,
    date: string,
    estimatedCost: number
  ): Promise<CollaborativeActivity | null> {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const prompt = `Generate a detailed activity suggestion for a trip to ${trip.destination}.
      
Activity: ${activityName}
Location: ${location}
Date: ${date}
Estimated Cost: $${estimatedCost}

Please provide:
1. A detailed description (2-3 sentences)
2. Recommended duration in hours
3. Best time to visit
4. Any special considerations or tips

Format as JSON with fields: description, duration, bestTime, tips`;

      const result = await model.generateContent(prompt);
      const aiResponse = JSON.parse(result.response.text());

      const activityId = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const activity: CollaborativeActivity = {
        id: activityId,
        name: activityName,
        description: aiResponse.description || `Experience ${activityName} at ${location}`,
        location,
        date,
        time: aiResponse.bestTime || '10:00',
        duration: aiResponse.duration || 2,
        cost: estimatedCost,
        votes: [],
        suggestedBy: userId,
        status: 'proposed',
        alternatives: []
      };

      trip.activities.push(activity);
      trip.lastModified = new Date().toISOString();

      // Broadcast update
      this.broadcastUpdate(tripId, {
        type: 'activity_added',
        data: { activity },
        userId,
        timestamp: new Date().toISOString()
      });

      return activity;
    } catch (error) {
      console.error('Error generating activity suggestion:', error);
      return null;
    }
  }

  async voteOnActivity(
    tripId: string,
    activityId: string,
    userId: string,
    vote: 'yes' | 'no' | 'maybe',
    comment?: string
  ): Promise<boolean> {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return false;

    const activity = trip.activities.find(a => a.id === activityId);
    if (!activity) return false;

    // Remove existing vote from this user
    activity.votes = activity.votes.filter(v => v.userId !== userId);

    // Add new vote
    activity.votes.push({
      userId,
      vote,
      comment,
      timestamp: new Date().toISOString()
    });

    // Check if activity should be approved (majority yes votes)
    const yesVotes = activity.votes.filter(v => v.vote === 'yes').length;
    const totalVotes = activity.votes.length;
    const collaboratorCount = trip.collaborators.filter(c => c.status === 'accepted').length;

    if (yesVotes > collaboratorCount / 2 && totalVotes >= Math.min(3, collaboratorCount)) {
      activity.status = 'approved';
    }

    trip.lastModified = new Date().toISOString();

    // Broadcast update
    this.broadcastUpdate(tripId, {
      type: 'activity_voted',
      data: { activityId, vote, comment, userId },
      userId,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  // Budget Management
  async updateBudget(
    tripId: string,
    userId: string,
    budgetUpdate: Partial<CollaborativeBudget>
  ): Promise<boolean> {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return false;

    // Only owners and editors can update budget
    const collaborator = trip.collaborators.find(c => c.id === userId);
    if (!collaborator || collaborator.role === 'viewer') return false;

    Object.assign(trip.budget, budgetUpdate);
    trip.lastModified = new Date().toISOString();

    // Broadcast update
    this.broadcastUpdate(tripId, {
      type: 'budget_updated',
      data: { budget: trip.budget },
      userId,
      timestamp: new Date().toISOString()
    });

    return true;
  }

  // AI-Powered Optimization
  async optimizeTripPlan(tripId: string): Promise<{
    optimizedActivities: CollaborativeActivity[];
    budgetOptimization: string;
    routeOptimization: string;
  } | null> {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: GEMINI_MODEL_TEXT });
      
      const approvedActivities = trip.activities.filter(a => a.status === 'approved');
      const totalBudget = trip.budget.total;
      
      const prompt = `Optimize this collaborative trip plan for ${trip.destination}:

Trip Details:
- Dates: ${trip.startDate} to ${trip.endDate}
- Budget: $${totalBudget}
- Collaborators: ${trip.collaborators.length}

Approved Activities:
${approvedActivities.map(a => `- ${a.name} at ${a.location} (${a.date}, $${a.cost})`).join('\n')}

Please provide:
1. Optimized activity schedule (consider travel time, opening hours, weather)
2. Budget optimization suggestions
3. Route optimization recommendations

Format as JSON with fields: optimizedSchedule, budgetTips, routeTips`;

      const result = await model.generateContent(prompt);
      const optimization = JSON.parse(result.response.text());

      return {
        optimizedActivities: approvedActivities, // Would be reordered based on AI suggestions
        budgetOptimization: optimization.budgetTips || 'Consider group discounts and early booking savings.',
        routeOptimization: optimization.routeTips || 'Plan activities by geographic proximity to minimize travel time.'
      };
    } catch (error) {
      console.error('Error optimizing trip plan:', error);
      return null;
    }
  }

  // Real-time Communication
  connectToTrip(tripId: string, userId: string, ws: any): void {
    const connectionId = `${tripId}_${userId}`;
    this.wsConnections.set(connectionId, ws);

    ws.addEventListener('close', () => {
      this.wsConnections.delete(connectionId);
    });
  }

  private broadcastUpdate(tripId: string, update: RealTimeUpdate): void {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return;

    // Send to all connected collaborators
    trip.collaborators.forEach(collaborator => {
      const connectionId = `${tripId}_${collaborator.id}`;
      const ws = this.wsConnections.get(connectionId);
      
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(update));
      }
    });
  }

  // Conflict Resolution
  async resolveConflicts(tripId: string): Promise<string[]> {
    const trip = this.tripPlans.get(tripId);
    if (!trip) return [];

    const conflicts: string[] = [];

    // Check for scheduling conflicts
    const approvedActivities = trip.activities.filter(a => a.status === 'approved');
    for (let i = 0; i < approvedActivities.length; i++) {
      for (let j = i + 1; j < approvedActivities.length; j++) {
        const activity1 = approvedActivities[i];
        const activity2 = approvedActivities[j];
        
        if (activity1.date === activity2.date) {
          const time1 = new Date(`${activity1.date} ${activity1.time}`);
          const time2 = new Date(`${activity2.date} ${activity2.time}`);
          const end1 = new Date(time1.getTime() + activity1.duration * 60 * 60 * 1000);
          
          if (time2 < end1) {
            conflicts.push(`Time conflict: ${activity1.name} and ${activity2.name} overlap on ${activity1.date}`);
          }
        }
      }
    }

    // Check budget conflicts
    const totalActivityCost = approvedActivities.reduce((sum, a) => sum + a.cost, 0);
    if (totalActivityCost > trip.budget.total) {
      conflicts.push(`Budget exceeded: Activities cost $${totalActivityCost} but budget is $${trip.budget.total}`);
    }

    return conflicts;
  }

  // Data Access
  getTripPlan(tripId: string): CollaborativeTripPlan | null {
    return this.tripPlans.get(tripId) || null;
  }

  getUserTrips(userId: string): CollaborativeTripPlan[] {
    return Array.from(this.tripPlans.values()).filter(trip =>
      trip.collaborators.some(c => c.id === userId && c.status === 'accepted')
    );
  }
}

export const realTimeCollaborationService = new RealTimeCollaborationService();