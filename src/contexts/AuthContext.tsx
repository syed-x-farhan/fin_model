
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  authToken: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, []);

  const login = (token: string) => {
    setAuthToken(token);
    localStorage.setItem('authToken', token);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem('authToken');
  };

  const value = {
    authToken,
    isAuthenticated: !!authToken,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
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
