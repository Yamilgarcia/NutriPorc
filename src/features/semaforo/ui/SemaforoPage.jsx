import { useState } from "react";
import { useSemaforo } from "../logic/useSemaforo";
import "./SemaforoPage.css";

export default function SemaforoPage() {
  const { lotesEvaluados, loading, handleAtenderAlerta, handleEditarAlerta, handleEliminarAlerta } = useSemaforo();
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [tratamientoData, setTratamientoData] = useState({ tipo: "Tratamiento", medicamento: "", notas: "" });

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
        notes: registro.notes || registro.notas // Soporte para ambos nombres de propiedad
      });
    } else {
      setEditandoId(null);
      setTratamientoData({ tipo: "Tratamiento", medicamento: "", notas: "" });
    }
    setModalOpen(true);
  };

  const handleDeleteRegistro = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este registro médico?")) {
      await handleEliminarAlerta(id);
    }
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
    <div className="semaforo-page" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <header className="module-header" style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "26px", color: "#1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
          Semáforo Epidemiológico 🚨
        </h2>
        <p style={{ color: "#64748b", margin: "4px 0 0 0" }}>Control de incidencias biológicas y monitoreo sanitario automático.</p>
      </header>

      {loading ? (
        <p className="status-text">Analizando datos sanitarios de la granja...</p>
      ) : (
        <div className="semaforo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
          {lotesEvaluados.map(lote => {
            const isOpen = !!historialesAbiertos[lote.id];
            const tieneHistorial = lote.historialMedico && lote.historialMedico.length > 0;
            
            // Contadores rápidos para los chips de resumen
            const totalTratamientos = lote.historialMedico?.filter(h => h.tipo === "Tratamiento").length || 0;
            const totalAislamientos = lote.historialMedico?.filter(h => h.tipo === "Aislamiento").length || 0;

            return (
              <div key={lote.id} className={`alerta-card ${lote.semaforo.toLowerCase()}`} style={{ height: "fit-content" }}>
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

                {/* BARRA DE CHIPS DE RESUMEN (Súper moderno) */}
                {tieneHistorial && (
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "0 20px", marginBottom: "10px" }}>
                    {totalTratamientos > 0 && <span style={{ fontSize: "11px", backgroundColor: "#fffbeb", color: "#b45309", padding: "3px 8px", borderRadius: "20px", fontWeight: "600" }}>💊 {totalTratamientos} Tratados</span>}
                    {totalAislamientos > 0 && <span style={{ fontSize: "11px", backgroundColor: "#eff6ff", color: "#1e40af", padding: "3px 8px", borderRadius: "20px", fontWeight: "600" }}>🚪 {totalAislamientos} Aislados</span>}
                  </div>
                )}

                {/* SECCIÓN DE LÍNEA DE TIEMPO EXPANDIBLE */}
                {tieneHistorial && (
                  <div style={{ padding: "0 20px" }}>
                    <button 
                      onClick={() => toggleHistorial(lote.id)}
                      style={{ width: "100%", padding: "10px", backgroundColor: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", fontWeight: "600", color: "#475569", transition: "background 0.2s" }}
                    >
                      <span>{isOpen ? "⬇️ Ocultar historial médico" : "➡️ Ver línea de tiempo médica"}</span>
                      <span style={{ backgroundColor: "#cbd5e1", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px" }}>
                        {lote.historialMedico.length}
                      </span>
                    </button>

                    {/* Contenedor Animado de la Línea de Tiempo */}
                    <div className={`timeline-container ${isOpen ? 'expanded' : 'collapsed'}`}>
                      <div style={{ padding: "15px 5px 5px 15px", borderLeft: "2px solid #cbd5e1", marginLeft: "10px", display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
                        {lote.historialMedico.map(registro => {
                          const esTratamiento = registro.tipo === "Tratamiento";
                          const esAislamiento = registro.tipo === "Aislamiento";
                          
                          // Color del nodo de la línea de tiempo según la gravedad
                          let colorNodo = "#64748b"; // Gris por defecto
                          if (esTratamiento) colorNodo = "#f59e0b"; // Amarillo/Naranja
                          if (esAislamiento) colorNodo = "#3b82f6"; // Azul

                          return (
                            <div key={registro.id} style={{ position: "relative" }}>
                              {/* Punto flotante de la línea de tiempo */}
                              <span style={{ position: "absolute", left: "-22px", top: "2px", width: "12px", height: "12px", borderRadius: "50%", backgroundColor: colorNodo, boxShadow: `0 0 0 4px white, 0 0 8px ${colorNodo}` }}></span>
                              
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600" }}>{registro.fecha}</span>
                                  <h4 style={{ margin: "2px 0", fontSize: "13px", color: "#334155" }}>{registro.tipo}</h4>
                                  <p style={{ margin: 0, color: "#64748b", fontSize: "12px", lineHeight: "1.4" }}>{registro.notas || registro.notes}</p>
                                  {registro.medicamento && registro.medicamento !== "N/A" && (
                                    <span style={{ display: "inline-block", marginTop: "4px", padding: "2px 6px", backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "4px", fontSize: "11px", fontWeight: "600" }}>
                                      💊 {registro.medicamento}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: "8px", marginLeft: "10px" }}>
                                  <button onClick={() => openModal(lote, registro)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px" }} title="Editar">✏️</button>
                                  <button onClick={() => handleDeleteRegistro(registro.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px" }} title="Eliminar">🗑️</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <div className="alerta-actions" style={{ marginTop: "15px", padding: "20px" }}>
                  <button className="btn-atender" onClick={() => openModal(lote)} style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px" }}>
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

      {/* MODAL COMPLETAMENTE CORREGIDO */}
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
    </div>
  );
}