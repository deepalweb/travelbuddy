import React, { useState } from 'react'
import { X, Camera, MapPin, Upload, Search } from 'lucide-react'
import { communityService } from '../services/communityService'
import { PlacePicker } from './PlacePicker'

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

interface CreateStoryModalProps {
  onClose: () => void;
  onStoryCreated: (story: Story) => void;
}

export const CreateStoryModal: React.FC<CreateStoryModalProps> = ({ onClose, onStoryCreated }) => {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [location, setLocation] = useState('')
  const [place, setPlace] = useState<Story['place'] | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [showPlacePicker, setShowPlacePicker] = useState(false)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader()
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages(prev => [...prev, event.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || (!location.trim() && !place)) return

    try {
      setLoading(true)
      
      // Generate AI tags if none selected
      let finalTags = tags
      if (tags.length === 0) {
        try {
          const aiTags = await communityService.generateAITags(title.trim(), content.trim())
          finalTags = aiTags
        } catch (error) {
          console.log('AI tagging failed, using manual tags')
        }
      }
      
      const newStory = await communityService.createStory({
        title: title.trim(),
        content: content.trim(),
        location: place?.name || location.trim(),
        place,
        images,
        tags: finalTags
      })
      onStoryCreated(newStory)
    } catch (error) {
      console.error('Failed to create story:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Share Your Travel Story</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Story Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your story a catchy title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            {place ? (
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{place.name}</p>
                      <p className="text-sm text-gray-500">{place.address}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPlace(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where did this happen?"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required={!place}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPlacePicker(true)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-600"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPlacePicker(true)}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                >
                  <Search className="w-4 h-4" />
                  <span>Search for a place</span>
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Story
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us about your amazing travel experience..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {['Adventure', 'Food', 'Culture', 'Nature', 'Photography', 'Beach', 'Mountain', 'City'].map((suggestedTag) => (
                  !tags.includes(suggestedTag) && (
                    <button
                      key={suggestedTag}
                      type="button"
                      onClick={() => handleAddTag(suggestedTag)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 text-gray-600"
                    >
                      + {suggestedTag}
                    </button>
                  )
                ))}
                {title.trim() && content.trim() && tags.length === 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const aiTags = await communityService.generateAITags(title.trim(), content.trim())
                        setTags(aiTags)
                      } catch (error) {
                        console.error('AI tagging failed:', error)
                      }
                    }}
                    className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 font-medium"
                  >
                    ✨ AI Suggest Tags
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload photos</p>
                <p className="text-sm text-gray-500">PNG, JPG up to 10MB each</p>
              </label>
            </div>

            {/* Image Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !content.trim() || (!location.trim() && !place)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Share Story</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Google Places Picker Modal */}
      {showPlacePicker && (
        <PlacePicker
          onClose={() => setShowPlacePicker(false)}
          onPlaceSelect={(selectedPlace) => {
            setPlace(selectedPlace)
            setLocation(selectedPlace.name)
            setShowPlacePicker(false)
          }}
        />
      )}
    </div>
  )
}
