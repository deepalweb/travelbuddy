import React, { useState, useRef } from 'react';
import { PersonalizedSuggestion } from '../services/personalizedSuggestionsService';
import { Star, Heart, Navigation, X, Check } from './Icons.tsx';

interface SwipeableCardProps {
  suggestion: PersonalizedSuggestion;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  getPriceDisplay: (level: number) => string;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  suggestion,
  onSwipeLeft,
  onSwipeRight,
  getPriceDisplay
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const startX = e.clientX;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const offset = e.clientX - startX;
      setDragOffset(offset);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (Math.abs(dragOffset) > 100) {
        if (dragOffset > 0) {
          onSwipeRight();
        } else {
          onSwipeLeft();
        }
      }
      setDragOffset(0);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const cardStyle = {
    transform: `translateX(${dragOffset}px) rotate(${dragOffset * 0.1}deg)`,
    opacity: Math.max(0.5, 1 - Math.abs(dragOffset) / 300)
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing select-none"
      style={cardStyle}
      onMouseDown={handleMouseDown}
    >
      {/* Swipe Indicators */}
      {dragOffset > 50 && (
        <div className="absolute top-4 right-4 z-10 bg-green-500 text-white p-2 rounded-full">
          <Heart className="w-4 h-4" />
        </div>
      )}
      {dragOffset < -50 && (
        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white p-2 rounded-full">
          <X className="w-4 h-4" />
        </div>
      )}

      {/* Image */}
      {suggestion.photoUrl && (
        <div className="w-full h-48 overflow-hidden">
          <img 
            src={suggestion.photoUrl} 
            alt={suggestion.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
            {suggestion.name}
          </h3>
          <div className="flex items-center gap-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            {suggestion.rating}
          </div>
        </div>
        
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          {suggestion.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {suggestion.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 text-xs rounded-full" style={{ backgroundColor: 'var(--color-glass-bg)', color: 'var(--color-primary)' }}>
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span>{suggestion.distance}</span>
            <span>{getPriceDisplay(suggestion.priceLevel)}</span>
            <span className={`w-2 h-2 rounded-full ${suggestion.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); onSwipeLeft(); }}
            className="flex-1 py-2 px-4 rounded-lg border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Pass
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onSwipeRight(); }}
            className="flex-1 py-2 px-4 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Heart className="w-4 h-4" />
            Like
          </button>
        </div>
      </div>
    </div>
  );
};

export default SwipeableCard;