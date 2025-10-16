import React, { useState, useEffect, useRef } from 'react';
import { Place } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { MapPin, Star, Clock, Camera, Eye } from './Icons.tsx';

interface PlaceARViewProps {
  isOpen: boolean;
  onClose: () => void;
  place: Place;
  userLocation?: { latitude: number; longitude: number } | null;
  onNavigateToPlace: (place: Place) => void;
}

interface ARAnnotation {
  id: string;
  type: 'direction' | 'info' | 'poi' | 'warning';
  title: string;
  description: string;
  distance?: string;
  position: { x: number; y: number };
  color: string;
}

export const PlaceARView: React.FC<PlaceARViewProps> = ({
  isOpen,
  onClose,
  place,
  userLocation,
  onNavigateToPlace
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCamera, setHasCamera] = useState(false);
  const [annotations, setAnnotations] = useState<ARAnnotation[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
      generateAnnotations();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen]);

  const initializeCamera = async () => {
    try {
      setIsLoading(true);
      
      // Check if we have camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setHasCamera(true);
      }
    } catch (error) {
      console.error('Camera access denied or not available:', error);
      setHasCamera(false);
    } finally {
      setIsLoading(false);
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const generateAnnotations = () => {
    // Generate mock AR annotations based on the place
    const mockAnnotations: ARAnnotation[] = [
      {
        id: 'direction-1',
        type: 'direction',
        title: `To ${place.name}`,
        description: '250m ahead',
        distance: '250m',
        position: { x: 60, y: 40 },
        color: '#3b82f6'
      },
      {
        id: 'info-1',
        type: 'info',
        title: 'Opening Hours',
        description: place.opening_hours?.open_now ? 'Open now' : 'Closed',
        position: { x: 30, y: 60 },
        color: place.opening_hours?.open_now ? '#10b981' : '#ef4444'
      },
      {
        id: 'poi-1',
        type: 'poi',
        title: 'Photo Spot',
        description: 'Great view of the entrance',
        position: { x: 80, y: 30 },
        color: '#8b5cf6'
      },
      {
        id: 'info-2',
        type: 'info',
        title: 'Rating',
        description: `⭐ ${place.rating?.toFixed(1) || 'N/A'}`,
        position: { x: 70, y: 70 },
        color: '#f59e0b'
      }
    ];

    setAnnotations(mockAnnotations);
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  };

  const getAnnotationIcon = (type: ARAnnotation['type']) => {
    switch (type) {
      case 'direction':
        return <MapPin className="w-4 h-4" />;
      case 'info':
        return <Eye className="w-4 h-4" />;
      case 'poi':
        return <Camera className="w-4 h-4" />;
      case 'warning':
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <h2 className="font-bold text-lg">{t('arView.title')}</h2>
              <p className="text-sm text-gray-300">{place.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
            <button
              onClick={() => onNavigateToPlace(place)}
              className="px-4 py-2 bg-blue-600 rounded-full font-medium hover:bg-blue-700 transition-colors"
            >
              {t('arView.navigate')}
            </button>
          </div>
        </div>
      </div>

      {/* Camera View or Fallback */}
      <div className="relative w-full h-full">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-lg">{t('arView.initializing')}</p>
            </div>
          </div>
        ) : hasCamera ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-800 to-gray-900">
            <div className="text-center text-white max-w-md px-6">
              <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold mb-2">{t('arView.cameraUnavailable')}</h3>
              <p className="text-gray-300 mb-6">{t('arView.cameraPermissionRequired')}</p>
              
              {/* Fallback: Show place info */}
              <div className="bg-black/50 rounded-xl p-6 backdrop-blur-sm">
                <img
                  src={place.image || place.photoUrl || '/images/placeholder.svg'}
                  alt={place.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                />
                <h4 className="font-bold text-lg mb-2">{place.name}</h4>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{place.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <button
                  onClick={() => onNavigateToPlace(place)}
                  className="w-full px-4 py-2 bg-blue-600 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  {t('arView.getDirections')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AR Annotations Overlay */}
        {hasCamera && !isLoading && (
          <div className="absolute inset-0 pointer-events-none">
            {annotations.map((annotation) => (
              <div
                key={annotation.id}
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${annotation.position.x}%`,
                  top: `${annotation.position.y}%`,
                }}
              >
                {/* Annotation Point */}
                <div className="relative">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse"
                    style={{ backgroundColor: annotation.color }}
                  >
                    {getAnnotationIcon(annotation.type)}
                  </div>
                  
                  {/* Annotation Label */}
                  <div 
                    className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap backdrop-blur-sm"
                    style={{ minWidth: '120px' }}
                  >
                    <div className="font-medium">{annotation.title}</div>
                    <div className="text-xs text-gray-300">{annotation.description}</div>
                    {annotation.distance && (
                      <div className="text-xs text-blue-300">{annotation.distance}</div>
                    )}
                    
                    {/* Arrow pointing to the dot */}
                    <div 
                      className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="flex items-center justify-center gap-4">
          <div className="bg-black/50 rounded-xl px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {userLocation ? 
                  `${Math.random() * 500 + 100}m away` : 
                  t('arView.locationUnavailable')
                }
              </span>
            </div>
          </div>
          
          <div className="bg-black/50 rounded-xl px-4 py-2 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {place.opening_hours?.open_now ? 
                  t('arView.openNow') : 
                  t('arView.closed')
                }
              </span>
            </div>
          </div>
        </div>
        
        {/* AR Instructions */}
        <div className="text-center mt-4">
          <p className="text-white text-sm opacity-75">
            {hasCamera ? 
              t('arView.pointCameraInstructions') : 
              t('arView.enableCameraInstructions')
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlaceARView;
