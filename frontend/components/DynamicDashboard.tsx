import React from 'react';
import { moduleService } from '../services/moduleService';
import AgentDashboard from './dashboards/AgentDashboard';
import MerchantDashboard from './dashboards/MerchantDashboard';

interface DynamicDashboardProps {
  user: any;
  activeTab: string;
}

const DynamicDashboard: React.FC<DynamicDashboardProps> = ({ user, activeTab }) => {
  const userModules = user.enabledModules || moduleService.getModulesForProfile(user.profileType || 'traveler');
  
  // Service Provider Dashboard
  if (moduleService.hasModule(userModules, 'services') && activeTab === 'profile') {
    return <AgentDashboard user={user} />;
  }
  
  // Business Owner Dashboard  
  if (moduleService.hasModule(userModules, 'deals') && activeTab === 'profile') {
    return <MerchantDashboard user={user} />;
  }
  
  // Traveler Dashboard (default)
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Welcome, {user.username}!</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userModules.includes('places') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">🗺️ Places</h3>
            <p className="text-sm text-gray-600">Discover amazing places around you</p>
          </div>
        )}
        {userModules.includes('trips') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">✈️ Trip Planning</h3>
            <p className="text-sm text-gray-600">Plan your perfect journey</p>
          </div>
        )}
        {userModules.includes('community') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">👥 Community</h3>
            <p className="text-sm text-gray-600">Connect with fellow travelers</p>
          </div>
        )}
        {userModules.includes('deals') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">💰 Business Deals</h3>
            <p className="text-sm text-gray-600">Manage your business offers</p>
          </div>
        )}
        {userModules.includes('services') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">🎯 Services</h3>
            <p className="text-sm text-gray-600">Manage your travel services</p>
          </div>
        )}
        {userModules.includes('bookings') && (
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">📅 Bookings</h3>
            <p className="text-sm text-gray-600">Handle customer bookings</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicDashboard;