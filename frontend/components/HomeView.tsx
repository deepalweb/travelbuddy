import React, { useState, useEffect } from 'react';
import { CurrentUser, SupportPoint, LocalInfo, ActiveTab, Place } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import {
  MapPin, Clock, Thermometer, Compass, Calendar, Camera, ShieldCheck,
  Sparkles, Coffee, Map as MapIcon, Heart, Lightbulb, DollarSign, Star, Navigation, RefreshCw
} from './Icons.tsx';
import SectionLoadingAnimation from './SectionLoadingAnimation.tsx';
import { personalizedSuggestionsService, PersonalizedSuggestion } from '../services/personalizedSuggestionsService';
import { localDiscoveriesService, LocalDiscovery } from '../services/localDiscoveriesService';
import { socialIntegrationService } from '../services/socialIntegrationService';
import SwipeableCard from './SwipeableCard.tsx';

interface HomeViewProps {
  currentUser: CurrentUser | null;
  userLocation: { latitude: number; longitude: number } | null;
  userCity: string | null;
  localInfo: LocalInfo | null;
  isLoading: boolean;
  supportLocations: SupportPoint[];
  onShowSOSModal: () => void;
  onTabChange: (tab: ActiveTab) => void;
  onSurpriseMeClick: () => void;
  favoritePlacesCount: number;
  favoritePlaces?: Place[];
  onSelectPlaceDetail?: (place: Place) => void;
}

const HomeView: React.FC<HomeViewProps> = ({
  currentUser,
  userLocation,
  userCity,
  localInfo,
  isLoading,
  supportLocations,
  onShowSOSModal,
  onTabChange,
  onSurpriseMeClick,
  favoritePlacesCount,
  favoritePlaces = [],
  onSelectPlaceDetail,
}) => {
  const { t, language } = useLanguage();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [suggestions, setSuggestions] = useState<PersonalizedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'nearby' | 'trending' | 'budget'>('all');
  const [localDiscoveries, setLocalDiscoveries] = useState<LocalDiscovery | null>(null);
  const [loadingDiscoveries, setLoadingDiscoveries] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('grid');
  const [currentSwipeIndex, setCurrentSwipeIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load personalized suggestions and local discoveries
  useEffect(() => {
    if (userLocation && userCity) {
      loadPersonalizedSuggestions();
      loadLocalDiscoveries();
    }
  }, [userLocation, userCity, currentUser]);

  const loadPersonalizedSuggestions = async () => {
    if (!userLocation || !userCity) return;
    
    setLoadingSuggestions(true);
    try {
      const rawSuggestions = await personalizedSuggestionsService.generatePersonalizedSuggestions(
        userLocation,
        userCity,
        currentUser?.selectedInterests || [],
        favoritePlaces,
        getCurrentTimeOfDay(),
        localInfo?.weather || 'sunny'
      );
      const enhancedSuggestions = socialIntegrationService.enhanceSuggestionsWithSocialData(rawSuggestions);
      setSuggestions(enhancedSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const loadLocalDiscoveries = async () => {
    if (!userCity) return;
    
    setLoadingDiscoveries(true);
    try {
      const discoveries = await localDiscoveriesService.generateLocalDiscoveries(userCity);
      setLocalDiscoveries(discoveries);
    } catch (error) {
      console.error('Failed to load local discoveries:', error);
    } finally {
      setLoadingDiscoveries(false);
    }
  };

  const getCurrentTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const getPriceDisplay = (level: number) => {
    return '$'.repeat(Math.max(1, Math.min(level, 3)));
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    switch (selectedFilter) {
      case 'nearby': return parseFloat(suggestion.distance) < 1;
      case 'budget': return suggestion.priceLevel <= 2;
      case 'trending': return suggestion.socialData?.isTrending || suggestion.rating >= 4.5;
      default: return true;
    }
  });

  const handleSwipeLeft = () => {
    socialIntegrationService.trackUserInteraction(filteredSuggestions[currentSwipeIndex]?.id, 'pass');
    setCurrentSwipeIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
  };

  const handleSwipeRight = () => {
    socialIntegrationService.trackUserInteraction(filteredSuggestions[currentSwipeIndex]?.id, 'like');
    setCurrentSwipeIndex(prev => Math.min(prev + 1, filteredSuggestions.length - 1));
  };

  const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
    <div className={`card-base p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );

  const Section: React.FC<React.PropsWithChildren<{ title: string, icon: React.ReactNode, className?: string }>> = ({ title, icon, children, className }) => (
    <Card className={className}>
      <div className="flex items-center mb-4">
        <span className="text-blue-500 mr-2">{icon}</span>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
      </div>
      {children}
    </Card>
  );

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Welcome Header */}
      <Card className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          Hello, {currentUser?.username || "Traveler"}! 👋
        </h1>
        <p className="text-md mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Ready for your next adventure?
        </p>
        {currentUser && (
          <div className="inline-block px-3 py-1 text-xs font-semibold rounded-full mb-4" style={{ backgroundColor: 'var(--color-input-bg)', color: 'var(--color-primary)' }}>
            {currentUser.tier.charAt(0).toUpperCase() + currentUser.tier.slice(1)} Plan
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-input-bg)' }}>
            <MapPin className="w-4 h-4" />
            <span>{isLoading ? (
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            ) : userCity || "Location unavailable"}</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-input-bg)' }}>
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString(language === 'es' ? 'es-ES' : 'en-US')}</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-input-bg)' }}>
            <Thermometer className="w-4 h-4" />
            <span>{isLoading ? (
              <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
            ) : localInfo?.weather || "22°C ☀️ Sunny"}</span>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Explore Places', icon: <Compass />, color: 'bg-blue-500', action: () => onTabChange('placeExplorer') },
          { label: 'Plan Trip', icon: <Calendar />, color: 'bg-green-500', action: () => onTabChange('planner') },
          { label: 'Nearby Places', icon: <Camera />, color: 'bg-purple-500', action: () => onTabChange('placeExplorer') },
          { label: 'Safety Hub', icon: <ShieldCheck />, color: 'bg-red-500', action: onShowSOSModal },
        ].map(action => (
          <button key={action.label} onClick={action.action} className="card-base p-4 flex flex-col items-center justify-center text-center space-y-2 transition-transform hover:scale-105">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${action.color}`}>
              {React.cloneElement(action.icon, { className: 'w-6 h-6' })}
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>{action.label}</span>
          </button>
        ))}
      </div>

      {/* Personalized Recommendations Carousel */}
      <Section title="Personalized Recommendations" icon={<Sparkles className="w-5 h-5" />}>
        <div className="space-y-6">
          
          {/* Based on your interests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <span>🎯</span> Based on your interests
                <span className="hidden sm:inline text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  {currentUser?.selectedInterests?.join(', ') || 'Foodie, Adventure'}
                </span>
              </h3>
              <button className="text-xs text-blue-600 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:flex sm:gap-3 sm:overflow-x-auto sm:pb-2">
              {[
                { id: 'interest-1', name: 'Rooftop Bar Vista', type: 'Nightlife', rating: 4.8, image: '🍸', distance: '0.3km', formatted_address: '123 Sky Tower, Downtown' },
                { id: 'interest-2', name: 'Adventure Park', type: 'Adventure', rating: 4.6, image: '🧗', distance: '1.2km', formatted_address: '456 Mountain View Rd' },
                { id: 'interest-3', name: 'Local Food Market', type: 'Food', rating: 4.7, image: '🍜', distance: '0.8km', formatted_address: '789 Market Street' },
                { id: 'interest-4', name: 'Art Gallery', type: 'Culture', rating: 4.9, image: '🎨', distance: '0.5km', formatted_address: '321 Arts District' }
              ].map((place, index) => (
                <div 
                  key={index} 
                  onClick={() => onSelectPlaceDetail && onSelectPlaceDetail({
                    id: place.id,
                    name: place.name,
                    formatted_address: place.formatted_address,
                    rating: place.rating,
                    type: place.type,
                    geometry: { location: { lat: 0, lng: 0 } },
                    photos: []
                  } as Place)}
                  className="min-w-[160px] sm:min-w-[200px] p-3 rounded-lg cursor-pointer hover:shadow-md transition-all" 
                  style={{ backgroundColor: 'var(--color-input-bg)' }}
                >
                  <div className="text-2xl mb-2">{place.image}</div>
                  <h4 className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{place.name}</h4>
                  <p className="text-xs mb-2 truncate" style={{ color: 'var(--color-text-secondary)' }}>{place.type}</p>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {place.rating}
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>{place.distance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending near you */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <span>🔥</span> Trending near you
                <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-600">
                  {userCity || 'Your area'}
                </span>
              </h3>
              <button className="text-xs text-orange-600 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:flex sm:gap-3 sm:overflow-x-auto sm:pb-2">
              {[
                { id: 'trending-1', name: 'New Art Gallery', type: 'Culture', rating: 4.9, image: '🎨', trend: '+45% visits', formatted_address: '100 Gallery District' },
                { id: 'trending-2', name: 'Pop-up Food Festival', type: 'Event', rating: 4.5, image: '🎪', trend: 'This weekend', formatted_address: 'Central Park Area' },
                { id: 'trending-3', name: 'Sunset Viewpoint', type: 'Nature', rating: 4.8, image: '🌅', trend: 'Viral on social', formatted_address: 'Hilltop Drive' },
                { id: 'trending-4', name: 'Night Market', type: 'Shopping', rating: 4.6, image: '🏮', trend: 'Hot spot', formatted_address: 'Old Town Square' }
              ].map((place, index) => (
                <div 
                  key={index} 
                  onClick={() => onSelectPlaceDetail && onSelectPlaceDetail({
                    id: place.id,
                    name: place.name,
                    formatted_address: place.formatted_address,
                    rating: place.rating,
                    type: place.type,
                    geometry: { location: { lat: 0, lng: 0 } },
                    photos: []
                  } as Place)}
                  className="min-w-[160px] sm:min-w-[200px] p-3 rounded-lg border-l-4 border-orange-400 cursor-pointer hover:shadow-md transition-all" 
                  style={{ backgroundColor: 'var(--color-input-bg)' }}
                >
                  <div className="text-2xl mb-2">{place.image}</div>
                  <h4 className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{place.name}</h4>
                  <p className="text-xs mb-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>{place.type}</p>
                  <p className="text-xs text-orange-600 mb-2 truncate">{place.trend}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {place.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Because you liked */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <span>💡</span> Because you liked
                <span className="hidden sm:inline text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                  {favoritePlaces[0]?.name || 'Coffee shops'}
                </span>
              </h3>
              <button className="text-xs text-blue-600 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:flex sm:gap-3 sm:overflow-x-auto sm:pb-2">
              {[
                { id: 'ai-1', name: 'Artisan Coffee Co.', type: 'Similar vibe', rating: 4.7, image: '☕', match: '95% match', formatted_address: '456 Bean Street' },
                { id: 'ai-2', name: 'Cozy Book Café', type: 'Similar atmosphere', rating: 4.6, image: '📚', match: '88% match', formatted_address: '789 Reading Lane' },
                { id: 'ai-3', name: 'Garden Tea House', type: 'Similar style', rating: 4.8, image: '🍃', match: '92% match', formatted_address: '321 Garden Way' },
                { id: 'ai-4', name: 'Rooftop Lounge', type: 'Similar ambiance', rating: 4.5, image: '🌃', match: '87% match', formatted_address: '654 Sky Avenue' }
              ].map((place, index) => (
                <div 
                  key={index} 
                  onClick={() => onSelectPlaceDetail && onSelectPlaceDetail({
                    id: place.id,
                    name: place.name,
                    formatted_address: place.formatted_address,
                    rating: place.rating,
                    type: place.type,
                    geometry: { location: { lat: 0, lng: 0 } },
                    photos: []
                  } as Place)}
                  className="min-w-[160px] sm:min-w-[200px] p-3 rounded-lg border-l-4 border-blue-400 cursor-pointer hover:shadow-md transition-all" 
                  style={{ backgroundColor: 'var(--color-input-bg)' }}
                >
                  <div className="text-2xl mb-2">{place.image}</div>
                  <h4 className="font-medium text-sm mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>{place.name}</h4>
                  <p className="text-xs mb-1 truncate" style={{ color: 'var(--color-text-secondary)' }}>{place.type}</p>
                  <p className="text-xs text-blue-600 mb-2 truncate">{place.match}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {place.rating}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button 
            onClick={() => onTabChange('placeExplorer')} 
            className="flex-1 btn btn-primary"
          >
            <MapIcon className="w-4 h-4 mr-2" />
            Explore All
          </button>
          <button onClick={onSurpriseMeClick} className="flex-1 btn btn-secondary">
            <Sparkles className="w-4 h-4 mr-2" />
            Surprise Me!
          </button>
        </div>
      </Section>

      {/* Safety & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Nearby Support" icon={<ShieldCheck className="w-5 h-5" />}>
            {isLoading ? (
              <div className="space-y-2 mb-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse p-2 rounded-md flex justify-between items-center" style={{backgroundColor: 'var(--color-input-bg)'}}>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                  {supportLocations.slice(0, 3).map(loc => (
                      <div key={loc.id} className="text-xs p-2 rounded-md flex justify-between items-center" style={{backgroundColor: 'var(--color-input-bg)'}}>
                         <span>{loc.name}</span>
                         <span className="font-semibold px-2 py-0.5 rounded-full" style={{backgroundColor: 'var(--color-glass-bg)'}}>{loc.type}</span>
                      </div>
                  ))}
              </div>
            )}
            <button onClick={onShowSOSModal} className="btn w-full bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 hover:bg-red-500/30">
                Emergency SOS
            </button>
        </Section>
        <Section title="Travel Tips" icon={<Lightbulb className="w-5 h-5" />}>
           <div className="space-y-3">
             <div className="p-3 rounded-lg flex items-center gap-3 text-sm" style={{ backgroundColor: 'var(--color-input-bg)' }}>
                <span>💡</span>
                <p>Keep digital copies of important documents in a secure cloud service.</p>
             </div>
             <div className="p-3 rounded-lg flex items-center gap-3 text-sm" style={{ backgroundColor: 'var(--color-input-bg)' }}>
                <span>💰</span>
                <p>Inform your bank about your travel dates to avoid card issues.</p>
             </div>
           </div>
        </Section>
      </div>

      {/* Local Discoveries Widget */}
      <Section title="Local Discoveries" icon={<Sparkles className="w-5 h-5" />}>
        {loadingDiscoveries ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="p-4 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-input-bg)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hidden Gem Today */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-input-bg)' }}>
              <div className="flex items-start gap-3 mb-3">
                <span className="text-lg">📍</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>Hidden Gem Today:</h3>
                  <p className="font-medium text-sm mb-1" style={{ color: 'var(--color-primary)' }}>
                    {localDiscoveries?.hiddenGem.name || 'Local Hidden Gem'}
                  </p>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {localDiscoveries?.hiddenGem.description || 'A peaceful spot often overlooked by tourists.'}
                  </p>
                  <button 
                    onClick={() => onTabChange('planner')} 
                    className="text-xs px-3 py-1 rounded-full border transition-colors"
                    style={{ 
                      borderColor: 'var(--color-primary)', 
                      color: 'var(--color-primary)',
                      backgroundColor: 'transparent'
                    }}
                  >
                    Add to Travel Plan
                  </button>
                </div>
              </div>
            </div>

            {/* Food & Culture Corner */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-input-bg)' }}>
              <div className="flex items-start gap-3">
                <span className="text-lg">🍲</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>Food & Culture Corner:</h3>
                  <p className="font-medium text-sm mb-1" style={{ color: 'var(--color-primary)' }}>
                    {localDiscoveries?.foodCulture.name || 'Local Cuisine'}
                  </p>
                  <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {localDiscoveries?.foodCulture.description || 'Traditional local dish popular with residents.'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    📍 Try it at "{localDiscoveries?.foodCulture.location || 'Local Restaurant'}" nearby.
                  </p>
                </div>
              </div>
            </div>

            {/* Insider Tip */}
            <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-input-bg)' }}>
              <div className="flex items-start gap-3">
                <span className="text-lg">💡</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text-primary)' }}>Insider Tip:</h3>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {localDiscoveries?.insiderTip || 'Visit popular attractions early morning to avoid crowds.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

    </div>
  );
};

export default HomeView;
