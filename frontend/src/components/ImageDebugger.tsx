import React, { useEffect, useState } from 'react';
import { debugImageUrls } from '../utils/imageUtils';

interface ImageDebuggerProps {
  images: Array<{ name: string; url: string; fallback?: string }>;
}

export const ImageDebugger: React.FC<ImageDebuggerProps> = ({ images }) => {
  const [results, setResults] = useState<Array<{ name: string; url: string; status: 'loading' | 'success' | 'error' }>>([]);

  useEffect(() => {
    const testImages = async () => {
      const initialResults = images.map(img => ({ 
        name: img.name, 
        url: img.url, 
        status: 'loading' as const 
      }));
      setResults(initialResults);

      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const response = await fetch(img.url, { method: 'HEAD' });
          setResults(prev => prev.map((result, index) => 
            index === i 
              ? { ...result, status: response.ok ? 'success' : 'error' }
              : result
          ));
        } catch {
          setResults(prev => prev.map((result, index) => 
            index === i 
              ? { ...result, status: 'error' }
              : result
          ));
        }
      }
    };

    testImages();
  }, [images]);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm max-h-64 overflow-y-auto z-50">
      <h3 className="font-bold text-sm mb-2">Image Status Debug</h3>
      <div className="space-y-1">
        {results.map((result, index) => (
          <div key={index} className="flex items-center space-x-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${
              result.status === 'loading' ? 'bg-yellow-400' :
              result.status === 'success' ? 'bg-green-400' : 'bg-red-400'
            }`}></span>
            <span className="truncate">{result.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};