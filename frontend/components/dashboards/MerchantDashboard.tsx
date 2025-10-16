import React, { useState, useEffect } from 'react';
import { EnhancedUser } from '../../types/roles';

interface MerchantDashboardProps {
  user: EnhancedUser;
}

const MerchantDashboard: React.FC<MerchantDashboardProps> = ({ user }) => {
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    activeDeals: 0,
    totalViews: 0,
    totalBookings: 0,
    revenue: 0
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'analytics' | 'profile'>('overview');

  useEffect(() => {
    // Load merchant metrics
    loadMerchantMetrics();
  }, []);

  const loadMerchantMetrics = async () => {
    // Mock data - replace with API call
    setMetrics({
      totalDeals: 12,
      activeDeals: 8,
      totalViews: 1250,
      totalBookings: 89,
      revenue: 4500
    });
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Total Deals</h3>
        <p className="text-3xl font-bold text-blue-600">{metrics.totalDeals}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Active Deals</h3>
        <p className="text-3xl font-bold text-green-600">{metrics.activeDeals}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Total Views</h3>
        <p className="text-3xl font-bold text-purple-600">{metrics.totalViews}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900">Revenue</h3>
        <p className="text-3xl font-bold text-yellow-600">${metrics.revenue}</p>
      </div>
    </div>
  );

  const renderDealsManagement = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Manage Deals</h3>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Create New Deal
        </button>
      </div>
      <div className="space-y-4">
        {/* Deal items would go here */}
        <p className="text-gray-500">No deals created yet. Create your first deal to get started!</p>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-medium mb-2">Deal Performance</h4>
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-500">Chart placeholder</span>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Revenue Trends</h4>
          <div className="h-32 bg-gray-100 rounded flex items-center justify-center">
            <span className="text-gray-500">Chart placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessProfile = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Business Profile</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Name</label>
          <input
            type="text"
            value={user.businessProfile?.businessName || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Business Type</label>
          <input
            type="text"
            value={user.businessProfile?.businessType || ''}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Verification Status</label>
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            user.businessProfile?.verificationStatus === 'approved' 
              ? 'bg-green-100 text-green-800'
              : user.businessProfile?.verificationStatus === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {user.businessProfile?.verificationStatus || 'Not verified'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="merchant-dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Merchant Dashboard</h1>
        <p className="text-gray-600">Welcome back, {user.businessProfile?.businessName || user.username}!</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'deals', label: 'Deals' },
            { id: 'analytics', label: 'Analytics' },
            { id: 'profile', label: 'Profile' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'deals' && renderDealsManagement()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'profile' && renderBusinessProfile()}
    </div>
  );
};

export default MerchantDashboard;