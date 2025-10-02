import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Simple translations object
const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.title': 'Travel Buddy',
    'nav.home': 'Home',
    'nav.explore': 'Explore',
    'nav.trips': 'Trips',
    'nav.community': 'Community',
    'nav.profile': 'Profile',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.username': 'Username',
    'places.search': 'Search places...',
    'places.nearby': 'Nearby Places',
    'places.favorites': 'Favorites',
    'trips.myTrips': 'My Trips',
    'trips.createNew': 'Create New Trip',
    'community.posts': 'Community Posts',
    'community.createPost': 'Create Post',
    'profile.settings': 'Settings',
    'profile.subscription': 'Subscription',
  },
  es: {
    'app.title': 'Compañero de Viaje',
    'nav.home': 'Inicio',
    'nav.explore': 'Explorar',
    'nav.trips': 'Viajes',
    'nav.community': 'Comunidad',
    'nav.profile': 'Perfil',
    'auth.signIn': 'Iniciar Sesión',
    'auth.signUp': 'Registrarse',
    'auth.logout': 'Cerrar Sesión',
    'auth.email': 'Correo',
    'auth.password': 'Contraseña',
    'auth.username': 'Usuario',
    'places.search': 'Buscar lugares...',
    'places.nearby': 'Lugares Cercanos',
    'places.favorites': 'Favoritos',
    'trips.myTrips': 'Mis Viajes',
    'trips.createNew': 'Crear Nuevo Viaje',
    'community.posts': 'Publicaciones',
    'community.createPost': 'Crear Publicación',
    'profile.settings': 'Configuración',
    'profile.subscription': 'Suscripción',
  },
  fr: {
    'app.title': 'Compagnon de Voyage',
    'nav.home': 'Accueil',
    'nav.explore': 'Explorer',
    'nav.trips': 'Voyages',
    'nav.community': 'Communauté',
    'nav.profile': 'Profil',
  },
  de: {
    'app.title': 'Reisebegleiter',
    'nav.home': 'Startseite',
    'nav.explore': 'Erkunden',
    'nav.trips': 'Reisen',
    'nav.community': 'Gemeinschaft',
    'nav.profile': 'Profil',
  },
  it: {
    'app.title': 'Compagno di Viaggio',
    'nav.home': 'Casa',
    'nav.explore': 'Esplora',
    'nav.trips': 'Viaggi',
    'nav.community': 'Comunità',
    'nav.profile': 'Profilo',
  },
  pt: {
    'app.title': 'Companheiro de Viagem',
    'nav.home': 'Início',
    'nav.explore': 'Explorar',
    'nav.trips': 'Viagens',
    'nav.community': 'Comunidade',
    'nav.profile': 'Perfil',
  },
  ja: {
    'app.title': '旅行仲間',
    'nav.home': 'ホーム',
    'nav.explore': '探索',
    'nav.trips': '旅行',
    'nav.community': 'コミュニティ',
    'nav.profile': 'プロフィール',
  },
  ko: {
    'app.title': '여행 친구',
    'nav.home': '홈',
    'nav.explore': '탐색',
    'nav.trips': '여행',
    'nav.community': '커뮤니티',
    'nav.profile': '프로필',
  },
  zh: {
    'app.title': '旅行伙伴',
    'nav.home': '首页',
    'nav.explore': '探索',
    'nav.trips': '旅行',
    'nav.community': '社区',
    'nav.profile': '个人资料',
  },
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('travelbuddy_language');
    if (stored && Object.keys(translations).includes(stored)) {
      return stored as Language;
    }
    return 'en';
  });

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    localStorage.setItem('travelbuddy_language', newLanguage);
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[language]?.[key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};