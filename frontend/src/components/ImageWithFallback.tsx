import React, { useState, useEffect } from 'react';
import { Skeleton } from './SkeletonLoader';

interface ImageWithFallbackProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  onLoad,
  onError
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
    setRetryCount(0);
    
    // Timeout fallback to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    
    return () => clearTimeout(timeout);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(false); // Reset error state for retry
    
    if (retryCount === 0 && fallbackSrc && currentSrc !== fallbackSrc) {
      // First error: try fallback image
      setCurrentSrc(fallbackSrc);
      setRetryCount(1);
    } else if (retryCount === 1 && currentSrc !== `https://via.placeholder.com/600x400/6366f1/ffffff?text=${encodeURIComponent(alt)}`) {
      // Second error: use placeholder
      setCurrentSrc(`https://via.placeholder.com/600x400/6366f1/ffffff?text=${encodeURIComponent(alt)}`);
      setRetryCount(2);
    } else {
      // Final fallback: show error state
      setHasError(true);
    }
    
    onError?.();
  };

  if (hasError) {
    return (
      <div className={`bg-gray-200 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">{alt}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <Skeleton className={`absolute inset-0 z-10 ${className}`} />
      )}
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
};