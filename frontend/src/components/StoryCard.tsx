import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, MapPin, Calendar, MoreHorizontal, ExternalLink, Trash2, Edit } from 'lucide-react'

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

interface StoryCardProps {
  story: Story;
  onLike: (storyId: string) => void;
  onDelete?: (storyId: string) => void;
  currentUserId?: string;
}

export const StoryCard: React.FC<StoryCardProps> = ({ story, onLike, onDelete, currentUserId }) => {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="story-card bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Header */}
      <div className="p-6 flex items-center justify-between bg-gradient-to-r from-white to-gray-50">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center ring-2 ring-purple-100 hover:ring-purple-200 transition-all duration-200">
              {story.author.profilePicture ? (
                <img src={story.author.profilePicture} alt={story.author.username} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white font-medium text-sm">{story.author.username[0]}</span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <p className="font-medium text-gray-900">{story.author.username}</p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <MapPin className="w-3 h-3" />
              <span>{story.location}</span>
              <span>•</span>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(story.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              {onDelete && currentUserId && story.author.username === 'You' && (
                <button
                  onClick={() => {
                    if (confirm('Delete this post?')) {
                      onDelete?.(story._id)
                    }
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Post</span>
                </button>
              )}
              {(!onDelete || !currentUserId || story.author.username !== 'You') && (
                <div className="px-4 py-2 text-gray-400 text-sm">No actions available</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-4">
        <h3 
          onClick={() => navigate(`/community/story/${story._id}`)}
          className="font-bold text-xl text-gray-900 mb-3 hover:text-purple-600 transition-colors cursor-pointer"
        >
          {story.title}
        </h3>
        <p className="text-gray-700 mb-4 line-clamp-3 leading-relaxed">{story.content}</p>
        
        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {story.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Place Info */}
        {story.place && (
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900 text-sm">{story.place.name}</p>
                <p className="text-xs text-gray-500">{story.place.address}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Images */}
      {story.images && story.images.length > 0 && story.images.filter(img => img && img.trim()).length > 0 && (
        <div className="px-6 pb-6">
          {story.images.length === 1 ? (
            <img 
              src={story.images[0]} 
              alt={story.title}
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                console.error('Failed to load image:', story.images[0])
                console.log('Story data:', { id: story._id, images: story.images })
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {story.images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`${story.title} ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      console.error('Failed to load image:', image)
                    }}
                  />
                  {index === 3 && story.images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{story.images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <button
              onClick={() => onLike(story._id)}
              className={`group flex items-center space-x-2 transition-all duration-200 transform hover:scale-105 ${
                story.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-6 h-6 transition-all duration-200 ${
                story.isLiked ? 'fill-current animate-pulse' : 'group-hover:scale-110'
              }`} />
              <span className="font-semibold text-lg">{story.likes}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="group flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all duration-200 transform hover:scale-105"
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-semibold text-lg">{story.comments}</span>
            </button>
          </div>
          <div className="text-sm text-gray-400">
            {formatDate(story.createdAt)}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 animate-fade-in-up">
          <div className="space-y-3">
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center">Comments coming soon...</p>
          </div>
        </div>
      )}
    </div>
  )
}
