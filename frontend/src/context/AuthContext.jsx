import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('cmd_token');
    if (token) {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
      } catch (err) {
        localStorage.removeItem('cmd_token');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (usernameOrEmail, password) => {
    const res = await api.post('/auth/login', { username_or_email: usernameOrEmail, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('cmd_token', access_token);
    setUser(userData);
    return userData;
  };

  const register = async (email, username, password, fullName) => {
    await api.post('/auth/register', { email, username, password, full_name: fullName });
    return await login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('cmd_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
