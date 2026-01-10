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
    <div className="story-card bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
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

      {/* Place Info - Before Content */}
      {story.place && (
        <div className="px-4 pb-3">
          <div className="flex items-center space-x-2 text-sm">
            <MapPin className="w-4 h-4 text-purple-600" />
            <div>
              <p className="font-semibold text-gray-900">{story.place.name}</p>
              <p className="text-xs text-gray-500">{story.place.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 pb-3">
        <h3 
          onClick={() => navigate(`/community/story/${story._id}`)}
          className="font-semibold text-lg text-gray-900 mb-2 hover:text-purple-600 transition-colors cursor-pointer"
        >
          {story.title}
        </h3>
        <p className="text-gray-700 text-[15px] leading-relaxed">{story.content}</p>
        
        {/* Tags */}
        {story.tags && story.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
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
      </div>

      {/* Images - Full Width like Facebook */}
      {story.images && story.images.length > 0 && story.images.filter(img => img && img.trim()).length > 0 && (
        <div className="w-full">
          {story.images.length === 1 ? (
            <img 
              src={story.images[0]} 
              alt={story.title}
              className="w-full max-h-[600px] object-cover cursor-pointer"
              onClick={() => window.open(story.images[0], '_blank')}
              onError={(e) => {
                console.error('Failed to load image:', story.images[0])
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : story.images.length === 2 ? (
            <div className="grid grid-cols-2 gap-0.5">
              {story.images.slice(0, 2).map((image, index) => (
                <img 
                  key={index}
                  src={image} 
                  alt={`${story.title} ${index + 1}`}
                  className="w-full h-[300px] object-cover cursor-pointer"
                  onClick={() => window.open(image, '_blank')}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-0.5">
              {story.images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <img 
                    src={image} 
                    alt={`${story.title} ${index + 1}`}
                    className="w-full h-[250px] object-cover cursor-pointer"
                    onClick={() => window.open(image, '_blank')}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  {index === 3 && story.images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center cursor-pointer">
                      <span className="text-white font-bold text-2xl">+{story.images.length - 4}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onLike(story._id)}
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                story.isLiked ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-5 h-5 ${
                story.isLiked ? 'fill-current' : ''
              }`} />
              <span className="font-medium text-sm">{story.likes}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-sm">{story.comments}</span>
            </button>
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
