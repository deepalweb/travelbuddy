import React from 'react'
import { Button } from './Button'

interface QuickAccessOption {
  label: string
  query: string
}

interface QuickAccessButtonsProps {
  countryOptions?: Array<{ value: string; label: string }>
  regionOptions?: QuickAccessOption[]
  onCountrySelect?: (country: string) => void
  onRegionSelect?: (query: string) => void
  loading?: boolean
}

const QuickAccessButtons: React.FC<QuickAccessButtonsProps> = ({
  countryOptions = [
    { value: 'Japan', label: '🇯🇵 Japan' },
    { value: 'France', label: '🇫🇷 France' },
    { value: 'Italy', label: '🇮🇹 Italy' },
    { value: 'Thailand', label: '🇹🇭 Thailand' },
    { value: 'United States', label: '🇺🇸 United States' },
    { value: 'United Kingdom', label: '🇬🇧 United Kingdom' },
    { value: 'Spain', label: '🇪🇸 Spain' },
    { value: 'Germany', label: '🇩🇪 Germany' },
    { value: 'Australia', label: '🇦🇺 Australia' },
    { value: 'Canada', label: '🇨🇦 Canada' },
    { value: 'India', label: '🇮🇳 India' },
    { value: 'China', label: '🇨🇳 China' },
    { value: 'Brazil', label: '🇧🇷 Brazil' },
    { value: 'Mexico', label: '🇲🇽 Mexico' },
    { value: 'Sri Lanka', label: '🇱🇰 Sri Lanka' }
  ],
  regionOptions = [
    { label: '🌍 Asia', query: 'attractions in Asia' },
    { label: '🇪🇺 Europe', query: 'attractions in Europe' },
    { label: '🇺🇸 Americas', query: 'attractions in Americas' },
    { label: '🌊 Islands', query: 'tropical islands destinations' },
    { label: '🏔️ Mountains', query: 'mountain destinations' },
    { label: '🏛️ Culture', query: 'cultural attractions museums' }
  ],
  onCountrySelect,
  onRegionSelect,
  loading = false
}) => {
  return (
    <div className="bg-white border-b border-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6">
          {/* Country Dropdown */}
          <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap justify-center">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Explore by Country:</span>
            <select 
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors"
              onChange={(e) => e.target.value && onCountrySelect?.(e.target.value)}
              defaultValue=""
              disabled={loading}
            >
              <option value="">Select a country</option>
              {countryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Region Quick Access Chips */}
          <div className="flex flex-wrap justify-center gap-3 w-full">
            {regionOptions.map((region) => (
              <Button
                key={region.label}
                variant="outline"
                size="sm"
                onClick={() => onRegionSelect?.(region.query)}
                disabled={loading}
                className="border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors whitespace-nowrap"
              >
                {region.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickAccessButtons
