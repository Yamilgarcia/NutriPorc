import { useEffect, useState } from "react";
import { useDashboardAlerts } from "../logic/useDashboardAlerts";
import { usePerfil } from "../logic/usePerfil";
import { useNavigate } from "react-router-dom";

import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../firebase.config";
import { useAuth } from "../../auth/logic/AuthContext";
import logoNutriporc from "../../../../public/icons/icon-192.png";
import "./Welcome.css";

export default function Welcome() {
  const { alertasOptimas, loadingAlertas } = useDashboardAlerts();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mensajeExito, setMensajeExito] = useState("");

  const {
    isEditing,
    setIsEditing,
    editData,
    setEditData,
    estadisticas,
    datosFinca,
    loadingDatos,
    showDeleteModal,
    setShowDeleteModal,
    isProcessing,
    handleUpdate,
    handleDelete,
  } = usePerfil();

  useEffect(() => {
    const activarLicencia = async () => {
      const pagoExitoso = localStorage.getItem("pago_pendiente_procesar");

      if (pagoExitoso && user?.fincaId) {
        try {
          const fincaRef = doc(db, "fincas", user.fincaId);
          await updateDoc(fincaRef, {
            estado_suscripcion: "activa",
            plan: "Pro",
          });

          const sesionGuardada = JSON.parse(
            localStorage.getItem("nutriporc_session"),
          );
          if (sesionGuardada) {
            sesionGuardada.plan = "Pro";
            sesionGuardada.estado_suscripcion = "activa";
            localStorage.setItem(
              "nutriporc_session",
              JSON.stringify(sesionGuardada),
            );
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
        {/* ENCABEZADO DE MARCA */}
        <div className="brand-header">
          {/* Aquí puedes reemplazar el div por <img src="/ruta/al/logo.png" /> cuando lo exportes */}
          <div className="logo-wrapper">
            <img
              src={logoNutriporc}
              alt="Logo NutriPorc"
              className="logo-img"
            />
          </div>

          <p className="welcome-subtitle">
            Ciencia nutricional y control analítico al alcance del productor
            real.
          </p>
        </div>

        {/* PANEL DE CONFIGURACIÓN DE PERFIL */}
        {user && !loadingDatos && (
          <div className="profile-card">
            <div className="profile-card-header">
              <h3>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Perfil Productivo
              </h3>
              {!isEditing && (
                <button
                  className="btn-edit-link"
                  onClick={() => setIsEditing(true)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Modificar
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="profile-edit-form animate-fade-in">
                <div className="form-grid">
                  <div className="input-field">
                    <label>Nombre de la Granja</label>
                    <input
                      type="text"
                      value={editData.nombre}
                      onChange={(e) =>
                        setEditData({ ...editData, nombre: e.target.value })
                      }
                    />
                  </div>
                  <div className="input-field">
                    <label>Productor / Administrador</label>
                    <input
                      type="text"
                      value={editData.productor}
                      placeholder="Ej. Raúl Álvarez"
                      onChange={(e) =>
                        setEditData({ ...editData, productor: e.target.value })
                      }
                    />
                  </div>
                  <div className="input-field">
                    <label>Ubicación Geográfica</label>
                    <input
                      type="text"
                      value={editData.ubicacion}
                      placeholder="Ej. Chontales, Nicaragua"
                      onChange={(e) =>
                        setEditData({ ...editData, ubicacion: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    className="btn-cancel-profile"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-save-profile"
                    onClick={handleUpdate}
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Sincronizando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-display-info">
                <div className="info-group">
                  <span className="info-label">Unidad Productiva</span>
                  <span className="info-value">
                    {datosFinca?.nombre || user.fincaNombre}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Administrador</span>
                  <span className="info-value">
                    {datosFinca?.productor || "No configurado"}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Ubicación</span>
                  <span className="info-value">
                    {datosFinca?.ubicacion || "No configurada"}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Licencia de Acceso</span>
                  <div>
                    <span className={`badge-plan ${user.plan.toLowerCase()}`}>
                      {user.plan}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* PANEL DE RESUMEN ESTADÍSTICO */}
            <div className="stats-dashboard-grid">
              <div className="stat-box-card">
                <span className="stat-number-display">
                  {estadisticas.totalCerdos}
                </span>
                <span className="stat-label-display">Cerdos Activos</span>
              </div>
              <div className="stat-box-card">
                <span className="stat-number-display">
                  {estadisticas.lotesHistoricos}
                </span>
                <span className="stat-label-display">
                  Lotes Cerrados (Históricos)
                </span>
              </div>
            </div>

            {user.plan !== "Pro" && (
              <div className="upgrade-premium-banner animate-fade-in">
                <div>
                  <p>
                    🚀 <strong>Desbloquea todo el potencial productivo</strong>
                  </p>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "#524A29",
                      marginTop: "4px",
                    }}
                  >
                    Habilita visión artificial y optimización lineal de
                    recursos.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const stripeLink =
                      "https://buy.stripe.com/test_7sY8wP14i67J4XyeUe7ss00";
                    window.location.href = `${stripeLink}?prefilled_email=${encodeURIComponent(user.email)}&client_reference_id=${user.fincaId}`;
                  }}
                  className="btn-upgrade-action"
                >
                  Adquirir Licencia Pro
                </button>
              </div>
            )}

            {mensajeExito && (
              <div className="success-banner-display">{mensajeExito}</div>
            )}

            <div className="danger-zone-trigger">
              <button
                className="btn-danger-purge"
                onClick={() => setShowDeleteModal(true)}
              >
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
              <p
                style={{
                  color: "var(--np-text-muted)",
                  lineHeight: "1.5",
                  marginBottom: "1.5rem",
                }}
              >
                Estás a punto de ejecutar la purga completa de tu unidad
                productiva de los servidores de Firestore. Esta acción borrará
                lotes, pesajes y registros financieros de manera{" "}
                <strong>irreversible</strong>.
              </p>
              <div className="critical-actions">
                <button
                  className="btn-cancel-purge"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="btn-confirm-purge"
                  onClick={handleDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Purgando..." : "Sí, purgar servidores"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ALERTAS DEL MAXIMIZADOR */}
        {!loadingAlertas && alertasOptimas.length > 0 && (
          <div className="dashboard-alerts">
            <h3
              className="alerts-title"
              style={{
                color: "var(--np-text-dark)",
                marginBottom: "1rem",
                marginTop: "2rem",
              }}
            >
              Alertas de Rentabilidad en Tiempo Real
            </h3>
            {alertasOptimas.map((alerta) => (
              <div
                key={alerta.loteId}
                className="alert-card"
                onClick={() => navigate("/maximizador")}
                style={{
                  background: "white",
                  border: "1px solid var(--np-green)",
                  borderLeft: "4px solid var(--np-green)",
                  borderRadius: "12px",
                  padding: "1.2rem",
                  marginBottom: "1rem",
                  display: "flex",
                  gap: "1rem",
                  cursor: "pointer",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <div
                  className="alert-icon"
                  style={{
                    color: "var(--np-green)",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div
                  className="alert-content"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <strong style={{ color: "var(--np-text-dark)" }}>
                    Lote: {alerta.loteNombre}
                  </strong>
                  <span
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--np-text-muted)",
                    }}
                  >
                    {alerta.diasRestantes === 0
                      ? "¡Punto Óptimo Alcanzado Hoy!"
                      : `Ventana óptima en ${alerta.diasRestantes} días`}
                  </span>
                  <span
                    className="alert-profit"
                    style={{ color: "var(--np-green)", fontWeight: "bold" }}
                  >
                    Margen Estimado: C${alerta.gananciaNeta.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
