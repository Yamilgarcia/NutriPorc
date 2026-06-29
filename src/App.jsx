import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import PesajesPage from "./pages/PesajesPage";
//EJEMPLO DE COMO DEBEN IR LAS RUTAS

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>

        <Route path="/monitoreo" element={<PesajesPage />} />
      </Route>
    </Routes>
  );
}
