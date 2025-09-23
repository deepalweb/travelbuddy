import React, { useState, useEffect } from 'react';
import CreateDealModal from './CreateDealModal.tsx';

interface MerchantDashboardProps {
  merchant: any;
  onLogout: () => void;
}

interface Deal {
  id: string;
  title: string;
  discount: string;
  description: string;
  validUntil: string;
  isActive: boolean;
  views: number;
  claims: number;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ merchant, onLogout }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'deals' | 'analytics' | 'profile'>('deals');

  useEffect(() => {
    // Load merchant deals
    const mockDeals: Deal[] = [
      {
        id: '1',
        title: '20% Off All Meals',
        discount: '20% OFF',
        description: 'Valid for lunch and dinner',
        validUntil: '2024-12-31',
        isActive: true,
        views: 245,
        claims: 12
      }
    ];
    setDeals(mockDeals);
  }, []);

  const handleCreateDeal = (dealData: any) => {
    const newDeal: Deal = {
      id: Date.now().toString(),
      ...dealData,
      views: 0,
      claims: 0,
      isActive: true
    };
    setDeals([...deals, newDeal]);
    setShowCreateModal(false);
  };

  const toggleDealStatus = (dealId: string) => {
    setDeals(deals.map(deal => 
      deal.id === dealId ? { ...deal, isActive: !deal.isActive } : deal
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Merchant Dashboard</h1>
              <p className="text-gray-600">{merchant.businessName}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-8 border-b mb-6">
          {(['deals', 'analytics', 'profile'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'deals' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Your Deals</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Create New Deal
              </button>
            </div>

            <div className="grid gap-4">
              {deals.map(deal => (
                <div key={deal.id} className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{deal.title}</h3>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                          {deal.discount}
                        </span>
                        <span className={`px-2 py-1 rounded text-sm ${
                          deal.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {deal.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{deal.description}</p>
                      <p className="text-sm text-gray-500">Valid until: {deal.validUntil}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{deal.views}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{deal.claims}</div>
                        <div className="text-xs text-gray-500">Claims</div>
                      </div>
                      <button
                        onClick={() => toggleDealStatus(deal.id)}
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
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">245</div>
                <div className="text-gray-600">Total Views</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">12</div>
                <div className="text-gray-600">Total Claims</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">4.9%</div>
                <div className="text-gray-600">Conversion Rate</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Business Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={merchant.businessName}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={merchant.email}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-sm text-gray-600">Business Verified</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDealModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateDeal}
        />
      )}
    </div>
  );
};

export default MerchantDashboard;