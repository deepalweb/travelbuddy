import React, { useState, useEffect, useRef } from 'react';
import { Colors } from '../constants.ts';
import { CurrentUser } from '../types.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface UserMenuDropdownProps {
  currentUser: CurrentUser;
  onNavigateToProfile: () => void;
  onShowSOSModal: () => void;
  onNavigateToAdminPortal?: () => void;
  onLogout: () => void;
}

const UserMenuDropdown: React.FC<UserMenuDropdownProps> = ({
  currentUser,
  onNavigateToProfile,
  onShowSOSModal,
  onNavigateToAdminPortal,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const menuItems = [
    { labelKey: 'userMenu.profile', action: onNavigateToProfile, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
    { labelKey: 'userMenu.sosEmergency', action: onShowSOSModal, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
  ];

  if (currentUser.isAdmin && onNavigateToAdminPortal) {
    menuItems.push({ labelKey: 'userMenu.adminPortal', action: onNavigateToAdminPortal, icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> });
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center p-1.5 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-white/70 active:scale-95"
        style={{
          backgroundColor: 'rgba(255,255,255,0.1)',
          boxShadow: Colors.boxShadowSoft
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={t('userMenu.userActions')}
      >
        <span 
          className="text-sm font-medium mr-2 hidden sm:inline truncate max-w-[100px]" 
          style={{ color: 'var(--color-text-primary)' }}
        >
          {currentUser.username}
        </span>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            style={{ color: 'var(--color-primary)' }}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth="1.5"
        >
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeInUp"
          style={{ 
            backgroundColor: 'var(--color-glass-bg)', 
            boxShadow: 'var(--shadow-lg)',
            border: `1px solid var(--color-glass-border)`
          }}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
          <div className="py-1" role="none">
            {menuItems.map(item => (
              <button
                key={item.labelKey}
                onClick={() => handleItemClick(item.action)}
                className="w-full text-left flex items-center px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: 'var(--color-text-secondary)' }}
                role="menuitem"
              >
                {item.icon}
                {t(item.labelKey)}
              </button>
            ))}
            <div className="border-t my-1" style={{borderColor: 'var(--color-glass-border)'}}></div>
            <button
              onClick={() => handleItemClick(onLogout)}
              className="w-full text-left flex items-center px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-red-500/10"
              style={{ color: 'var(--color-accent-danger)' }}
              role="menuitem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {t('header.logout')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenuDropdown;