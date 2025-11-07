import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Save, Upload, Calendar, DollarSign, MapPin, Tag, Sparkles, Target, Eye, Clock, Image, Video, Wand2 } from 'lucide-react'
import { Button } from '../components/Button'
import { Card, CardContent } from '../components/Card'

const CreateDealPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [aiLoading, setAiLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    businessName: '',
    businessType: 'restaurant',
    originalPrice: '',
    discountedPrice: '',
    discount: '',
    discountPercent: 0,
    location: { address: '', coordinates: { lat: 0, lng: 0 } },
    validFrom: '',
    validUntil: '',
    images: [] as string[],
    videos: [] as string[],
    promoCode: '',
    maxClaims: '',
    showCountdown: true,
    trackAnalytics: true,
    destinationFocus: '',
    travelerType: '',
    visibilityScope: 'global',
    tags: [] as string[]
  })

  const businessTypes = [
    { value: 'restaurant', label: '🍽️ Restaurant', color: 'text-orange-600' },
    { value: 'hotel', label: '🏨 Hotel', color: 'text-blue-600' },
    { value: 'cafe', label: '☕ Café', color: 'text-amber-600' },
    { value: 'attraction', label: '🎢 Attraction', color: 'text-purple-600' },
    { value: 'transport', label: '🚗 Transport', color: 'text-green-600' },
    { value: 'tour', label: '🗺️ Tour', color: 'text-indigo-600' },
    { value: 'spa', label: '💆 Spa & Wellness', color: 'text-pink-600' },
    { value: 'shopping', label: '🛍️ Shopping', color: 'text-red-600' }
  ]

  const travelerTypes = [
    { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
    { value: 'backpacker', label: '🎒 Backpacker' },
    { value: 'luxury', label: '💎 Luxury' },
    { value: 'adventure', label: '🏔️ Adventure' },
    { value: 'business', label: '💼 Business' },
    { value: 'romantic', label: '💕 Romantic' }
  ]

  const steps = [
    { id: 1, title: 'Deal Information', icon: Tag },
    { id: 2, title: 'Pricing & Media', icon: DollarSign },
    { id: 3, title: 'Location & Validity', icon: MapPin },
    { id: 4, title: 'Targeting & Analytics', icon: Target },
    { id: 5, title: 'Preview & Submit', icon: Eye }
  ]

  const handleInputChange = (field: string, value: any) => {
    if (field === 'address') {
      setFormData(prev => ({ ...prev, location: { ...prev.location, address: value } }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }

    // Auto-calculate discount percentage
    if (field === 'originalPrice' || field === 'discountedPrice') {
      const original = parseFloat(field === 'originalPrice' ? value : formData.originalPrice)
      const discounted = parseFloat(field === 'discountedPrice' ? value : formData.discountedPrice)
      
      if (original > 0 && discounted > 0 && discounted < original) {
        const discountPercent = Math.round(((original - discounted) / original) * 100)
        setFormData(prev => ({ 
          ...prev, 
          discount: `${discountPercent}% OFF`,
          discountPercent
        }))
      }
    }
  }

  const generateAIContent = async (type: 'title' | 'description' | 'tags') => {
    setAiLoading(true)
    try {
      const prompt = type === 'title' 
        ? `Generate 3 catchy deal titles for a ${formData.businessType} business named "${formData.businessName}" with ${formData.discountPercent}% off`
        : type === 'description'
        ? `Write engaging marketing copy for a ${formData.businessType} deal: "${formData.title}" at ${formData.businessName}`
        : `Generate relevant tags for a ${formData.businessType} travel deal`

      // Mock AI response for now
      if (type === 'title') {
        const suggestions = [
          `${formData.discountPercent}% Off at ${formData.businessName}`,
          `Special ${formData.businessType} Deal - Save Big!`,
          `Limited Time: ${formData.businessName} Discount`
        ]
        setFormData(prev => ({ ...prev, title: suggestions[0] }))
      } else if (type === 'description') {
        const description = `Enjoy an exclusive ${formData.discountPercent}% discount at ${formData.businessName}. Perfect for travelers looking for quality ${formData.businessType} experiences. Limited time offer - book now!`
        setFormData(prev => ({ ...prev, description }))
      } else if (type === 'tags') {
        const tags = ['travel', 'discount', 'limited-time', formData.businessType, 'exclusive']
        setFormData(prev => ({ ...prev, tags }))
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setAiLoading(false)
    }
  }

  const handleMediaUpload = (type: 'image' | 'video', files: FileList) => {
    const urls: string[] = []
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file)
      urls.push(url)
    })
    
    if (type === 'image') {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...urls] }))
    } else {
      setFormData(prev => ({ ...prev, videos: [...prev.videos, ...urls] }))
    }
  }

  const removeMedia = (type: 'image' | 'video', index: number) => {
    if (type === 'image') {
      setFormData(prev => ({ 
        ...prev, 
        images: prev.images.filter((_, i) => i !== index) 
      }))
    } else {
      setFormData(prev => ({ 
        ...prev, 
        videos: prev.videos.filter((_, i) => i !== index) 
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...formData,
          isActive: true,
          views: 0,
          claims: 0,
          validFrom: formData.validFrom ? new Date(formData.validFrom) : new Date(),
          validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
          maxClaims: formData.maxClaims ? parseInt(formData.maxClaims) : undefined
        })
      })

      if (response.ok) {
        navigate('/deals')
      } else {
        const errorData = await response.text()
        console.error('Server response:', response.status, errorData)
        throw new Error(`Server error: ${response.status} - ${errorData}`)
      }
    } catch (error) {
      console.error('Error creating deal:', error)
      alert('Failed to create deal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderDealInformation()
      case 2: return renderPricingAndMedia()
      case 3: return renderLocationAndValidity()
      case 4: return renderTargetingAndAnalytics()
      case 5: return renderPreviewAndSubmit()
      default: return renderDealInformation()
    }
  }

  const renderDealInformation = () => (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Deal Information
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Deal Title</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateAIContent('title')}
                disabled={aiLoading || !formData.businessName}
                className="text-xs"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                AI Suggest
              </Button>
            </div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., 30% Off All Main Courses"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => generateAIContent('description')}
                disabled={aiLoading || !formData.title}
                className="text-xs"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Generate Copy
              </Button>
            </div>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your deal and any terms & conditions"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                placeholder="Your business name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
              <select
                value={formData.businessType}
                onChange={(e) => handleInputChange('businessType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {businessTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPricingAndMedia = () => (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            Pricing & Offer Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Original Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.originalPrice}
                onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discounted Price ($)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.discountedPrice}
                onChange={(e) => handleInputChange('discountedPrice', e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
              <input
                type="text"
                value={formData.discount}
                placeholder="Auto-calculated"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
              <input
                type="text"
                value={formData.promoCode}
                onChange={(e) => handleInputChange('promoCode', e.target.value)}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Image className="h-5 w-5 mr-2" />
            Media Upload
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleMediaUpload('image', e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload images</p>
                </label>
              </div>
              
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {formData.images.map((img, index) => (
                    <div key={index} className="relative">
                      <img src={img} alt={`Deal ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeMedia('image', index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Videos</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={(e) => e.target.files && handleMediaUpload('video', e.target.files)}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload videos</p>
                </label>
              </div>
              
              {formData.videos.length > 0 && (
                <div className="space-y-2 mt-4">
                  {formData.videos.map((video, index) => (
                    <div key={index} className="relative bg-gray-100 p-2 rounded flex items-center justify-between">
                      <span className="text-sm truncate">Video {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeMedia('video', index)}
                        className="bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderLocationAndValidity = () => (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <MapPin className="h-5 w-5 mr-2" />
          Location & Validity
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
            <input
              type="text"
              required
              value={formData.location.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Full business address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Max Claims</label>
            <input
              type="number"
              value={formData.maxClaims}
              onChange={(e) => handleInputChange('maxClaims', e.target.value)}
              placeholder="Unlimited"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valid From</label>
            <input
              type="date"
              value={formData.validFrom}
              onChange={(e) => handleInputChange('validFrom', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valid Until</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => handleInputChange('validUntil', e.target.value)}
              min={formData.validFrom || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderTargetingAndAnalytics = () => (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2" />
          Audience Targeting & Analytics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ideal Traveler Type</label>
            <select
              value={formData.travelerType}
              onChange={(e) => handleInputChange('travelerType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Any Traveler</option>
              {travelerTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Visibility Scope</label>
            <select
              value={formData.visibilityScope}
              onChange={(e) => handleInputChange('visibilityScope', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="global">🌍 Global</option>
              <option value="local">📍 Local Only</option>
            </select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Track Views & Claims</label>
              <p className="text-xs text-gray-500">Monitor engagement analytics</p>
            </div>
            <input
              type="checkbox"
              checked={formData.trackAnalytics}
              onChange={(e) => handleInputChange('trackAnalytics', e.target.checked)}
              className="rounded"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Show Countdown Timer</label>
              <p className="text-xs text-gray-500">Creates urgency in deal card</p>
            </div>
            <input
              type="checkbox"
              checked={formData.showCountdown}
              onChange={(e) => handleInputChange('showCountdown', e.target.checked)}
              className="rounded"
            />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Tags</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => generateAIContent('tags')}
              disabled={aiLoading}
              className="text-xs"
            >
              <Wand2 className="h-3 w-3 mr-1" />
              Auto-fill Tags
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs flex items-center">
                {tag}
                <button
                  type="button"
                  onClick={() => {
                    const newTags = formData.tags.filter((_, i) => i !== index)
                    handleInputChange('tags', newTags)
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderPreviewAndSubmit = () => (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Live Preview
        </h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden max-w-sm mx-auto">
          <div className="relative">
            {formData.images[0] ? (
              <img src={formData.images[0]} alt="Deal preview" className="w-full h-48 object-cover" />
            ) : (
              <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <Tag className="w-12 h-12 text-gray-400" />
              </div>
            )}
            
            {formData.discount && (
              <div className="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                {formData.discount}
              </div>
            )}
            
            <div className="absolute top-3 left-3 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
              {businessTypes.find(t => t.value === formData.businessType)?.label || formData.businessType}
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-bold text-lg text-gray-900 mb-1">{formData.title || 'Deal Title'}</h3>
            <div className="flex items-center text-gray-600 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{formData.businessName || 'Business Name'}</span>
            </div>
            
            {formData.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{formData.description}</p>
            )}
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500 line-through text-sm">${formData.originalPrice || '0.00'}</span>
                <span className="text-green-600 font-bold text-lg">${formData.discountedPrice || '0.00'}</span>
              </div>
              {formData.showCountdown && formData.validUntil && (
                <div className="flex items-center text-orange-600 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Limited time</span>
                </div>
              )}
            </div>
            
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium">
              Claim Deal
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create a New Deal</h1>
          <p className="text-xl text-gray-600">Boost your visibility by publishing a verified travel deal</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="ml-2 hidden md:block">
                    <div className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {renderStepContent()}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Preview */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 text-sm">Quick Preview</h3>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm truncate">{formData.title || 'Deal Title'}</div>
                    <div className="text-xs text-gray-600 truncate">{formData.businessName || 'Business Name'}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500 line-through text-xs">${formData.originalPrice || '0.00'}</span>
                      <span className="text-green-600 font-bold text-sm">${formData.discountedPrice || '0.00'}</span>
                    </div>
                    {formData.discount && (
                      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full inline-block">
                        {formData.discount}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {currentStep < 5 ? (
                      <>
                        <Button
                          type="button"
                          onClick={nextStep}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={currentStep === 1 && (!formData.title || !formData.businessName)}
                        >
                          Next Step
                        </Button>
                        {currentStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className="w-full"
                          >
                            Previous
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Creating...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Create Deal
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          className="w-full"
                        >
                          Previous
                        </Button>
                      </>
                    )}
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/deals')}
                      className="w-full text-gray-600"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Loading Indicator */}
              {aiLoading && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <span className="text-sm">AI is working...</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateDealPage