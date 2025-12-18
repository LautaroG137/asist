
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User, AppSettings, Role } from '../types';
import { api } from '../services/mockApi';

interface AuthContextType {
  user: User | null;
  settings: AppSettings | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isPreceptor: boolean;
  isStudent: boolean;
  login: (document: string) => Promise<User | null>;
  logout: () => void;
  refreshSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  
  const refreshSettings = useCallback(async () => {
    const appSettings = await api.getSettings();
    setSettings(appSettings);
  }, []);

  const login = useCallback(async (document: string): Promise<User | null> => {
    const foundUser = await api.getUserByDocument(document);
    if (foundUser) {
      setUser(foundUser);
      await refreshSettings();
      return foundUser;
    }
    setUser(null);
    setSettings(null);
    throw new Error('Usuario no encontrado');
  }, [refreshSettings]);

  const logout = useCallback(() => {
    setUser(null);
    setSettings(null);
  }, []);
  
  const isAuthenticated = !!user;
  const isAdmin = user?.role === Role.Admin;
  const isPreceptor = user?.role === Role.Preceptor || user?.role === Role.Admin;
  const isStudent = user?.role === Role.Student;

  return (
    <AuthContext.Provider value={{ user, settings, isAuthenticated, isAdmin, isPreceptor, isStudent, login, logout, refreshSettings }}>
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
