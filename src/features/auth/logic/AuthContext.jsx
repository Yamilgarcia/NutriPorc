import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loginConRoles } from "../data/auth.service";

const AuthContext = createContext();

// 1. Función externa para leer la sesión SIN causar re-renders
const obtenerUsuarioGuardado = () => {
  const sesionGuardada = localStorage.getItem("nutriporc_session");
  if (!sesionGuardada) return null;

  try {
    const datosSesion = JSON.parse(sesionGuardada);
    // Si la sesión ya expiró, limpiamos y devolvemos null
    if (Date.now() > datosSesion.expiraEn) {
      localStorage.removeItem("nutriporc_session");
      return null;
    }
    return datosSesion;
  } catch {
    // Si los datos están corruptos, limpiamos y devolvemos null (resolviendo el unused error)
    localStorage.removeItem("nutriporc_session");
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // 2. Inicializamos el estado síncronamente. ¡Cero useEffect, cero parpadeos!
  const [user, setUser] = useState(obtenerUsuarioGuardado);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem("nutriporc_session");
    setUser(null);
    navigate("/login", { replace: true });
  }, [navigate]);

  const login = useCallback(async (email, password) => {
    const data = await loginConRoles(email, password);
    setUser(data);
    navigate("/"); // Redirige al inicio tras loguearse
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Silenciamos la advertencia estricta de Vite para esta única línea
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);