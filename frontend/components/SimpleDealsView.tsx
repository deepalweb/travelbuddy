import React, { useState, useEffect } from 'react';

interface Deal {
  _id: string;
  title: string;
  discount: string;
  description: string;
  businessName: string;
  businessType: string;
  merchantId?: string;
  views?: number;
  claims?: number;
  validUntil?: string;
}

interface SimpleDealsViewProps {
  currentUser?: any;
}

const SimpleDealsView: React.FC<SimpleDealsViewProps> = ({ currentUser }) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/deals');
      if (response.ok) {
        const data = await response.json();
        setDeals(data);
      }
    } catch (error) {
      console.error('Error loading deals:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading deals...</div>;
  }

  const myDeals = deals.filter(deal => deal.merchantId === currentUser?.mongoId);
  const otherDeals = deals.filter(deal => deal.merchantId !== currentUser?.mongoId);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Deals</h1>
      
      {/* Debug Info */}
      <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
        <p>Total deals: {deals.length}</p>
        <p>My deals: {myDeals.length}</p>
        <p>User ID: {currentUser?.mongoId || 'None'}</p>
      </div>

      {/* My Deals */}
      {myDeals.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-blue-600">My Deals ({myDeals.length})</h2>
          <div className="grid gap-4">
            {myDeals.map(deal => (
              <div key={deal._id} className="border-2 border-blue-200 bg-blue-50 p-4 rounded">
                <h3 className="font-bold">{deal.title}</h3>
                <p className="text-green-600 font-semibold">{deal.discount}</p>
                <p className="text-sm text-gray-600">{deal.description}</p>
                <p className="text-sm">{deal.businessName} • {deal.views || 0} views</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Deals */}
      <div>
        <h2 className="text-xl font-bold mb-4">All Deals ({otherDeals.length})</h2>
        <div className="grid gap-4">
          {otherDeals.map(deal => (
            <div key={deal._id} className="border p-4 rounded">
              <h3 className="font-bold">{deal.title}</h3>
              <p className="text-green-600 font-semibold">{deal.discount}</p>
              <p className="text-sm text-gray-600">{deal.description}</p>
              <p className="text-sm">{deal.businessName} • {deal.views || 0} views</p>
            </div>
          ))}
        </div>
      </div>

      {deals.length === 0 && (
        <div className="text-center py-8">
          <p>No deals available</p>
        </div>
      )}
    </div>
  );
};

export default SimpleDealsView;