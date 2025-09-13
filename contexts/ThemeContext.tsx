import React, { createContext, useState, useContext, useMemo, ReactNode, useEffect } from 'react';
import { Colors } from '../constants.ts';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: typeof Colors;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('travelBuddyTheme') as Theme | null;
    return savedTheme || 'light';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('travelBuddyTheme', newTheme);
  };

  // Add logic to toggle body attribute for CSS
  useEffect(() => {
    const body = window.document.body;
    
    if (theme === 'dark') {
      body.setAttribute('data-theme', 'dark');
    } else {
      body.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const colors = useMemo(() => {
    // CSS variables handle the actual color changes.
    // This context provides the constant color names for JS logic.
    return Colors;
  }, []);

  const value = { theme, setTheme, colors };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};