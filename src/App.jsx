import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./features/auth/logic/AuthContext";
import LoginPage from "./pages/LoginPage";
import LotesPage from "./pages/LotesPage";
import MaximizadorPage from "./features/maximizador/ui/MaximizadorPage";
import PesajesPage from "./pages/PesajesPage";
import FormuladorPage from "./features/formulador/ui/FormuladorPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* RUTA PÚBLICA */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTAS PROTEGIDAS: Requieren autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<WelcomePage />} />
            <Route path="/lotes" element={<LotesPage />} />
            <Route path="/maximizador" element={<MaximizadorPage />} />
            <Route path="/monitoreo" element={<PesajesPage />} />
            <Route path="/formulador" element={<FormuladorPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}