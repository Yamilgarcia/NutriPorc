import { useState } from "react";
import { useSemaforo } from "../logic/useSemaforo";
import ProPaywall from "../../../components/ProPaywall";
import "./SemaforoPage.css";

export default function SemaforoPage() {
  const { lotesEvaluados, loading, handleAtenderAlerta, handleEditarAlerta, handleEliminarAlerta } = useSemaforo();
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [tratamientoData, setTratamientoData] = useState({ tipo: "Tratamiento", medicamento: "", notas: "" });
const [alertaEliminar, setAlertaEliminar] = useState({ mostrar: false, id: null });
  // Estado para controlar qué tarjetas tienen su historial médico desplegado
  const [historialesAbiertos, setHistorialesAbiertos] = useState({});

  const toggleHistorial = (loteId) => {
    setHistorialesAbiertos(prev => ({
      ...prev,
      [loteId]: !prev[loteId]
    }));
  };

  const openModal = (lote, registro = null) => {
    setLoteSeleccionado(lote);
    if (registro) {
      setEditandoId(registro.id);
      setTratamientoData({
        tipo: registro.tipo,
        medicamento: registro.medicamento !== "N/A" ? registro.medicamento : "",
        notes: registro.notes || registro.notas 
      });
    } else {
      setEditandoId(null);
      setTratamientoData({ tipo: "Tratamiento", medicamento: "", notas: "" });
    }
    setModalOpen(true);
  };

 // 1. Solo abre el modal y guarda qué ID queremos borrar
  const handleDeleteRegistro = (id) => {
    setAlertaEliminar({ mostrar: true, id: id });
  };

  // 2. Ejecuta la eliminación real en la base de datos
  const confirmarEliminacion = async () => {
    if (alertaEliminar.id) {
      await handleEliminarAlerta(alertaEliminar.id);
    }
    setAlertaEliminar({ mostrar: false, id: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const notasTexto = tratamientoData.notas || tratamientoData.notes;
    if (!notasTexto?.trim()) return alert("Debes agregar una nota o detalle.");
    setIsSubmitting(true);
    
    if (editandoId) {
      await handleEditarAlerta(editandoId, tratamientoData.tipo, tratamientoData.medicamento, notasTexto);
    } else {
      await handleAtenderAlerta(loteSeleccionado.id, tratamientoData.tipo, tratamientoData.medicamento, notasTexto);
    }
    
    setModalOpen(false);
    setIsSubmitting(false);
  };

  return (
    <ProPaywall 
      tituloFeature="Semáforo Epidemiológico 🚨" 
      descripcion="Anticípate a los brotes de enfermedades. El sistema Pro analiza la mortalidad de tus corrales en tiempo real y te alerta antes de que sea crítico."
    >
      <div className="semaforo-page">
        <header className="module-header">
          <h2 className="semaforo-main-title">
            Semáforo Epidemiológico 🚨
          </h2>
          <p className="semaforo-subtitle">Control de incidencias biológicas y monitoreo sanitario automático.</p>
        </header>

        {loading ? (
          <p className="status-text">Analizando datos sanitarios de la granja...</p>
        ) : (
          <div className="semaforo-grid">
            {lotesEvaluados.map(lote => {
              const isOpen = !!historialesAbiertos[lote.id];
              const tieneHistorial = lote.historialMedico && lote.historialMedico.length > 0;
              
              // Contadores rápidos para los chips de resumen
              const totalTratamientos = lote.historialMedico?.filter(h => h.tipo === "Tratamiento").length || 0;
              const totalAislamientos = lote.historialMedico?.filter(h => h.tipo === "Aislamiento").length || 0;

              return (
                <div key={lote.id} className={`alerta-card ${lote.semaforo.toLowerCase()}`}>
                  <div className="alerta-header">
                    <div className="alerta-title">
                      <span className="luz-indicadora"></span>
                      <h3>{lote.nombre}</h3>
                    </div>
                    <span className="poblacion-badge">{lote.cantidad} cerdos</span>
                  </div>
                  
                  <div className="alerta-body">
                    <p className="diagnostico"><strong>Diagnóstico:</strong> {lote.diagnostico}</p>
                    <p className="recomendacion"><strong>Acción sugerida:</strong> {lote.accionRecomendada}</p>
                  </div>

                  {/* BARRA DE CHIPS DE RESUMEN */}
                  {tieneHistorial && (
                    <div className="chips-container">
                      {totalTratamientos > 0 && <span className="chip chip-tratamiento">💊 {totalTratamientos} Tratados</span>}
                      {totalAislamientos > 0 && <span className="chip chip-aislamiento">🚪 {totalAislamientos} Aislados</span>}
                    </div>
                  )}

                  {/* SECCIÓN DE LÍNEA DE TIEMPO EXPANDIBLE */}
                  {tieneHistorial && (
                    <div className="historial-section">
                      <button 
                        className="btn-toggle-historial"
                        onClick={() => toggleHistorial(lote.id)}
                      >
                        <span>{isOpen ? "⬇️ Ocultar historial médico" : "➡️ Ver línea de tiempo médica"}</span>
                        <span className="historial-counter">
                          {lote.historialMedico.length}
                        </span>
                      </button>

                      {/* Contenedor Animado de la Línea de Tiempo */}
                      <div className={`timeline-container ${isOpen ? 'expanded' : 'collapsed'}`}>
                        <div className="timeline-track">
                          {lote.historialMedico.map(registro => {
                            const esTratamiento = registro.tipo === "Tratamiento";
                            const esAislamiento = registro.tipo === "Aislamiento";
                            
                            // Color del nodo de la línea de tiempo según la gravedad
                            let colorNodo = "#64748b"; // Gris por defecto
                            if (esTratamiento) colorNodo = "#f59e0b"; // Amarillo/Naranja
                            if (esAislamiento) colorNodo = "#3b82f6"; // Azul

                            return (
                              <div key={registro.id} className="timeline-item">
                                {/* Punto flotante de la línea de tiempo */}
                                <span 
                                  className="timeline-dot" 
                                  style={{ backgroundColor: colorNodo, boxShadow: `0 0 0 4px white, 0 0 8px ${colorNodo}` }}
                                ></span>
                                
                                <div className="timeline-content">
                                  <div className="timeline-info">
                                    <span className="timeline-date">{registro.fecha}</span>
                                    <h4 className="timeline-type">{registro.tipo}</h4>
                                    <p className="timeline-notes">{registro.notas || registro.notes}</p>
                                    {registro.medicamento && registro.medicamento !== "N/A" && (
                                      <span className="timeline-medication">
                                        💊 {registro.medicamento}
                                      </span>
                                    )}
                                  </div>
                                  <div className="timeline-actions">
                                    <button className="btn-timeline-action" onClick={() => openModal(lote, registro)} title="Editar">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                      Editar
                                    </button>
                                    <button className="btn-timeline-action danger" onClick={() => handleDeleteRegistro(registro.id)} title="Eliminar">
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="alerta-actions">
                    <button className="btn-atender" onClick={() => openModal(lote)}>
                      🏥 Registrar Incidencia Médica
                    </button>
                  </div>
                </div>
              );
            })}

            {lotesEvaluados.length === 0 && (
              <p className="status-text">No tienes lotes activos para evaluar en este momento.</p>
            )}
          </div>
        )}

        {/* MODAL */}
        {modalOpen && loteSeleccionado && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editandoId ? "✏️ Editar Incidencia Médica" : `🏥 Registrar Incidencia: ${loteSeleccionado.nombre}`}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Tipo de Acción</label>
                  <select 
                    className="form-input" 
                    value={tratamientoData.tipo} 
                    onChange={e => setTratamientoData({...tratamientoData, tipo: e.target.value})}
                    disabled={isSubmitting}
                  >
                    <option value="Tratamiento">Iniciar Tratamiento Médico</option>
                    <option value="Falsa Alarma">Descartar (Falsa Alarma)</option>
                    <option value="Aislamiento">Aislamiento de Cerdos</option>
                  </select>
                </div>

                {tratamientoData.tipo === "Tratamiento" && (
                  <div className="form-group">
                    <label>Medicamento Aplicado (Opcional)</label>
                    <input 
                      className="form-input" 
                      placeholder="Ej. Enrofloxacina, Penicilina..." 
                      value={tratamientoData.medicamento} 
                      onChange={e => setTratamientoData({...tratamientoData, medicamento: e.target.value})}
                      disabled={isSubmitting}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label>Notas / Diagnóstico del Productor</label>
                  <textarea 
                    required 
                    className="form-input" 
                    rows="3" 
                    placeholder="Describe los síntomas observados..." 
                    value={tratamientoData.notas || tratamientoData.notes || ""} 
                    onChange={e => setTratamientoData({...tratamientoData, notas: e.target.value, notes: e.target.value})}
                    disabled={isSubmitting}
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : (editandoId ? "Actualizar Registro" : "Guardar en Historial")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}


        {/* MODAL PERSONALIZADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
        {alertaEliminar.mostrar && (
          <div className="modal-overlay" style={{ zIndex: 9999, backdropFilter: "blur(4px)" }}>
            <div className="modal-content" style={{ textAlign: "center", maxWidth: "350px", borderRadius: "20px" }}>
              
              <div style={{ fontSize: "3.5rem", marginBottom: "15px" }}>⚠️</div>
              
              <h3 style={{ color: "#0f172a", marginBottom: "10px", fontSize: "1.3rem" }}>
                Confirmar Eliminación
              </h3>
              
              <p style={{ color: "#64748b", margin: "0 0 25px 0", fontSize: "0.95rem", lineHeight: "1.5" }}>
                ¿Estás seguro que deseas eliminar este registro médico? Esta acción no se puede deshacer y afectará el historial sanitario del corral.
              </p>
              
              <div className="modal-actions" style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button 
                  type="button"
                  className="btn-cancel" 
                  onClick={() => setAlertaEliminar({ mostrar: false, id: null })}
                  style={{ flex: 1, padding: "12px", borderRadius: "10px", fontWeight: "bold" }}
                >
                  Cancelar
                </button>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={confirmarEliminacion}
                  style={{ flex: 1, backgroundColor: "#ef4444", borderColor: "#ef4444", padding: "12px", borderRadius: "10px", fontWeight: "bold" }}
                >
                  Sí, eliminar
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </ProPaywall>
  );
}