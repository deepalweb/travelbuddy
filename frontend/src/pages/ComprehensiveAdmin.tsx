import React, { useState, useEffect } from 'react';

const ComprehensiveAdmin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminSecret, setAdminSecret] = useState(localStorage.getItem('adminSecret') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [deals, setDeals] = useState([]);
  const [events, setEvents] = useState([]);
  const [trips, setTrips] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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

  const changeTier = async (id, tier) => {
    await fetch(`${API_URL}/api/admin/users/${id}/tier`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ tier })
    });
    loadUsers();
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await fetch(`${API_URL}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadUsers();
  };

  const moderatePost = async (id, status) => {
    await fetch(`${API_URL}/api/admin/posts/${id}/moderate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
      body: JSON.stringify({ status })
    });
    loadPosts();
  };

  const deletePost = async (id) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`${API_URL}/api/admin/posts/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadPosts();
  };

  const toggleDeal = async (id) => {
    await fetch(`${API_URL}/api/admin/deals/${id}/toggle`, {
      method: 'PUT',
      headers: { 'x-admin-secret': adminSecret }
    });
    loadDeals();
  };

  const approveBusiness = async (id, type) => {
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

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'posts', label: 'Posts', icon: '📝' },
    { id: 'businesses', label: 'Businesses', icon: '🏢' },
    { id: 'deals', label: 'Deals', icon: '🎁' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'trips', label: 'Trips', icon: '✈️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🌍</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">TravelBuddy Admin</h1>
                <p className="text-xs text-gray-500">Management Dashboard</p>
              </div>
            </div>
            <button
              onClick={() => { setIsAuthenticated(false); localStorage.removeItem('adminSecret'); }}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading && <div className="text-center py-12 text-gray-500">Loading...</div>}
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">{error}</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && !loading && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Users</p>
                    <p className="text-3xl font-bold mt-2">{stats.users?.total || 0}</p>
                    <p className="text-blue-100 text-xs mt-2">Free: {stats.users?.free || 0} | Premium: {stats.users?.premium || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">👥</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Total Posts</p>
                    <p className="text-3xl font-bold mt-2">{stats.content?.posts || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">📝</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Active Deals</p>
                    <p className="text-3xl font-bold mt-2">{stats.content?.deals || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">🎁</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Trip Plans</p>
                    <p className="text-3xl font-bold mt-2">{stats.content?.trips || 0}</p>
                  </div>
                  <div className="text-4xl opacity-50">✈️</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span>🏢</span> Business Accounts
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Merchants</span>
                    <span className="font-bold">{stats.users?.merchants || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Travel Agents</span>
                    <span className="font-bold">{stats.users?.agents || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transport Providers</span>
                    <span className="font-bold">{stats.users?.providers || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span>📅</span> Events & Content
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Events</span>
                    <span className="font-bold">{stats.content?.events || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Posts</span>
                    <span className="font-bold">{stats.content?.posts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trips</span>
                    <span className="font-bold">{stats.content?.trips || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <span>🔔</span> Recent Activity
                </h3>
                <div className="space-y-2 text-sm">
                  {stats.recent?.users?.slice(0, 3).map(u => (
                    <div key={u._id} className="text-gray-600">
                      New user: {u.username}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && !loading && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow flex gap-4">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button onClick={loadUsers} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Search
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {users.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No users found</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{user.username}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={user.tier}
                            onChange={(e) => changeTier(user._id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="free">Free</option>
                            <option value="basic">Basic</option>
                            <option value="premium">Premium</option>
                            <option value="pro">Pro</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && !loading && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">No posts found</div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="font-semibold">{post.userId?.username || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      post.moderationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                      post.moderationStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.moderationStatus || 'pending'}
                    </span>
                  </div>
                  <p className="mb-4 text-gray-700">{post.content?.text}</p>
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
                    <button
                      onClick={() => deletePost(post._id)}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Deals Tab */}
        {activeTab === 'deals' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {deals.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No deals found</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Merchant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Discount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deals.map(deal => (
                    <tr key={deal._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{deal.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{deal.merchantId?.username || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
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
                      <td className="px-6 py-4 text-sm">{deal.views || 0}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleDeal(deal._id)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          Toggle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Businesses Tab */}
        {activeTab === 'businesses' && !loading && (
          <div className="space-y-4">
            {businesses.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
                No pending business applications
              </div>
            ) : (
              businesses.map(biz => (
                <div key={biz._id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="font-bold text-lg mb-2">{biz.username}</h3>
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
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Approve Agent
                      </button>
                    )}
                    {biz.transportProfile?.verificationStatus === 'pending' && (
                      <button
                        onClick={() => approveBusiness(biz._id, 'transport')}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
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

        {/* Events Tab */}
        {activeTab === 'events' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {events.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No events found</div>
            ) : (
              <div className="divide-y">
                {events.map(event => (
                  <div key={event._id} className="p-6 hover:bg-gray-50">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    <p className="text-gray-600 mt-2">{event.description}</p>
                    <div className="mt-4 flex gap-4 text-sm text-gray-500">
                      <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                      <span>📍 {event.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trips Tab */}
        {activeTab === 'trips' && !loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {trips.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No trips found</div>
            ) : (
              <div className="divide-y">
                {trips.map(trip => (
                  <div key={trip._id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{trip.tripTitle}</h3>
                        <p className="text-gray-600 mt-1">{trip.destination} • {trip.duration}</p>
                        <p className="text-sm text-gray-500 mt-2">By: {trip.userId?.username || 'Unknown'}</p>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComprehensiveAdmin;
