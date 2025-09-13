
import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { CurrentUser, SubscriptionTier } from '../../types.ts';
import { apiService } from '../../services/apiService.ts';

interface MockUser {
  id: string;
  username: string;
  email: string;
  tier: SubscriptionTier;
  subscriptionStatus: string;
  subscriptionEndDate?: string;
  trialEndDate?: string;
}

const AdminSubscriptionManagementView: React.FC = () => {
  const [users, setUsers] = useState<MockUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const userData = await apiService.getUsers();
        setUsers(userData.map((user: any) => ({
          id: user._id,
          username: user.username,
          email: user.email,
          tier: user.tier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionEndDate: user.subscriptionEndDate,
          trialEndDate: user.trialEndDate
        })));
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleChangeTier = async (userId: string, newTier: SubscriptionTier) => {
    try {
  await apiService.subscribeUser(userId, newTier);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, tier: newTier } : user
      ));
    } catch (error) {
      console.error('Failed to update user tier:', error);
    }
  };

  const handleExtendTrial = async (userId: string) => {
    try {
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + 7);
      const updateData = {
        subscriptionStatus: 'trial',
        trialEndDate: newTrialEnd.toISOString()
      };
      await apiService.updateUser(userId, updateData);
      setUsers(prev => prev.map(user => 
        user.id === userId ? { 
          ...user, 
          subscriptionStatus: 'trial',
          trialEndDate: newTrialEnd.toISOString().split('T')[0]
        } : user
      ));
    } catch (error) {
      console.error('Failed to extend trial:', error);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10B981';
      case 'trial': return '#F59E0B';
      case 'expired': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div className="animate-fadeInUp">
        <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Subscription Management</h1>
        <div style={cardStyle}>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Subscription Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div style={cardStyle}>
          <h3 className="font-semibold text-green-600">Active</h3>
          <p className="text-2xl font-bold">{users.filter(u => u.subscriptionStatus === 'active').length}</p>
        </div>
        <div style={cardStyle}>
          <h3 className="font-semibold text-yellow-600">Trial</h3>
          <p className="text-2xl font-bold">{users.filter(u => u.subscriptionStatus === 'trial').length}</p>
        </div>
        <div style={cardStyle}>
          <h3 className="font-semibold text-red-600">Expired</h3>
          <p className="text-2xl font-bold">{users.filter(u => u.subscriptionStatus === 'expired').length}</p>
        </div>
        <div style={cardStyle}>
          <h3 className="font-semibold text-gray-600">Free</h3>
          <p className="text-2xl font-bold">{users.filter(u => u.subscriptionStatus === 'none').length}</p>
        </div>
      </div>

      {/* Users Table */}
      <div style={cardStyle}>
        <h2 className="text-xl font-semibold mb-4">User Subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">User</th>
                <th className="text-left p-2">Tier</th>
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">End Date</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b">
                  <td className="p-2">
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-2">
                    <select 
                      value={user.tier} 
                      onChange={(e) => handleChangeTier(user.id, e.target.value as SubscriptionTier)}
                      className="border rounded px-2 py-1"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <span 
                      className="px-2 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: getStatusColor(user.subscriptionStatus) }}
                    >
                      {user.subscriptionStatus}
                    </span>
                  </td>
                  <td className="p-2">
                    {user.subscriptionEndDate || user.trialEndDate || 'N/A'}
                  </td>
                  <td className="p-2">
                    <button 
                      onClick={() => handleExtendTrial(user.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Extend Trial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionManagementView;
