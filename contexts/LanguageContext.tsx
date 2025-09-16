
import React, { createContext, useState, useCallback, ReactNode, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations.ts';
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '../i18n/locales.ts';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, substitutions?: Record<string, string>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage?: string; // Optional prop to set initial language, useful if App.tsx manages it
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLanguage }) => {
  const [language, setLanguageState] = useState<string>(initialLanguage || DEFAULT_LANGUAGE);

  useEffect(() => {
    if (initialLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === initialLanguage)) {
      setLanguageState(initialLanguage);
    }
  }, [initialLanguage]);


  const setLanguage = useCallback((lang: string) => {
    if (SUPPORTED_LANGUAGES.some(l => l.code === lang)) {
      setLanguageState(lang);
      // Persisting language choice could be done here if App.tsx isn't handling it via currentUser
      // localStorage.setItem('travelBuddyLanguage', lang); 
    } else {
      console.warn(`Language '${lang}' is not supported. Defaulting to '${DEFAULT_LANGUAGE}'.`);
      setLanguageState(DEFAULT_LANGUAGE);
    }
  }, []);

  const t = useCallback((key: string, substitutions?: Record<string, string>): string => {
    const langTranslations = translations[language] || translations[DEFAULT_LANGUAGE];
    
    // Simple dot notation accessor
    const keys = key.split('.');
    let result = langTranslations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as any)[k];
      } else {
        // Fallback to default language if key not found in current language
        let fallbackResult = translations[DEFAULT_LANGUAGE];
        for (const fk of keys) {
            if (fallbackResult && typeof fallbackResult === 'object' && fk in fallbackResult) {
                fallbackResult = (fallbackResult as any)[fk];
            } else {
                console.warn(`Translation key "${key}" not found in language "${language}" or default "${DEFAULT_LANGUAGE}".`);
                return key; // Key not found in default lang either
            }
        }
        if (typeof fallbackResult === 'string') {
            let S_res = fallbackResult;
             if (substitutions) {
                Object.keys(substitutions).forEach(subKey => {
                    S_res = S_res.replace(new RegExp(`{{${subKey}}}`, 'g'), substitutions[subKey]);
                });
            }
            return S_res;
        }
        return key;
      }
    }

    if (typeof result === 'string') {
        let S_res = result;
        if (substitutions) {
            Object.keys(substitutions).forEach(subKey => {
                S_res = S_res.replace(new RegExp(`{{${subKey}}}`, 'g'), substitutions[subKey]);
            });
        }
        return S_res;
    }
    
    console.warn(`Translation key "${key}" found, but it's not a string in language "${language}".`);
    return key; // Key found but not a string
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
