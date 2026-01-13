import BaseApiClient from './baseApiClient'

class CommunityApiService extends BaseApiClient {
  async getPosts(limit = 20, cursor?: string) {
    const params = new URLSearchParams({ limit: limit.toString() })
    if (cursor) params.append('cursor', cursor)
    
    return this.request(`/community/posts?${params}`)
  }

  async createPost(postData: any) {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  async getDeals(businessType?: string, isActive = true) {
    const params = new URLSearchParams({ isActive: isActive.toString() })
    if (businessType && businessType !== 'all') {
      params.append('businessType', businessType)
    }
    
    return this.request(`/deals?${params}`)
  }
}

export const communityApiService = new CommunityApiService()
