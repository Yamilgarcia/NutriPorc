import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import InsumosPage from "./pages/InsumosPage";
import LotesPage from "./pages/LotesPage";
import PesajesPage from "./pages/PesajesPage";
import FormuladorPage from "./features/formulador/ui/FormuladorPage";
import MaximizadorPage from "./features/maximizador/ui/MaximizadorPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/insumos" element={<InsumosPage />} />
        <Route path="/lotes" element={<LotesPage />} />
        <Route path="/monitoreo" element={<PesajesPage />} />
        <Route path="/formulador" element={<FormuladorPage />} />
        <Route path="/maximizador" element={<MaximizadorPage />} />
      </Route>
    </Routes>
  );
}
