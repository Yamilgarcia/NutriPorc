import { useState } from "react";
import { useSemaforo } from "../logic/useSemaforo";
import "./SemaforoPage.css";

export default function SemaforoPage() {
  const { lotesEvaluados, loading, handleAtenderAlerta } = useSemaforo();
  const [loteSeleccionado, setLoteSeleccionado] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [tratamientoData, setTratamientoData] = useState({ tipo: "Tratamiento", medicamento: "", notas: "" });

  const openModal = (lote) => {
    setLoteSeleccionado(lote);
    setTratamientoData({ tipo: "Tratamiento", medicamento: "", notas: "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tratamientoData.notas.trim()) return alert("Debes agregar una nota o detalle.");
    
    await handleAtenderAlerta(
      loteSeleccionado.id, 
      tratamientoData.tipo, 
      tratamientoData.medicamento, 
      tratamientoData.notas
    );
    
    alert(`Acción registrada exitosamente para el lote ${loteSeleccionado.nombre}`);
    setModalOpen(false);
  };

  return (
    <div className="semaforo-page">
      <header className="module-header">
        <h2>Semáforo Epidemiológico 🚨</h2>
        <p>Sistema de alerta temprana basado en mortalidad y parámetros de crecimiento.</p>
      </header>

      {loading ? (
        <p>Analizando datos sanitarios de la granja...</p>
      ) : (
        <div className="semaforo-grid">
          {lotesEvaluados.map(lote => (
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
                <p className="recomendacion"><strong>Acción:</strong> {lote.accionRecomendada}</p>
              </div>

              {lote.semaforo !== "Verde" && (
                <div className="alerta-actions">
                  <button className="btn-atender" onClick={() => openModal(lote)}>
                    🏥 Gestionar Incidencia
                  </button>
                </div>
              )}
            </div>
          ))}

          {lotesEvaluados.length === 0 && (
            <p>No tienes lotes activos para evaluar en este momento.</p>
          )}
        </div>
      )}

      {/* MODAL DE GESTIÓN MÉDICA */}
      {modalOpen && loteSeleccionado && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Atender Alerta: {loteSeleccionado.nombre}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Tipo de Acción</label>
                <select className="form-input" value={tratamientoData.tipo} onChange={e => setTratamientoData({...tratamientoData, tipo: e.target.value})}>
                  <option value="Tratamiento">Iniciar Tratamiento Médico</option>
                  <option value="Falsa Alarma">Descartar (Falsa Alarma)</option>
                  <option value="Aislamiento">Aislamiento de Cerdos</option>
                </select>
              </div>

              {tratamientoData.tipo === "Tratamiento" && (
                <div className="form-group">
                  <label>Medicamento Aplicado (Opcional)</label>
                  <input className="form-input" placeholder="Ej. Enrofloxacina, Penicilina..." value={tratamientoData.medicamento} onChange={e => setTratamientoData({...tratamientoData, medicamento: e.target.value})} />
                </div>
              )}

              <div className="form-group">
                <label>Notas / Diagnóstico del Productor</label>
                <textarea required className="form-input" rows="3" placeholder="Describe los síntomas observados o la razón del descarte..." value={tratamientoData.notas} onChange={e => setTratamientoData({...tratamientoData, notas: e.target.value})}></textarea>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar en Historial</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}