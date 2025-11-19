const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed [${endpoint}]:`, error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network connection failed. Please check your internet connection.');
      }
      throw error;
    }
  }

  // Dashboard Analytics
  async getDashboardStats() {
    try {
      return this.request('/admin/dashboard/stats');
    } catch (error) {
      const [users, posts, deals] = await Promise.all([
        this.request('/users').catch(() => []),
        this.request('/posts').catch(() => []),
        this.request('/deals').catch(() => [])
      ]);

      return {
        totalUsers: users.length || 0,
        totalPosts: posts.length || 0,
        totalDeals: deals.length || 0,
        pendingReports: 0,
        subscriptions: { free: users.length || 0, basic: 0, premium: 0, pro: 0 }
      };
    }
  }

  // User Management
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, data: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Content Moderation
  async getPendingReports() {
    return this.request('/admin/reports').catch(() => []);
  }

  async moderatePost(postId: string, action: 'approve' | 'reject' | 'flag') {
    return this.request(`/admin/moderate/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  async getPosts() {
    return this.request('/posts');
  }

  async deletePost(id: string) {
    return this.request(`/posts/${id}`, {
      method: 'DELETE',
    });
  }

  // Business & Deals Management
  async getDeals(filters: any = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/deals?${params}`);
  }

  async createDeal(data: any) {
    return this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeal(id: string, data: any) {
    return this.request(`/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeal(id: string) {
    return this.request(`/deals/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getUsageStats() {
    return this.request('/usage').catch(() => ({ totals: {}, events: [] }));
  }

  async getSubscriptionAnalytics() {
    return this.request('/subscriptions/analytics').catch(() => ({}));
  }

  async getModerationStats() {
    return this.request('/admin/moderation/stats').catch(() => ({}));
  }

  // System Health
  async getSystemHealth() {
    return this.request('/health/db').catch(() => ({ mongo: { connected: false } }));
  }

  async getApiCosts() {
    return this.request('/usage/cost').catch(() => ({ totals: {}, projections: {} }));
  }

  // Real-time Admin Features
  async getRealtimeStats() {
    return this.request('/admin/dashboard/stats');
  }

  async getUserAnalytics() {
    return this.request('/admin/users/analytics');
  }

  async getBusinessAnalytics() {
    return this.request('/admin/business/analytics');
  }

  async getModerationQueue() {
    return this.request('/admin/reports');
  }

  async moderateContent(postId: string, action: 'approve' | 'reject' | 'flag') {
    return this.request(`/admin/moderate/${postId}`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }

  // Role Management
  async updateUserRole(userId: string, role: string, reason?: string) {
    return this.request(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, reason }),
    });
  }

  async bulkUpdateRoles(userIds: string[], role: string, reason?: string) {
    return this.request('/admin/users/bulk-role', {
      method: 'PUT',
      body: JSON.stringify({ userIds, role, reason }),
    });
  }

  async getRoleStats() {
    return this.request('/admin/roles/stats');
  }

  // Live Data Endpoints
  async getApiUsageTimeseries(window = 60) {
    return this.request(`/usage/timeseries?window=${window}`);
  }

  async getDailyUsageStats(days = 30) {
    return this.request(`/usage/aggregate/daily?days=${days}`);
  }

  async getMonthlyUsageStats(months = 12) {
    return this.request(`/usage/aggregate/monthly?months=${months}`);
  }

  // Trip Planning Endpoints
  async getUserTripPlans() {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/trip-plans', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async createTripPlan(tripData: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/trip-plans', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(tripData)
    });
  }

  async updateTripPlan(tripId: string, tripData: any) {
    const token = localStorage.getItem('auth_token');
    return this.request(`/users/trip-plans/${tripId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(tripData)
    });
  }

  async deleteTripPlan(tripId: string) {
    const token = localStorage.getItem('auth_token');
    return this.request(`/users/trip-plans/${tripId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async updateActivityStatus(tripId: string, dayIndex: number, activityIndex: number, isVisited: boolean) {
    const token = localStorage.getItem('auth_token');
    return this.request(`/users/trip-plans/${tripId}/activities`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        dayIndex,
        activityIndex,
        isVisited,
        visitedDate: isVisited ? new Date().toISOString() : null
      })
    });
  }

  async generateTripPlan(params: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/ai/trip-generator', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params)
    });
  }

  // User Favorites Endpoints
  async getUserFavorites() {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async addFavorite(placeId: string) {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/favorites', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ placeId })
    });
  }

  async removeFavorite(placeId: string) {
    const token = localStorage.getItem('auth_token');
    return this.request(`/users/favorites/${placeId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async toggleFavorite(placeId: string) {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/favorites/toggle', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ placeId })
    });
  }

  // User Preferences Endpoints
  async getUserTravelStyle() {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/travel-style', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async updateUserTravelStyle(travelStyle: string) {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/travel-style', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ travelStyle })
    });
  }

  async getUserPreferences() {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/preferences', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async updateUserPreferences(preferences: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/preferences', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(preferences)
    });
  }

  // Extended User Profile Endpoints
  async getExtendedUserProfile() {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/profile/extended', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  }

  async updateExtendedUserProfile(profileData: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/users/profile/extended', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(profileData)
    });
  }

  async uploadProfilePicture(formData: FormData) {
    const token = localStorage.getItem('auth_token');
    return fetch(`${this.baseURL}/api/users/profile/picture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
  }

  // AI Service Endpoints
  async generateAITripPlan(params: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/ai/trip-generator', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params)
    });
  }

  async getAIRecommendations(params: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/ai/recommendations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(params)
    });
  }

  async generatePlaceAIContent(placeData: any) {
    const token = localStorage.getItem('auth_token');
    return this.request('/ai/place-content', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(placeData)
    });
  }

  async getCachedPlaceAIContent(placeId: string) {
    return this.request(`/ai/place-content/${placeId}`);
  }

  async enhancedPlacesSearch(queryParams: string) {
    return this.request(`/enhanced-places/search?${queryParams}`);
  }

export const apiService = new ApiService();
export default apiService;
