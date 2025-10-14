const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net/api';

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Dashboard Analytics
  async getDashboardStats() {
    try {
      return this.request('/admin/dashboard/stats');
    } catch (error) {
      // Fallback to individual requests if admin endpoint fails
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
}

export const apiService = new ApiService();
export default apiService;