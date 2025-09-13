
import React, { useMemo, useState } from 'react';
import { Place, ExchangeRates } from '../types.ts';
import { Colors } from '../constants.ts';
import DealCard from './DealCard.tsx';
import SectionLoadingAnimation from './SectionLoadingAnimation.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface DealsViewProps {
  placesWithDeals: Place[];
  onSelectPlaceByNameOrId: (identifier: string, isId?: boolean) => void;
  currentUserHomeCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  hasAccessToPremiumDeals: boolean;
  fallbackPlaces?: Place[];
  isLoading?: boolean;
}

const DealsView: React.FC<DealsViewProps> = ({
  placesWithDeals,
  onSelectPlaceByNameOrId,
  currentUserHomeCurrency,
  exchangeRates,
  hasAccessToPremiumDeals,
  fallbackPlaces = [],
  isLoading = false,
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'hotels' | 'restaurants' | 'cafes' | 'shops'>('all');

  const filteredFallback = useMemo(() => {
    if (!fallbackPlaces) return [] as Place[];
    if (filter === 'all') return fallbackPlaces;
    const tokenMap: Record<string, string[]> = {
      hotels: ['lodging', 'hotel', 'hotels'],
      restaurants: ['food', 'restaurant', 'restaurants'],
      cafes: ['cafe', 'cafes', 'coffee'],
      shops: ['shopping', 'shop', 'shops', 'store'],
    };
    const tokens = tokenMap[filter];
    return fallbackPlaces.filter(p => {
      const t = (p.type || '').toLowerCase();
      return tokens.some(tok => t.includes(tok) || (p.types || []).some(tt => tt.toLowerCase().includes(tok)));
    });
  }, [fallbackPlaces, filter]);

  if (isLoading) {
    return (
      <div className="animate-fadeInUp">
        <h1 className="text-3xl font-bold mb-6" style={{ color: Colors.text }}>
          {t('dealsTab.title')}
        </h1>
        <SectionLoadingAnimation 
          type="cards" 
          count={8} 
          message="Finding the best deals for you..."
        />
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6" style={{ color: Colors.text }}>
        {t('dealsTab.title')}
      </h1>
      
      {placesWithDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {placesWithDeals.map(place => place.deal && (
            <DealCard
              key={`deal-page-${place.deal.id}`}
              deal={place.deal}
              onSelectPlace={() => onSelectPlaceByNameOrId(place.deal!.placeName, false)}
              homeCurrency={currentUserHomeCurrency}
              exchangeRates={exchangeRates}
              placePhotoUrl={place.photoUrl}
              hasAccessToPremiumDeals={hasAccessToPremiumDeals}
            />
          ))}
        </div>
      ) : fallbackPlaces.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.text }}>
            Nearby Hotels, Restaurants, Cafes & Shops
          </h2>
          <div className="flex gap-2 mb-4">
            {(['all','hotels','restaurants','cafes','shops'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-md border ${filter===f? 'font-semibold' : ''}`}
                style={{
                  color: Colors.text,
                  backgroundColor: filter===f? Colors.inputBackground : 'transparent',
                  borderColor: Colors.cardBorder
                }}
              >
                {f[0].toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFallback.map((place) => {
              // Build image URL similar to PlaceCard
              let imageUrl = place.image || place.photoUrl || '/images/placeholder.svg';
              if (!place.image && place.photos && place.photos.length > 0 && (place.photos[0] as any).photo_reference) {
                const ref = (place.photos[0] as any).photo_reference;
                imageUrl = `/api/places/photo?ref=${encodeURIComponent(ref)}&w=400`;
              }
              return (
                <button
                  key={`fallback-${place.id}`}
                  onClick={() => onSelectPlaceByNameOrId(place.id, true)}
                  className="rounded-xl overflow-hidden flex flex-col transition-all duration-200 group w-full text-left hover:shadow-lg hover:-translate-y-1"
                  style={{ backgroundColor: Colors.cardBackground, border: `1px solid ${Colors.cardBorder}`, boxShadow: Colors.boxShadow }}
                >
                  <div className="relative w-full h-32 sm:h-36 overflow-hidden">
                    <img src={imageUrl} alt={place.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }} />
                  </div>
                  <div className="p-4">
                    <h4 className="text-base font-semibold mb-1.5" style={{ color: Colors.text }}>{place.name}</h4>
                    <p className="text-sm mb-1" style={{ color: Colors.text_secondary }}>{place.types?.[0]?.replace(/_/g, ' ')}</p>
                    <p className="text-sm mb-1" style={{ color: Colors.text_secondary }}>{place.vicinity || place.formatted_address}</p>
                    {place.rating != null && (
                      <p className="text-sm" style={{ color: Colors.text_secondary }}>★ {place.rating.toFixed(1)}{place.user_ratings_total ? ` (${place.user_ratings_total})` : ''}</p>
                    )}
                    <div className="mt-2 text-xs font-semibold inline-flex items-center gap-1 opacity-80 group-hover:opacity-100" style={{ color: Colors.primary }}>
                      <span>View details</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-6 rounded-2xl" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-16 w-16 mb-4" style={{ color: Colors.text_secondary }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
            {t('dealsTab.noDealsAvailable')}
          </p>
          <p className="text-md" style={{ color: Colors.text_secondary }}>
            {t('dealsTab.checkBackLater')}
          </p>
        </div>
      )}
    </div>
  );
};

export default DealsView;
