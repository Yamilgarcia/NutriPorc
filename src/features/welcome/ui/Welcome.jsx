import { useEffect, useState } from 'react';
import { useDashboardAlerts } from '../logic/useDashboardAlerts';
import { usePerfil } from '../logic/usePerfil';
import { useNavigate } from 'react-router-dom';

import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase.config'; 
import { useAuth } from '../../auth/logic/AuthContext'; 

import './Welcome.css';

export default function Welcome() {
  const { alertasOptimas, loadingAlertas } = useDashboardAlerts();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mensajeExito, setMensajeExito] = useState("");

  const { 
    isEditing, setIsEditing, 
    editData, setEditData, 
    estadisticas, datosFinca, loadingDatos,
    showDeleteModal, setShowDeleteModal, 
    isProcessing, handleUpdate, handleDelete 
  } = usePerfil();

  useEffect(() => {
    const activarLicencia = async () => {
      const pagoExitoso = localStorage.getItem("pago_pendiente_procesar");

      if (pagoExitoso && user?.fincaId) {
        try {
          const fincaRef = doc(db, "fincas", user.fincaId);
          await updateDoc(fincaRef, {
            estado_suscripcion: "activa",
            plan: "Pro"
          });

          const sesionGuardada = JSON.parse(localStorage.getItem("nutriporc_session"));
          if (sesionGuardada) {
            sesionGuardada.plan = "Pro";
            sesionGuardada.estado_suscripcion = "activa";
            localStorage.setItem("nutriporc_session", JSON.stringify(sesionGuardada));
          }

          localStorage.removeItem("pago_pendiente_procesar");
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
      <div className="welcome-content animate-fade-in">
        <div className="logo-placeholder">🐷</div>
        <h1 className="welcome-title">NutriPorc Pro</h1>
        <p className="welcome-subtitle">
          Ciencia nutricional y control analítico al alcance del productor real.
        </p>

        {/* --- PANEL DE CONFIGURACIÓN DE PERFIL --- */}
        {user && !loadingDatos && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h3>⚙️ Configuración del Perfil Productivo</h3>
              {!isEditing && (
                <button className="btn-edit-link" onClick={() => setIsEditing(true)}>
                  ✏️ Modificar
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="profile-edit-form">
                <div className="form-grid">
                  <div className="input-field">
                    <label>Nombre de la Unidad Productiva</label>
                    <input 
                      type="text" 
                      value={editData.nombre} 
                      onChange={(e) => setEditData({...editData, nombre: e.target.value})}
                    />
                  </div>
                  <div className="input-field">
                    <label>Nombre del Productor / Administrador</label>
                    <input 
                      type="text" 
                      value={editData.productor} 
                      placeholder="Ej. Raúl Álvarez Genes "
                      onChange={(e) => setEditData({...editData, productor: e.target.value})}
                    />
                  </div>
                  <div className="input-field">
                    <label>Ubicación Geográfica General</label>
                    <input 
                      type="text" 
                      value={editData.ubicacion} 
                      placeholder="Ej. Chontales, Nicaragua"
                      onChange={(e) => setEditData({...editData, ubicacion: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button className="btn-save-profile" onClick={handleUpdate} disabled={isProcessing}>
                    {isProcessing ? "Sincronizando..." : "Guardar Cambios"}
                  </button>
                  <button className="btn-cancel-profile" onClick={() => setIsEditing(false)}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-display-info">
                <div className="info-item"><span>Granja:</span> <strong>{datosFinca?.nombre || user.fincaNombre}</strong></div>
                <div className="info-item"><span>Productor:</span> <strong>{datosFinca?.productor || "No configurado"}</strong></div>
                <div className="info-item"><span>Ubicación:</span> <strong>{datosFinca?.ubicacion || "No configurada"}</strong></div>
                <div className="info-item"><span>Licencia de Acceso:</span> <span className={`badge-plan ${user.plan.toLowerCase()}`}>{user.plan}</span></div>
              </div>
            )}

            {/* --- PANEL DE RESUMEN ESTADÍSTICO GLOBAL (REQUERIMIENTO CRUD LEER) --- */}
            <div className="stats-dashboard-grid">
              <div className="stat-box-card">
                <span className="stat-number-display">{estadisticas.totalCerdos}</span>
                <span className="stat-label-display">Cerdos Activos</span>
              </div>
              <div className="stat-box-card">
                <span className="stat-number-display">{estadisticas.lotesHistoricos}</span>
                <span className="stat-label-display">Lotes Cerrados (Históricos)</span>
              </div>
            </div>

            {user.plan !== 'Pro' && (
              <div className="upgrade-premium-banner">
                <p>🚀 <strong>Desbloquea visión artificial y optimización lineal</strong></p>
                <button 
                  onClick={() => {
                    const stripeLink = "https://buy.stripe.com/test_7sY8wP14i67J4XyeUe7ss00";
                    window.location.href = `${stripeLink}?prefilled_email=${encodeURIComponent(user.email)}&client_reference_id=${user.fincaId}`;
                  }}
                  className="btn-upgrade-action"
                >
                  Adquirir Licencia Pro ($49/mes)
                </button>
              </div>
            )}

            {mensajeExito && <div className="success-banner-display">{mensajeExito}</div>}

            <div className="danger-zone-trigger">
              <button className="btn-danger-purge" onClick={() => setShowDeleteModal(true)}>
                Desactivar Cuenta y Purgar Datos de Firestore
              </button>
            </div>
          </div>
        )}

        {/* MODAL DE ELIMINACIÓN CRÍTICA */}
        {showDeleteModal && (
          <div className="critical-modal-overlay">
            <div className="critical-modal-box">
              <h3>⚠️ Acción de Seguridad Crítica</h3>
              <p>Estás a punto de ejecutar la purga completa de tu unidad productiva de los servidores de Firestore. Esta acción borrará lotes, pesajes y registros financieros de manera irreversible.</p>
              <div className="critical-actions">
                <button className="btn-confirm-purge" onClick={handleDelete} disabled={isProcessing}>
                  {isProcessing ? "Purgando..." : "Sí, purgar servidores"}
                </button>
                <button className="btn-cancel-purge" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* --- ALERTAS DEL MAXIMIZADOR --- */}
        {!loadingAlertas && alertasOptimas.length > 0 && (
          <div className="dashboard-alerts">
            <h3 className="alerts-title">Alertas de Rentabilidad en Tiempo Real</h3>
            {alertasOptimas.map(alerta => (
              <div key={alerta.loteId} className="alert-card verde-tierno" onClick={() => navigate('/maximizador')}>
                <div className="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div className="alert-content">
                  <strong>Lote: {alerta.loteNombre}</strong>
                  <span>{alerta.diasRestantes === 0 ? "¡Punto Óptimo Alcanzado Hoy!" : `Ventana óptima en ${alerta.diasRestantes} días`}</span>
                  <span className="alert-profit">Margen Estimado: C${alerta.gananciaNeta.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}