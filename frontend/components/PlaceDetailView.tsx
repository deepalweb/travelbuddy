import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { Colors } from '../constants';
import { withApiBase } from '../services/config';

interface PlaceDetailViewProps {
  place: Place;
  onClose: () => void;
}

interface PlaceDetailContent {
  overview: string;
  highlights: string[];
  insiderTips: string[];
  bestTimeToVisit: string;
  duration: string;
  cost: string;
  images: string[];
}

export const PlaceDetailView: React.FC<PlaceDetailViewProps> = ({ place, onClose }) => {
  const [content, setContent] = useState<PlaceDetailContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    generatePlaceContent();
  }, [place]);

  const generatePlaceContent = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate AI content
      const aiContent = await generateAIContent();
      
      // Fetch images from Unsplash
      const images = await fetchImages();
      
      setContent({
        ...aiContent,
        images
      });
    } catch (err) {
      setError('Failed to load place details');
      console.error('Error generating place content:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIContent = async (): Promise<Omit<PlaceDetailContent, 'images'>> => {
    const response = await fetch(withApiBase('/api/ai/generate-place-content'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        placeName: place.name,
        placeType: place.type,
        address: place.address,
        description: place.description,
        rating: place.rating
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate AI content');
    }

    return await response.json();
  };

  const fetchImages = async (): Promise<string[]> => {
    try {
      // Use a combination of place photo and generated images
      const images = [];
      
      // Add the original place photo if available
      if (place.photoUrl) {
        images.push(place.photoUrl);
      }
      
      // Add some related images using Lorem Picsum with place-specific seeds
      const placeHash = place.name.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      
      const baseImages = [
        `https://picsum.photos/800/600?random=${Math.abs(placeHash) % 1000}`,
        `https://picsum.photos/800/600?random=${Math.abs(placeHash + 1) % 1000}`,
        `https://picsum.photos/800/600?random=${Math.abs(placeHash + 2) % 1000}`,
        `https://picsum.photos/800/600?random=${Math.abs(placeHash + 3) % 1000}`,
        `https://picsum.photos/800/600?random=${Math.abs(placeHash + 4) % 1000}`
      ];
      
      images.push(...baseImages);
      return images.slice(0, 6);
    } catch (error) {
      // Fallback images
      return [
        place.photoUrl || 'https://picsum.photos/800/600?random=1',
        'https://picsum.photos/800/600?random=2',
        'https://picsum.photos/800/600?random=3'
      ];
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4" style={{ backgroundColor: Colors.cardBackground }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: Colors.primary }}></div>
            <p style={{ color: Colors.text }}>Loading detailed information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4" style={{ backgroundColor: Colors.cardBackground }}>
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Failed to load content'}</p>
            <button 
              onClick={onClose}
              className="px-4 py-2 rounded"
              style={{ backgroundColor: Colors.primary, color: 'white' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: Colors.cardBackground }}
      >
        {/* Header with image gallery */}
        <div className="relative h-64 md:h-80">
          <img 
            src={content.images[activeImageIndex]} 
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          {/* Image navigation */}
          {content.images.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 overflow-x-auto">
              {content.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`flex-shrink-0 w-16 h-12 rounded border-2 ${
                    idx === activeImageIndex ? 'border-white' : 'border-transparent'
                  }`}
                >
                  <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover rounded" />
                </button>
              ))}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{place.name}</h1>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>{place.address}</span>
              </div>
              {place.rating && (
                <div className="flex items-center gap-1">
                  <span style={{ color: Colors.gold }}>{'⭐'.repeat(Math.round(place.rating))}</span>
                  <span>({place.rating.toFixed(1)})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left column */}
            <div className="space-y-6">
              {/* Overview */}
              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: Colors.primary }}>
                  <span>ℹ️</span>
                  Overview
                </h2>
                <p className="text-sm leading-relaxed" style={{ color: Colors.text_secondary }}>
                  {content.overview}
                </p>
              </section>

              {/* Highlights */}
              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: Colors.primary }}>
                  <span>✨</span>
                  Highlights
                </h2>
                <ul className="space-y-2">
                  {content.highlights.map((highlight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: Colors.text_secondary }}>
                      <span className="text-green-500 mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Insider Tips */}
              <section>
                <h2 className="text-xl font-semibold mb-3 flex items-center gap-2" style={{ color: Colors.primary }}>
                  <span>💡</span>
                  Insider Tips
                </h2>
                <ul className="space-y-2">
                  {content.insiderTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm" style={{ color: Colors.text_secondary }}>
                      <span className="text-yellow-500 mt-1">💡</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Visit Information */}
              <section className="p-4 rounded-lg" style={{ backgroundColor: Colors.inputBackground }}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: Colors.primary }}>
                  <span>📅</span>
                  Visit Information
                </h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏰</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: Colors.text }}>Best Time to Visit</p>
                      <p className="text-xs" style={{ color: Colors.text_secondary }}>{content.bestTimeToVisit}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-lg">⏱️</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: Colors.text }}>Recommended Duration</p>
                      <p className="text-xs" style={{ color: Colors.text_secondary }}>{content.duration}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💰</span>
                    <div>
                      <p className="font-medium text-sm" style={{ color: Colors.text }}>Estimated Cost</p>
                      <p className="text-xs" style={{ color: Colors.text_secondary }}>{content.cost}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Actions */}
              <section className="space-y-3">
                <button
                  onClick={() => {
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
                    window.open(mapsUrl, '_blank');
                  }}
                  className="w-full py-3 px-4 rounded-lg font-medium text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: Colors.primary }}
                >
                  <span>🗺️</span>
                  Get Directions
                </button>
                
                <button
                  onClick={() => {
                    // Share functionality
                    if (navigator.share) {
                      navigator.share({
                        title: place.name,
                        text: `Check out ${place.name}!`,
                        url: window.location.href
                      });
                    } else {
                      // Fallback: copy to clipboard
                      navigator.clipboard.writeText(`${place.name} - ${place.address}`);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: Colors.inputBackground, 
                    color: Colors.primary,
                    border: `1px solid ${Colors.primary}`
                  }}
                >
                  <span>📤</span>
                  Share Place
                </button>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};