import { apiService } from './apiService';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  birthday?: string;
  languages?: string[];
  interests?: string[];
  travelStyle?: string;
  status?: string;
  tier: 'free' | 'basic' | 'premium' | 'pro';
  subscriptionStatus: 'none' | 'trial' | 'active' | 'canceled';
  trialEndDate?: string;
  subscriptionEndDate?: string;
  mongoId?: string;
  showBirthdayToOthers?: boolean;
  showLocationToOthers?: boolean;
  budgetPreferences?: string[];
  profilePicture?: string;
}

export interface UserStats {
  totalPosts: number;
  followers: number;
  following: number;
  placesVisited: number;
  totalDistance: number;
  currentStreak: number;
  favoriteCategory: string;
  placesVisitedThisMonth: number;
  totalDistanceKm: number;
  followersCount: number;
  followingCount: number;
}

export interface TravelInsights {
  totalPlacesVisited: number;
  placesVisitedThisMonth: number;
  totalDistanceKm: number;
  currentStreak: number;
  favoriteCategory: string;
  topCategories: Array<{ category: string; count: number }>;
  monthlyStats: Array<{ month: string; places: number }>;
  achievements: Array<{ id: string; name: string; description: string; unlockedAt: string }>;
}

class UserProfileService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to update profile');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserStats(): Promise<UserStats | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  async getTravelInsights(): Promise<TravelInsights | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/travel-insights`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching travel insights:', error);
      return null;
    }
  }

  async updateTravelStyle(travelStyle: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/travel-style`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ travelStyle })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating travel style:', error);
      return false;
    }
  }

  async uploadProfilePicture(imageFile: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('profilePicture', imageFile);

      const response = await fetch(`${this.baseUrl}/api/users/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        return result.profilePictureUrl;
      }
      return null;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      return null;
    }
  }

  async updateStatus(status: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ status })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating status:', error);
      return false;
    }
  }

  async getFollowers(): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/followers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  async getFollowing(): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/following`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }

  async followUser(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  async unfollowUser(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/${userId}/unfollow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async getUserPosts(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/posts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching user posts:', error);
      return [];
    }
  }

  async getBookmarkedPosts(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/bookmarks`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      return [];
    }
  }

  async deleteAccount(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting account:', error);
      return false;
    }
  }

  // Subscription management
  async startTrial(tier: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/subscription/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ tier })
      });

      return response.ok;
    } catch (error) {
      console.error('Error starting trial:', error);
      return false;
    }
  }

  async subscribe(tier: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/subscription/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify({ tier })
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing:', error);
      return false;
    }
  }

  async cancelSubscription(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return false;
    }
  }

  private async getAuthToken(): Promise<string> {
    // This should integrate with your auth context to get the current user's token
    // For now, returning empty string - you'll need to implement this based on your auth setup
    // TODO: Implement token retrieval from your backend auth system
    return '';
  }
}

export const userProfileService = new UserProfileService();