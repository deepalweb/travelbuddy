import React, { useState, useEffect } from 'react';
import { CurrentUser } from '../types.ts';
import DealDetailModal from './DealDetailModal.tsx';

interface Deal {
  _id: string;
  title: string;
  discount: string;
  description: string;
  businessName: string;
  businessType: string;
  businessPhone?: string;
  businessWebsite?: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  images?: string[];
  validUntil: string;
  views: number;
  claims: number;
  merchantId?: string;
}

interface FastDealsViewProps {
  currentUser?: CurrentUser;
}

const FastDealsView: React.FC<FastDealsViewProps> = ({ currentUser }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  useEffect(() => {
    loadDeals();
  }, [filter, currentUser?.mongoId]);

  const loadDeals = async () => {
    setLoading(true);
    try {
      // Build optimized query
      const params = new URLSearchParams();
      params.append('isActive', 'true');
      params.append('limit', '20');
      
      if (filter !== 'all') {
        params.append('businessType', filter);
      }
      
      const response = await fetch(`/api/deals?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Failed to load deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  // Separate user's deals from others (client-side for small dataset)
  const myDeals = deals.filter(deal => deal.merchantId === currentUser?.mongoId);
  const otherDeals = deals.filter(deal => deal.merchantId !== currentUser?.mongoId);

  const handleDealClick = (deal: Deal) => {
    // Increment view count locally
    setDeals(prev => prev.map(d => 
      d._id === deal._id ? { ...d, views: d.views + 1 } : d
    ));
    
    // Update view count on server
    fetch(`/api/deals/${deal._id}/view`, { method: 'POST' }).catch(() => {});
    
    // Show deal details modal
    setSelectedDeal(deal);
  };

  const handleClaimDeal = async (dealId: string) => {
    try {
      // Increment claim count locally
      setDeals(prev => prev.map(d => 
        d._id === dealId ? { ...d, claims: d.claims + 1 } : d
      ));
      
      // Update claim count on server
      await fetch(`/api/deals/${dealId}/claim`, { method: 'POST' });
      
      console.log('Deal claimed successfully!');
    } catch (error) {
      console.error('Failed to claim deal:', error);
    }
  };

  const DealCard: React.FC<{ deal: Deal; isOwn?: boolean }> = ({ deal, isOwn }) => (
    <div 
      onClick={() => handleDealClick(deal)}
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer ${isOwn ? 'border-blue-200' : 'border-gray-200'}`}
    >
      {deal.images?.[0] && (
        <img
          src={deal.images[0]}
          alt={deal.title}
          className="w-full h-32 object-cover rounded-t-lg"
          loading="lazy"
        />
      )}
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-sm">{deal.title}</h3>
          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
            {deal.discount}
          </span>
        </div>
        <p className="text-gray-600 text-xs mb-2 line-clamp-2">{deal.description}</p>
        <div className="flex justify-between items-center text-xs text-gray-500 mb-2">
          <span>{deal.businessName}</span>
          <span>{deal.views} views</span>
        </div>
        
        {/* Quick Contact Options */}
        <div className="flex gap-1">
          {deal.businessPhone && (
            <a
              href={`tel:${deal.businessPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200"
            >
              📞
            </a>
          )}
          {deal.businessWebsite && (
            <a
              href={deal.businessWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
            >
              🌐
            </a>
          )}
          {deal.location && (
            <a
              href={`https://maps.google.com/?q=${deal.location.lat},${deal.location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
            >
              📍
            </a>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Deals</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Deals</h1>
      
      {/* Simple Filter Buttons */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {['all', 'restaurant', 'hotel', 'cafe', 'shop', 'attraction'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 text-sm rounded whitespace-nowrap ${
              filter === f 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* My Deals */}
      {myDeals.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-blue-600">My Deals ({myDeals.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {myDeals.map(deal => (
              <DealCard key={deal._id} deal={deal} isOwn />
            ))}
          </div>
        </div>
      )}

      {/* Other Deals */}
      {otherDeals.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {filter === 'all' ? 'All Deals' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Deals`} ({otherDeals.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherDeals.map(deal => (
              <DealCard key={deal._id} deal={deal} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">📢</div>
          <p className="text-gray-600">No deals available</p>
          <p className="text-sm text-gray-500">Check back later for new offers!</p>
        </div>
      )}
      
      {/* Deal Detail Modal */}
      {selectedDeal && (
        <DealDetailModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onClaim={handleClaimDeal}
        />
      )}
    </div>
  );
};

export default FastDealsView;