import { useState } from "react";
import { useLotes } from "../logic/useLotes";
import { useInsumos } from "../../insumos/logic/useInsumos"; // <-- NUEVO: Importamos los insumos
import "./LotesPage.css";

export default function LotesPage() {
  const {
    lotes, loading: loadingLotes, searchTerm, setSearchTerm, filterEstado, setFilterEstado, filterEtapa, setFilterEtapa,
    handleAdd, handleUpdate, handleArchivar, handleRegistrarBaja, handleRegistrarPesaje,
  } = useLotes();

  // NUEVO: Traemos el catálogo de insumos de la granja
  const { insumos } = useInsumos();

  // Estados de los Modales
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEtapaModalOpen, setEtapaModalOpen] = useState(false);
  const [isBajaModalOpen, setBajaModalOpen] = useState(false);
  const [isCerrarModalOpen, setCerrarModalOpen] = useState(false);
  const [isPesajeModalOpen, setPesajeModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [alertaLote, setAlertaLote] = useState({ mostrar: false, exito: true, titulo: "", mensaje: "" });

  // Formularios de datos (Nota: ingredientes ahora es un Array [])
  const [formData, setFormData] = useState({ nombre: "", codigo: "", fechaInicio: "", cantidad: "", raza: "", etapa: "Destete" });
  const [bajaData, setBajaData] = useState({ cantidad: "", causa: "", fecha: new Date().toISOString().split("T")[0] });
  const [cierreData, setCierreData] = useState({ pesoFinal: "", dietaAplicada: "", ingredientes: [] });
  const [pesajeData, setPesajeData] = useState({ peso: "", dieta: "", ingredientes: [], fecha: new Date().toISOString().split("T")[0] });
  const [nuevaEtapa, setNuevaEtapa] = useState("");
  const [editData, setEditData] = useState({ nombre: "", codigo: "" });

  // NUEVO: Función para alternar selección de ingredientes (Checkboxes visuales)
  const toggleIngrediente = (nombreInsumo, dataState, setDataState) => {
    const seleccionados = dataState.ingredientes;
    if (seleccionados.includes(nombreInsumo)) {
      setDataState({ ...dataState, ingredientes: seleccionados.filter(i => i !== nombreInsumo) });
    } else {
      setDataState({ ...dataState, ingredientes: [...seleccionados, nombreInsumo] });
    }
  };

  const openEditModal = (lote) => {
    setSelectedLote(lote);
    setEditData({ nombre: lote.nombre, codigo: lote.codigo || "" });
    setEditModalOpen(true);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    if (!editData.nombre.trim()) return setAlertaLote({ mostrar: true, exito: false, titulo: "Error", mensaje: "El nombre es obligatorio." });
    await handleUpdate(selectedLote.id, { nombre: editData.nombre.trim(), codigo: editData.codigo.trim() });
    setEditModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "¡Lote Actualizado!", mensaje: `Datos guardados.` });
  };

  const handleOpenCreate = () => {
    setFormData({ nombre: "", codigo: "", fechaInicio: new Date().toISOString().split("T")[0], cantidad: "", raza: "", etapa: "Destete" });
    setCreateModalOpen(true);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) return setAlertaLote({ mostrar: true, exito: false, titulo: "Error", mensaje: "Nombre obligatorio." });
    handleAdd({ ...formData, nombre: formData.nombre.trim(), codigo: formData.codigo.trim(), cantidad: parseInt(formData.cantidad, 10) });
    setCreateModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "¡Lote Creado!", mensaje: `El corral "${formData.nombre}" ha sido registrado.` });
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
    setAlertaLote({ mostrar: true, exito: true, titulo: "Etapa Actualizada", mensaje: `Nueva etapa: ${nuevaEtapa}.` });
  };

  const openBajaModal = (lote) => {
    setSelectedLote(lote);
    setBajaData({ cantidad: "", causa: "", fecha: new Date().toISOString().split("T")[0] });
    setBajaModalOpen(true);
  };

  const submitBaja = (e) => {
    e.preventDefault();
    const cant = parseInt(bajaData.cantidad, 10);
    if (cant > selectedLote.cantidad) return setAlertaLote({ mostrar: true, exito: false, titulo: "Error", mensaje: "Supera el inventario." });
    handleRegistrarBaja(selectedLote.id, selectedLote.bajas, { fecha: bajaData.fecha, cantidad: cant, causa: bajaData.causa }, selectedLote.cantidad - cant);
    setBajaModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Baja Registrada", mensaje: "Inventario actualizado." });
  };

  const handleArchivarClick = (lote) => {
    setSelectedLote(lote);
    setCierreData({ pesoFinal: "", dietaAplicada: "", ingredientes: [] });
    setCerrarModalOpen(true);
  };

  const submitCerrarLote = (e) => {
    e.preventDefault();
    let dias = Math.floor((new Date() - new Date(selectedLote.fechaInicio)) / (1000 * 60 * 60 * 24));
    handleArchivar(selectedLote.id, {
      pesoFinal: parseFloat(cierreData.pesoFinal),
      dietaAplicada: cierreData.dietaAplicada.trim(),
      ingredientesClave: cierreData.ingredientes, // Ya es un array limpio
      diasCiclo: dias <= 0 ? 1 : dias,
    });
    setCerrarModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Lote Finalizado", mensaje: "Datos enviados a la Inteligencia Nutricional." });
  };

  const openPesajeModal = (lote) => {
    setSelectedLote(lote);
    setPesajeData({ peso: "", dieta: "", ingredientes: [], fecha: new Date().toISOString().split("T")[0] });
    setPesajeModalOpen(true);
  };

  const submitPesaje = (e) => {
    e.preventDefault();
    handleRegistrarPesaje(selectedLote.id, selectedLote.pesajes, {
      peso: parseFloat(pesajeData.peso),
      dieta: pesajeData.dieta.trim(),
      ingredientes: pesajeData.ingredientes, // Ya es un array limpio
      fecha: pesajeData.fecha,
    });
    setPesajeModalOpen(false);
    setAlertaLote({ mostrar: true, exito: true, titulo: "Avance Guardado", mensaje: "Control registrado." });
  };

  return (
    <div className="lotes-page">
      <header className="module-header">
        <h2>Gestión de Lotes</h2>
        <p>Control de etapas biológicas, inventario y mortalidad.</p>
      </header>
      
      <div className="control-panelLotes">
        <input type="text" placeholder="Buscar lote..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
        <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="sort-select">
          <option value="Todos">Todos</option><option value="Activo">Activos</option><option value="Histórico">Históricos</option>
        </select>
        <select value={filterEtapa} onChange={(e) => setFilterEtapa(e.target.value)} className="sort-select">
          <option value="Todas">Todas las etapas</option><option value="Destete">Destete</option><option value="Desarrollo">Desarrollo</option><option value="Engorde">Engorde</option>
        </select>
        <button className="btn-primary" style={{ marginLeft: "auto" }} onClick={handleOpenCreate}>+ Nuevo Lote</button>
      </div>

      {loadingLotes ? <p>Cargando...</p> : (
        <div className="lotes-grid">
          {lotes.map((lote) => (
            <div key={lote.id} className="lote-card">
              <span className={`card-badge ${lote.estado === "Activo" ? "badge-activo" : "badge-historico"}`}>{lote.estado}</span>
              <div className="card-header">
                <h3>{lote.nombre}</h3><p className="card-subtitle">Cód: {lote.codigo || "N/A"}</p>
              </div>
              <div className="card-body">
                <div className="stat-row"><span className="stat-label">Población:</span><span className="stat-value">{lote.cantidad} cerdos</span></div>
                <div className="stat-row"><span className="stat-label">Etapa:</span><span className="etapa-badge">{lote.etapa}</span></div>
                <div className="stat-row"><span className="stat-label">Mortalidad:</span><span className="stat-value" style={{ color: "#e53e3e" }}>{lote.bajas?.length ? lote.bajas.reduce((acc, b) => acc + b.cantidad, 0) : 0}</span></div>
              </div>
              {lote.estado === "Activo" && (
                <div className="card-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' }}>
                  <button className="btn-action" onClick={() => openEditModal(lote)}>Editar</button>
                  <button className="btn-action" onClick={() => openEtapaModal(lote)}>Etapa</button>
                  <button className="btn-action" onClick={() => openBajaModal(lote)}>Mortalidad</button>
                  <button className="btn-action" onClick={() => openPesajeModal(lote)}>Peso</button>
                  <button className="btn-action archivar" onClick={() => handleArchivarClick(lote)}>Cerrar</button>
                </div>
              )}
            </div>
          ))}
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

      {/* MODAL CIERRE LOTE (ACTUALIZADO) */}
      {isCerrarModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cerrar Lote: {selectedLote.nombre}</h3>
            <form onSubmit={submitCerrarLote}>
              <div className="form-group"><label>Peso Promedio Final (kg)</label><input required type="number" step="0.1" className="form-input" value={cierreData.pesoFinal} onChange={(e) => setCierreData({ ...cierreData, pesoFinal: e.target.value })} /></div>
              <div className="form-group"><label>Nombre de Dieta Principal</label><input required className="form-input" value={cierreData.dietaAplicada} onChange={(e) => setCierreData({ ...cierreData, dietaAplicada: e.target.value })} /></div>
              
              <div className="form-group">
                <label>Ingredientes Utilizados (Selecciona de tu inventario)</label>
                <div className="ingredientes-selector">
                  {insumos.map(ins => (
                    <div 
                      key={ins.id} 
                      className={`ingrediente-chip ${cierreData.ingredientes.includes(ins.nombre) ? 'chip-active' : ''}`}
                      onClick={() => toggleIngrediente(ins.nombre, cierreData, setCierreData)}
                    >
                      {ins.nombre}
                    </div>
                  ))}
                  {insumos.length === 0 && <p style={{fontSize: '0.8rem', color: 'red'}}>No tienes insumos en tu biblioteca.</p>}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setCerrarModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-danger" disabled={cierreData.ingredientes.length === 0}>Archivar Lote</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PESAJE (ACTUALIZADO) */}
      {isPesajeModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Control de Peso: {selectedLote.nombre}</h3>
            <form onSubmit={submitPesaje}>
              <div className="form-group"><label>Fecha</label><input required type="date" className="form-input" value={pesajeData.fecha} onChange={(e) => setPesajeData({ ...pesajeData, fecha: e.target.value })} /></div>
              <div className="form-group"><label>Peso Actual (kg)</label><input required type="number" step="0.1" className="form-input" value={pesajeData.peso} onChange={(e) => setPesajeData({ ...pesajeData, peso: e.target.value })} /></div>
              <div className="form-group"><label>Dieta Aplicada</label><input required className="form-input" value={pesajeData.dieta} onChange={(e) => setPesajeData({ ...pesajeData, dieta: e.target.value })} /></div>
              
              <div className="form-group">
                <label>Ingredientes de esta Dieta</label>
                <div className="ingredientes-selector">
                  {insumos.map(ins => (
                    <div 
                      key={ins.id} 
                      className={`ingrediente-chip ${pesajeData.ingredientes.includes(ins.nombre) ? 'chip-active' : ''}`}
                      onClick={() => toggleIngrediente(ins.nombre, pesajeData, setPesajeData)}
                    >
                      {ins.nombre}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setPesajeModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={pesajeData.ingredientes.length === 0}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ALERTA */}
      {alertaLote.mostrar && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem' }}>{alertaLote.exito ? '✅' : '⚠️'}</div>
            <h3>{alertaLote.titulo}</h3><p>{alertaLote.mensaje}</p>
            <button onClick={() => setAlertaLote({ ...alertaLote, mostrar: false })} className="btn-primary" style={{ width: '100%' }}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
}