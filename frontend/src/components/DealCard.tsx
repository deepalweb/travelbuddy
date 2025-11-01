import React from 'react'
import { MapPin, Eye, Users, Clock, Star, ExternalLink } from 'lucide-react'

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
}

interface DealCardProps {
  deal: Deal
  onView: (dealId: string) => void
  onClaim: (dealId: string) => void
}

export const DealCard: React.FC<DealCardProps> = ({ deal, onView, onClaim }) => {
  const handleView = () => onView(deal._id)
  const handleClaim = () => onClaim(deal._id)

  const getBusinessTypeColor = (type: string) => {
    switch (type) {
      case 'restaurant': return 'bg-orange-100 text-orange-800'
      case 'hotel': return 'bg-blue-100 text-blue-800'
      case 'cafe': return 'bg-amber-100 text-amber-800'
      case 'attraction': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 group">
      <div className="relative">
        {deal.images[0] ? (
          <img 
            src={deal.images[0]} 
            alt={deal.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Star className="w-12 h-12 text-gray-400" />
          </div>
        )}
        
        {/* Discount Badge */}
        <div className="absolute top-3 right-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
          {deal.discount}
        </div>
        
        {/* Business Type Badge */}
        <div className={`absolute top-3 left-3 text-xs font-medium px-2 py-1 rounded-full ${getBusinessTypeColor(deal.businessType)}`}>
          {deal.businessType.charAt(0).toUpperCase() + deal.businessType.slice(1)}
        </div>
      </div>
      
      <div className="p-5">
        <div className="mb-3">
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{deal.title}</h3>
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{deal.businessName}</span>
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
        
        {/* Stats and Time */}
        <div className="flex items-center justify-between mb-4 text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>{deal.views}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{deal.claims}</span>
            </div>
          </div>
          {timeLeft && (
            <div className="flex items-center text-orange-600">
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-medium">{timeLeft}</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          <button
            onClick={handleView}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View</span>
          </button>
          <button
            onClick={handleClaim}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Claim Deal
          </button>
        </div>
      </div>
    </div>
  )
}