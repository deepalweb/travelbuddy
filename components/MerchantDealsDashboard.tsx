import React, { useState, useEffect } from 'react';
import { Colors } from '../constants.ts';
import CreateMerchantDealModal from './CreateMerchantDealModal.tsx';

interface Deal {
  _id: string;
  title: string;
  discount: string;
  description: string;
  businessName: string;
  businessType: string;
  businessAddress?: string;
  validUntil?: string;
  isActive: boolean;
  views?: number;
  claims?: number;
  originalPrice?: string;
  discountedPrice?: string;
}

interface MerchantDealsDashboardProps {
  currentUser?: any;
}

const MerchantDealsDashboard: React.FC<MerchantDealsDashboardProps> = ({ currentUser }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  useEffect(() => {
    loadMerchantDeals();
  }, [currentUser]);

  const loadMerchantDeals = async () => {
    if (!currentUser?.mongoId && !currentUser?._id) return;
    
    setLoading(true);
    try {
      const merchantId = currentUser.mongoId || currentUser._id;
      const response = await fetch(`/api/deals?merchantId=${merchantId}`);
      if (response.ok) {
        const merchantDeals = await response.json();
        setDeals(merchantDeals);
      }
    } catch (error) {
      console.error('Failed to load merchant deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeal = async (dealData: any) => {
    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });
      
      if (response.ok) {
        await loadMerchantDeals();
      }
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  const toggleDealStatus = async (dealId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      
      if (response.ok) {
        await loadMerchantDeals();
      }
    } catch (error) {
      console.error('Error updating deal status:', error);
    }
  };

  const deleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadMerchantDeals();
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  if (!currentUser?.isMerchant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">This section is only available for merchants.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading your deals...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: Colors.text }}>
            My Deals Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your business deals and track performance
          </p>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Deals</p>
              <p className="text-xl font-semibold">{deals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Active Deals</p>
              <p className="text-xl font-semibold">{deals.filter(d => d.isActive).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Views</p>
              <p className="text-xl font-semibold">{deals.reduce((sum, d) => sum + (d.views || 0), 0)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-500">Total Claims</p>
              <p className="text-xl font-semibold">{deals.reduce((sum, d) => sum + (d.claims || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deals Table */}
      {deals.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deals yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating your first deal.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create Deal
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valid Until
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                        <div className="text-sm text-gray-500">{deal.discount}</div>
                        <div className="text-xs text-gray-400 mt-1">{deal.description.substring(0, 60)}...</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        deal.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {deal.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{deal.views || 0} views</div>
                      <div>{deal.claims || 0} claims</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deal.validUntil ? new Date(deal.validUntil).toLocaleDateString() : 'No expiry'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => toggleDealStatus(deal._id, deal.isActive)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            deal.isActive
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {deal.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteDeal(deal._id)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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

export default MerchantDealsDashboard;