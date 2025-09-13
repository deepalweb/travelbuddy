import React, { Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minLoadTime?: number; // Minimum loading time in ms to prevent flash
}

const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback, 
  minLoadTime = 200 
}) => {
  const [showFallback, setShowFallback] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(false);
    }, minLoadTime);

    return () => clearTimeout(timer);
  }, [minLoadTime]);

  const defaultFallback = (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner />
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {showFallback ? (fallback || defaultFallback) : children}
    </Suspense>
  );
};

export default LazyWrapper;
