import { useState } from "react";
import { useAuth } from "../features/auth/logic/AuthContext";
import { loginPrimerPaso, verificarCodigo2FA } from "../features/auth/data/auth.service";
import "./LoginPage.css";

// ============================================================
// 1. IMPORTA TUS IMÁGENES PNG AQUÍ
// Asegúrate de colocar las rutas correctas a tus archivos PNG.
// ============================================================
import pigOcultoPng from "../assets/pig_oculto.png"; // Reemplaza por tu archivo real
import pigVisiblePng from "../assets/pig_visible.png"; // Reemplaza por tu archivo real
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
  const [isLoading, setIsLoading] = useState(false);

  const handleCredencialesSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
                  {/* ============================================================ */}
                  {/* 2. USA TUS IMÁGENES PNG AQUÍ */}
                  {/* Condicional para mostrar la imagen correspondiente. */}
                  {/* ============================================================ */}
                  <img 
                    src={showPassword ? pigVisiblePng : pigOcultoPng} 
                    alt={showPassword ? "Cerdo con los ojos abiertos" : "Cerdo tapándose los ojos"} 
                    className="password-toggle-img"
                  />
                  {/* ============================================================ */}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login-submit" disabled={isLoading}>
              {isLoading ? "Enviando código de seguridad..." : "Siguiente Paso ➔"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerificarCodigoSubmit} className="login-form">
            
            <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534' }}>
                📧 Hemos enviado un código de 6 dígitos a tu correo. Por favor, revísalo para continuar.
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