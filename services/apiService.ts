// API service for database operations with optional Firebase auth token
import { withApiBase } from './config';

async function withAuthHeaders(init?: RequestInit): Promise<RequestInit> {
  try {
    // Lazy import to avoid circular deps
  const { getAuth } = await import('firebase/auth');
  const { getFirebaseApp } = await import('../firebase-config');
  const app = getFirebaseApp();
  if (!app) return init || {};
  const auth = getAuth(app);
    const token = await auth.currentUser?.getIdToken?.();
    if (token) {
      return {
        ...init,
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      };
    }
  } catch {}
  return init || {};
}

export const apiService = {
  // Users
  async createUser(userData: any) {
    try {
  const response = await fetch(withApiBase(`/api/users`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
  }));
      return response.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async getUsers() {
    try {
  const response = await fetch(withApiBase(`/api/users`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  async getUser(userId: string) {
    try {
      const response = await fetch(withApiBase(`/api/users/${userId}`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  async updateUser(userId: string, userData: any) {
    try {
  const response = await fetch(withApiBase(`/api/users/${userId}`), await withAuthHeaders({
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
  }));
      return response.json();
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Subscription helpers
  async startTrial(userId: string, tier: string) {
    try {
      const response = await fetch(withApiBase(`/api/subscriptions/start-trial`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier })
      }));
      return response.json();
    } catch (error) {
      console.error('Error starting trial:', error);
      throw error;
    }
  },

  async subscribeUser(userId: string, tier: string) {
    try {
      const response = await fetch(withApiBase(`/api/subscriptions/subscribe`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tier })
      }));
      return response.json();
    } catch (error) {
      console.error('Error subscribing user:', error);
      throw error;
    }
  },

  async cancelSubscription(userId: string) {
    try {
      const response = await fetch(withApiBase(`/api/subscriptions/cancel`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      }));
      return response.json();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  },

  // Additional subscription endpoints
  async checkSubscriptionStatus(userId: string) {
    try {
      const response = await fetch(withApiBase(`/api/users/${userId}/subscription-status`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error checking subscription status:', error);
      throw error;
    }
  },

  async getInvoices(userId: string) {
    try {
      const response = await fetch(withApiBase(`/api/users/${userId}/invoices`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return [];
    }
  },

  // Payments (Stripe)
  async createCheckoutSession(priceId: string, customerEmail?: string) {
    try {
      const response = await fetch(withApiBase('/api/payments/create-checkout-session'), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, customerEmail })
      }));
      return response.json();
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  // Posts
  async createPost(postData: any) {
    try {
  const response = await fetch(withApiBase(`/api/posts`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
  }));
      return response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  async getPosts() {
    try {
  const response = await fetch(withApiBase(`/api/posts`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Return empty array instead of throwing error for better UX
      return [];
    }
  },

  // Post engagement
  async likePost(postId: string, payload: { userId?: string; username?: string }) {
    try {
  const response = await fetch(withApiBase(`/api/posts/${postId}/like`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
  }));
      return response.json();
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  async addComment(postId: string, payload: { userId?: string; username?: string; text: string }) {
    try {
  const response = await fetch(withApiBase(`/api/posts/${postId}/comments`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
  }));
      return response.json();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  async getComments(postId: string) {
    try {
  const response = await fetch(withApiBase(`/api/posts/${postId}/comments`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { comments: [], count: 0 };
    }
  },

  async getReviews() {
    try {
  const response = await fetch(withApiBase(`/api/reviews`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  // Reviews
  async createReview(reviewData: any) {
    try {
  const response = await fetch(withApiBase(`/api/reviews`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewData)
  }));
      return response.json();
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  },

  // Trip Plans
  async createTripPlan(tripData: any) {
    try {
  const response = await fetch(withApiBase(`/api/trips`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tripData)
  }));
      return response.json();
    } catch (error) {
      console.error('Error creating trip plan:', error);
      throw error;
    }
  },

  async getUserTrips(userId: string) {
    try {
  const response = await fetch(withApiBase(`/api/users/${userId}/trips`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching user trips:', error);
      return [];
    }
  },

  // Favorites
  async addFavorite(userId: string, placeId: string) {
    try {
  const response = await fetch(withApiBase(`/api/users/${userId}/favorites`), await withAuthHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId })
  }));
      return response.json();
    } catch (error) {
      console.error('Error adding favorite:', error);
      throw error;
    }
  },

  async getFavorites(userId: string) {
    try {
  const response = await fetch(withApiBase(`/api/users/${userId}/favorites`), await withAuthHeaders());
      return response.json();
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }
  },

  // Auth: ask backend to upsert user on login (optional; backend may be gated)
  async authLogin(): Promise<any> {
    const init = await withAuthHeaders({ method: 'POST' });
  const res = await fetch(withApiBase(`/api/auth/login`), init);
    return res.json();
  }
};