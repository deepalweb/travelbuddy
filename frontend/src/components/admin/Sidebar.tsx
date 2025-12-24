import React, { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r shadow-lg z-40 transition-all duration-300 ${
          collapsed ? 'w-20' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            {!collapsed && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌍</span>
                <div>
                  <h2 className="font-bold text-gray-800">TravelBuddy</h2>
                  <p className="text-xs text-gray-500">Admin Panel</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg hidden lg:block"
            >
              {collapsed ? '→' : '←'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                {!collapsed && <span>{tab.label}</span>}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <span className="text-xl">🚪</span>
              {!collapsed && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
