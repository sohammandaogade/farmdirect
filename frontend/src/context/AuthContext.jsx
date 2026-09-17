import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('farmdirect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('farmdirect_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      if (token) {
        try {
          const res = await authAPI.me();
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('farmdirect_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Session expired or invalid token:', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifyUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.data.success) {
      const { user: userData, token: jwtToken } = res.data.data;
      setUser(userData);
      setToken(jwtToken);
      localStorage.setItem('farmdirect_token', jwtToken);
      localStorage.setItem('farmdirect_user', JSON.stringify(userData));
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authAPI.register(userData);
    if (res.data.success) {
      const { user: registeredUser, token: jwtToken } = res.data.data;
      setUser(registeredUser);
      setToken(jwtToken);
      localStorage.setItem('farmdirect_token', jwtToken);
      localStorage.setItem('farmdirect_user', JSON.stringify(registeredUser));
      return registeredUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    try {
      authAPI.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('farmdirect_token');
    localStorage.removeItem('farmdirect_user');
  };

  const refreshUser = async () => {
    try {
      const res = await authAPI.me();
      if (res.data.success) {
        setUser(res.data.data);
        localStorage.setItem('farmdirect_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
