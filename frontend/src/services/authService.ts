const API_BASE = 'http://localhost:3001/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  profilePicture?: string;
  tier: 'free' | 'basic' | 'premium' | 'pro';
  subscriptionStatus: 'none' | 'trial' | 'active' | 'expired';
  profileType?: 'traveler' | 'business' | 'service' | 'creator';
  role?: 'regular' | 'merchant' | 'agent' | 'admin';
  homeCurrency?: string;
  language?: string;
  selectedInterests?: string[];
  hasCompletedWizard?: boolean;
  favoritePlaces?: string[];
  isVerified?: boolean;
  createdAt?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }
    
    return response.json();
  },

  async register(data: RegisterData): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    
    return response.json();
  },

  async getProfile(token: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    
    return response.json();
  },

  async updateProfile(token: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    
    return response.json();
  },

  async getFullProfile(userId: string): Promise<User> {
    const response = await fetch(`${API_BASE}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch full profile');
    }
    
    return response.json();
  },

  async updateFullProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE}/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update full profile');
    }
    
    return response.json();
  }
};