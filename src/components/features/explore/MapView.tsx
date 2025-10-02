import React from 'react';

interface MapViewProps {
  searchQuery: string;
  selectedCategory: string;
}

const MapView: React.FC<MapViewProps> = ({ searchQuery, selectedCategory }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="h-96 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Map View Coming Soon
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Interactive map with place markers will be available here.
          </p>
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Search: "{searchQuery}" | Category: {selectedCategory}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;