import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import WelcomePage from "./pages/WelcomePage";
import MaximizadorPage from "./features/maximizador/ui/MaximizadorPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<WelcomePage />} />
 
        <Route path="/maximizador" element={<MaximizadorPage />} />
      </Route>
    </Routes>
  );
}
