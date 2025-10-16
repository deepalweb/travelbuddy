import React from 'react';
import { Place } from '../types';
import { MapPin, Star, Clock } from 'lucide-react';

interface InstantSearchResultsProps {
  results: Place[];
  isVisible: boolean;
  onSelectPlace: (place: Place) => void;
  onClose: () => void;
  searchQuery: string;
}

const InstantSearchResults: React.FC<InstantSearchResultsProps> = ({
  results,
  isVisible,
  onSelectPlace,
  onClose,
  searchQuery
}) => {
  if (!isVisible || results.length === 0) return null;

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 dark:bg-yellow-800 font-semibold">
          {part}
        </span>
      ) : part
    );
  };

  return (
    <div className="absolute top-full left-0 right-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
      <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {results.length} instant results
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ×
        </button>
      </div>
      
      <div className="py-2">
        {results.map((place) => (
          <button
            key={place.id}
            onClick={() => {
              onSelectPlace(place);
              onClose();
            }}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start gap-3"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
              {place.photos?.[0] ? (
                <img
                  src={`/api/places/photo?ref=${place.photos[0].photo_reference}&w=100`}
                  alt={place.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {highlightText(place.name, searchQuery)}
              </h3>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                {highlightText(place.formatted_address || '', searchQuery)}
              </p>
              
              <div className="flex items-center gap-4 mt-1">
                {place.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {place.rating.toFixed(1)}
                    </span>
                  </div>
                )}
                
                {place.opening_hours && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${
                      place.opening_hours.open_now 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {place.opening_hours.open_now ? 'Open' : 'Closed'}
                    </span>
                  </div>
                )}
                
                <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {place.type}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
          Press Enter or continue typing for more results
        </p>
      </div>
    </div>
  );
};

export default InstantSearchResults;