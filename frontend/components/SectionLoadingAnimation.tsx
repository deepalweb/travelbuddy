import React from 'react';
import { Colors } from '../constants.ts';

interface SectionLoadingAnimationProps {
  type?: 'cards' | 'list' | 'grid' | 'skeleton';
  count?: number;
  message?: string;
  className?: string;
}

const SectionLoadingAnimation: React.FC<SectionLoadingAnimationProps> = ({
  type = 'cards',
  count = 6,
  message = 'Loading...',
  className = ''
}) => {
  const renderSkeletonCard = (index: number) => (
    <div 
      key={index}
      className="animate-pulse rounded-xl overflow-hidden"
      style={{ 
        backgroundColor: Colors.cardBackground, 
        border: `1px solid ${Colors.cardBorder}`,
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  );

  const renderSkeletonList = (index: number) => (
    <div 
      key={index}
      className="animate-pulse flex items-center space-x-4 p-4 rounded-lg"
      style={{ 
        backgroundColor: Colors.cardBackground,
        animationDelay: `${index * 80}ms`
      }}
    >
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
    </div>
  );

  const renderSpinner = () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <div 
          className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: Colors.primary, borderTopColor: 'transparent' }}
        ></div>
        <div 
          className="absolute inset-2 w-12 h-12 border-4 border-b-transparent rounded-full animate-spin"
          style={{ 
            borderColor: Colors.primaryGradientEnd, 
            borderBottomColor: 'transparent',
            animationDirection: 'reverse',
            animationDuration: '1.5s'
          }}
        ></div>
      </div>
      <div className="text-center">
        <p className="text-lg font-semibold mb-1" style={{ color: Colors.text }}>
          {message}
        </p>
        <div className="flex space-x-1 justify-center">
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: Colors.primary,
              animationDelay: '0ms'
            }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: Colors.primary,
              animationDelay: '150ms'
            }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ 
              backgroundColor: Colors.primary,
              animationDelay: '300ms'
            }}
          ></div>
        </div>
      </div>
    </div>
  );

  if (type === 'skeleton') {
    return renderSpinner();
  }

  return (
    <div className={`animate-fadeInUp ${className}`}>
      {type === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: count }).map((_, index) => renderSkeletonCard(index))}
        </div>
      )}
      
      {type === 'list' && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, index) => renderSkeletonList(index))}
        </div>
      )}
      
      {type === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: count }).map((_, index) => renderSkeletonCard(index))}
        </div>
      )}
    </div>
  );
};

export default SectionLoadingAnimation;