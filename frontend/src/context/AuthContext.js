import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('astro_token');
    const savedUser = localStorage.getItem('astro_user');
    
    if (token && savedUser) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
        localStorage.setItem('astro_user', JSON.stringify(response.data));
      } catch (error) {
        localStorage.removeItem('astro_token');
        localStorage.removeItem('astro_user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('astro_token', access_token);
    localStorage.setItem('astro_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const register = async (name, email, password) => {
    const response = await authAPI.register({ name, email, password });
    const { access_token, user: userData } = response.data;
    
    localStorage.setItem('astro_token', access_token);
    localStorage.setItem('astro_user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('astro_token');
    localStorage.removeItem('astro_user');
    setUser(null);
  };

  const updateUser = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem('astro_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout,
      updateUser,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
