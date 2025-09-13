import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { withApiBase } from '../../services/config';

interface Deal {
  _id: string;
  title: string;
  description: string;
  discount: string;
  placeId: string;
  isActive: boolean;
  createdAt: string;
}

const AdminDealManagementView: React.FC = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: '',
    description: '',
    discount: '',
    placeId: '',
    placeName: '',
    isPremium: false,
    priceAmount: '',
  priceCurrency: 'USD',
  startsAt: '',
  endsAt: ''
  });

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
  const response = await fetch(withApiBase('/api/deals'));
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      console.error('Error fetching deals:', error);
      setDeals([]);
    } finally {
      setLoading(false);
    }
  };

  const createDeal = async () => {
    try {
  const response = await fetch(withApiBase('/api/deals'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDeal.title,
          description: newDeal.description,
          discount: newDeal.discount,
          placeId: newDeal.placeId,
          placeName: newDeal.placeName || undefined,
          isPremium: !!newDeal.isPremium,
          price: newDeal.priceAmount ? { amount: Number(newDeal.priceAmount), currencyCode: newDeal.priceCurrency } : undefined,
          isActive: true,
          startsAt: newDeal.startsAt ? new Date(newDeal.startsAt) : undefined,
          endsAt: newDeal.endsAt ? new Date(newDeal.endsAt) : undefined
        })
      });
      const deal = await response.json();
      setDeals([deal, ...deals]);
      setNewDeal({ title: '', description: '', discount: '', placeId: '', placeName: '', isPremium: false, priceAmount: '', priceCurrency: 'USD', startsAt: '', endsAt: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating deal:', error);
    }
  };

  const toggleDeal = async (dealId: string, isActive: boolean) => {
    try {
  await fetch(withApiBase(`/api/deals/${dealId}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });
      setDeals(deals.map(deal => 
        deal._id === dealId ? { ...deal, isActive: !isActive } : deal
      ));
    } catch (error) {
      console.error('Error updating deal:', error);
    }
  };

  const deleteDeal = async (dealId: string) => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
  await fetch(withApiBase(`/api/deals/${dealId}`), {
        method: 'DELETE'
      });
      setDeals(deals.filter(deal => deal._id !== dealId));
    } catch (error) {
      console.error('Error deleting deal:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeInUp flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: Colors.text }}>Loading deals...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Deal Management</h1>
      
      <div style={cardStyle}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: Colors.text }}>Active Deals ({deals.length})</h2>
          <button 
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white"
            style={{ backgroundColor: Colors.primary }}
          >
            {showForm ? 'Cancel' : 'Create New Deal'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border rounded-lg" style={{ borderColor: Colors.cardBorder }}>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Deal Title"
                value={newDeal.title}
                onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <input
                type="text"
                placeholder="Discount (e.g., 20% off)"
                value={newDeal.discount}
                onChange={(e) => setNewDeal({...newDeal, discount: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <input
                type="text"
                placeholder="Place ID"
                value={newDeal.placeId}
                onChange={(e) => setNewDeal({...newDeal, placeId: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <input
                type="text"
                placeholder="Place Name (optional)"
                value={newDeal.placeName}
                onChange={(e) => setNewDeal({...newDeal, placeName: e.target.value})}
                className="px-3 py-2 border rounded"
                style={{ borderColor: Colors.cardBorder }}
              />
              <div className="flex items-center gap-2">
                <input id="isPremium" type="checkbox" checked={newDeal.isPremium} onChange={(e) => setNewDeal({...newDeal, isPremium: e.target.checked})} />
                <label htmlFor="isPremium" className="text-sm" style={{ color: Colors.text }}>Premium deal</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Price Amount (optional)"
                  value={newDeal.priceAmount}
                  onChange={(e) => setNewDeal({...newDeal, priceAmount: e.target.value})}
                  className="px-3 py-2 border rounded"
                  style={{ borderColor: Colors.cardBorder }}
                />
                <input
                  type="text"
                  placeholder="Currency (e.g., USD)"
                  value={newDeal.priceCurrency}
                  onChange={(e) => setNewDeal({...newDeal, priceCurrency: e.target.value})}
                  className="px-3 py-2 border rounded w-28"
                  style={{ borderColor: Colors.cardBorder }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  placeholder="Starts At (optional)"
                  value={newDeal.startsAt}
                  onChange={(e) => setNewDeal({ ...newDeal, startsAt: e.target.value })}
                  className="px-3 py-2 border rounded"
                  style={{ borderColor: Colors.cardBorder }}
                />
                <input
                  type="date"
                  placeholder="Ends At (optional)"
                  value={newDeal.endsAt}
                  onChange={(e) => setNewDeal({ ...newDeal, endsAt: e.target.value })}
                  className="px-3 py-2 border rounded"
                  style={{ borderColor: Colors.cardBorder }}
                />
              </div>
              <button
                onClick={createDeal}
                className="px-4 py-2 text-sm font-semibold rounded text-white"
                style={{ backgroundColor: Colors.secondary }}
              >
                Create Deal
              </button>
            </div>
            <textarea
              placeholder="Deal Description"
              value={newDeal.description}
              onChange={(e) => setNewDeal({...newDeal, description: e.target.value})}
              className="w-full mt-2 px-3 py-2 border rounded"
              style={{ borderColor: Colors.cardBorder }}
              rows={3}
            />
          </div>
        )}

        <div className="space-y-4">
          {deals.length === 0 ? (
            <p style={{ color: Colors.text_secondary }}>No deals found. Create your first deal!</p>
          ) : (
            deals.map(deal => (
              <div key={deal._id} className="border rounded-lg p-4" style={{ borderColor: Colors.cardBorder }}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold" style={{ color: Colors.text }}>{deal.title}</h3>
                    <p className="text-sm" style={{ color: Colors.text_secondary }}>{deal.description}</p>
                    <p className="text-sm font-medium" style={{ color: Colors.primary }}>{deal.discount}</p>
                    <p className="text-xs" style={{ color: Colors.text_secondary }}>
                      Place: {deal.placeId} • Created: {new Date(deal.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => toggleDeal(deal._id, deal.isActive)}
                      className="text-xs px-3 py-1 rounded"
                      style={{
                        color: deal.isActive ? Colors.accentWarning : Colors.accentSuccess,
                        backgroundColor: deal.isActive ? `${Colors.accentWarning}20` : `${Colors.accentSuccess}20`
                      }}
                    >
                      {deal.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteDeal(deal._id)}
                      className="text-xs px-3 py-1 rounded"
                      style={{ color: Colors.accentError, backgroundColor: `${Colors.accentError}20` }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDealManagementView;