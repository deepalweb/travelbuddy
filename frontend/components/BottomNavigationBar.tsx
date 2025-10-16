import React from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { ActiveTab } from '../types.ts';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tabName: ActiveTab) => void;
}

const NavIcon: React.FC<{isActive: boolean, children: React.ReactNode}> = ({isActive, children}) => (
    <div className={`w-7 h-7 flex items-center justify-center mb-0.5 transition-all duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
        {children}
    </div>
);

const BottomNavigationBar: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { t } = useLanguage();

  const navItems = [
    { name: 'forYou', labelKey: 'bottomNav.home', icon: (isActive: boolean) => <NavIcon isActive={isActive}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg></NavIcon> },
    { name: 'placeExplorer', labelKey: 'bottomNav.places', icon: (isActive: boolean) => <NavIcon isActive={isActive}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5-10.5h-7a2.25 2.25 0 00-2.25 2.25v10.5a2.25 2.25 0 002.25 2.25h7.5a2.25 2.25 0 002.25-2.25v-10.5a2.25 2.25 0 00-2.25-2.25z" /></svg></NavIcon> },
    { name: 'planner', labelKey: 'bottomNav.planner', icon: (isActive: boolean) => <NavIcon isActive={isActive}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg></NavIcon> },
    { name: 'deals', labelKey: 'bottomNav.deals', icon: (isActive: boolean) => <NavIcon isActive={isActive}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m0 0h1.5m9 1.5H18" /></svg></NavIcon> },
    { name: 'community', labelKey: 'bottomNav.community', icon: (isActive: boolean) => <NavIcon isActive={isActive}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></NavIcon> },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden"
      style={{
        backgroundColor: 'var(--color-glass-bg)',
        borderTop: '1px solid var(--color-glass-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map(item => {
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.name}
              onClick={() => onTabChange(item.name as ActiveTab)}
              className="flex flex-col items-center justify-center w-full h-full transition-colors duration-200"
              style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={t(item.labelKey)}
            >
              {item.icon(isActive)}
              <span className={`text-xs transition-all duration-200 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {t(item.labelKey)}
              </span>
              {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{backgroundColor: 'var(--color-primary)'}}></div>}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;
