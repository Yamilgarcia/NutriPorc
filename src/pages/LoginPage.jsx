import { useState } from "react";
import { useAuth } from "../features/auth/logic/AuthContext";
// 1. Añadimos recuperarContrasena a la importación
import { loginPrimerPaso, verificarCodigo2FA, recuperarContrasena } from "../features/auth/data/auth.service";
import "./LoginPage.css";

// ============================================================
// IMPORTA TUS IMÁGENES PNG AQUÍ
// ============================================================
import pigOcultoPng from "../assets/pig_oculto.png"; 
import pigVisiblePng from "../assets/pig_visible.png"; 
// ============================================================

export default function LoginPage() {
  const { loginExitoso2FA } = useAuth();
  
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [codigo2FA, setCodigo2FA] = useState("");
  const [datosTemporales, setDatosTemporales] = useState(null);
  
  const [error, setError] = useState("");
  // 2. Nuevo estado para el mensaje de recuperación exitosa
  const [resetMensaje, setResetMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCredencialesSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResetMensaje(""); // Limpiamos mensaje si lo hubiera
    setIsLoading(true);

    try {
      const datosUser = await loginPrimerPaso(email, password);
      setDatosTemporales(datosUser);
      setStep(2); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificarCodigoSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const sesionActiva = await verificarCodigo2FA(datosTemporales, codigo2FA);
      loginExitoso2FA(sesionActiva); 
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. NUEVA FUNCIÓN: Manejador para recuperar la contraseña
  const handleRecuperarPassword = async () => {
    if (!email) {
      setError("Escribe tu correo en el campo superior antes de recuperar la contraseña.");
      return;
    }
    setError("");
    setResetMensaje("");
    setIsLoading(true);
    try {
      const mensaje = await recuperarContrasena(email);
      setResetMensaje(mensaje);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>NutriPorc <span>Pro</span></h1>
          <p>
            {step === 1 
              ? "Acceso al panel de control de tu granja" 
              : "Autenticación de Dos Factores (2FA)"}
          </p>
        </div>

        {error && <div className="login-error">⚠️ {error}</div>}

        {step === 1 ? (
          <form onSubmit={handleCredencialesSubmit} className="login-form">
            <div className="input-group">
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tugranja.com"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                  data-tooltip={showPassword ? "Ocultar" : "Ver"} 
                >
                  <img 
                    src={showPassword ? pigVisiblePng : pigOcultoPng} 
                    alt={showPassword ? "Cerdo con los ojos abiertos" : "Cerdo tapándose los ojos"} 
                    className="password-toggle-img"
                  />
                </button>
              </div>
            </div>

            {/* 4. NUEVO: Botón de olvido de contraseña y Mensaje de éxito */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '5px', marginBottom: '15px' }}>
              <button 
                type="button" 
                onClick={handleRecuperarPassword}
                disabled={isLoading}
                style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {resetMensaje && (
              <div style={{ padding: '10px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '15px', fontSize: '0.85rem', textAlign: 'center' }}>
                ✅ {resetMensaje}
              </div>
            )}

            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? "Procesando..." : "Siguiente Paso ➔"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificarCodigoSubmit} className="login-form">
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534' }}>
                📧 Hemos enviado un código de 6 dígitos a tu correo. Por favor, revísalo para continuar, en caso de no encontrarlo revise la carpeta spam de su correo.
              </p>
            </div>

            <div className="input-group">
              <label style={{ textAlign: 'center', width: '100%' }}>Código de Acceso</label>
              <input
                type="text"
                maxLength="6"
                value={codigo2FA}
                onChange={(e) => setCodigo2FA(e.target.value.replace(/\D/g, ""))} 
                placeholder="000000"
                required
                style={{ 
                  textAlign: 'center', 
                  fontSize: '1.5rem', 
                  letterSpacing: '5px', 
                  fontWeight: 'bold' 
                }}
              />
            </div>

            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? "Comprobando código..." : "Confirmar e Ingresar"}
            </button>

            <button 
              type="button" 
              onClick={() => setStep(1)} 
              style={{ 
                width: '100%', 
                background: 'none', 
                border: 'none', 
                marginTop: '15px', 
                color: '#64748b', 
                cursor: 'pointer', 
                textDecoration: 'underline' 
              }}
            >
              ◀ Regresar y corregir correo
            </button>
          </form>
        )}
      </div>
    </div>
  );
}