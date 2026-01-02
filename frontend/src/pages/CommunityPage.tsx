import React, { useState, useEffect } from 'react'
import { Camera, Heart, MessageCircle, Award, TrendingUp, Users, Plus, Map, List, MapPin } from 'lucide-react'
import { StoryCard } from '../components/StoryCard'
import { CreateStoryModal } from '../components/CreateStoryModal'
import { StoryMap } from '../components/StoryMap'
import { communityService } from '../services/communityService'
import '../styles/community.css'

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
  likes: number;
  comments: number;
  createdAt: string;
  isLiked?: boolean;
}

interface TopTraveler {
  username: string;
  profilePicture?: string;
  storiesCount: number;
  totalLikes: number;
}

export const CommunityPage: React.FC = () => {
  const [stories, setStories] = useState<Story[]>([])
  const [topTravelers, setTopTravelers] = useState<TopTraveler[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState('recent')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'feed' | 'map'>('feed')
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)

  useEffect(() => {
    setStories([])
    setCursor(null)
    setHasMore(true)
    loadCommunityData(true)
  }, [filter])

  useEffect(() => {
    const handleScroll = () => {
      if (viewMode !== 'feed' || !hasMore || loadingMore) return
      
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = document.documentElement.clientHeight
      
      if (scrollTop + clientHeight >= scrollHeight - 500) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, loadingMore, cursor, viewMode])

  const loadCommunityData = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
      }
      setError(null)
      const [storiesData, travelersData] = await Promise.all([
        communityService.getStories(filter, null),
        communityService.getTopTravelers()
      ])
      setStories(storiesData)
      setTopTravelers(travelersData)
      setHasMore(storiesData.length >= 20)
      if (storiesData.length > 0) {
        setCursor(storiesData[storiesData.length - 1].createdAt)
      }
    } catch (error: any) {
      console.error('Failed to load community data:', error)
      setError(error.message || 'Unable to load stories. Please check your connection and try again.')
      setStories([])
      setTopTravelers([])
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor) return
    
    try {
      setLoadingMore(true)
      const moreStories = await communityService.getStories(filter, cursor)
      if (moreStories.length === 0) {
        setHasMore(false)
      } else {
        setStories([...stories, ...moreStories])
        setCursor(moreStories[moreStories.length - 1].createdAt)
        setHasMore(moreStories.length >= 20)
      }
    } catch (error: any) {
      console.error('Failed to load more stories:', error)
      // Show toast or inline error for load more failures
      setError('Failed to load more stories. Please try again.')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoadingMore(false)
    }
  }

  // Enhanced semantic search with AI-powered matching
  const filteredStories = stories.filter(story => {
    const matchesTag = !selectedTag || (story.tags && story.tags.includes(selectedTag))
    
    if (!searchQuery) return matchesTag
    
    const query = searchQuery.toLowerCase()
    const matchesBasic = 
      story.title.toLowerCase().includes(query) ||
      story.content.toLowerCase().includes(query) ||
      story.location.toLowerCase().includes(query) ||
      (story.place?.name.toLowerCase().includes(query)) ||
      (story.tags && story.tags.some(tag => tag.toLowerCase().includes(query)))
    
    // Semantic matching for travel terms
    const semanticMatches = {
      'food': ['restaurant', 'cuisine', 'dish', 'meal', 'eat', 'taste'],
      'adventure': ['hiking', 'climbing', 'extreme', 'thrill', 'exciting'],
      'culture': ['museum', 'temple', 'traditional', 'heritage', 'history'],
      'nature': ['park', 'wildlife', 'forest', 'mountain', 'beach', 'ocean'],
      'city': ['urban', 'downtown', 'street', 'building', 'shopping']
    }
    
    const matchesSemantic = Object.entries(semanticMatches).some(([key, synonyms]) => {
      if (query.includes(key)) {
        return synonyms.some(synonym => 
          story.title.toLowerCase().includes(synonym) ||
          story.content.toLowerCase().includes(synonym)
        )
      }
      return false
    })
    
    return matchesTag && (matchesBasic || matchesSemantic)
  })

  // Get all unique tags from stories
  const allTags = Array.from(new Set(stories.flatMap(story => story.tags || [])))

  const handleLike = async (storyId: string) => {
    try {
      await communityService.likeStory(storyId)
      setStories(stories.map(story => 
        story._id === storyId 
          ? { ...story, likes: story.likes + (story.isLiked ? -1 : 1), isLiked: !story.isLiked }
          : story
      ))
    } catch (error) {
      console.error('Failed to like story:', error)
    }
  }

  const handleDelete = async (storyId: string) => {
    if (!confirm('Delete this story?')) return
    try {
      await communityService.deleteStory(storyId)
      setStories(stories.filter(s => s._id !== storyId))
    } catch (error) {
      console.error('Failed to delete story:', error)
      alert('Failed to delete story')
    }
  }

  const handleStoryCreated = (newStory: Story) => {
    setStories([newStory, ...stories])
    setShowCreateModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 text-white py-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full animate-pulse"></div>
          <div className="absolute top-32 right-20 w-16 h-16 border-2 border-white rounded-full animate-pulse delay-1000"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 border-2 border-white rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Camera className="w-5 h-5" />
              <span className="text-sm font-medium">Travel Stories & Adventures</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              Travel Community
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Share your adventures, inspire others, and discover amazing travel stories from around the world
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Camera className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">{viewMode === 'map' ? filteredStories.filter(s => s.place).length : filteredStories.length}</span>
                <span className="text-purple-100">{viewMode === 'map' ? 'Places' : 'Stories'}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Users className="w-5 h-5 text-green-300" />
                <span className="font-semibold">{topTravelers.length}</span>
                <span className="text-purple-100">Travelers</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <Heart className="w-5 h-5 text-red-300" />
                <span className="font-semibold">{stories.reduce((sum, story) => sum + story.likes, 0)}</span>
                <span className="text-purple-100">Likes</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Filter & Create Bar */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 backdrop-blur-sm">
              <div className="flex flex-col gap-4">
                {/* Top Row: Sort, View Mode & Create */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center space-x-4">
                    {/* Sort Filters */}
                    <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setFilter('recent')}
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          filter === 'recent' 
                            ? 'bg-white text-purple-700 shadow-sm transform scale-105' 
                            : 'text-gray-600 hover:text-purple-600'
                        }`}
                      >
                        <TrendingUp className="w-4 h-4 inline mr-2" />
                        Recent
                      </button>
                      <button
                        onClick={() => setFilter('popular')}
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          filter === 'popular' 
                            ? 'bg-white text-purple-700 shadow-sm transform scale-105' 
                            : 'text-gray-600 hover:text-purple-600'
                        }`}
                      >
                        <Heart className="w-4 h-4 inline mr-2" />
                        Popular
                      </button>
                      <button
                        onClick={() => setFilter('trending')}
                        className={`px-4 py-2 rounded-md font-medium transition-all duration-200 ${
                          filter === 'trending' 
                            ? 'bg-white text-purple-700 shadow-sm transform scale-105' 
                            : 'text-gray-600 hover:text-purple-600'
                        }`}
                      >
                        <Award className="w-4 h-4 inline mr-2" />
                        Trending
                      </button>
                    </div>
                    
                    {/* View Mode Toggle */}
                    <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('feed')}
                        className={`px-3 py-2 rounded-md font-medium transition-all duration-200 ${
                          viewMode === 'feed' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('map')}
                        className={`px-3 py-2 rounded-md font-medium transition-all duration-200 ${
                          viewMode === 'map' 
                            ? 'bg-white text-gray-900 shadow-sm' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        <Map className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="group flex items-center space-x-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Share Your Story</span>
                  </button>
                </div>
                
                {/* Enhanced Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search stories... (try 'food', 'adventure', 'culture')"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {searchQuery && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        ✨ Smart Search
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Tag Filters */}
                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedTag(null)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        !selectedTag 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    {allTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTag === tag 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Stories Content */}
            {error ? (
              <div className="text-center py-20 bg-white rounded-xl shadow-lg border border-red-100">
                <div className="text-red-500 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
                <button
                  onClick={() => loadCommunityData(true)}
                  className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  Try Again
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
                    <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : stories.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-100">
                <div className="relative inline-block mb-6">
                  <Camera className="w-20 h-20 text-purple-300 mx-auto animate-bounce" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No stories yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">Be the first to share your amazing travel experience and inspire others!</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Share Your First Story
                </button>
                <div className="mt-6 text-sm text-gray-500">
                  <p>💡 Tip: Make sure you're connected to the internet</p>
                  <button
                    onClick={() => loadCommunityData(true)}
                    className="text-purple-600 hover:text-purple-700 font-medium mt-2"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            ) : viewMode === 'map' ? (
              <div className="space-y-6">
                <StoryMap 
                  stories={filteredStories} 
                  onStoryClick={(story) => {
                    // Navigate to story or show modal
                    console.log('Story clicked:', story.title)
                  }}
                />
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Stories on Map</h3>
                    <button
                      onClick={() => setViewMode('feed')}
                      className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                    >
                      ← Back to Feed
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredStories.filter(s => s.place).slice(0, 6).map((story) => (
                      <div key={story._id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="w-3 h-3 text-purple-600" />
                          <span className="font-medium text-xs">{story.place?.name}</span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{story.title}</p>
                        <p className="text-xs text-gray-500">by {story.author.username}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredStories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No stories found matching your filters.</p>
                    <button
                      onClick={() => {
                        setSelectedTag(null)
                        setSearchQuery('')
                      }}
                      className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  filteredStories.map((story, index) => (
                    <div 
                      key={story._id} 
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <StoryCard
                        story={story}
                        onLike={handleLike}
                        onDelete={handleDelete}
                      />
                    </div>
                  ))
                )}
                
                {/* Loading More Indicator */}
                {loadingMore && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading more stories...</p>
                  </div>
                )}
                
                {/* End of Feed */}
                {!hasMore && stories.length > 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>You've reached the end! 🎉</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Travelers */}
            <div className="bg-gradient-to-br from-white to-yellow-50 rounded-xl shadow-lg border border-yellow-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Award className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Top Travelers</h3>
                <div className="flex-1"></div>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">This Month</span>
              </div>
              <div className="space-y-4">
                {topTravelers.map((traveler, index) => (
                  <div key={traveler.username} className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        {traveler.profilePicture ? (
                          <img src={traveler.profilePicture} alt={traveler.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-white font-medium text-sm">{traveler.username[0]}</span>
                        )}
                      </div>
                      {index < 3 && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' : 
                          index === 1 ? 'bg-gray-400 text-white' : 
                          'bg-orange-500 text-white'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{traveler.username}</p>
                      <p className="text-sm text-gray-500">{traveler.storiesCount} stories • {traveler.totalLikes} likes</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Places */}
            <div className="bg-gradient-to-br from-white to-green-50 rounded-xl shadow-lg border border-green-100 p-6 mb-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Trending Places</h3>
              </div>
              <div className="space-y-3">
                {Array.from(new Set(stories.filter(s => s.place).map(s => s.place!.name))).slice(0, 5).map((placeName, index) => {
                  const placeStories = stories.filter(s => s.place?.name === placeName)
                  return (
                    <div key={placeName} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          index === 0 ? 'bg-green-500' : 
                          index === 1 ? 'bg-green-400' : 
                          'bg-green-300'
                        }`}></div>
                        <span className="text-gray-700 text-sm font-medium">{placeName}</span>
                      </div>
                      <span className="text-xs text-gray-500">{placeStories.length} stories</span>
                    </div>
                  )
                })}
                {stories.filter(s => s.place).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No places tagged yet</p>
                )}
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-br from-white to-purple-50 rounded-xl shadow-lg border border-purple-100 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900">Community Stats</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Stories</span>
                  <span className="font-bold text-purple-600">{stories.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Active Members</span>
                  <span className="font-bold text-purple-600">{topTravelers.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Likes</span>
                  <span className="font-bold text-purple-600">{stories.reduce((sum, story) => sum + story.likes, 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tagged Places</span>
                  <span className="font-bold text-purple-600">{new Set(stories.filter(s => s.place).map(s => s.place!.name)).size}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Story Modal */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}

      {/* Floating Error Toast */}
      {error && !loading && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-up max-w-md">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-white hover:text-gray-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
