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

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Transform backend post to frontend story format
const transformPost = (post: any): Story => {
  return {
    _id: post._id,
    title: post.content?.title || post.title || 'Untitled Story',
    content: post.content?.text || post.content || '',
    images: post.content?.images || post.images || [],
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
  async getStories(filter: string = 'recent'): Promise<Story[]> {
    try {
      const response = await fetch(`${API_BASE}/posts/community?limit=20`)
      if (!response.ok) throw new Error('Failed to fetch stories')
      const posts = await response.json()
      
      let stories = posts.map(transformPost)
      
      // Sort based on filter
      if (filter === 'popular') {
        stories.sort((a, b) => b.likes - a.likes)
      } else if (filter === 'trending') {
        stories.sort((a, b) => (b.likes + b.comments) - (a.likes + a.comments))
      }
      
      return stories
    } catch (error) {
      console.error('Error fetching stories:', error)
      return []
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
      if (!response.ok) throw new Error('Failed to fetch travelers')
      const posts = await response.json()
      
      // Group posts by username and calculate stats
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
    } catch (error) {
      console.error('Error fetching top travelers:', error)
      return []
    }
  },

  async createStory(storyData: CreateStoryData): Promise<Story> {
    const postData = {
      userId: '507f1f77bcf86cd799439011', // Valid ObjectId
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
    
    const response = await fetch(`${API_BASE}/posts/community`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Create story error:', errorText)
      throw new Error(`Failed to create story: ${response.status}`)
    }
    
    const post = await response.json()
    return transformPost(post)
  },

  async likeStory(storyId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/posts/${storyId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
    try {
      const response = await fetch(`${API_BASE}/ai/generate-tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content })
      })
      
      if (!response.ok) throw new Error('AI tagging failed')
      const data = await response.json()
      return data.tags || []
    } catch (error) {
      console.error('AI tagging error:', error)
      return []
    }
  }
}