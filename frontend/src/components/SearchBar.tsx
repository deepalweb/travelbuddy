import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Search, MapPin, X, TrendingUp, Clock, Loader2 } from 'lucide-react'
import { trendingSearches, categorySearches } from '../data/searchSuggestions'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
  showSuggestions?: boolean
}

interface Suggestion {
  text: string
  type: 'recent' | 'trending' | 'autocomplete'
}

export const SearchBar: React.FC<SearchBarProps> = ({ 
  onSearch, 
  placeholder = "Where do you want to go? (e.g., Kandy, Ella, Galle)",
  showSuggestions = true
}) => {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('recentSearches')
    return saved ? JSON.parse(saved) : []
  })
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout>()

  const fetchAutocompleteSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setAutocompleteSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setAutocompleteSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Autocomplete error:', error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  const handleInputChange = (value: string) => {
    setQuery(value)
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchAutocompleteSuggestions(value)
    }, 300)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isSearching) {
      setIsSearching(true)
      try {
        await onSearch(query.trim())
        saveToRecentSearches(query.trim())
        setShowDropdown(false)
      } finally {
        setIsSearching(false)
      }
    }
  }

  const saveToRecentSearches = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleClear = () => {
    setQuery('')
    setAutocompleteSuggestions([])
    inputRef.current?.focus()
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowDropdown(false)
    onSearch(suggestion)
    saveToRecentSearches(suggestion)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [])

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => showSuggestions && setShowDropdown(true)}
          placeholder={placeholder}
          disabled={isSearching}
          className="w-full pl-12 pr-20 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:border-teal-500 focus:outline-none bg-white shadow-lg text-gray-800 placeholder-gray-500 disabled:opacity-50"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-teal-500 text-white px-6 py-2 rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isSearching && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
          )}
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
      
      {/* Search Suggestions Dropdown */}
      {showSuggestions && showDropdown && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {autocompleteSuggestions.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                <div className="flex items-center">
                  <Search className="w-4 h-4 mr-1" />
                  Suggestions
                </div>
                {isLoadingSuggestions && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              {autocompleteSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="block w-full text-left px-2 py-2 text-sm text-gray-700 hover:bg-teal-50 rounded"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <Clock className="w-4 h-4 mr-1" />
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  {search}
                </button>
              ))}
            </div>
          )}
          
          <div className="p-4">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending in Sri Lanka
            </div>
            <div className="grid grid-cols-1 gap-1">
              {trendingSearches.slice(0, 6).map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="text-left px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded flex items-center"
                >
                  <Search className="w-3 h-3 mr-2 text-gray-400" />
                  {search}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
