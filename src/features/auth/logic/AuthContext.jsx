import { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
// (Eliminamos la importación de auth.service de aquí porque ahora la controlaremos desde el LoginPage)

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
    // Si los datos están corruptos, limpiamos y devolvemos null
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

  // 3. NUEVO: Función que se ejecuta SOLO cuando el código 2FA de 6 dígitos fue correcto
  const loginExitoso2FA = useCallback((sesionFinal) => {
    setUser(sesionFinal);
    navigate("/"); // Redirige al inicio tras loguearse exitosamente
  }, [navigate]);

  return (
    // Exponemos loginExitoso2FA en lugar del antiguo login
    <AuthContext.Provider value={{ user, logout, loginExitoso2FA }}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Silenciamos la advertencia estricta de Vite para esta única línea
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);