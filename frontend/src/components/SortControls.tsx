import React from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from './Button'

export type SortOption = 'relevance' | 'rating' | 'price-low' | 'price-high' | 'distance'

interface SortControlsProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  showDistance?: boolean
}

const SortControls: React.FC<SortControlsProps> = ({ 
  currentSort, 
  onSortChange,
  showDistance = false 
}) => {
  const sortOptions: Array<{ value: SortOption; label: string }> = [
    { value: 'relevance', label: '⭐ Relevance' },
    { value: 'rating', label: '🌟 Highest Rated' },
    { value: 'price-low', label: '💰 Budget First' },
    { value: 'price-high', label: '💎 Premium First' },
  ]

  if (showDistance) {
    sortOptions.push({ value: 'distance', label: '📍 Nearest First' })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-gray-700">Sort by:</span>
      <div className="relative inline-block">
        <select 
          value={currentSort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="appearance-none px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors cursor-pointer pr-8"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
      </div>
    </div>
  )
}

export default SortControls
