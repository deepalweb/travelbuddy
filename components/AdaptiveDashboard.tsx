import React from 'react';
import { CurrentUser } from '../types';
import { moduleService } from '../services/moduleService';
import AgentDashboard from './dashboards/AgentDashboard';
import MerchantDashboard from './dashboards/MerchantDashboard';
import ServiceProviderOnboarding from './ServiceProviderOnboarding';
import { useState } from 'react';

interface AdaptiveDashboardProps {
  user: CurrentUser;
  onNavigateToTab?: (tab: string) => void;
}

const AdaptiveDashboard: React.FC<AdaptiveDashboardProps> = ({ user, onNavigateToTab }) => {
  const [triggerServiceModal, setTriggerServiceModal] = useState(false);
  const userModules = user.enabledModules || moduleService.getModulesForProfile(user.profileType || 'traveler');
  const profileType = user.profileType || 'traveler';

  // Service Provider Dashboard
  if (profileType === 'service' || moduleService.hasModule(userModules, 'services')) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">Service Provider Hub</h2>
              <p className="opacity-90">Grow your travel business with Travel Buddy</p>
            </div>
            <div className="text-right">
              <div className="text-3xl mb-1">🎯</div>
              <div className="text-sm opacity-75">Active Services: 2</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="font-semibold text-gray-700">Quick Start</h3>
            <p className="text-sm text-gray-600 mb-3">Set up your first service</p>
            <button 
              onClick={() => onNavigateToTab?.('profile')}
              className="text-green-600 hover:text-green-800 text-sm font-medium"
            >
              Create Service →
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="font-semibold text-gray-700">Get Verified</h3>
            <p className="text-sm text-gray-600 mb-3">Build trust with customers</p>
            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              Start Verification →
            </button>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <h3 className="font-semibold text-gray-700">Boost Visibility</h3>
            <p className="text-sm text-gray-600 mb-3">Promote your services</p>
            <button className="text-purple-600 hover:text-purple-800 text-sm font-medium">
              Learn More →
            </button>
          </div>
        </div>
        
        <ServiceProviderOnboarding 
          user={user} 
          onComplete={(step) => console.log('Completed step:', step)}
          onOpenServiceModal={() => setTriggerServiceModal(true)}
        />
        <AgentDashboard user={user} />
      </div>
    );
  }
  
  // Business Owner Dashboard  
  if (profileType === 'business' || moduleService.hasModule(userModules, 'deals')) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Business Dashboard</h2>
          <p className="opacity-90">Manage your deals and business analytics</p>
        </div>
        <MerchantDashboard user={user} />
      </div>
    );
  }

  // Community Creator Dashboard
  if (profileType === 'creator') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Welcome, Community Creator!</h2>
          <p className="opacity-90">Share your experiences and build community</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DashboardCard
            icon="📝"
            title="Create Posts"
            description="Share your travel experiences"
            onClick={() => onNavigateToTab?.('community')}
          />
          <DashboardCard
            icon="📸"
            title="Photo Gallery"
            description="Upload and manage photos"
            onClick={() => onNavigateToTab?.('community')}
          />
          <DashboardCard
            icon="🎉"
            title="Organize Events"
            description="Create community events"
            onClick={() => onNavigateToTab?.('community')}
          />
          <DashboardCard
            icon="👥"
            title="Community"
            description="Engage with travelers"
            onClick={() => onNavigateToTab?.('community')}
          />
          <DashboardCard
            icon="📊"
            title="Analytics"
            description="Track your content performance"
            onClick={() => onNavigateToTab?.('profile')}
          />
          <DashboardCard
            icon="🏆"
            title="Achievements"
            description="View your creator badges"
            onClick={() => onNavigateToTab?.('profile')}
          />
        </div>
      </div>
    );
  }
  
  // Traveler Dashboard (default)
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-2">Welcome, {user.username}!</h2>
        <p className="opacity-90">Ready for your next adventure?</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userModules.includes('places') && (
          <DashboardCard
            icon="🗺️"
            title="Explore Places"
            description="Discover amazing destinations"
            onClick={() => onNavigateToTab?.('placeExplorer')}
          />
        )}
        {userModules.includes('trips') && (
          <DashboardCard
            icon="✈️"
            title="Plan Trips"
            description="Create your perfect itinerary"
            onClick={() => onNavigateToTab?.('planner')}
          />
        )}
        {userModules.includes('community') && (
          <DashboardCard
            icon="👥"
            title="Community"
            description="Connect with fellow travelers"
            onClick={() => onNavigateToTab?.('community')}
          />
        )}
        {userModules.includes('favorites') && (
          <DashboardCard
            icon="❤️"
            title="Favorites"
            description="Your saved places"
            onClick={() => onNavigateToTab?.('profile')}
          />
        )}
        <DashboardCard
          icon="💰"
          title="Deals"
          description="Find great travel deals"
          onClick={() => onNavigateToTab?.('deals')}
        />
        <DashboardCard
          icon="🤖"
          title="AI Assistant"
          description="Get personalized help"
          onClick={() => onNavigateToTab?.('aiAssistant')}
        />
      </div>
    </div>
  );
};

interface DashboardCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ icon, title, description, onClick }) => {
  return (
    <div 
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

export default AdaptiveDashboard;