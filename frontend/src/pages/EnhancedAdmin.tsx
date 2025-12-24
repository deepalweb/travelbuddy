import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from '../hooks/useSession';
import { Sidebar } from '../components/admin/Sidebar';
import { SessionTimer } from '../components/admin/SessionTimer';
import { DataTable } from '../components/admin/DataTable';

const EnhancedAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [deals, setDeals] = useState([]);
  const [events, setEvents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleSessionExpire = useCallback(() => {
    setIsAuthenticated(false);
    setAdminSecret('');
    setError('Session expired. Please login again.');
  }, []);

  const { timeRemaining, showWarning, formatTime, resetSession } = useSession(handleSessionExpire);

  const fetchWithAuth = async (endpoint: string) => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API_URL}/api/admin${endpoint}`, {
        headers: { 'x-admin-secret': adminSecret }
      });
      if (res.status === 403) {
        handleSessionExpire();
        return null;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoading(false);
      return data;
    } catch (err: any) {
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
    setIsAuthenticated(true);
    await loadDashboard();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminSecret('');
  };

  const loadDashboard = async () => {
    const data = await fetchWithAuth('/dashboard');
    if (data) setStats(data);
  };

  const loadAnalytics = async () => {
    const data = await fetchWithAuth('/analytics');
    if (data) setAnalytics(data);
  };

  const loadUsers = async () => {
    const data = await fetchWithAuth(`/users?search=${searchTerm}`);
    if (data) setUsers(data.users);
  };

  const loadPosts = async () => {
    const data = await fetchWithAuth('/posts/all');
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

  const loadEvents = async () => {
    const data = await fetchWithAuth('/events');
    if (data) setEvents(data);
  };

  const loadTrips = async () => {
    const data = await fetchWithAuth('/trips');
    if (data) setTrips(data);
  };

  const changeTier = async (id: string, tier: string) => {
    await fetch(`${API_URL}/api/admin/users/${id}/tier`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ tier })
    });
    loadUsers();
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadUsers();
  };

  const moderatePost = async (id: string, status: string) => {
    await fetch(`${API_URL}/api/admin/posts/${id}/moderate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ status })
    });
    loadPosts();
  };

  const deletePost = async (id: string) => {
    if (!window.confirm('Delete this post?')) return;
    await fetch(`${API_URL}/api/admin/posts/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadPosts();
  };

  const toggleDeal = async (id: string) => {
    await fetch(`${API_URL}/api/admin/deals/${id}/toggle`, {
      method: 'PUT',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadDeals();
  };

  const approveBusiness = async (id: string, type: string) => {
    await fetch(`${API_URL}/api/admin/businesses/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ type })
    });
    loadBusinesses();
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'dashboard') loadDashboard();
      if (activeTab === 'analytics') loadAnalytics();
      if (activeTab === 'users') loadUsers();
      if (activeTab === 'posts') loadPosts();
      if (activeTab === 'businesses') loadBusinesses();
      if (activeTab === 'deals') loadDeals();
      if (activeTab === 'events') loadEvents();
      if (activeTab === 'trips') loadTrips();
    }
  }, [activeTab, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-2">TravelBuddy Management System</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <input
              type="password"
              placeholder="Enter Admin Secret"
              value={adminSecret}
              onChange={(e) => setAdminSecret(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-lg mb-4 focus:border-blue-500 focus:outline-none"
              autoComplete="current-password"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold transition"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const userColumns = [
    { key: 'firstName', label: 'Name', render: (_: any, row: any) => `${row.firstName} ${row.lastName}` },
    { key: 'email', label: 'Email' },
    { key: 'tier', label: 'Tier', render: (val: string) => (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${
        val === 'premium' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
      }`}>{val}</span>
    )},
    { key: 'role', label: 'Role' },
    { key: 'createdAt', label: 'Joined', render: (val: string) => new Date(val).toLocaleDateString() },
    { key: 'actions', label: 'Actions', sortable: false, render: (_: any, row: any) => (
      <div className="flex gap-2">
        <select
          onChange={(e) => e.target.value && changeTier(row._id, e.target.value)}
          className="px-2 py-1 border rounded text-xs"
          defaultValue=""
        >
          <option value="">Change Tier</option>
          <option value="free">Free</option>
          <option value="premium">Premium</option>
        </select>
        <button
          onClick={() => deleteUser(row._id)}
          className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    )}
  ];

  const postColumns = [
    { key: 'content', label: 'Content', render: (val: string) => val?.substring(0, 50) + '...' },
    { key: 'author', label: 'Author', render: (val: any) => val?.firstName || 'Unknown' },
    { key: 'likes', label: 'Likes', render: (val: any[]) => val?.length || 0 },
    { key: 'status', label: 'Status', render: (val: string) => (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${
        val === 'approved' ? 'bg-green-100 text-green-700' : 
        val === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
      }`}>{val || 'pending'}</span>
    )},
    { key: 'createdAt', label: 'Created', render: (val: string) => new Date(val).toLocaleDateString() },
    { key: 'actions', label: 'Actions', sortable: false, render: (_: any, row: any) => (
      <div className="flex gap-2">
        <button
          onClick={() => moderatePost(row._id, 'approved')}
          className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs hover:bg-green-100"
        >
          Approve
        </button>
        <button
          onClick={() => moderatePost(row._id, 'rejected')}
          className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100"
        >
          Reject
        </button>
        <button
          onClick={() => deletePost(row._id)}
          className="px-2 py-1 bg-gray-50 text-gray-600 rounded text-xs hover:bg-gray-100"
        >
          Delete
        </button>
      </div>
    )}
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 capitalize">{activeTab}</h1>
              <p className="text-sm text-gray-500">Manage your TravelBuddy platform</p>
            </div>
            <SessionTimer
              timeRemaining={timeRemaining}
              showWarning={showWarning}
              formatTime={formatTime}
              onExtend={resetSession}
            />
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}
          {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

          {/* Dashboard */}
          {activeTab === 'dashboard' && !loading && stats && (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <span className="text-2xl">👥</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.users?.total || 0}</p>
                  <p className="text-blue-100 text-xs mt-2">Free: {stats.users?.free || 0} | Premium: {stats.users?.premium || 0}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-100 text-sm">Total Posts</p>
                    <span className="text-2xl">📝</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.content?.posts || 0}</p>
                  <p className="text-green-100 text-xs mt-2">User generated content</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-100 text-sm">Active Deals</p>
                    <span className="text-2xl">🎁</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.content?.deals || 0}</p>
                  <p className="text-purple-100 text-xs mt-2">Merchant offers</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-100 text-sm">Trip Plans</p>
                    <span className="text-2xl">✈️</span>
                  </div>
                  <p className="text-3xl font-bold">{stats.content?.trips || 0}</p>
                  <p className="text-orange-100 text-xs mt-2">User itineraries</p>
                </div>
              </div>

              {/* Business Accounts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🏢</span>
                    <div>
                      <p className="text-sm text-gray-500">Merchants</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.users?.merchants || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Business accounts</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🧳</span>
                    <div>
                      <p className="text-sm text-gray-500">Travel Agents</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.users?.agents || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Verified agents</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">🚗</span>
                    <div>
                      <p className="text-sm text-gray-500">Transport Providers</p>
                      <p className="text-2xl font-bold text-gray-800">{stats.users?.providers || 0}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Service providers</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-800">Recent Users</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {stats.recent?.users?.map((user: any) => (
                      <div key={user._id} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">{user.username || user.email}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow">
                  <div className="p-4 border-b">
                    <h3 className="font-semibold text-gray-800">Recent Posts</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    {stats.recent?.posts?.map((post: any) => (
                      <div key={post._id} className="py-2 border-b last:border-0">
                        <p className="text-sm text-gray-700 line-clamp-2">{post.content}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500">by {post.userId?.username || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Content Overview */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Content Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{stats.content?.posts || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Posts</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{stats.content?.deals || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Deals</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.content?.trips || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Trips</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{stats.content?.events || 0}</p>
                    <p className="text-sm text-gray-600 mt-1">Events</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users */}
          {activeTab === 'users' && !loading && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  onClick={loadUsers}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
              <DataTable
                data={users}
                columns={userColumns}
                bulkActions={[
                  { label: 'Delete Selected', value: 'delete' },
                  { label: 'Upgrade to Premium', value: 'premium' }
                ]}
                onBulkAction={(action, ids) => {
                  if (action === 'delete') {
                    ids.forEach(id => deleteUser(id));
                  } else if (action === 'premium') {
                    ids.forEach(id => changeTier(id, 'premium'));
                  }
                }}
              />
            </div>
          )}

          {/* Posts */}
          {activeTab === 'posts' && !loading && (
            <DataTable
              data={posts}
              columns={postColumns}
              bulkActions={[
                { label: 'Approve Selected', value: 'approve' },
                { label: 'Reject Selected', value: 'reject' },
                { label: 'Delete Selected', value: 'delete' }
              ]}
              onBulkAction={(action, ids) => {
                if (action === 'approve') {
                  ids.forEach(id => moderatePost(id, 'approved'));
                } else if (action === 'reject') {
                  ids.forEach(id => moderatePost(id, 'rejected'));
                } else if (action === 'delete') {
                  ids.forEach(id => deletePost(id));
                }
              }}
            />
          )}

          {/* Other tabs - placeholder */}
          {['analytics', 'businesses', 'deals', 'events', 'trips'].includes(activeTab) && !loading && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} content coming soon...
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default EnhancedAdmin;
