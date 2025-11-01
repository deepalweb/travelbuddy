import React, { useState } from 'react'
import { Star, ThumbsUp, MessageCircle, User, Calendar } from 'lucide-react'
import { Button } from './Button'
import { Card, CardContent } from './Card'

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  content: string
  date: string
  likes: number
  isLiked: boolean
  photos?: string[]
}

interface UserReviewsProps {
  placeId: string
  reviews: Review[]
  onAddReview: (review: { rating: number; title: string; content: string }) => void
  onLikeReview: (reviewId: string) => void
}

export const UserReviews: React.FC<UserReviewsProps> = ({
  placeId,
  reviews,
  onAddReview,
  onLikeReview
}) => {
  const [showAddReview, setShowAddReview] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    content: ''
  })

  const handleSubmitReview = () => {
    if (newReview.title.trim() && newReview.content.trim()) {
      onAddReview(newReview)
      setNewReview({ rating: 5, title: '', content: '' })
      setShowAddReview(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRatingChange?.(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`w-4 h-4 ${
                star <= rating
                  ? 'text-yellow-400 fill-current'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-1">
              {renderStars(Math.round(averageRating))}
            </div>
            <div className="text-sm text-gray-500">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        <Button
          onClick={() => setShowAddReview(true)}
          className="flex items-center"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Write Review
        </Button>
      </div>

      {/* Add Review Form */}
      {showAddReview && (
        <Card className="border-blue-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                {renderStars(newReview.rating, true, (rating) => 
                  setNewReview(prev => ({ ...prev, rating }))
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review
                </label>
                <textarea
                  value={newReview.content}
                  onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your experience with other travelers"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex space-x-3">
                <Button onClick={handleSubmitReview}>
                  Submit Review
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddReview(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  {review.userAvatar ? (
                    <img
                      src={review.userAvatar}
                      alt={review.userName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.userName}</h4>
                      <div className="flex items-center space-x-2">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                  <p className="text-gray-700 mb-4">{review.content}</p>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => onLikeReview(review.id)}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        review.isLiked
                          ? 'text-blue-600'
                          : 'text-gray-500 hover:text-blue-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${review.isLiked ? 'fill-current' : ''}`} />
                      <span>{review.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No reviews yet. Be the first to share your experience!</p>
        </div>
      )}
    </div>
  )
}