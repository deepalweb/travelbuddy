import React from 'react';

interface FilterBarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ selectedCategory, onCategoryChange }) => {
  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'restaurants', label: 'Restaurants', icon: '🍽️' },
    { id: 'attractions', label: 'Attractions', icon: '🎭' },
    { id: 'hotels', label: 'Hotels', icon: '🏨' },
    { id: 'shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎪' },
    { id: 'nature', label: 'Nature', icon: '🌲' },
    { id: 'culture', label: 'Culture', icon: '🏛️' },
  ];

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === category.id
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <span>{category.icon}</span>
          <span>{category.label}</span>
        </button>
      ))}
    </div>
  );
};

export default FilterBar;