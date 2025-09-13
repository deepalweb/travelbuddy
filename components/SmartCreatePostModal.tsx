import React, { useState, useEffect } from 'react';
import { X, Camera, MapPin, Star, DollarSign, Clock, Sparkles } from './Icons.tsx';
import { CurrentUser } from '../types.ts';

interface SmartCreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (postData: any) => void;
  currentUser: CurrentUser | null;
  userLocation?: { latitude: number; longitude: number };
  userCity?: string;
  isLoading?: boolean;
}

type PostType = 'experience' | 'review' | 'itinerary' | 'deal' | 'question' | 'photo';

const SmartCreatePostModal: React.FC<SmartCreatePostModalProps> = ({
  isOpen, onClose, onSubmit, currentUser, userLocation, userCity, isLoading = false
}) => {
  const [step, setStep] = useState<'type' | 'create'>('type');
  const [selectedType, setSelectedType] = useState<PostType>('experience');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [priceLevel, setPriceLevel] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState(userCity || '');
  const [isListening, setIsListening] = useState(false);

  const postTypes = [
    {
      id: 'experience' as PostType,
      title: 'Trip Experience',
      description: 'Share your travel story',
      icon: '✈️',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    },
    {
      id: 'review' as PostType,
      title: 'Place Review',
      description: 'Rate & review a place',
      icon: '📍',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      id: 'itinerary' as PostType,
      title: 'Trip Plan',
      description: 'Share your itinerary',
      icon: '🗓️',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      id: 'deal' as PostType,
      title: 'Deal Alert',
      description: 'Share a great deal',
      icon: '💸',
      color: 'bg-orange-50 border-orange-200 text-orange-700'
    },
    {
      id: 'question' as PostType,
      title: 'Ask Question',
      description: 'Get travel advice',
      icon: '❓',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-700'
    },
    {
      id: 'photo' as PostType,
      title: 'Photo Moment',
      description: 'Share a beautiful moment',
      icon: '📸',
      color: 'bg-pink-50 border-pink-200 text-pink-700'
    }
  ];

  // Context-aware suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (userCity) {
      setSuggestions([
        `Looks like you're in ${userCity}. Share a local tip!`,
        `Perfect time to review a place in ${userCity}`,
        `Help fellow travelers visiting ${userCity}`
      ]);
    }
  }, [userCity]);

  // AI-suggested hashtags based on post type and location
  const getSuggestedTags = (type: PostType) => {
    const baseTags = userCity ? [`#${userCity.replace(/\s+/g, '')}`] : [];
    
    switch (type) {
      case 'experience':
        return [...baseTags, '#TravelStory', '#Adventure', '#MustDo'];
      case 'review':
        return [...baseTags, '#Review', '#LocalTip', '#HiddenGem'];
      case 'itinerary':
        return [...baseTags, '#TripPlan', '#Itinerary', '#TravelGuide'];
      case 'deal':
        return [...baseTags, '#Deal', '#Discount', '#BudgetTravel'];
      case 'question':
        return [...baseTags, '#TravelHelp', '#Advice', '#Question'];
      case 'photo':
        return [...baseTags, '#Photography', '#Beautiful', '#Moment'];
      default:
        return baseTags;
    }
  };

  const handleVoiceToText = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setContent(prev => prev + ' ' + transcript);
      };

      recognition.start();
    }
  };

  const generateAICaption = async () => {
    // Mock AI caption generation
    const captions = [
      "Just discovered this amazing hidden spot! 🌟",
      "The views here are absolutely breathtaking 📸",
      "Local tip: Visit early morning for the best experience ⏰",
      "This place exceeded all my expectations! ✨"
    ];
    setContent(captions[Math.floor(Math.random() * captions.length)]);
  };

  const renderTypeSelection = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Create Post</h3>
          <p className="text-gray-600 mt-1">What would you like to share?</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
          <X size={20} className="text-gray-400" />
        </button>
      </div>

      {/* Context Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="text-blue-600" size={16} />
            <span className="text-sm font-medium text-blue-800">Smart Suggestions</span>
          </div>
          {suggestions.map((suggestion, index) => (
            <p key={index} className="text-sm text-blue-700">{suggestion}</p>
          ))}
        </div>
      )}

      {/* Post Type Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {postTypes.map(type => (
          <button
            key={type.id}
            onClick={() => {
              setSelectedType(type.id);
              setTags(getSuggestedTags(type.id));
              setStep('create');
            }}
            className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${type.color}`}
          >
            <div className="text-3xl mb-2">{type.icon}</div>
            <h4 className="font-semibold text-sm mb-1">{type.title}</h4>
            <p className="text-xs opacity-80">{type.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCreateForm = () => {
    const selectedTypeData = postTypes.find(t => t.id === selectedType)!;
    
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setStep('type')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ←
            </button>
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <span>{selectedTypeData.icon}</span>
                {selectedTypeData.title}
              </h3>
              <p className="text-gray-600 text-sm">{selectedTypeData.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin size={16} className="inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where are you posting from?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Rating & Price (for reviews) */}
          {selectedType === 'review' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      <Star size={20} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Level</label>
                <div className="flex gap-1">
                  {[1,2,3,4].map(level => (
                    <button
                      key={level}
                      onClick={() => setPriceLevel(level)}
                      className={`p-1 ${level <= priceLevel ? 'text-green-500' : 'text-gray-300'}`}
                    >
                      <DollarSign size={16} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {selectedType === 'question' ? 'Your Question' : 'Share Your Experience'}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleVoiceToText}
                  className={`p-2 rounded-lg transition-colors ${
                    isListening ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Voice to text"
                >
                  <span>🎤</span>
                </button>
                <button
                  onClick={generateAICaption}
                  className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                  title="AI caption"
                >
                  <Sparkles size={16} />
                </button>
              </div>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                selectedType === 'question' ? "What would you like to know about traveling here?" :
                selectedType === 'review' ? "Share your honest review and tips..." :
                selectedType === 'deal' ? "Tell us about this amazing deal..." :
                "Share your experience..."
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
              rows={4}
            />
          </div>

          {/* Photos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Camera size={16} className="inline mr-1" />
              Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                
                for (const file of files) {
                  // Simple approach: just use smaller file size limit
                  if (file.size > 500000) { // 500KB limit
                    alert('Image too large. Please choose a smaller image.');
                    continue;
                  }
                  
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const imageUrl = event.target?.result as string;
                    setImages(prev => [...prev, imageUrl]);
                  };
                  reader.readAsDataURL(file);
                }
              }}
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
            >
              <Camera size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-600">Click to add photos</p>
              <p className="text-xs text-gray-500 mt-1">Up to 5 photos</p>
            </label>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {images.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt="Upload" className="w-full h-20 object-cover rounded" />
                    <button
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="inline mr-1">#</span>
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter(t => t !== tag))}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add tags... (press Enter)"
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && !tags.includes(value)) {
                    setTags([...tags, value.startsWith('#') ? value : `#${value}`]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>

          {/* Impact Preview */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="text-green-600" size={16} />
              <span className="text-sm font-medium text-green-800">Potential Impact</span>
            </div>
            <p className="text-sm text-green-700">
              Your post could help <strong>15+ travelers</strong> visiting {userCity} this week!
            </p>
            {selectedType === 'review' && (
              <p className="text-xs text-green-600 mt-1">
                ⭐ This could earn you a "Local Guide" badge
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!content.trim()) return;
                
                const postData = {
                  type: selectedType,
                  content: content.trim(),
                  location,
                  rating: selectedType === 'review' ? rating : undefined,
                  priceLevel: selectedType === 'review' ? priceLevel : undefined,
                  tags,
                  images,
                  category: selectedType === 'question' ? 'Question' : 
                           selectedType === 'itinerary' ? 'Itinerary' :
                           selectedType === 'deal' ? 'Deal' : 'Experience'
                };
                
                console.log('Submitting post data:', postData);
                onSubmit(postData);
              }}
              disabled={!content.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Share Post'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {step === 'type' ? renderTypeSelection() : renderCreateForm()}
      </div>
    </div>
  );
};

export default SmartCreatePostModal;