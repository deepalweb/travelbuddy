import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Filter, X } from './Icons.tsx';
import { smartSearchService, SmartFilter, SortOption } from '../services/smartSearchService';

interface SmartSearchBarProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onAISearch: (query: string) => void;
  weather?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;
  activeSortOption: string;
  onSortChange: (sortId: string) => void;
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  searchInput,
  onSearchInputChange,
  onAISearch,
  weather = 'sunny',
  timeOfDay = 'afternoon',
  activeFilters,
  onFiltersChange,
  activeSortOption,
  onSortChange
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const searchRef = useRef<HTMLInputElement>(null);

  const smartFilters = smartSearchService.getSmartFilters();
  const sortOptions = smartSearchService.getSortOptions();
  const contextualFilters = smartSearchService.getContextualSuggestions(weather, timeOfDay);
  const allFilters = [...smartFilters, ...contextualFilters];

  const handleAISearch = async () => {
    if (!searchInput.trim()) return;
    
    try {
      const interpretation = await smartSearchService.interpretAISearch(searchInput);
      setAiSuggestion(interpretation.intent);
      onFiltersChange([...activeFilters, ...interpretation.filters]);
      onAISearch(searchInput);
    } catch (error) {
      console.error('AI search failed:', error);
      onAISearch(searchInput);
    }
  };

  const toggleFilter = (filterId: string) => {
    if (activeFilters.includes(filterId)) {
      onFiltersChange(activeFilters.filter(id => id !== filterId));
    } else {
      onFiltersChange([...activeFilters, filterId]);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange([]);
    onSortChange('closest');
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-5 h-5 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onAISearch(searchInput)}
            placeholder="Try 'best sunset spots near me' or 'free activities for kids'"
            className="w-full pl-10 pr-20 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-2 flex gap-2">
            <button
              onClick={() => onAISearch(searchInput)}
              disabled={!searchInput.trim()}
              className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              onClick={handleAISearch}
              disabled={!searchInput.trim()}
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="AI Search"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters || activeFilters.length > 0
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
              {activeFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* AI Suggestion */}
        {aiSuggestion && (
          <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            <Sparkles className="w-4 h-4 inline mr-1" />
            AI interpreted: {aiSuggestion}
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          {/* Quick Sort Options */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Sort by</h3>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map(option => (
                <button
                  key={option.id}
                  onClick={() => onSortChange(option.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeSortOption === option.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Smart Filters */}
          <div>
            <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-2">Filters</h3>
            <div className="flex flex-wrap gap-2">
              {allFilters.map(filter => (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.includes(filter.id)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <span>{filter.icon}</span>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear All */}
          {(activeFilters.length > 0 || activeSortOption !== 'closest') && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeFilters.length} filters active
              </span>
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearchBar;