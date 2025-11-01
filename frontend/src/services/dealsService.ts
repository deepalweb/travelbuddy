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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const dealsService = {
  async getDeals(businessType?: string): Promise<Deal[]> {
    const params = new URLSearchParams()
    params.append('isActive', 'true')
    if (businessType && businessType !== 'all') {
      params.append('businessType', businessType)
    }
    
    const response = await fetch(`${API_BASE}/api/deals?${params}`)
    if (!response.ok) throw new Error('Failed to fetch deals')
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
  }
}