interface Deal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  businessName: string;
  businessType: string;
  originalPrice: string;
  discountedPrice: string;
  location: {
    address: string;
    lat?: number;
    lng?: number;
  };
  images: string[];
  views: number;
  claims: number;
  isActive: boolean;
  validUntil?: Date;
  aiRank?: 'best-value' | 'trending' | 'limited-time';
  userCategory?: 'foodie' | 'adventure' | 'budget';
  distance?: number;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://travelbuddy-b2c6hgbbgeh4esdh.eastus2-01.azurewebsites.net'

export const dealsService = {
  async getDeals(businessType?: string, sortBy?: string, userLocation?: { lat: number; lng: number }): Promise<{ deals: Deal[]; newDealsCount: number }> {
    const params = new URLSearchParams()
    params.append('isActive', 'true')
    params.append('_t', Date.now().toString())
    if (businessType && businessType !== 'all') {
      params.append('businessType', businessType)
    }
    if (sortBy) {
      params.append('sort', sortBy)
    }
    if (userLocation) {
      params.append('lat', userLocation.lat.toString())
      params.append('lng', userLocation.lng.toString())
    }
    
    const lastVisit = localStorage.getItem('lastDealsVisit')
    if (lastVisit) {
      params.append('lastVisit', lastVisit)
    }
    localStorage.setItem('lastDealsVisit', Date.now().toString())
    
    const url = `${API_BASE}/api/deals?${params}`
    
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch deals: ${response.status}`)
    }
    
    return response.json()
  },

  async getTrendingDeals(): Promise<Deal[]> {
    const response = await fetch(`${API_BASE}/api/deals/trending`)
    if (!response.ok) throw new Error('Failed to fetch trending deals')
    return response.json()
  },

  async getNearbyDeals(lat: number, lng: number, radius: number = 10): Promise<Deal[]> {
    const params = new URLSearchParams()
    params.append('lat', lat.toString())
    params.append('lng', lng.toString())
    params.append('radius', radius.toString())
    
    const response = await fetch(`${API_BASE}/api/deals/nearby?${params}`)
    if (!response.ok) throw new Error('Failed to fetch nearby deals')
    return response.json()
  },

  async getRecommendedDeals(userId?: string): Promise<Deal[]> {
    const params = new URLSearchParams()
    if (userId) {
      params.append('userId', userId)
    }
    
    const response = await fetch(`${API_BASE}/api/deals/recommended?${params}`)
    if (!response.ok) throw new Error('Failed to fetch recommended deals')
    return response.json()
  },

  async viewDeal(dealId: string): Promise<void> {
    await fetch(`${API_BASE}/api/deals/${dealId}/view`, { method: 'POST' })
  },

  async claimDeal(dealId: string, userId?: string): Promise<void> {
    await fetch(`${API_BASE}/api/deals/${dealId}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
  },

  async getDealAnalytics(dealId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/deals/${dealId}/analytics`)
    if (!response.ok) throw new Error('Failed to fetch deal analytics')
    return response.json()
  },

  async createDeal(dealData: any): Promise<Deal> {
    const response = await fetch(`${API_BASE}/api/deals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': window.location.origin
      },
      credentials: 'include',
      body: JSON.stringify({
        ...dealData,
        views: 0,
        claims: 0,
        isActive: true
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Failed to create deal: ${response.status} - ${errorData}`)
    }
    
    return response.json()
  }
}
