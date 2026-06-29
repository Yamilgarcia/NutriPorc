import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";

import LotesPage from "./pages/LotesPage";

//EJEMPLO DE COMO DEBEN IR LAS RUTAS

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<WelcomePage />} />

        <Route path="/lotes" element={<LotesPage />} />
      </Route>
    </Routes>
  );
}
