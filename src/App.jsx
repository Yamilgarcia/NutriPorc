import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";

import FormuladorPage from "./features/formulador/ui/FormuladorPage";

//EJEMPLO DE COMO DEBEN IR LAS RUTAS

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/formulador" element={<FormuladorPage />} />
      </Route>
    </Routes>
  );
}
