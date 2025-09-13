
import React from 'react';
import { Colors } from '../constants.ts';

interface TypeFilterProps {
  types: string[];
  selectedType: string;
  onSelectType: (type: string) => void;
}

const TypeFilter: React.FC<TypeFilterProps> = ({ types, selectedType, onSelectType }) => {
  return (
    <div className="flex flex-wrap gap-2.5 items-center">
      <span className="text-sm font-medium mr-1.5 hidden sm:inline" style={{color: Colors.text_secondary}}>Filter:</span> 
      {types.map(type => {
        const isActive = selectedType === type;
        return (
          <button
            key={type}
            onClick={() => onSelectType(type)}
            className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-75 shadow-sm`}
            style={{
              color: isActive ? 'white' : Colors.text,
              backgroundImage: isActive ? `linear-gradient(135deg, ${Colors.primary}, ${Colors.primaryGradientEnd})` : 'none',
              backgroundColor: isActive ? 'transparent' : Colors.inputBackground, 
              border: `1px solid ${isActive ? 'transparent' : Colors.cardBorder}`,
              boxShadow: isActive ? Colors.boxShadowButton : Colors.boxShadowSoft
            }}
            aria-pressed={isActive}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
};

export default TypeFilter;
