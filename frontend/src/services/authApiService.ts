import BaseApiClient from './baseApiClient'

class AuthApiService extends BaseApiClient {
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async register(username: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    })
  }

  async getProfile() {
    return this.request('/auth/profile', {
      headers: this.getAuthHeaders(),
    })
  }

  async updateProfile(data: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    })
  }
}

export const authApiService = new AuthApiService()
