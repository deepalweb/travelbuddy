
import React from 'react';
import { Colors } from '../constants.ts';

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

interface AdminSidebarProps {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  key: AdminView;
  label: string;
  icon: React.ReactNode;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeView, setActiveView, isOpen, onClose }) => {
  const navItems: NavItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
    { key: 'users', label: 'User Management', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
    { key: 'places', label: 'Place Management', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { key: 'deals', label: 'Deal Management', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
    { key: 'events', label: 'Event Management', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
    { key: 'subscriptions', label: 'Subscriptions', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    { key: 'contentModeration', label: 'Content Moderation', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { key: 'merchants', label: 'Merchant Management', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
  { key: 'apiInsights', label: 'API Insights', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 12v4" /></svg> },
  ];

  return (
    <aside 
      className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-full sm:w-64 bg-opacity-75 backdrop-blur-md transition-transform duration-300 ease-in-out transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} z-20 md:sticky md:top-16`}
      style={{ 
        backgroundColor: Colors.cardBackground,
        boxShadow: Colors.boxShadowHeader,
        borderRight: `1px solid ${Colors.cardBorder}`
      }}
      aria-label="Admin navigation"
    >
      <div className="p-4 pt-6 flex flex-col h-full">
        <h2 className="text-lg font-semibold mb-6 px-2" style={{color: Colors.text}}>Admin Menu</h2>
        <nav className="flex-grow space-y-2 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setActiveView(item.key);
                onClose(); // Close sidebar on any item click, good for mobile
              }}
              className={`w-full flex items-center px-3 py-3 rounded-xl transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:ring-opacity-70`}
              style={{
                backgroundColor: activeView === item.key ? `${Colors.primary}20` : 'transparent',
                color: activeView === item.key ? Colors.primary : Colors.text_secondary,
                boxShadow: activeView === item.key 
                  ? Colors.boxShadowButton
                  : 'none',
                borderColor: Colors.primary, // For focus ring reference
              }}
              aria-current={activeView === item.key ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
