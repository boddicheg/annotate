import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

// API base URL
const API_URL = "http://localhost:1337/api";

interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Configure axios to include the token in all requests
const setupAxiosInterceptors = (token: string | null) => {
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common["Authorization"];
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [_, setTokenInitialized] = useState(false);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      setupAxiosInterceptors(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
    setTokenInitialized(true);
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/auth/user`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUser(response.data.user);
    } catch (err) {
      console.error("Failed to fetch user", err);
      // If token is invalid, clear it
      localStorage.removeItem("token");
      setupAxiosInterceptors(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { user, token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem("token", token);
      
      // Set up axios interceptors
      setupAxiosInterceptors(token);
      
      // Set user state
      setUser(user);
      
      // Small delay to ensure token is properly set before any redirects
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err: any) {
      console.error("Login failed", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("An unexpected error occurred");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { 
        username, 
        email, 
        password 
      });
      const { user, token } = response.data;
      
      // Save token to localStorage
      localStorage.setItem("token", token);
      
      // Set up axios interceptors
      setupAxiosInterceptors(token);
      
      // Set user state
      setUser(user);
      
      // Small delay to ensure token is properly set before any redirects
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (err: any) {
      console.error("Registration failed", err);
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("An unexpected error occurred");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear user data
    setUser(null);
    
    // Remove token from localStorage
    localStorage.removeItem("token");
    
    // Remove Authorization header
    setupAxiosInterceptors(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loading,
    error
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 