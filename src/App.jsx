import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./features/auth/logic/AuthContext";
import LoginPage from "./pages/LoginPage";
import LotesPage from "./pages/LotesPage";
import MaximizadorPage from "./features/maximizador/ui/MaximizadorPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/lotes" element={<LotesPage />} />
            <Route path="/maximizador" element={<MaximizadorPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}