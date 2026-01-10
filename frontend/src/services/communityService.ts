interface Story {
  _id: string;
  title: string;
  content: string;
  images: string[];
  author: {
    username: string;
    profilePicture?: string;
  };
  location: string;
  place?: {
    placeId: string;
    name: string;
    coordinates: { lat: number; lng: number };
    address: string;
  };
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
  tags?: string[];
}

interface TopTraveler {
  username: string;
  profilePicture?: string;
  storiesCount: number;
  totalLikes: number;
}

interface CreateStoryData {
  title: string;
  content: string;
  location: string;
  place?: {
    placeId: string;
    name: string;
    coordinates: { lat: number; lng: number };
    address: string;
  };
  images: string[];
  tags?: string[];
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://travelbuddylk.com/api'

// Transform backend post to frontend story format
const transformPost = (post: any): Story => {
  const images = post.content?.images || post.images || []
  console.log('🖼️ Transforming post images:', { postId: post._id, images, contentImages: post.content?.images, directImages: post.images })
  
  return {
    _id: post._id,
    title: post.content?.title || post.title || 'Untitled Story',
    content: post.content?.text || post.content || '',
    images: images.filter((img: string) => img && img.trim()),
    author: {
      username: post.username || post.author?.username || 'Anonymous',
      profilePicture: post.profilePicture || post.author?.profilePicture
    },
    location: post.location || post.content?.location || 'Unknown Location',
    place: post.place,
    likes: post.engagement?.likes || post.likes || 0,
    comments: post.engagement?.comments || post.comments || 0,
    createdAt: post.createdAt || new Date().toISOString(),
    isLiked: false, // Will be determined by user's like status
    tags: post.tags || []
  }
}

export const communityService = {
  async getStories(filter: string = 'recent', cursor: string | null = null): Promise<Story[]> {
    try {
      const url = cursor 
        ? `${API_BASE}/posts/community?limit=20&cursor=${encodeURIComponent(cursor)}`
        : `${API_BASE}/posts/community?limit=20`
      
      console.log('🔍 Fetching stories from:', url)
      const response = await fetch(url)
      console.log('📡 Response status:', response.status)
      
      if (!response.ok) {
        // Try alternative endpoint
        const altUrl = cursor
          ? `${API_BASE}/community/posts?limit=20&cursor=${encodeURIComponent(cursor)}`
          : `${API_BASE}/community/posts?limit=20`
        console.log('🔄 Trying alternative endpoint:', altUrl)
        const altResponse = await fetch(altUrl)
        if (!altResponse.ok) throw new Error(`Failed to fetch stories: ${response.status}`)
        const posts = await altResponse.json()
        console.log('✅ Fetched posts from alt endpoint:', posts.length)
        return posts.map(transformPost)
      }
      
      const posts = await response.json()
      console.log('✅ Fetched posts:', posts.length)
      
      let stories = posts.map(transformPost)
      
      // Sort based on filter (only for initial load)
      if (!cursor) {
        if (filter === 'popular') {
          stories.sort((a, b) => b.likes - a.likes)
        } else if (filter === 'trending') {
          stories.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
        }
      }
      
      return stories
    } catch (error) {
      console.error('❌ Error fetching stories:', error)
      throw error // Re-throw to let component handle it
    }
  },

  async getStory(storyId: string): Promise<Story | null> {
    try {
      const response = await fetch(`${API_BASE}/posts/community`)
      if (!response.ok) throw new Error('Failed to fetch story')
      const posts = await response.json()
      const post = posts.find((p: any) => p._id === storyId)
      return post ? transformPost(post) : null
    } catch (error) {
      console.error('Error fetching story:', error)
      return null
    }
  },

  async getTopTravelers(): Promise<TopTraveler[]> {
    try {
      const response = await fetch(`${API_BASE}/posts/community`)
      if (!response.ok) {
        // Try alternative endpoint
        const altResponse = await fetch(`${API_BASE}/community/posts`)
        if (!altResponse.ok) return []
        const posts = await altResponse.json()
        return this.calculateTopTravelers(posts)
      }
      const posts = await response.json()
      return this.calculateTopTravelers(posts)
    } catch (error) {
      console.error('Error fetching top travelers:', error)
      return []
    }
  },

  calculateTopTravelers(posts: any[]): TopTraveler[] {
    const userStats: { [key: string]: TopTraveler } = {}
    
    posts.forEach((post: any) => {
      const username = post.username || post.author?.username || 'Anonymous'
      if (!userStats[username]) {
        userStats[username] = {
          username,
          profilePicture: post.profilePicture || post.author?.profilePicture,
          storiesCount: 0,
          totalLikes: 0
        }
      }
      userStats[username].storiesCount++
      userStats[username].totalLikes += post.engagement?.likes || post.likes || 0
    })
    
    return Object.values(userStats)
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 5)
  },

  async createStory(storyData: CreateStoryData): Promise<Story> {
    console.log('📤 Creating story with images:', storyData.images)
    
    const postData = {
      userId: '507f1f77bcf86cd799439011',
      content: {
        title: storyData.title,
        text: storyData.content,
        images: storyData.images
      },
      location: storyData.location,
      place: storyData.place,
      tags: storyData.tags || [],
      username: 'You',
      moderationStatus: 'approved',
      engagement: {
        likes: 0,
        comments: 0
      }
    }
    
    console.log('📦 Post data being sent:', JSON.stringify(postData, null, 2))
    
    const response = await fetch(`${API_BASE}/posts/community`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '507f1f77bcf86cd799439011'
      },
      body: JSON.stringify(postData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create story error:', errorText)
      throw new Error(`Failed to create story: ${response.status}`)
    }
    
    const post = await response.json()
    console.log('✅ Created post response:', post)
    console.log('🖼️ Post images in response:', post.content?.images, post.images)
    return transformPost(post)
  },

  async likeStory(storyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${storyId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '507f1f77bcf86cd799439011'
      },
      body: JSON.stringify({ userId: 'current-user' })
    })
    
    if (!response.ok) throw new Error('Failed to like story')
  },

  async getComments(storyId: string): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE}/posts/${storyId}/comments`)
      if (!response.ok) throw new Error('Failed to fetch comments')
      const data = await response.json()
      return data.comments || []
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  },

  async addComment(storyId: string, text: string): Promise<any> {
    const response = await fetch(`${API_BASE}/posts/${storyId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '507f1f77bcf86cd799439011'
      },
      body: JSON.stringify({ 
        text,
        username: 'You', // This should come from auth context
        userId: 'current-user' // This should come from auth context
      })
    })
    if (!response.ok) throw new Error('Failed to add comment')
    return response.json()
  },

  async generateAITags(title: string, content: string): Promise<string[]> {
    return this.getFallbackTags(title, content)
  },

  async deleteStory(storyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${storyId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': '507f1f77bcf86cd799439011'
      }
    })
    if (!response.ok) throw new Error('Failed to delete story')
  },

  async updateStory(storyId: string, storyData: Partial<CreateStoryData>): Promise<Story> {
    const postData: any = {}
    
    if (storyData.title || storyData.content || storyData.images) {
      postData.content = {
        title: storyData.title,
        text: storyData.content,
        images: storyData.images
      }
    }
    if (storyData.location) postData.location = storyData.location
    if (storyData.place) postData.place = storyData.place
    if (storyData.tags) postData.tags = storyData.tags
    
    const response = await fetch(`${API_BASE}/posts/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '507f1f77bcf86cd799439011'
      },
      body: JSON.stringify(postData)
    })
    
    if (!response.ok) throw new Error('Failed to update story')
    const post = await response.json()
    return transformPost(post)
  },

  getFallbackTags(title: string, content: string): string[] {
    const availableTags = ['Adventure', 'Food', 'Culture', 'Nature', 'Photography', 'Beach', 'Mountain', 'City', 'Nightlife', 'Shopping', 'History', 'Art', 'Wildlife', 'Festival', 'Local', 'Budget', 'Luxury', 'Solo', 'Family', 'Couple']
    const text = (title + ' ' + content).toLowerCase()
    
    const matchedTags = availableTags.filter(tag => 
      text.includes(tag.toLowerCase()) || 
      text.includes(tag.toLowerCase().slice(0, -1))
    )
    
    if (matchedTags.length === 0) {
      return ['Travel', 'Adventure', 'Culture']
    }
    
    return matchedTags.slice(0, 4)
  }
}
