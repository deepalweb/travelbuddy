import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, MapPin, Calendar, ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { communityService } from '../services/communityService'

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

export const StoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [showImageModal, setShowImageModal] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadStory()
  }, [id])

  const loadStory = async () => {
    try {
      setLoading(true)
      const storyData = await communityService.getStory(id!)
      setStory(storyData)
    } catch (error) {
      console.error('Failed to load story:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!story) return
    try {
      await communityService.likeStory(story._id)
      setStory({
        ...story,
        likes: story.likes + (story.isLiked ? -1 : 1),
        isLiked: !story.isLiked
      })
    } catch (error) {
      console.error('Failed to like story:', error)
    }
  }

  const openImageModal = (index: number) => {
    setCurrentImageIndex(index)
    setShowImageModal(true)
  }

  const nextImage = () => {
    if (story && currentImageIndex < story.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Story not found</h2>
          <button
            onClick={() => navigate('/community')}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Community
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Community</span>
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Author Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  {story.author.profilePicture ? (
                    <img src={story.author.profilePicture} alt={story.author.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl">{story.author.username[0]}</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{story.author.username}</h2>
                <div className="flex items-center space-x-3 text-gray-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{story.location}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(story.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Story Content */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{story.title}</h1>
            <div className="prose prose-lg max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{story.content}</p>
            </div>
          </div>

          {/* Images */}
          {story.images.length > 0 && (
            <div className="px-6 pb-6">
              {story.images.length === 1 ? (
                <img
                  src={story.images[0]}
                  alt={story.title}
                  className="w-full max-h-96 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => openImageModal(0)}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {story.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${story.title} ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => openImageModal(index)}
                    />
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
                  onClick={handleLike}
                  className={`group flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 ${
                    story.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-7 h-7 transition-all duration-200 ${
                    story.isLiked ? 'fill-current animate-pulse' : 'group-hover:scale-110'
                  }`} />
                  <span className="font-semibold text-xl">{story.likes}</span>
                </button>
                <div className="flex items-center space-x-3 text-gray-500">
                  <MessageCircle className="w-7 h-7" />
                  <span className="font-semibold text-xl">{story.comments}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-6 py-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
            <div className="space-y-4">
              <div className="flex space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <textarea
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <button className="mt-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Post Comment
                  </button>
                </div>
              </div>
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No comments yet. Be the first to comment!</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && story.images.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            
            <img
              src={story.images[currentImageIndex]}
              alt={`${story.title} ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            
            {story.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  disabled={currentImageIndex === story.images.length - 1}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
                
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
                  {currentImageIndex + 1} / {story.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
