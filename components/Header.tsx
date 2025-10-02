import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useNotifications } from '../contexts/NotificationContext.tsx';
import { CurrentUser, ActiveTab, Place } from '../types.ts';
import SearchBar from './SearchBar.tsx';
import UserMenuDropdown from './UserMenuDropdown.tsx';
import NotificationCenter from './NotificationCenter.tsx';
import InstantSearchResults from './InstantSearchResults.tsx';
import { Bell } from './Icons.tsx';

interface HeaderProps {
  currentUser: CurrentUser | null;
  onShowAuthModal: (view: 'login' | 'register') => void;
  onLogout: () => void;
  onNavigateToProfile: () => void;
  onShowSOSModal: () => void; 
  onNavigateToAdminPortal?: () => void; 
  searchInput: string; 
  onSearchInputChange: (term: string) => void;
  activeTab: ActiveTab;
  onTabChange: (tabName: ActiveTab) => void;
  isListening: boolean;
  onVoiceSearchClick: () => void;
  onShowAPIStatus?: () => void;
  // Instant search props
  instantResults?: Place[];
  showInstantResults?: boolean;
  onSelectPlace?: (place: Place) => void;
  onCloseInstantResults?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentUser,
  onShowAuthModal,
  onLogout,
  onNavigateToProfile,
  onShowSOSModal, 
  onNavigateToAdminPortal, 
  searchInput, 
  onSearchInputChange,
  activeTab,
  onTabChange,
  isListening,
  onVoiceSearchClick,
  onShowAPIStatus,
  instantResults = [],
  showInstantResults = false,
  onSelectPlace,
  onCloseInstantResults
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const mainContentRef = document.querySelector('main');

  const navItems = [
    { name: 'forYou', labelKey: 'bottomNav.home' },
    { name: 'placeExplorer', labelKey: 'bottomNav.places' },
    { name: 'deals', labelKey: 'bottomNav.deals' },
    { name: 'planner', labelKey: 'bottomNav.planner' },
    { name: 'community', labelKey: 'bottomNav.community' },
    { name: 'aiAssistant', labelKey: 'bottomNav.aiAssistant' },
    { name: 'profile', labelKey: 'header.profile' },
  ];

  useEffect(() => {
    const handleScroll = () => {
        if (mainContentRef) {
          setIsScrolled(mainContentRef.scrollTop > 10);
        }
    };
    mainContentRef?.addEventListener('scroll', handleScroll);
    return () => mainContentRef?.removeEventListener('scroll', handleScroll);
  }, [mainContentRef]);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-in-out`}
      style={{
        backgroundColor: isScrolled ? 'var(--color-glass-bg)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${isScrolled ? 'var(--color-glass-border)' : 'transparent'}`
      }}
    >
      <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-6 lg:px-8 h-20">
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md" style={{backgroundImage: 'var(--gradient-accent)'}}>
                <span className="text-white font-bold text-base">TB</span>
              </div>
              <span className={`text-lg sm:text-xl font-bold transition-all duration-200 ease-in-out overflow-hidden gradient-text hidden xs:block`}>
                Travel Buddy
              </span>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
                {navItems.map(item => {
                    const isActive = activeTab === item.name;
                    return (
                        <button
                            key={item.name}
                            onClick={() => onTabChange(item.name as ActiveTab)}
                            className="px-3.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative"
                            style={{
                                color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                                fontWeight: isActive ? '600' : '500',
                            }}
                        >
                            {t(item.labelKey)}
                            {isActive && (
                                <span
                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                                    style={{ backgroundColor: 'var(--color-primary)' }}
                                ></span>
                            )}
                        </button>
                    )
                })}
            </nav>
        </div>

        <div className="flex-grow max-w-lg mx-2 sm:mx-4 relative">
          {['placeExplorer', 'deals'].includes(activeTab) && (
            <>
              <SearchBar 
                searchTerm={searchInput} 
                onSearchTermChange={onSearchInputChange} 
                isListening={isListening} 
                onVoiceSearchClick={onVoiceSearchClick} 
              />
              {onSelectPlace && onCloseInstantResults && (
                <InstantSearchResults
                  results={instantResults}
                  isVisible={showInstantResults}
                  onSelectPlace={(place) => {
                    onSelectPlace(place);
                    onTabChange('placeExplorer');
                  }}
                  onClose={onCloseInstantResults}
                  searchQuery={searchInput}
                />
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10 relative" 
              style={{ color: 'var(--color-text-secondary)'}}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationCenter 
              isOpen={showNotifications} 
              onClose={() => setShowNotifications(false)} 
            />
          </div>
          <button onClick={toggleLanguage} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--color-text-secondary)'}}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m4 13-4-4-4 4M19 17v-2a4 4 0 00-4-4H9m7 0l3 3m-3-3l-3 3" /></svg>
          </button>
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10" style={{ color: 'var(--color-text-secondary)'}}>
            {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )}
          </button>
          {onShowAPIStatus && (
            <button 
              onClick={onShowAPIStatus} 
              className="p-2 rounded-full transition-colors hover:bg-black/5 dark:hover:bg-white/10" 
              style={{ color: 'var(--color-text-secondary)'}}
              title="Check API Status"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          {currentUser ? (
            <UserMenuDropdown
              currentUser={currentUser}
              onNavigateToProfile={onNavigateToProfile}
              onShowSOSModal={onShowSOSModal}
              onNavigateToAdminPortal={currentUser.isAdmin ? onNavigateToAdminPortal : undefined}
              onLogout={onLogout}
            />
          ) : (
            <>
              <button
                onClick={() => onShowAuthModal('login')}
                className="btn text-sm px-2 sm:px-4"
                aria-label={t('header.login')}
              >
                {t('header.login')}
              </button>
              <button
                onClick={() => onShowAuthModal('register')}
                className="btn btn-primary text-sm px-2 sm:px-4 hidden sm:inline-flex" 
                aria-label={t('header.signUp')}
              >
                {t('header.signUp')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;