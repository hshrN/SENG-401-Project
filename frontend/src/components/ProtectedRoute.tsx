import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: React.ReactElement;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;