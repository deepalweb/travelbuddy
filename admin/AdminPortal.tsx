
import React, { useState } from 'react';
import { Colors } from '../constants.ts';
import { CurrentUser } from '../types.ts';
import AdminSidebar from './AdminSidebar.tsx';
import AdminDashboardView from './views/AdminDashboardView.tsx';
import AdminUserManagementView from './views/AdminUserManagementView.tsx';
import AdminPlaceManagementView from './views/AdminPlaceManagementView.tsx';
import AdminDealManagementView from './views/AdminDealManagementView.tsx';
import AdminEventManagementView from './views/AdminEventManagementView.tsx';
import AdminSubscriptionManagementView from './views/AdminSubscriptionManagementView.tsx';
import AdminContentModerationView from './views/AdminContentModerationView.tsx';
import AdminApiAnalyticsView from './views/AdminApiAnalyticsView.tsx';
import AdminApiCostView from './views/AdminApiCostView.tsx';
import AdminApiInsightsView from './views/AdminApiInsightsView.tsx';
import MerchantManagement from '../components/MerchantManagement.tsx';

type AdminView = 
  | 'dashboard' 
  | 'users' 
  | 'places' 
  | 'deals' 
  | 'events' 
  | 'subscriptions' 
  | 'contentModeration'
  | 'apiAnalytics'
  | 'apiCost'
  | 'apiInsights'
  | 'merchants';

interface AdminPortalProps {
  currentUser: CurrentUser | null;
  onExitAdminPortal: () => void;
}

const AdminPortal: React.FC<AdminPortalProps> = ({ currentUser, onExitAdminPortal }) => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768); // Default open on desktop

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <AdminDashboardView />;
      case 'users':
        return <AdminUserManagementView />;
      case 'places':
        return <AdminPlaceManagementView />;
      case 'deals':
        return <AdminDealManagementView />;
      case 'events':
        return <AdminEventManagementView />;
      case 'subscriptions':
        return <AdminSubscriptionManagementView />;
      case 'contentModeration':
        return <AdminContentModerationView />;
      case 'apiAnalytics':
        return <AdminApiAnalyticsView />;
      case 'apiCost':
        return <AdminApiCostView />;
      case 'apiInsights':
        return <AdminApiInsightsView />;
      case 'merchants':
        return <MerchantManagement currentUser={currentUser!} />;
      default:
        return <AdminDashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: Colors.background }}>
      {/* Admin Header */}
      <header 
        className="p-3.5 shadow-lg sticky top-0 z-30" // z-30 for header
        style={{
          backgroundImage: `linear-gradient(145deg, ${Colors.primary}, ${Colors.primaryGradientEnd})`,
          boxShadow: Colors.boxShadowHeader
        }}
      >
        <div className="container mx-auto flex items-center justify-between">
          <button 
            aria-label={isSidebarOpen ? "Close admin menu" : "Open admin menu"}
            className="text-white p-2 rounded-lg hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/70"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
              {isSidebarOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              )}
            </svg>
          </button>
          
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center flex-grow px-2">
            Travel Buddy Admin Portal
          </h1>
          
          <button
            onClick={onExitAdminPortal}
            className="text-sm font-semibold py-2 px-4 rounded-xl transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/70 whitespace-nowrap text-white border border-white/50 hover:bg-white/10"
            aria-label="Exit Admin Portal"
          >
            Exit Admin
          </button>
        </div>
      </header>

      {/* Admin Body */}
      <div className="flex flex-1 overflow-hidden relative"> {/* Added relative for backdrop positioning */}
        <AdminSidebar 
          activeView={activeView} 
          setActiveView={setActiveView} 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        {/* Backdrop for mobile when sidebar is open */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/30 z-10 md:hidden"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
            ></div>
        )}
        <main 
            className={`flex-1 p-4 sm:p-6 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}
        >
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default AdminPortal;
