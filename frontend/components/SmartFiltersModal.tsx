import React, { useState, useEffect, useCallback } from 'react';
import { Place } from '../types.ts';
import { Colors } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { MapPin, Star, Clock, Bookmark, Navigation, Camera, Coffee, Utensils } from './Icons.tsx';

interface SmartFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SmartFilters) => void;
  currentFilters: SmartFilters;
}

export interface SmartFilters {
  priceRange: {
    min: number;
    max: number;
  };
  rating: {
    min: number;
  };
  distance: {
    max: number; // in km
  };
  openNow: boolean;
  categories: string[];
  amenities: string[];
  accessibility: string[];
  timeOfDay: 'any' | 'morning' | 'afternoon' | 'evening' | 'night';
  crowdLevel: 'any' | 'quiet' | 'moderate' | 'lively';
  duration: 'any' | 'quick' | 'medium' | 'long'; // visit duration
}

const AVAILABLE_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurants', icon: <Utensils className="w-4 h-4" /> },
  { id: 'tourist_attraction', label: 'Attractions', icon: <Camera className="w-4 h-4" /> },
  { id: 'cafe', label: 'Cafes', icon: <Coffee className="w-4 h-4" /> },
  { id: 'museum', label: 'Museums', icon: <Star className="w-4 h-4" /> },
  { id: 'park', label: 'Parks', icon: <MapPin className="w-4 h-4" /> },
  { id: 'shopping_mall', label: 'Shopping', icon: <Bookmark className="w-4 h-4" /> },
  { id: 'night_club', label: 'Nightlife', icon: <Clock className="w-4 h-4" /> },
  { id: 'spa', label: 'Wellness', icon: <Star className="w-4 h-4" /> }
];

const AVAILABLE_AMENITIES = [
  { id: 'wifi', label: 'Free WiFi' },
  { id: 'parking', label: 'Parking Available' },
  { id: 'outdoor_seating', label: 'Outdoor Seating' },
  { id: 'takeaway', label: 'Takeaway Available' },
  { id: 'credit_cards', label: 'Accepts Cards' },
  { id: 'reservations', label: 'Takes Reservations' },
  { id: 'family_friendly', label: 'Family Friendly' },
  { id: 'pet_friendly', label: 'Pet Friendly' }
];

const ACCESSIBILITY_OPTIONS = [
  { id: 'wheelchair_accessible', label: 'Wheelchair Accessible' },
  { id: 'hearing_accessible', label: 'Hearing Accessible' },
  { id: 'visual_accessible', label: 'Visual Accessible' },
  { id: 'step_free', label: 'Step-Free Access' }
];

export const SmartFiltersModal: React.FC<SmartFiltersModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [filters, setFilters] = useState<SmartFilters>(currentFilters);
  const { t } = useLanguage();

  const handleCloseWithAnimation = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleCloseWithAnimation();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleCloseWithAnimation]);

  const handleApply = () => {
    onApplyFilters(filters);
    handleCloseWithAnimation();
  };

  const handleReset = () => {
    const defaultFilters: SmartFilters = {
      priceRange: { min: 0, max: 200 },
      rating: { min: 0 },
      distance: { max: 10 },
      openNow: false,
      categories: [],
      amenities: [],
      accessibility: [],
      timeOfDay: 'any',
      crowdLevel: 'any',
      duration: 'any'
    };
    setFilters(defaultFilters);
  };

  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const toggleAmenity = (amenityId: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const toggleAccessibility = (accessibilityId: string) => {
    setFilters(prev => ({
      ...prev,
      accessibility: prev.accessibility.includes(accessibilityId)
        ? prev.accessibility.filter(id => id !== accessibilityId)
        : [...prev.accessibility, accessibilityId]
    }));
  };

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-out
                  ${isVisible && isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={handleCloseWithAnimation}
      role="dialog"
      aria-modal="true"
      aria-labelledby="smart-filters-title"
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col relative rounded-xl shadow-xl overflow-hidden
                    transform transition-all duration-300 ease-out
                    ${isVisible && isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: Colors.cardBorder }}>
          <h2 id="smart-filters-title" className="text-2xl font-bold" style={{ color: Colors.text }}>
            {t('smartFilters.title')}
          </h2>
          <button
            onClick={handleCloseWithAnimation}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label={t('close')}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Price Range */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
              {t('smartFilters.priceRange')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.text_secondary }}>
                  {t('smartFilters.minPrice')}
                </label>
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, min: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: Colors.text_secondary }}>
                  {t('smartFilters.maxPrice')}
                </label>
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    priceRange: { ...prev.priceRange, max: parseInt(e.target.value) || 200 }
                  }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
                />
              </div>
            </div>
          </div>

          {/* Rating & Distance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                {t('smartFilters.minimumRating')}
              </h3>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={filters.rating.min}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  rating: { min: parseFloat(e.target.value) }
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-2" style={{ color: Colors.text_secondary }}>
                <span>Any</span>
                <span className="font-medium">{filters.rating.min}+ ⭐</span>
                <span>5 ⭐</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
                {t('smartFilters.maxDistance')}
              </h3>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={filters.distance.max}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  distance: { max: parseInt(e.target.value) }
                }))}
                className="w-full"
              />
              <div className="flex justify-between text-sm mt-2" style={{ color: Colors.text_secondary }}>
                <span>1km</span>
                <span className="font-medium">{filters.distance.max}km</span>
                <span>50km</span>
              </div>
            </div>
          </div>

          {/* Quick Toggles */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
              {t('smartFilters.quickOptions')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.openNow}
                  onChange={(e) => setFilters(prev => ({ ...prev, openNow: e.target.checked }))}
                  className="rounded"
                />
                <span style={{ color: Colors.text }}>{t('smartFilters.openNow')}</span>
              </label>

              <select
                value={filters.timeOfDay}
                onChange={(e) => setFilters(prev => ({ ...prev, timeOfDay: e.target.value as any }))}
                className="px-3 py-2 border rounded-lg"
                style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
              >
                <option value="any">{t('smartFilters.anyTime')}</option>
                <option value="morning">{t('smartFilters.morning')}</option>
                <option value="afternoon">{t('smartFilters.afternoon')}</option>
                <option value="evening">{t('smartFilters.evening')}</option>
                <option value="night">{t('smartFilters.night')}</option>
              </select>

              <select
                value={filters.crowdLevel}
                onChange={(e) => setFilters(prev => ({ ...prev, crowdLevel: e.target.value as any }))}
                className="px-3 py-2 border rounded-lg"
                style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
              >
                <option value="any">{t('smartFilters.anyCrowd')}</option>
                <option value="quiet">{t('smartFilters.quiet')}</option>
                <option value="moderate">{t('smartFilters.moderate')}</option>
                <option value="lively">{t('smartFilters.lively')}</option>
              </select>

              <select
                value={filters.duration}
                onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value as any }))}
                className="px-3 py-2 border rounded-lg"
                style={{ backgroundColor: Colors.inputBackground, borderColor: Colors.cardBorder }}
              >
                <option value="any">{t('smartFilters.anyDuration')}</option>
                <option value="quick">{t('smartFilters.quick')}</option>
                <option value="medium">{t('smartFilters.medium')}</option>
                <option value="long">{t('smartFilters.long')}</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
              {t('smartFilters.categories')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AVAILABLE_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${
                    filters.categories.includes(category.id)
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: filters.categories.includes(category.id) 
                      ? 'rgba(59, 130, 246, 0.1)' 
                      : Colors.inputBackground,
                    borderColor: filters.categories.includes(category.id) 
                      ? '#3b82f6' 
                      : Colors.cardBorder,
                    color: filters.categories.includes(category.id) 
                      ? '#1d4ed8' 
                      : Colors.text
                  }}
                >
                  {category.icon}
                  <span className="text-sm font-medium">{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
              {t('smartFilters.amenities')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_AMENITIES.map((amenity) => (
                <label key={amenity.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: Colors.text }}>{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Accessibility */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: Colors.text }}>
              {t('smartFilters.accessibility')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACCESSIBILITY_OPTIONS.map((option) => (
                <label key={option.id} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.accessibility.includes(option.id)}
                    onChange={() => toggleAccessibility(option.id)}
                    className="rounded"
                  />
                  <span className="text-sm" style={{ color: Colors.text }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center" style={{ borderColor: Colors.cardBorder }}>
          <button
            onClick={handleReset}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            style={{ color: Colors.text }}
          >
            {t('smartFilters.reset')}
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleCloseWithAnimation}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              style={{ color: Colors.text }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {t('smartFilters.apply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartFiltersModal;
