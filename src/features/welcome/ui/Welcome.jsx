import { useEffect, useState } from 'react';
import { useDashboardAlerts } from '../logic/useDashboardAlerts';
import { useNavigate } from 'react-router-dom';

// Importaciones para el Upgrade y Base de Datos
import { doc, updateDoc } from 'firebase/firestore';
// Ajusta estas dos rutas si es necesario según la estructura de tus carpetas
import { db } from '../../../../firebase.config'; 
import { useAuth } from '../../auth/logic/AuthContext'; 

import './Welcome.css';

export default function Welcome() {
  const { alertasOptimas, loadingAlertas } = useDashboardAlerts();
  const navigate = useNavigate();
  
  // Extraemos la sesión y preparamos el estado del mensaje de éxito
  const { user } = useAuth();
  const [mensajeExito, setMensajeExito] = useState("");

  // Efecto que atrapa al usuario cuando regresa de pagar en Stripe
  useEffect(() => {
    const activarLicencia = async () => {
      // 1. Leemos la memoria en lugar de la URL
      const pagoExitoso = localStorage.getItem("pago_pendiente_procesar");

      if (pagoExitoso && user?.fincaId) {
        try {
          // 2. Actualizamos en Firebase
          const fincaRef = doc(db, "fincas", user.fincaId);
          await updateDoc(fincaRef, {
            estado_suscripcion: "activa",
            plan: "Pro"
          });

          // 3. Actualizamos la sesión en tu navegador
          const sesionGuardada = JSON.parse(localStorage.getItem("nutriporc_session"));
          if (sesionGuardada) {
            sesionGuardada.plan = "Pro";
            sesionGuardada.estado_suscripcion = "activa";
            localStorage.setItem("nutriporc_session", JSON.stringify(sesionGuardada));
          }

          // 4. Borramos la memoria para que no se ejecute en bucle
          localStorage.removeItem("pago_pendiente_procesar");

          // 5. Forzamos la recarga de la página para que la interfaz aplique el estado Pro
          window.location.href = "/"; 
          
        } catch (error) {
          console.error("Error al activar la licencia:", error);
        }
      }
    };

    activarLicencia();
  }, [user]);

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="logo-placeholder">🐷</div>
        <h1 className="welcome-title">Bienvenido a NutriPorc Pro</h1>
        <p className="welcome-subtitle">
          Ciencia nutricional al alcance del pequeño productor.
        </p>

        {/* --- PANEL CENTRALIZADO DE SUSCRIPCIÓN --- */}
        {user && (
          <div style={{ marginTop: '20px', marginBottom: '30px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0f172a' }}>
              Granja: {user.fincaNombre}
            </h3>
            <p style={{ margin: '0', color: '#64748b', fontSize: '0.95rem' }}>
              Nivel de acceso: <strong>{user.plan}</strong>
            </p>

            {/* BANNER DE UPGRADE (Desaparece automáticamente cuando son Pro) */}
            {user.plan !== 'Pro' && (
              <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fffbeb', border: '1px solid #f59e0b', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 10px 0', color: '#b45309', fontWeight: '600' }}>
                  🚀 Desbloquea IA y Formulación Avanzada
                </p>
                <button 
                  onClick={() => {
                    const stripeLink = "https://buy.stripe.com/test_7sY8wP14i67J4XyeUe7ss00";
                    window.location.href = `${stripeLink}?prefilled_email=${encodeURIComponent(user.email)}&client_reference_id=${user.fincaId}`;
                  }}
                  style={{ backgroundColor: '#f59e0b', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
                >
                  Adquirir Licencia Pro ($49/mes)
                </button>
              </div>
            )}

            {/* Mensaje de confirmación post-pago */}
            {mensajeExito && (
              <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                {mensajeExito}
              </div>
            )}
          </div>
        )}
        {/* --- FIN PANEL DE SUSCRIPCIÓN --- */}

        {/* --- TUS ALERTAS DEL MAXIMIZADOR --- */}
        {!loadingAlertas && alertasOptimas.length > 0 && (
          <div className="dashboard-alerts">
            <h3 className="alerts-title">Alertas de Rentabilidad</h3>
            {alertasOptimas.map(alerta => (
              <div key={alerta.loteId} className="alert-card verde-tierno" onClick={() => navigate('/maximizador')}>
                <div className="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div className="alert-content">
                  <strong>{alerta.loteNombre}</strong>
                  <span>
                    {alerta.diasRestantes === 0 
                      ? "¡Vender HOY!" 
                      : `Vender en ${alerta.diasRestantes} días`}
                  </span>
                  <span className="alert-profit">Margen: C${alerta.gananciaNeta.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}