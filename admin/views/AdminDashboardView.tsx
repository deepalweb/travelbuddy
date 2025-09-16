
import React, { useState, useEffect } from 'react';
import { Colors } from '../../constants.ts';
import { apiService } from '../../services/apiService.ts';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalPosts: number;
  totalReviews: number;
  totalTripPlans: number;
  totalFavorites: number;
}

const AdminDashboardView: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalPosts: 0,
    totalReviews: 0,
    totalTripPlans: 0,
    totalFavorites: 0
  });
  const [loading, setLoading] = useState(true);

  const cardStyle: React.CSSProperties = {
    backgroundColor: Colors.cardBackground,
    borderRadius: '1rem',
    padding: '1.5rem',
    boxShadow: Colors.boxShadow,
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Fetching dashboard stats...');
      
      // Use apiService methods instead of hardcoded URLs
      const [users, posts, reviews] = await Promise.all([
        apiService.getUsers(),
        apiService.getPosts(),
        apiService.getReviews()
      ]);

      console.log('Data fetched:', { users: users.length, posts: posts.length, reviews: reviews.length });

      // Get trip plans count
      let totalTripPlans = 0;
      for (const user of users) {
        try {
          const userTrips = await apiService.getUserTrips(user._id);
          totalTripPlans += userTrips.length;
        } catch (err) {
          console.warn(`Failed to fetch trips for user ${user._id}:`, err);
        }
      }

      const activeSubscriptions = users.filter((user: any) => user.subscriptionStatus === 'active').length;
      const totalFavorites = users.reduce((sum: number, user: any) => sum + (user.favoritePlaces?.length || 0), 0);

      const newStats = {
        totalUsers: users.length,
        activeSubscriptions,
        totalPosts: posts.length,
        totalReviews: reviews.length,
        totalTripPlans,
        totalFavorites
      };
      
      console.log('Final stats:', newStats);
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
  alert(`Dashboard Error: ${errorMessage}. Ensure the backend is running. In production, calls use same-origin /api. Optionally set VITE_API_BASE_URL or window.API_BASE.`);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers.toString(), icon: '👥' },
    { title: 'Active Subscriptions', value: stats.activeSubscriptions.toString(), icon: '💳' },
    { title: 'Community Posts', value: stats.totalPosts.toString(), icon: '📝' },
    { title: 'Reviews', value: stats.totalReviews.toString(), icon: '⭐' },
    { title: 'Trip Plans', value: stats.totalTripPlans.toString(), icon: '🗺️' },
    { title: 'Total Favorites', value: stats.totalFavorites.toString(), icon: '❤️' },
  ];

  if (loading) {
    return (
      <div className="animate-fadeInUp flex justify-center items-center h-64">
        <div className="text-lg" style={{ color: Colors.text }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="animate-fadeInUp">
      <h1 className="text-2xl font-bold mb-6" style={{ color: Colors.text }}>Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map(item => (
          <div key={item.title} style={cardStyle} className="flex items-center p-4">
            <div className="text-3xl mr-4">{item.icon}</div>
            <div>
              <p className="text-sm font-medium" style={{ color: Colors.text_secondary }}>{item.title}</p>
              <p className="text-2xl font-bold" style={{ color: Colors.text }}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{...cardStyle, marginTop: '2rem'}}>
        <h2 className="text-xl font-semibold mb-4" style={{ color: Colors.primary }}>Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
            <button className="px-4 py-2 text-sm font-semibold rounded-lg" style={{backgroundColor: Colors.primary, color: 'white', boxShadow: cardStyle.boxShadow}}>Approve Content</button>
            <button className="px-4 py-2 text-sm font-semibold rounded-lg" style={{backgroundColor: Colors.secondary, color: 'white', boxShadow: cardStyle.boxShadow}}>Add New Deal</button>
            <button className="px-4 py-2 text-sm font-semibold rounded-lg" style={{backgroundColor: Colors.highlight, color: 'white', boxShadow: cardStyle.boxShadow}}>View User List</button>
        </div>
      </div>
       <p className="mt-8 text-center text-sm" style={{color: Colors.text_secondary}}>
        Welcome, Admin! Dashboard showing real-time data from your TravelBuddy database.
      </p>
    </div>
  );
};

export default AdminDashboardView;
