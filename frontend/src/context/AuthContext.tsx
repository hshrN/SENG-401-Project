import React, { createContext, useContext, useEffect, useState } from "react";
import { login, signup, type LoginRequest, type SignupRequest, type User } from "../application/authService";

type AuthContextType = {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // When the app refreshes/loads
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("user");
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const loginUser = async (data: LoginRequest) => {
    const result = await login(data);
    handleAuthSuccess(result.user);
  };

  const signupUser = async (data: SignupRequest) => {
    const result = await signup(data);
    handleAuthSuccess(result.user);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value: AuthContextType = {
    user,
    isLoggedIn: !!user,
    isLoading,
    login: loginUser,
    signup: signupUser,
    logout,
  };

  return <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (!context) {
    // If context is undefined which happens when a component not inside of the Provider tries to access the context
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};