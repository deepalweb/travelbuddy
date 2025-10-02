import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import WelcomeSection from './WelcomeSection';
import QuickActions from './QuickActions';
import NearbyPlaces from './NearbyPlaces';
import RecentActivity from './RecentActivity';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <WelcomeSection user={user} />

      {/* Quick Actions */}
      <QuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Nearby Places */}
        <div className="lg:col-span-2">
          <NearbyPlaces />
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default HomePage;