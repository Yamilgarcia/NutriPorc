// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/logic/AuthContext";

export default function ProtectedRoute() {
  const { user } = useAuth();

  // Si no hay usuario, lo manda al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si hay usuario, renderiza las rutas hijas (AppLayout)
  return <Outlet />;
}