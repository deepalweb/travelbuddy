import React, { useState, useEffect } from 'react';
import { CurrentUser } from '../types.ts';

interface User {
  _id: string;
  username: string;
  email: string;
  isMerchant: boolean;
  merchantInfo?: {
    businessName?: string;
    businessType?: string;
    verificationStatus?: string;
  };
}

interface MerchantManagementProps {
  currentUser: CurrentUser;
}

const MerchantManagement: React.FC<MerchantManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [merchantForm, setMerchantForm] = useState({
    businessName: '',
    businessType: 'restaurant',
    businessAddress: '',
    businessPhone: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMerchantStatus = async (userId: string, isMerchant: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isMerchant: !isMerchant,
          ...(isMerchant ? {} : { merchantInfo: merchantForm })
        })
      });

      if (response.ok) {
        loadUsers();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Failed to update merchant status:', error);
    }
  };

  const handleMerchantSetup = (user: User) => {
    setSelectedUser(user);
    setMerchantForm({
      businessName: user.merchantInfo?.businessName || '',
      businessType: user.merchantInfo?.businessType || 'restaurant',
      businessAddress: '',
      businessPhone: ''
    });
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
        <p className="text-gray-600">Only administrators can manage merchant accounts.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Merchant Management</h2>

      {isLoading ? (
        <div className="text-center py-8">Loading users...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isMerchant 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isMerchant ? 'Merchant' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.merchantInfo?.businessName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.isMerchant ? (
                      <button
                        onClick={() => toggleMerchantStatus(user._id, user.isMerchant)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove Merchant
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMerchantSetup(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Make Merchant
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Setup Merchant Account for {selectedUser.username}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={merchantForm.businessName}
                  onChange={(e) => setMerchantForm({...merchantForm, businessName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter business name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Type
                </label>
                <select
                  value={merchantForm.businessType}
                  onChange={(e) => setMerchantForm({...merchantForm, businessType: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="restaurant">Restaurant</option>
                  <option value="hotel">Hotel</option>
                  <option value="cafe">Cafe</option>
                  <option value="shop">Shop</option>
                  <option value="attraction">Attraction</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={merchantForm.businessAddress}
                  onChange={(e) => setMerchantForm({...merchantForm, businessAddress: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter business address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={merchantForm.businessPhone}
                  onChange={(e) => setMerchantForm({...merchantForm, businessPhone: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter business phone"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => toggleMerchantStatus(selectedUser._id, selectedUser.isMerchant)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Merchant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantManagement;