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
                                    <button onClick={() => openModal(lote, registro)} title="Editar">✏️</button>
                                    <button onClick={() => handleDeleteRegistro(registro.id)} title="Eliminar">🗑️</button>
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
      </div>
    </ProPaywall>
  );
}