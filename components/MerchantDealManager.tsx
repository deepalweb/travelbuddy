import React, { useState, useEffect } from 'react';
import { CurrentUser } from '../types.ts';
import CreateDealModal from './CreateDealModal.tsx';

interface Deal {
  _id: string;
  title: string;
  discount: string;
  description: string;
  validUntil: string;
  isActive: boolean;
  views: number;
  claims: number;
  businessName?: string;
  businessType?: string;
  images?: string[];
  merchantId?: string;
}

interface MerchantDealManagerProps {
  currentUser: CurrentUser;
}

const MerchantDealManager: React.FC<MerchantDealManagerProps> = ({ currentUser }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    if (!currentUser.mongoId) return;
    
    setIsLoading(true);
    try {
      // Load all deals and filter by merchantId on frontend for now
      const response = await fetch('/api/deals');
      if (response.ok) {
        const allDeals = await response.json();
        const userDeals = allDeals.filter((deal: any) => deal.merchantId === currentUser.mongoId);
        setDeals(userDeals);
        console.log('📊 Loaded', userDeals.length, 'deals for user');
      }
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDeal = async (dealData: any) => {
    if (!currentUser.mongoId) {
      console.error('No mongoId found for user');
      return;
    }

    console.log('🚀 Creating deal for user:', currentUser.mongoId);
    console.log('📝 Deal data:', dealData);

    try {
      // Use the general deals endpoint instead of merchant-specific
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dealData,
          merchantId: currentUser.mongoId,
          validUntil: new Date(dealData.validUntil).toISOString(),
        })
      });

      console.log('📞 Response status:', response.status);
      const result = await response.json();
      console.log('📝 Response data:', result);

      if (response.ok) {
        setDeals(prev => [result, ...prev]);
        setShowCreateModal(false);
        console.log('✅ Deal created successfully');
      } else {
        console.error('❌ Deal creation failed:', result);
      }
    } catch (error) {
      console.error('❌ Failed to create deal:', error);
    }
  };

  const toggleDealStatus = async (dealId: string) => {
    try {
      const deal = deals.find(d => d._id === dealId);
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !deal?.isActive })
      });

      if (response.ok) {
        setDeals(prev => prev.map(d => 
          d._id === dealId ? { ...d, isActive: !d.isActive } : d
        ));
      }
    } catch (error) {
      console.error('Failed to update deal:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">My Deals</h2>
          <p className="text-gray-600">{currentUser.merchantInfo?.businessName}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Deal
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading deals...</div>
      ) : deals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No deals created yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Your First Deal
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {deals.map(deal => (
            <div key={deal._id} className="bg-white p-4 rounded-lg border shadow-sm">
              <div className="flex gap-4">
                {deal.images && deal.images.length > 0 && (
                  <img
                    src={deal.images[0]}
                    alt={deal.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{deal.title}</h3>
                      <p className="text-green-600 font-medium">{deal.discount}</p>
                      <p className="text-gray-600 mt-1">{deal.description}</p>
                      <p className="text-sm text-gray-500 mt-1">{deal.businessName} • {deal.businessType}</p>
                      <p className="text-sm text-gray-500">Valid until: {new Date(deal.validUntil).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-xl font-bold text-blue-600">{deal.views}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-green-600">{deal.claims}</div>
                        <div className="text-xs text-gray-500">Claims</div>
                      </div>
                      <button
                        onClick={() => toggleDealStatus(deal._id)}
                        className={`px-3 py-1 rounded text-sm ${
                          deal.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {deal.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateDealModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDeal}
        />
      )}
    </div>
  );
};

export default MerchantDealManager;