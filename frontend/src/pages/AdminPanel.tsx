import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('adminSecret') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [deals, setDeals] = useState([]);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWithAuth = async (endpoint) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/admin${endpoint}`, {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (res.status === 403) {
        setIsAuthenticated(false);
        setError('Invalid admin secret');
        return null;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  const handleLogin = async () => {
    if (!adminSecret) {
      setError('Please enter admin secret');
      return;
    }
    localStorage.setItem('adminSecret', adminSecret);
    setIsAuthenticated(true);
    await loadDashboard();
  };

  const loadDashboard = async () => {
    const data = await fetchWithAuth('/dashboard');
    if (data) setStats(data);
  };

  const loadUsers = async () => {
    const data = await fetchWithAuth('/users');
    if (data) setUsers(data.users);
  };

  const loadPosts = async () => {
    const data = await fetchWithAuth('/posts/pending');
    if (data) setPosts(data);
  };

  const loadBusinesses = async () => {
    const data = await fetchWithAuth('/businesses/pending');
    if (data) setBusinesses(data);
  };

  const loadDeals = async () => {
    const data = await fetchWithAuth('/deals');
    if (data) setDeals(data);
  };

  const moderatePost = async (id, status) => {
    await fetch(`${API_URL}/api/admin/posts/${id}/moderate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ status })
    });
    loadPosts();
  };

  const approveBusiness = async (id, type) => {
    await fetch(`${API_URL}/api/admin/businesses/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ type })
    });
    loadBusinesses();
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadUsers();
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'dashboard') loadDashboard();
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'posts') loadPosts();
      if (activeTab === 'businesses') loadBusinesses();
      if (activeTab === 'deals') loadDeals();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <input
              type="password"
              placeholder="Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="w-full p-2 border rounded mb-4"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">TravelBuddy Admin</h1>
            <button
              onClick={() => { setIsAuthenticated(false); localStorage.removeItem('adminSecret'); }}
              className="text-red-600 hover:text-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6">
          {['dashboard', 'users', 'posts', 'businesses', 'deals'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white'}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-8">Loading...</div>}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded mb-4">{error}</div>}

        {activeTab === 'dashboard' && !loading && stats && (
          <div className="space-y-6">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-3xl font-bold mt-2">{stats.users?.total || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">👥</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Posts</p>
                    <p className="text-3xl font-bold mt-2">{stats.content?.posts || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">📝</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Active Deals</p>
                    <p className="text-3xl font-bold mt-2">{stats.content?.deals || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">🎁</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Trip Plans</p>
                    <p className="text-3xl font-bold mt-2">{stats.content?.trips || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">✈️</div>
                </div>
              </div>
            </div>

            {/* Business Accounts */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-700 font-semibold">Merchants</h3>
                  <span className="text-2xl">🏪</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.users?.merchants || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Business accounts</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-700 font-semibold">Travel Agents</h3>
                  <span className="text-2xl">🧳</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.users?.agents || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Registered agents</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-700 font-semibold">Transport Providers</h3>
                  <span className="text-2xl">🚗</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">{stats.users?.providers || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Active providers</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-5 gap-3">
                <button
                  onClick={() => setActiveTab('users')}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <div className="text-sm font-medium text-gray-700">Manage Users</div>
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <div className="text-sm font-medium text-gray-700">Moderate Posts</div>
                </button>
                <button
                  onClick={() => setActiveTab('businesses')}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">🏢</div>
                  <div className="text-sm font-medium text-gray-700">Approve Business</div>
                </button>
                <button
                  onClick={() => setActiveTab('deals')}
                  className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">🎁</div>
                  <div className="text-sm font-medium text-gray-700">Manage Deals</div>
                </button>
                <button
                  onClick={() => loadDashboard()}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-center transition"
                >
                  <div className="text-2xl mb-2">🔄</div>
                  <div className="text-sm font-medium text-gray-700">Refresh Data</div>
                </button>
              </div>
            </div>

            {/* System Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Platform Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Content</span>
                    <span className="font-semibold">{(stats.content?.posts || 0) + (stats.content?.deals || 0) + (stats.content?.trips || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Business Accounts</span>
                    <span className="font-semibold">{(stats.users?.merchants || 0) + (stats.users?.agents || 0) + (stats.users?.providers || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Regular Users</span>
                    <span className="font-semibold">{(stats.users?.total || 0) - ((stats.users?.merchants || 0) + (stats.users?.agents || 0) + (stats.users?.providers || 0))}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Database</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">Connected</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">API Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">Online</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-500">{new Date().toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {users.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No users found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Username</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Tier</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id} className="border-t">
                      <td className="px-6 py-4">{user.username}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {user.tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteUser(user._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'posts' && !loading && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                No pending posts
              </div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold">{post.author?.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                      {post.moderationStatus}
                    </span>
                  </div>
                  <p className="mb-4">{post.content?.text}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moderatePost(post._id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => moderatePost(post._id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'businesses' && !loading && (
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                No pending business applications
              </div>
            ) : (
              businesses.map(biz => (
                <div key={biz._id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-bold mb-2">{biz.username}</h3>
                  <p className="text-gray-600 mb-4">{biz.email}</p>
                  <div className="flex gap-2">
                    {biz.businessProfile?.verificationStatus === 'pending' && (
                      <button
                        onClick={() => approveBusiness(biz._id, 'business')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve Merchant
                      </button>
                    )}
                    {biz.agentProfile?.verificationStatus === 'pending' && (
                      <button
                        onClick={() => approveBusiness(biz._id, 'agent')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve Agent
                      </button>
                    )}
                    {biz.transportProfile?.verificationStatus === 'pending' && (
                      <button
                        onClick={() => approveBusiness(biz._id, 'transport')}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Approve Transport
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'deals' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {deals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No deals found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Title</th>
                    <th className="px-6 py-3 text-left">Discount</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Views</th>
                    <th className="px-6 py-3 text-left">Claims</th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map(deal => (
                    <tr key={deal._id} className="border-t">
                      <td className="px-6 py-4">{deal.title}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {deal.discount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-sm ${
                          deal.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{deal.views || 0}</td>
                      <td className="px-6 py-4">{deal.claims || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
