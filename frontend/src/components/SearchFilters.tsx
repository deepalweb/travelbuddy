import React, { useState } from 'react'
import { Filter, X, MapPin, Star, DollarSign } from 'lucide-react'
import { Button } from './Button'

interface FilterOptions {
  category: string[]
  priceRange: string[]
  rating: number
  location: string
}

interface SearchFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void
  isOpen: boolean
  onClose: () => void
}

const categories = [
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
  { id: 'hotel', label: 'Hotels', icon: '🏨' },
  { id: 'attraction', label: 'Attractions', icon: '🏛️' },
  { id: 'temple', label: 'Temples', icon: '🛕' },
  { id: 'beach', label: 'Beaches', icon: '🏖️' },
  { id: 'nature', label: 'Nature', icon: '🌿' }
]

const priceRanges = [
  { id: '$', label: 'Budget (LKR 1,000-3,000)', value: '$' },
  { id: '$$', label: 'Mid-range (LKR 3,000-8,000)', value: '$$' },
  { id: '$$$', label: 'Premium (LKR 8,000+)', value: '$$$' }
]

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  isOpen,
  onClose
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    category: [],
    priceRange: [],
    rating: 0,
    location: ''
  })

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.category.includes(categoryId)
      ? filters.category.filter(c => c !== categoryId)
      : [...filters.category, categoryId]
    
    const newFilters = { ...filters, category: newCategories }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePriceToggle = (priceId: string) => {
    const newPrices = filters.priceRange.includes(priceId)
      ? filters.priceRange.filter(p => p !== priceId)
      : [...filters.priceRange, priceId]
    
    const newFilters = { ...filters, priceRange: newPrices }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters = { category: [], priceRange: [], rating: 0, location: '' }
    setFilters(emptyFilters)
    onFiltersChange(emptyFilters)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:w-96 sm:rounded-xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Categories</h4>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategoryToggle(category.id)}
                className={`p-3 rounded-lg border text-sm flex items-center justify-center transition-colors ${
                  filters.category.includes(category.id)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Price Range</h4>
          <div className="space-y-2">
            {priceRanges.map(price => (
              <button
                key={price.id}
                onClick={() => handlePriceToggle(price.value)}
                className={`w-full p-3 rounded-lg border text-sm text-left transition-colors ${
                  filters.priceRange.includes(price.value)
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{price.label}</span>
                  <span className="font-medium">{price.value}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Minimum Rating</h4>
          <div className="flex space-x-2">
            {[3, 4, 4.5].map(rating => (
              <button
                key={rating}
                onClick={() => setFilters(prev => ({ ...prev, rating }))}
                className={`px-3 py-2 rounded-lg border text-sm flex items-center transition-colors ${
                  filters.rating === rating
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Star className="w-4 h-4 mr-1 fill-current" />
                {rating}+
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button onClick={clearFilters} variant="outline" className="flex-1">
            Clear All
          </Button>
          <Button onClick={onClose} className="flex-1">
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}