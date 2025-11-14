import React, { useState } from 'react'
import { MapPin, Eye, Users, Clock, Star, ExternalLink, Heart, Share2, Zap } from 'lucide-react'

interface Deal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  businessName: string;
  businessType: string;
  originalPrice: string;
  discountedPrice: string;
  location: {
    address: string;
  };
  images: string[];
  views: number;
  claims: number;
  isActive: boolean;
  validUntil?: Date;
  contactInfo?: {
    website?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    facebook?: string;
    instagram?: string;
  };
}

interface DealCardProps {
  deal: Deal
  onView: (dealId: string) => void
  onClaim: (dealId: string) => void
  isRecommended?: boolean
  distance?: string
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onView, onClaim, isRecommended = false, distance }) => {
  const [isSaved, setIsSaved] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  
  const handleView = () => {
    onView(deal._id)
    console.log('Deal data:', deal)
    console.log('Contact info:', deal.contactInfo)
    // Always show contact modal for deal details
    setShowContactModal(true)
  }
  const handleClaim = () => onClaim(deal._id)
  
  const handleSave = () => {
    setIsSaved(!isSaved)
    // TODO: Save to favorites API
  }
  
  const handleShare = async () => {
    setIsSharing(true)
    try {
      await navigator.share({
        title: deal.title,
        text: `${deal.discount} off at ${deal.businessName}!`,
        url: window.location.href
      })
    } catch {
      navigator.clipboard.writeText(window.location.href)
    }
    setIsSharing(false)
  }

  const getBusinessTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-orange-100 text-orange-800'
      case 'hotel': return 'bg-blue-100 text-blue-800'
      case 'cafe': return 'bg-amber-100 text-amber-800'
      case 'attraction': return 'bg-purple-100 text-purple-800'
      case 'transport': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const getBusinessTypeIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return '🍽️'
      case 'hotel': return '🏨'
      case 'cafe': return '☕'
      case 'attraction': return '🎡'
      case 'transport': return '🚗'
      default: return '🏪'
    }
  }
  
  const getUrgencyColor = (timeLeft: string) => {
    if (timeLeft.includes('Expired')) return 'text-red-600 bg-red-50'
    const days = parseInt(timeLeft)
    if (days <= 2) return 'text-red-600 bg-red-50'
    if (days <= 7) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const formatTimeLeft = (validUntil?: Date) => {
    if (!validUntil) return null
    const now = new Date()
    const end = new Date(validUntil)
    const diff = end.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? `${days} days left` : 'Expired'
  }

  const timeLeft = formatTimeLeft(deal.validUntil)
  const savings = parseFloat(deal.originalPrice) - parseFloat(deal.discountedPrice)

  return (
    <div className={`bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border group hover:-translate-y-1 ${
      isRecommended 
        ? 'border-transparent bg-gradient-to-br from-blue-50 to-purple-50 ring-2 ring-gradient-to-r ring-blue-200' 
        : 'border-gray-100'
    }`}>
      <div className="relative">
        {deal.images && deal.images.length > 0 && deal.images[0] ? (
          <img 
            src={deal.images[0]} 
            alt={deal.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=400&h=300&fit=crop&auto=format&q=80'
            }}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <Star className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Discount Badge */}
        <div className="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
          {deal.discount}
        </div>
        
        {/* Business Type Badge */}
        <div className={`absolute top-3 left-3 text-xs font-medium px-3 py-1 rounded-full flex items-center space-x-1 ${getBusinessTypeColor(deal.businessType)}`}>
          <span>{getBusinessTypeIcon(deal.businessType)}</span>
          <span>{deal.businessType.charAt(0).toUpperCase() + deal.businessType.slice(1)}</span>
        </div>
        
        {/* Trending Badge */}
        {deal.claims > 10 && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1 animate-pulse">
            <Zap className="w-3 h-3" />
            <span>Trending</span>
          </div>
        )}
        
        {/* Recommended Badge */}
        {isRecommended && (
          <div className="absolute bottom-3 left-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center space-x-1">
            <Star className="w-3 h-3 fill-current" />
            <span>AI Pick</span>
          </div>
        )}
      </div>
      
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{deal.title}</h3>
          <div className="flex items-center justify-between text-gray-600 text-sm">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{deal.businessName}</span>
            </div>
            {distance && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                {distance}
              </span>
            )}
          </div>
        </div>
        
        {deal.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{deal.description}</p>
        )}
        
        {/* Price Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 line-through text-sm">${deal.originalPrice}</span>
            <span className="text-green-600 font-bold text-lg">${deal.discountedPrice}</span>
            {savings > 0 && (
              <span className="text-green-600 text-sm font-medium">Save ${savings.toFixed(0)}</span>
            )}
          </div>
        </div>
        
        {/* Enhanced Stats and Time */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <div className="flex items-center space-x-3">
            <div className="flex items-center text-gray-500">
              <Eye className="w-4 h-4 mr-1" />
              <span>{deal.views}</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Users className="w-4 h-4 mr-1" />
              <span>{deal.claims}</span>
            </div>
          </div>
          {timeLeft && (
            <div className={`flex items-center font-medium px-2 py-1 rounded-full text-xs ${
              getUrgencyColor(timeLeft)
            }`}>
              <Clock className="w-3 h-3 mr-1" />
              <span>{timeLeft}</span>
            </div>
          )}
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="space-y-3">
          <div className="flex space-x-2">
            <button
              onClick={handleView}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View</span>
            </button>
            <button
              onClick={handleSave}
              className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md ${
                isSaved
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gradient-to-r from-pink-500 to-red-500 text-white hover:from-pink-600 hover:to-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 mr-2 inline ${isSaved ? 'fill-current' : ''}`} />
              {isSaved ? 'Favorited' : 'Add to Favorite'}
            </button>
          </div>
          
          {/* Secondary Actions */}
          <div className="flex items-center justify-center pt-2 border-t border-gray-100">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-blue-500 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Deal Details Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) setShowContactModal(false); }}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">{deal.title}</h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">{deal.description}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 line-through">${deal.originalPrice}</span>
                <span className="text-green-600 font-bold text-lg">${deal.discountedPrice}</span>
              </div>
              <p className="text-sm text-gray-500">📍 {deal.location.address}</p>
            </div>
            
            {((deal.contactInfo && Object.values(deal.contactInfo).some(v => v)) || !deal.contactInfo) && (
              <div className="space-y-3 mb-4">
                <h4 className="font-semibold">Contact {deal.businessName}</h4>
                {/* Show test contact info if no real contact info exists */}
                {(!deal.contactInfo || !Object.values(deal.contactInfo).some(v => v)) && (
                  <>
                    <a href="https://example.com" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                      <span>🌐</span>
                      <span>Visit Website</span>
                    </a>
                    <a href="tel:+1234567890" 
                       className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <span>📞</span>
                      <span>Call +1 (234) 567-890</span>
                    </a>
                    <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer"
                       className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                      <span>💬</span>
                      <span>WhatsApp</span>
                    </a>
                    <a href="mailto:contact@business.com" 
                       className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span>✉️</span>
                      <span>Email</span>
                    </a>
                  </>
                )}
              {deal.contactInfo?.website && (
                <a href={deal.contactInfo.website} target="_blank" rel="noopener noreferrer" 
                   className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span>🌐</span>
                  <span>Visit Website</span>
                </a>
              )}
              {deal.contactInfo?.phone && (
                <a href={`tel:${deal.contactInfo.phone}`} 
                   className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span>📞</span>
                  <span>Call {deal.contactInfo.phone}</span>
                </a>
              )}
              {deal.contactInfo?.whatsapp && (
                <a href={`https://wa.me/${deal.contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                   className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  <span>💬</span>
                  <span>WhatsApp</span>
                </a>
              )}
              {deal.contactInfo?.email && (
                <a href={`mailto:${deal.contactInfo.email}`} 
                   className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <span>✉️</span>
                  <span>Email</span>
                </a>
              )}
              {deal.contactInfo?.facebook && (
                <a href={deal.contactInfo.facebook} target="_blank" rel="noopener noreferrer"
                   className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  <span>📘</span>
                  <span>Facebook</span>
                </a>
              )}
              {deal.contactInfo?.instagram && (
                <a href={deal.contactInfo.instagram} target="_blank" rel="noopener noreferrer"
                   className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                  <span>📷</span>
                  <span>Instagram</span>
                </a>
              )}
              </div>
            )}
            
            <button 
              onClick={() => setShowContactModal(false)}
              className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}