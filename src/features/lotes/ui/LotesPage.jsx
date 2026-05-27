import { useState } from "react";
import { useLotes } from "../logic/useLotes";
import "./LotesPage.css";

export default function LotesPage() {
  const {
    lotes, loading,
    searchTerm, setSearchTerm,
    filterEstado, setFilterEstado,
    filterEtapa, setFilterEtapa,
    handleAdd, handleUpdate, handleArchivar, handleRegistrarBaja
  } = useLotes();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isEtapaModalOpen, setEtapaModalOpen] = useState(false);
  const [isBajaModalOpen, setBajaModalOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "", codigo: "", fechaInicio: "", cantidad: "", raza: "", etapa: "Destete"
  });

  const [bajaData, setBajaData] = useState({
    cantidad: "", causa: "", fecha: new Date().toISOString().split('T')[0]
  });

  const [nuevaEtapa, setNuevaEtapa] = useState("");

  const handleOpenCreate = () => {
    setFormData({ nombre: "", codigo: "", fechaInicio: new Date().toISOString().split('T')[0], cantidad: "", raza: "", etapa: "Destete" });
    setCreateModalOpen(true);
  };

  const submitCreate = (e) => {
    e.preventDefault();
    handleAdd({
      ...formData,
      cantidad: parseInt(formData.cantidad, 10)
    });
    setCreateModalOpen(false);
  };

  const openEtapaModal = (lote) => {
    setSelectedLote(lote);
    setNuevaEtapa(lote.etapa);
    setEtapaModalOpen(true);
  };

  const submitCambioEtapa = (e) => {
    e.preventDefault();
    handleUpdate(selectedLote.id, { etapa: nuevaEtapa });
    setEtapaModalOpen(false);
  };

  const openBajaModal = (lote) => {
    setSelectedLote(lote);
    setBajaData({ cantidad: "", causa: "", fecha: new Date().toISOString().split('T')[0] });
    setBajaModalOpen(true);
  };

  const submitBaja = (e) => {
    e.preventDefault();
    const cantidadBaja = parseInt(bajaData.cantidad, 10);
    const cantidadRestante = selectedLote.cantidad - cantidadBaja;
    
    handleRegistrarBaja(
      selectedLote.id, 
      selectedLote.bajas, 
      { fecha: bajaData.fecha, cantidad: cantidadBaja, causa: bajaData.causa }, 
      cantidadRestante
    );
    setBajaModalOpen(false);
  };

  return (
    <div className="lotes-page">
      <header className="module-header">
        <h2>Gestión de Lotes</h2>
        <p>Control de etapas biológicas, inventario y mortalidad.</p>
      </header>

      {/* PANEL DE CONTROL */}
      <div className="control-panel">
        <input 
          type="text" 
          placeholder="Buscar lote o código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
        </select>
        
        <button className="btn-primary" style={{marginLeft: "auto"}} onClick={handleOpenCreate}>
          + Nuevo Lote
        </button>
      </div>

      {/* RENDERIZADO DEL CATÁLOGO */}
      {loading ? (
        <p>Cargando base de datos...</p>
      ) : (
        <div className="lotes-grid">
          {lotes.map((lote) => (
            <div key={lote.id} className="lote-card">
              <span className={`card-badge ${lote.estado === 'Activo' ? 'badge-activo' : 'badge-historico'}`}>
                {lote.estado}
              </span>
              
              <div className="card-header">
                <h3>{lote.nombre}</h3>
                <p className="card-subtitle">Cód: {lote.codigo || 'N/A'}</p>
              </div>
              
              <div className="card-body">
                <div className="stat-row">
                  <span className="stat-label">Población:</span> 
                  <span className="stat-value">{lote.cantidad} cerdos</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Etapa:</span> 
                  <span className="etapa-badge">{lote.etapa}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Inicio:</span> 
                  <span className="stat-value">{new Date(lote.fechaInicio).toLocaleDateString()}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Mortalidad:</span> 
                  <span className="stat-value" style={{color: '#e53e3e'}}>{lote.bajas?.length ? lote.bajas.reduce((acc, b) => acc + b.cantidad, 0) : 0}</span>
                </div>
              </div>

              {lote.estado === 'Activo' && (
                <div className="card-actions">
                  <button className="btn-action" onClick={() => openEtapaModal(lote)}>Cambiar Etapa</button>
                  <button className="btn-action" onClick={() => openBajaModal(lote)}>Reportar Baja</button>
                  <button className="btn-action archivar" onClick={() => handleArchivar(lote.id)}>Cerrar Lote</button>
                </div>
              )}
            </div>
          ))}
          {lotes.length === 0 && <p>No hay lotes que coincidan con los filtros.</p>}
        </div>
      )}

      {/* MODAL CREAR LOTE */}
      {isCreateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Registrar Nuevo Lote</h3>
            <form onSubmit={submitCreate}>
              <div className="form-group">
                <label>Nombre del Lote</label>
                <input required className="form-input" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Código Interno</label>
                <input className="form-input" value={formData.codigo} onChange={e => setFormData({...formData, codigo: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Fecha de Inicio</label>
                <input required type="date" className="form-input" value={formData.fechaInicio} onChange={e => setFormData({...formData, fechaInicio: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Cantidad de Cerdos</label>
                <input required type="number" min="1" className="form-input" value={formData.cantidad} onChange={e => setFormData({...formData, cantidad: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Raza (Opcional)</label>
                <input className="form-input" value={formData.raza} onChange={e => setFormData({...formData, raza: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Etapa Biológica Inicial</label>
                <select className="form-input" value={formData.etapa} onChange={e => setFormData({...formData, etapa: e.target.value})}>
                  <option value="Destete">Destete</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Engorde">Engorde</option>
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

      {/* MODAL CAMBIO DE ETAPA */}
      {isEtapaModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Cambiar Etapa: {selectedLote.nombre}</h3>
            <form onSubmit={submitCambioEtapa}>
              <div className="form-group">
                <label>Nueva Etapa Biológica</label>
                <select className="form-input" value={nuevaEtapa} onChange={e => setNuevaEtapa(e.target.value)}>
                  <option value="Destete">Destete</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Engorde">Engorde</option>
                </select>
                {nuevaEtapa !== selectedLote.etapa && (
                  <div className="alert-dieta">
                    <strong>¡Atención!</strong> Este cambio de etapa requiere ajuste en la dieta de los cerdos.
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setEtapaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR BAJA */}
      {isBajaModalOpen && selectedLote && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reportar Mortalidad: {selectedLote.nombre}</h3>
            <p style={{marginBottom: "1rem"}}>Población actual: {selectedLote.cantidad} cerdos</p>
            <form onSubmit={submitBaja}>
              <div className="form-group">
                <label>Fecha de Baja</label>
                <input required type="date" className="form-input" value={bajaData.fecha} onChange={e => setBajaData({...bajaData, fecha: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Cantidad (Cerdos fallecidos)</label>
                <input required type="number" min="1" max={selectedLote.cantidad} className="form-input" value={bajaData.cantidad} onChange={e => setBajaData({...bajaData, cantidad: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Causa</label>
                <input required className="form-input" placeholder="Ej. Neumonía, Desconocida..." value={bajaData.causa} onChange={e => setBajaData({...bajaData, causa: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setBajaModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn-danger">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
