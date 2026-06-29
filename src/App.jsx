import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./features/auth/logic/AuthContext";
import LoginPage from "./pages/LoginPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* RUTA PÚBLICA: Si no hay sesión, ProtectedRoute te mandará aquí */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PROTEGIDAS: Solo pasas si tienes sesión activa */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* RUTA RAÍZ: Al iniciar sesión exitosamente, aterrizas aquí */}
            <Route path="/" element={<WelcomePage />} />
            
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}