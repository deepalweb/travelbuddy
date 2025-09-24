
import React, { useMemo, useState, useEffect } from 'react';
import { Place, ExchangeRates, CurrentUser } from '../types.ts';
import { Colors } from '../constants.ts';
import DealCard from './DealCard.tsx';
import SectionLoadingAnimation from './SectionLoadingAnimation.tsx';
import CreateMerchantDealModal from './CreateMerchantDealModal.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface Deal {
  _id: string;
  title: string;
  discount: string;
  description: string;
  businessName: string;
  businessType: string;
  businessAddress?: string;
  images?: string[];
  validUntil?: string;
  isActive: boolean;
  views?: number;
  claims?: number;
  merchantId?: string;
}

interface DealsViewProps {
  placesWithDeals: Place[];
  onSelectPlaceByNameOrId: (identifier: string, isId?: boolean) => void;
  currentUserHomeCurrency?: string;
  exchangeRates?: ExchangeRates | null;
  hasAccessToPremiumDeals: boolean;
  fallbackPlaces?: Place[];
  isLoading?: boolean;
  currentUser?: CurrentUser;
}

const DealsView: React.FC<DealsViewProps> = ({
  placesWithDeals,
  onSelectPlaceByNameOrId,
  currentUserHomeCurrency,
  exchangeRates,
  hasAccessToPremiumDeals,
  fallbackPlaces = [],
  isLoading = false,
  currentUser,
}) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'restaurant' | 'hotel' | 'cafe' | 'shop' | 'attraction'>('all');
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const handleCreateDeal = async (dealData: any) => {
    try {
      console.log('Creating deal with data:', dealData);
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });
      
      if (response.ok) {
        const newDeal = await response.json();
        console.log('Created deal:', newDeal);
        // Reload deals to show the new one
        await loadDeals();
      } else {
        console.error('Failed to create deal:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  const loadDeals = async () => {
    setDealsLoading(true);
    try {
      const response = await fetch('/api/deals?isActive=true');
      if (response.ok) {
        const deals = await response.json();
        console.log('Loaded deals:', deals.length, deals);
        console.log('Current user:', currentUser);
        setAllDeals(deals);
      } else {
        console.error('Failed to fetch deals:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setDealsLoading(false);
    }
  };

  const { myDeals, otherDeals, dealsByCategory } = useMemo(() => {
    const my: Deal[] = [];
    const others: Deal[] = [];
    
    // Check multiple possible user ID formats
    const userIds = [
      currentUser?.mongoId,
      currentUser?._id,
      currentUser?.id
    ].filter(Boolean);
    
    allDeals.forEach(deal => {
      const isMyDeal = userIds.some(userId => 
        deal.merchantId === userId || 
        deal.merchantId === String(userId)
      );
      
      if (isMyDeal) {
        my.push(deal);
      } else {
        others.push(deal);
      }
    });

    const filtered = filter === 'all' ? others : others.filter(deal => deal.businessType === filter);
    
    const categories = ['restaurant', 'hotel', 'cafe', 'shop', 'attraction'] as const;
    const byCategory: Record<string, Deal[]> = {};
    
    categories.forEach(cat => {
      byCategory[cat] = filtered.filter(deal => deal.businessType === cat);
    });

    return {
      myDeals: my,
      otherDeals: filtered,
      dealsByCategory: byCategory
    };
  }, [allDeals, filter, currentUser?.mongoId, currentUser?._id, currentUser?.id]);

  if (isLoading || dealsLoading) {
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

  const DealCardComponent: React.FC<{ deal: Deal; isMerchantDeal?: boolean }> = ({ deal, isMerchantDeal = false }) => (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ${isMerchantDeal ? 'border-l-4 border-blue-500' : ''}`}>
      {deal.images && deal.images.length > 0 && (
        <img
          src={deal.images[0]}
          alt={deal.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        {isMerchantDeal && (
          <div className="flex items-center mb-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              My Deal
            </span>
          </div>
        )}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg">{deal.title}</h3>
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-semibold">
            {deal.discount}
          </span>
        </div>
        <p className="text-gray-600 text-sm mb-2">{deal.description}</p>
        <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
          <span className="font-medium">{deal.businessName}</span>
          <span className="capitalize">{deal.businessType}</span>
        </div>
        {deal.businessAddress && (
          <p className="text-xs text-gray-400 mb-2">{deal.businessAddress}</p>
        )}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span>{deal.views || 0} views • {deal.claims || 0} claims</span>
          <span>Valid until {deal.validUntil ? new Date(deal.validUntil).toLocaleDateString() : 'No expiry'}</span>
        </div>
        {isMerchantDeal && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex gap-2">
              <button className="flex-1 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors">
                Edit
              </button>
              <button className="flex-1 bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors">
                Analytics
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-3xl font-bold mb-6" style={{ color: Colors.text }}>
        {t('dealsTab.title')}
      </h1>
      
      {/* Filter Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all','restaurant','hotel','cafe','shop','attraction'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              filter === f ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {f === 'all' ? 'All Categories' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
          </button>
        ))}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
          <p><strong>Debug Info:</strong></p>
          <p>Total deals: {allDeals.length}</p>
          <p>My deals: {myDeals.length}</p>
          <p>Other deals: {otherDeals.length}</p>
          <p>Current user ID: {currentUser?.mongoId || currentUser?._id || 'None'}</p>
          <p>Is merchant: {currentUser?.isMerchant ? 'Yes' : 'No'}</p>
          {allDeals.length > 0 && (
            <p>Sample deal merchant IDs: {allDeals.slice(0, 3).map(d => d.merchantId).join(', ')}</p>
          )}
        </div>
      )}

      {/* My Deals Section */}
      {myDeals.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Deals ({myDeals.length})
            </h2>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Deal
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {myDeals.map(deal => (
              <DealCardComponent key={deal._id} deal={deal} isMerchantDeal={true} />
            ))}
          </div>
        </div>
      )}

      {/* Other Deals by Category */}
      {otherDeals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            {filter === 'all' ? 'All Merchant Deals' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Deals`} ({otherDeals.length})
          </h2>
          
          {filter === 'all' ? (
            Object.entries(dealsByCategory).map(([category, deals]) => 
              deals.length > 0 && (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 capitalize text-gray-700 border-b border-gray-200 pb-2">
                    {category}s ({deals.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {deals.map(deal => (
                      <DealCardComponent key={deal._id} deal={deal} />
                    ))}
                  </div>
                </div>
              )
            )
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {otherDeals.map(deal => (
                <DealCardComponent key={deal._id} deal={deal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state for merchants */}
      {currentUser?.isMerchant && myDeals.length === 0 && (
        <div className="text-center py-12 px-6 rounded-2xl mb-8" style={{ backgroundColor: Colors.cardBackground, boxShadow: Colors.boxShadow }}>
          <svg className="mx-auto h-16 w-16 mb-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2" style={{ color: Colors.text }}>
            No deals created yet
          </h3>
          <p className="text-md mb-4" style={{ color: Colors.text_secondary }}>
            Start attracting customers by creating your first deal
          </p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Create Your First Deal
          </button>
        </div>
      )}

      {/* Fallback to original places if no deals */}
      {allDeals.length === 0 && fallbackPlaces.length > 0 ? (
        <div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: Colors.text }}>
            Nearby Hotels, Restaurants, Cafes & Shops
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {fallbackPlaces.map((place) => {
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
        !currentUser?.isMerchant && allDeals.length === 0 && (
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
        )
      )}

      {/* Create Deal Modal */}
      <CreateMerchantDealModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateDeal}
        currentUser={currentUser}
      />
    </div>
  );
};

export default DealsView;
