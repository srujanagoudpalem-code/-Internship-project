import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (userId: string, token: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Auto-login on mount to bypass login screen
  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      if (storedUser && token) {
        try {
          setUser(JSON.parse(storedUser));
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
      }

      // Auto-authenticate customer user
      try {
        const res = await api.post('/auth/login', {
          email: 'customer@giftstore.com',
          password: 'password123',
        });
        const { accessToken, user: userData } = res.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
      } catch (error) {
        console.error('Auto login failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async () => {};
  const register = async () => {};
  const logout = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  };
  const forgotPassword = async () => {};
  const resetPassword = async () => {};

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
