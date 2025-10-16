import React from 'react';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', label: 'All', icon: '🌍' },
    { id: 'restaurant', label: 'Restaurants', icon: '🍽️' },
    { id: 'tourist_attraction', label: 'Attractions', icon: '🎭' },
    { id: 'lodging', label: 'Hotels', icon: '🏨' },
    { id: 'shopping_mall', label: 'Shopping', icon: '🛍️' },
    { id: 'park', label: 'Parks', icon: '🌳' },
  ];

  return (
    <div className="flex space-x-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === category.id
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <span>{category.icon}</span>
          <span className="text-sm font-medium">{category.label}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterBar;