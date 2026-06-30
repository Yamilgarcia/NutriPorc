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
import Insumos from "./features/insumos/ui/InsumosPage";

// Atrapamos el parámetro antes de que React Router redireccione y lo borre
if (window.location.search.includes("pago=exitoso")) {
  localStorage.setItem("pago_pendiente_procesar", "true");
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<WelcomePage />} />
       
      </Route>
    </Routes>
  );
}
