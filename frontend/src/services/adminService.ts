const ADMIN_API_BASE = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:3001/api/admin'

export class AdminService {
  private static instance: AdminService
  private token: string | null = null

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService()
    }
    return AdminService.instance
  }

  setToken(token: string) {
    this.token = token
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${ADMIN_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Admin API error: ${response.statusText}`)
    }
    
    return response.json()
  }

  async getDashboardStats() {
    return this.request('/dashboard/stats')
  }

  async getUsers(page = 1, limit = 10) {
    return this.request(`/users?page=${page}&limit=${limit}`)
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended') {
    return this.request(`/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async getContentReports() {
    return this.request('/content/reports')
  }

  async moderateContent(contentId: string, action: 'approve' | 'reject') {
    return this.request(`/content/${contentId}/moderate`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    })
  }
}

export const adminService = AdminService.getInstance()