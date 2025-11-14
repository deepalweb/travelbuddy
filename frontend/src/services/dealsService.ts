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
  };
  images: string[];
  views: number;
  claims: number;
  isActive: boolean;
  validUntil?: Date;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export const dealsService = {
  async getDeals(businessType?: string, sortBy?: string): Promise<Deal[]> {
    const params = new URLSearchParams()
    params.append('isActive', 'true')
    if (businessType && businessType !== 'all') {
      params.append('businessType', businessType)
    }
    if (sortBy) {
      params.append('sort', sortBy)
    }
    
    const response = await fetch(`${API_BASE}/api/deals?${params}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    })
    if (!response.ok) throw new Error('Failed to fetch deals')
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