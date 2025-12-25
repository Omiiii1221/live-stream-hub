import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('streamify_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call - in production this would hit your backend
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // Mock user data based on email
    const mockUser: User = {
      id: crypto.randomUUID(),
      email,
      username: email.split('@')[0],
      role: email.includes('host') ? 'host' : 'viewer',
      createdAt: new Date(),
    };
    
    setUser(mockUser);
    localStorage.setItem('streamify_user', JSON.stringify(mockUser));
  }, []);

  const register = useCallback(async (email: string, password: string, username: string, role: UserRole) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      username,
      role,
      createdAt: new Date(),
    };
    
    setUser(newUser);
    localStorage.setItem('streamify_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('streamify_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
