import React, { useState, useEffect } from 'react'
import { Camera, Heart, MessageCircle, Award, TrendingUp, Users, Plus } from 'lucide-react'
import { StoryCard } from '../components/StoryCard'
import { CreateStoryModal } from '../components/CreateStoryModal'
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
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState('recent')

  useEffect(() => {
    loadCommunityData()
  }, [filter])

  const loadCommunityData = async () => {
    try {
      setLoading(true)
      const [storiesData, travelersData] = await Promise.all([
        communityService.getStories(filter),
        communityService.getTopTravelers()
      ])
      setStories(storiesData)
      setTopTravelers(travelersData)
    } catch (error) {
      console.error('Failed to load community data:', error)
    } finally {
      setLoading(false)
    }
  }

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
                <span className="font-semibold">{stories.length}</span>
                <span className="text-purple-100">Stories</span>
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
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="group flex items-center space-x-2 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white px-8 py-3 rounded-xl hover:from-purple-700 hover:via-pink-700 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Share Your Story</span>
                </button>
              </div>
            </div>

            {/* Stories Grid */}
            {loading ? (
              <div className="flex flex-col justify-center items-center h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent absolute top-0 left-0"></div>
                </div>
                <p className="text-purple-600 font-medium mt-4 animate-pulse">Loading amazing stories...</p>
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
              </div>
            ) : (
              <div className="space-y-8">
                {stories.map((story, index) => (
                  <div 
                    key={story._id} 
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <StoryCard
                      story={story}
                      onLike={handleLike}
                    />
                  </div>
                ))}
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
    </div>
  )
}