import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        try {
          const basicProfile = await authService.getProfile(savedToken);
          const fullProfile = await authService.getFullProfile(basicProfile.user.id);
          setUser(fullProfile);
          setToken(savedToken);
        } catch (error) {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { user: userData, token: authToken } = await authService.login(credentials);
      const fullProfile = await authService.getFullProfile(userData.id);
      setUser(fullProfile);
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: RegisterData) => {
    setLoading(true);
    try {
      const { user: userData, token: authToken } = await authService.register(data);
      const fullProfile = await authService.getFullProfile(userData.id);
      setUser(fullProfile);
      setToken(authToken);
      localStorage.setItem('auth_token', authToken);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (user) {
      try {
        const updatedUser = await authService.updateFullProfile(user.id, updates);
        setUser(updatedUser);
      } catch (error) {
        throw error;
      }
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    token,
    signIn,
    signUp,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};