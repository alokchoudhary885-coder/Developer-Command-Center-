import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithGitHub: () => void;
  loginWithGoogle: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (
    email: string,
    password: string,
    name: string,
    confirmPassword?: string
  ) => Promise<void>;
  demoLogin: (username?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshSession = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.data?.user) {
        setUser(response.data.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const loginWithGitHub = () => {
    window.location.href = 'http://localhost:5000/api/auth/github';
  };

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const loginWithPassword = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data?.data?.user) {
      setUser(res.data.data.user);
    }
  };

  const registerWithPassword = async (
    email: string,
    password: string,
    name: string,
    confirmPassword?: string
  ) => {
    const res = await api.post('/auth/register', {
      email,
      password,
      name,
      confirmPassword,
    });
    if (res.data?.success && res.data?.data?.user) {
      setUser(res.data.data.user);
    }
  };

  const demoLogin = async (username: string = 'alok-engineer') => {
    try {
      setLoading(true);
      const res = await api.post('/auth/dev-login', { username });
      if (res.data?.success && res.data?.data?.user) {
        setUser(res.data.data.user);
      }
    } catch (err) {
      console.error('Demo login error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        loginWithGitHub,
        loginWithGoogle,
        loginWithPassword,
        registerWithPassword,
        demoLogin,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
