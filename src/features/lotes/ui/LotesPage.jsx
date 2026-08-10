import { useState } from "react";
import { useLotes } from "../logic/useLotes";
import "./LotesPage.css";

export default function LotesPage() {
  const {
    lotes, loading, searchTerm, setSearchTerm, filterEstado, setFilterEstado, filterEtapa, setFilterEtapa,
    handleAdd, handleUpdate, handleArchivar, handleRegistrarBaja, handleRegistrarPesaje,
  } = useLotes();

  // Estados de los Modales Existentes
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEtapaModalOpen, setEtapaModalOpen] = useState(false);
  const [isBajaModalOpen, setBajaModalOpen] = useState(false);
  const [isCerrarModalOpen, setCerrarModalOpen] = useState(false);
  const [isPesajeModalOpen, setPesajeModalOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);

  // ==========================================
  // NUEVO: ESTADOS PARA EDICIÓN Y ALERTA BONITA
  // ==========================================
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editData, setEditData] = useState({ nombre: "", codigo: "" });
  const [alertaLote, setAlertaLote] = useState({ mostrar: false, exito: true, titulo: "", mensaje: "" });

  // Formularios de datos
  const [formData, setFormData] = useState({ nombre: "", codigo: "", fechaInicio: "", cantidad: "", raza: "", etapa: "Destete" });
  const [bajaData, setBajaData] = useState({ cantidad: "", causa: "", fecha: new Date().toISOString().split("T")[0] });
  const [cierreData, setCierreData] = useState({ pesoFinal: "", dietaAplicada: "", ingredientes: "" });
  const [pesajeData, setPesajeData] = useState({ peso: "", dieta: "", ingredientes: "", fecha: new Date().toISOString().split("T")[0] });
  const [nuevaEtapa, setNuevaEtapa] = useState("");

  // ==========================================
  // FUNCIONES DE EDICIÓN
  // ==========================================
  const openEditModal = (lote) => {
    setSelectedLote(lote);
    setEditData({ nombre: lote.nombre, codigo: lote.codigo || "" });
    setEditModalOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editData.nombre.trim()) {
      setAlertaLote({ mostrar: true, exito: false, titulo: "Error", mensaje: "El nombre del lote es obligatorio." });
      return;
    }

    await handleUpdate(selectedLote.id, {
      nombre: editData.nombre.trim(),
      codigo: editData.codigo.trim()
    });

    setEditModalOpen(false);
    setAlertaLote({
      mostrar: true,
      exito: true,
      titulo: "¡Lote Actualizado!",
      mensaje: `Los datos del lote "${editData.nombre.trim()}" han sido guardados correctamente.`
    });
  };

  // Funciones Existentes
  const handleOpenCreate = () => {
    setFormData({ nombre: "", codigo: "", fechaInicio: new Date().toISOString().split("T")[0], cantidad: "", raza: "", etapa: "Destete" });
    setCreateModalOpen(true);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return setAlertaLote({ mostrar: true, exito: false, titulo: "Datos Incompletos", mensaje: "El nombre del lote es obligatorio." });
    if (/\d/.test(formData.nombre)) return setAlertaLote({ mostrar: true, exito: false, titulo: "Formato Inválido", mensaje: "El nombre no debe contener números." });
    
    handleAdd({
      ...formData,
      nombre: formData.nombre.trim(),
      codigo: formData.codigo.trim(),
      raza: formData.raza.trim(),
      cantidad: parseInt(formData.cantidad, 10),
    });
    setCreateModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "¡Lote Creado!", mensaje: `El corral "${formData.nombre}" ha sido registrado en el sistema.` });
  };

  const openEtapaModal = (lote) => {
    setSelectedLote(lote);
    setNuevaEtapa(lote.etapa);
    setEtapaModalOpen(true);
  };

  const submitCambioEtapa = (e) => {
    e.preventDefault();
    if (nuevaEtapa === selectedLote.etapa) return;
    handleUpdate(selectedLote.id, { etapa: nuevaEtapa });
    setEtapaModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Etapa Actualizada", mensaje: `El lote ahora se encuentra en la etapa de ${nuevaEtapa}.` });
  };

  const openBajaModal = (lote) => {
    setSelectedLote(lote);
    setBajaData({ cantidad: "", causa: "", fecha: new Date().toISOString().split("T")[0] });
    setBajaModalOpen(true);
  };

  const submitBaja = (e) => {
    e.preventDefault();
    const cantidadBaja = parseInt(bajaData.cantidad, 10);
    if (!bajaData.fecha || isNaN(cantidadBaja) || cantidadBaja <= 0 || !bajaData.causa.trim()) {
      return setAlertaLote({ mostrar: true, exito: false, titulo: "Error", mensaje: "Verifica que todos los campos sean correctos." });
    }
    if (cantidadBaja > selectedLote.cantidad) {
      return setAlertaLote({ mostrar: true, exito: false, titulo: "Error de Inventario", mensaje: `No puedes reportar ${cantidadBaja} bajas si solo tienes ${selectedLote.cantidad} cerdos.` });
    }

    const cantidadRestante = selectedLote.cantidad - cantidadBaja;
    handleRegistrarBaja(selectedLote.id, selectedLote.bajas, { fecha: bajaData.fecha, cantidad: cantidadBaja, causa: bajaData.causa.trim() }, cantidadRestante);
    setBajaModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Baja Registrada", mensaje: "El inventario del corral ha sido actualizado." });
  };

  const handleArchivarClick = (lote) => {
    setSelectedLote(lote);
    setCierreData({ pesoFinal: "", dietaAplicada: "", ingredientes: "" });
    setCerrarModalOpen(true);
  };

  const submitCerrarLote = (e) => {
    e.preventDefault();
    if (!cierreData.dietaAplicada.trim()) return;

    let dias = Math.floor((new Date() - new Date(selectedLote.fechaInicio)) / (1000 * 60 * 60 * 24));
    if (dias <= 0) dias = 1;

    const datosDeCierre = {
      pesoFinal: parseFloat(cierreData.pesoFinal),
      dietaAplicada: cierreData.dietaAplicada.trim(),
      ingredientesClave: cierreData.ingredientes.split(",").map((i) => i.trim()).filter((i) => i !== ""),
      diasCiclo: dias,
    };

    handleArchivar(selectedLote.id, datosDeCierre);
    setCerrarModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Lote Finalizado", mensaje: "Los datos se enviaron a la Inteligencia Nutricional." });
  };

  const openPesajeModal = (lote) => {
    setSelectedLote(lote);
    setPesajeData({ peso: "", dieta: "", ingredientes: "", fecha: new Date().toISOString().split("T")[0] });
    setPesajeModalOpen(true);
  };

  const submitPesaje = (e) => {
    e.preventDefault();
    if (!pesajeData.dieta.trim()) return;

    const nuevoPesaje = {
      peso: parseFloat(pesajeData.peso),
      dieta: pesajeData.dieta.trim(),
      ingredientes: pesajeData.ingredientes.split(",").map((i) => i.trim()).filter((i) => i !== ""),
      fecha: pesajeData.fecha,
    };

    handleRegistrarPesaje(selectedLote.id, selectedLote.pesajes, nuevoPesaje);
    setPesajeModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Avance Guardado", mensaje: "El control de peso se registró con éxito." });
  };

  return (
    <div className="lotes-page">
      <header className="module-header">
        <h2>Gestión de Lotes</h2>
        <p>Control de etapas biológicas, inventario y mortalidad.</p>
      </header>
      
      <div className="control-panelLotes">
        <input type="text" placeholder="Buscar lote o código..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="sort-select">
          <option value="Todos">Todos los estados</option>
          <option value="Activo">Activos</option>
          <option value="Histórico">Históricos</option>
        </select>
        <select value={filterEtapa} onChange={(e) => setFilterEtapa(e.target.value)} className="sort-select">
          <option value="Todas">Todas las etapas</option>
          <option value="Destete">Destete</option>
          <option value="Desarrollo">Desarrollo</option>
          <option value="Engorde">Engorde</option>
          <option value="Reproducción">Reproducción</option>
          <option value="Gestación">Gestación</option>
          <option value="Lactancia">Lactancia</option>
        </select>
        <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={handleOpenCreate}>+ Nuevo Lote</button>
      </div>

      {loading ? (
        <p>Cargando base de datos...</p>
      ) : (
        <div className="lotes-grid">
          {lotes.map((lote) => (
            <div key={lote.id} className="lote-card">
              <span className={`card-badge ${lote.estado === "Activo" ? "badge-activo" : "badge-historico"}`}>
                {lote.estado}
              </span>
              <div className="card-header">
                <h3>{lote.nombre}</h3>
                <p className="card-subtitle">Cód: {lote.codigo || "N/A"}</p>
              </div>
              <div className="card-body">
                <div className="stat-row"><span className="stat-label">Población:</span><span className="stat-value">{lote.cantidad} cerdos</span></div>
                <div className="stat-row"><span className="stat-label">Etapa:</span><span className="etapa-badge">{lote.etapa}</span></div>
                <div className="stat-row"><span className="stat-label">Inicio:</span><span className="stat-value">{new Date(lote.fechaInicio).toLocaleDateString()}</span></div>
                <div className="stat-row">
                  <span className="stat-label">Mortalidad:</span>
                  <span className="stat-value" style={{ color: "#e53e3e" }}>
                    {lote.bajas?.length ? lote.bajas.reduce((acc, b) => acc + b.cantidad, 0) : 0}
                  </span>
                </div>
              </div>
              {lote.estado === "Activo" && (
                <div className="card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
                  {/* NUEVO BOTÓN DE EDITAR */}
                  <button className="btn-action" onClick={() => openEditModal(lote)}>✏️ Editar</button>
                  <button className="btn-action" onClick={() => openEtapaModal(lote)}>Cambiar Etapa</button>
                  <button className="btn-action" onClick={() => openBajaModal(lote)}>Reportar Baja</button>
                  <button className="btn-action" onClick={() => openPesajeModal(lote)}>Control Peso</button>
                  <button className="btn-action archivar" onClick={() => handleArchivarClick(lote)}>Cerrar Lote</button>
                </div>
              )}
            </div>
          ))}
          {lotes.length === 0 && (
            <p>No hay lotes que coincidan con los filtros.</p>
          )}
        </div>
      )}

      {/* NUEVO MODAL DE EDICIÓN */}
      {isEditModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Info: {selectedLote.nombre}</h3>
            <form onSubmit={submitEdit}>
              <div className="form-group">
                <label>Nombre del Lote</label>
                <input required className="form-input" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value.replace(/[0-9]/g, "")})} />
              </div>
              <div className="form-group">
                <label>Código Interno</label>
                <input className="form-input" maxLength={15} value={editData.codigo} onChange={e => setEditData({...editData, codigo: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEditModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Creación */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registrar Nuevo Lote</h3>
            <form onSubmit={submitCreate}>
              <div className="form-group"><label>Nombre del Lote</label><input required className="form-input" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value.replace(/[0-9]/g, "") })} /></div>
              <div className="form-group"><label>Código Interno</label><input className="form-input" maxLength={15} value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} /></div>
              <div className="form-group"><label>Fecha de Inicio</label><input required type="date" className="form-input" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} /></div>
              <div className="form-group"><label>Cantidad de Cerdos</label><input required type="number" min="1" className="form-input" value={formData.cantidad} onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })} /></div>
              <div className="form-group"><label>Raza (Opcional)</label><input className="form-input" value={formData.raza} onChange={(e) => setFormData({ ...formData, raza: e.target.value.replace(/[0-9]/g, "") })} /></div>
              <div className="form-group">
                <label>Etapa Biológica Inicial</label>
                <select className="form-input" value={formData.etapa} onChange={(e) => setFormData({ ...formData, etapa: e.target.value })}>
                  <option value="Destete">Destete</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Engorde">Engorde</option>
                  <option value="Reproducción">Reproducción</option>
                  <option value="Gestación">Gestación</option>
                  <option value="Lactancia">Lactancia</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Etapa */}
      {isEtapaModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cambiar Etapa: {selectedLote.nombre}</h3>
            <form onSubmit={submitCambioEtapa}>
              <div className="form-group">
                <label>Nueva Etapa Biológica</label>
                <select className="form-input" value={nuevaEtapa} onChange={(e) => setNuevaEtapa(e.target.value)}>
                  <option value="Destete">Destete</option><option value="Desarrollo">Desarrollo</option><option value="Engorde">Engorde</option><option value="Reproducción">Reproducción</option><option value="Gestación">Gestación</option><option value="Lactancia">Lactancia</option>
                </select>
                {nuevaEtapa !== selectedLote.etapa && (<div className="alert-dieta"><strong>¡Atención!</strong> Este cambio requiere ajuste en la dieta.</div>)}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEtapaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Baja */}
      {isBajaModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reportar Mortalidad: {selectedLote.nombre}</h3>
            <p style={{ marginBottom: "1rem" }}>Población actual: {selectedLote.cantidad} cerdos</p>
            <form onSubmit={submitBaja}>
              <div className="form-group"><label>Fecha de Baja</label><input required type="date" className="form-input" value={bajaData.fecha} onChange={(e) => setBajaData({ ...bajaData, fecha: e.target.value })} /></div>
              <div className="form-group"><label>Cantidad (Cerdos fallecidos)</label><input required type="number" min="1" max={selectedLote.cantidad} className="form-input" value={bajaData.cantidad} onChange={(e) => setBajaData({ ...bajaData, cantidad: e.target.value })} /></div>
              <div className="form-group"><label>Causa</label><input required className="form-input" placeholder="Ej. Neumonía..." value={bajaData.causa} onChange={(e) => setBajaData({ ...bajaData, causa: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setBajaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-danger">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Cierre de Lote */}
      {isCerrarModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cerrar Lote: {selectedLote.nombre}</h3>
            <p style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.9rem", lineHeight: "1.4" }}>
              Para enviar este lote al historial y alimentar la Inteligencia Nutricional, ingresa los datos finales de rendimiento.
            </p>
            <form onSubmit={submitCerrarLote}>
              <div className="form-group"><label>Peso Promedio Final (kg)</label><input required type="number" step="0.1" min="1" className="form-input" placeholder="Ej: 110" value={cierreData.pesoFinal} onChange={(e) => setCierreData({ ...cierreData, pesoFinal: e.target.value })} /></div>
              <div className="form-group"><label>Nombre de Dieta Principal</label><input required className="form-input" placeholder="Ej: Engorde Máximo" value={cierreData.dietaAplicada} onChange={(e) => setCierreData({ ...cierreData, dietaAplicada: e.target.value })} /></div>
              <div className="form-group"><label>Ingredientes Clave</label><input required className="form-input" placeholder="Ej: Sorgo, Harina de Soya, Aceite" value={cierreData.ingredientes} onChange={(e) => setCierreData({ ...cierreData, ingredientes: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setCerrarModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-danger">Archivar y Generar Analítica</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Control de Peso */}
      {isPesajeModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Control de Peso: {selectedLote.nombre}</h3>
            <p style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.9rem" }}>Registra el peso actual y la dieta para evaluar su rendimiento sin cerrar el lote.</p>
            <form onSubmit={submitPesaje}>
              <div className="form-group"><label>Fecha de Pesaje</label><input required type="date" className="form-input" value={pesajeData.fecha} onChange={(e) => setPesajeData({ ...pesajeData, fecha: e.target.value })} /></div>
              <div className="form-group"><label>Peso Promedio Actual (kg)</label><input required type="number" step="0.1" min="1" className="form-input" placeholder="Ej: 50" value={pesajeData.peso} onChange={(e) => setPesajeData({ ...pesajeData, peso: e.target.value })} /></div>
              <div className="form-group"><label>Dieta Aplicada</label><input required className="form-input" placeholder="Ej: Desarrollo Fase 1" value={pesajeData.dieta} onChange={(e) => setPesajeData({ ...pesajeData, dieta: e.target.value })} /></div>
              <div className="form-group"><label>Ingredientes Clave</label><input required className="form-input" placeholder="Ej: Maíz, Soya, Calcio" value={pesajeData.ingredientes} onChange={(e) => setPesajeData({ ...pesajeData, ingredientes: e.target.value })} /></div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setPesajeModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Registrar Avance</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* NUEVO MODAL DE ALERTA GENERAL (ESTILO PREMIUM) */}
      {/* ========================================== */}
      {alertaLote.mostrar && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '20px', maxWidth: '350px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            
            <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
              {alertaLote.exito ? '✅' : '⚠️'}
            </div>
            
            <h3 style={{ color: '#0f172a', margin: '0 0 10px 0', fontSize: '1.4rem' }}>{alertaLote.titulo}</h3>
            
            <p style={{ color: '#64748b', margin: '0 0 20px 0', whiteSpace: 'pre-line', fontSize: '0.95rem', lineHeight: '1.5' }}>
              {alertaLote.mensaje}
            </p>

            <button 
              onClick={() => setAlertaLote({ ...alertaLote, mostrar: false })}
              style={{ width: '100%', background: alertaLote.exito ? '#10b981' : '#f59e0b', color: 'white', padding: '14px', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: 'all 0.2s' }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}