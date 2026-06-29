import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./features/auth/logic/AuthContext";
import LoginPage from "./pages/LoginPage";
import LotesPage from "./pages/LotesPage"; // Importamos Lotes

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PROTEGIDAS: Todo lo que esté aquí dentro requiere sesión */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<WelcomePage />} />
            {/* AQUÍ AGREGAMOS LA RUTA DE LOTES */}
            <Route path="/lotes" element={<LotesPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}