import { useState, useEffect } from "react";
import { useInsumos } from "../logic/useInsumos";
import "./InsumosPage.css";

// --- MINI-COMPONENTE PARA LA TARJETA ---
const InsumoCard = ({ insumo, esDelSistema, handleUpdatePrecio, handleDelete }) => {
  const [precioBorrador, setPrecioBorrador] = useState(insumo.costoPorLibra);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  useEffect(() => {
    setPrecioBorrador(insumo.costoPorLibra);
  }, [insumo.costoPorLibra]);

  const hayCambios = parseFloat(precioBorrador) !== parseFloat(insumo.costoPorLibra);

  const confirmarGuardado = () => {
    handleUpdatePrecio(insumo, parseFloat(precioBorrador));
    setConfirmarEliminar(false);
  };

  const cancelarCambio = () => {
    setPrecioBorrador(insumo.costoPorLibra);
  };

  return (
    <div className={`insumo-card ${hayCambios ? "card-editing" : ""}`}>
      
      {confirmarEliminar && (
        <div className="delete-overlay">
          <div className="delete-overlay-content">
            <h4>⚠️ ¿Eliminar Insumo?</h4>
            <p>Borrarás <strong>{insumo.nombre}</strong> de tu inventario. Esta acción no se puede deshacer.</p>
            <div className="action-buttons">
              <button className="btn-cancel-delete" onClick={() => setConfirmarEliminar(false)}>
                Cancelar
              </button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(insumo.id)}>
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card-header">
        <div className="title-wrapper">
          <h3>{insumo.nombre}</h3>
          <span className={`badge ${esDelSistema ? "badge-sistema" : "badge-propio"}`}>
            {esDelSistema ? "App" : "Propio"}
          </span>
        </div>
        
        {!esDelSistema && (
          <button onClick={() => setConfirmarEliminar(true)} className="btn-delete" title="Eliminar subproducto">
            ✕
          </button>
        )}
      </div>
      
      <div className="card-body">
        <div className="stat"><span>Proteína:</span> <strong>{insumo.porcentajeProteina}%</strong></div>
        <div className="stat"><span>Energía:</span> <strong>{insumo.porcentajeEnergia} Kcal</strong></div>
        <div className="stat"><span>Fibra:</span> <strong>{insumo.porcentajeFibra}%</strong></div>
      </div>

      <div className="card-footer">
        <div className="price-control-group">
          <label>Precio Actual (C$/lb):</label>
          <input 
            type="number" 
            step="0.01"
            min="0"
            value={precioBorrador}
            className={`price-input ${hayCambios ? "input-changed" : ""}`}
            onChange={(e) => setPrecioBorrador(e.target.value)}
          />
        </div>
        
        {hayCambios && (
          <div className="action-buttons">
            <button className="btn-cancel-price" onClick={cancelarCambio} title="Deshacer cambio">
              ✕ Cancelar
            </button>
            <button className="btn-confirm-price" onClick={confirmarGuardado} title="Guardar nuevo precio">
              💾 Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---
export default function InsumosPage() {
  const { 
    insumos, loading, searchTerm, setSearchTerm, sortBy, setSortBy, 
    handleAdd, handleUpdatePrecio, handleDelete 
  } = useInsumos();

  const [formData, setFormData] = useState({
    nombre: "", porcentajeProteina: "", porcentajeEnergia: "", porcentajeFibra: "", costoPorLibra: ""
  });

  const onSubmit = (e) => {
    e.preventDefault();
    handleAdd({
      nombre: formData.nombre,
      porcentajeProteina: parseFloat(formData.porcentajeProteina),
      porcentajeEnergia: parseFloat(formData.porcentajeEnergia),
      porcentajeFibra: parseFloat(formData.porcentajeFibra),
      costoPorLibra: parseFloat(formData.costoPorLibra)
    });
    setFormData({ nombre: "", porcentajeProteina: "", porcentajeEnergia: "", porcentajeFibra: "", costoPorLibra: "" });
  };

  return (
    <div className="insumos-page">
      <header className="module-header">
        <h2>Biblioteca de Insumos</h2>
        <p>Inventario nutricional y costos base. Actualiza los precios según tu zona.</p>
      </header>

      <div className="control-panel">
        <input 
          type="text" 
          placeholder="🔍 Buscar subproducto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="nombre">Ordenar A-Z</option>
          <option value="precio">Menor Precio</option>
          <option value="proteina">Mayor Proteína</option>
        </select>
      </div>

      <form className="add-insumo-form" onSubmit={onSubmit}>
        <div className="form-header">
          <h3>➕ Añadir Nuevo Subproducto</h3>
        </div>
        <div className="form-inputs">
          <input required type="text" placeholder="Nombre (ej. Suero)" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
          <input required type="number" step="0.01" placeholder="% Proteína" value={formData.porcentajeProteina} onChange={e => setFormData({...formData, porcentajeProteina: e.target.value})} />
          <input required type="number" placeholder="Energía (Kcal)" value={formData.porcentajeEnergia} onChange={e => setFormData({...formData, porcentajeEnergia: e.target.value})} />
          <input required type="number" step="0.01" placeholder="% Fibra" value={formData.porcentajeFibra} onChange={e => setFormData({...formData, porcentajeFibra: e.target.value})} />
          <input required type="number" step="0.01" placeholder="Costo C$/lb" value={formData.costoPorLibra} onChange={e => setFormData({...formData, costoPorLibra: e.target.value})} />
          <button type="submit" className="btn-add">Guardar</button>
        </div>
      </form>

      {loading ? (
        <p className="status-text">Cargando base de datos nutricional...</p>
      ) : (
        <div className="insumos-grid">
          {insumos.map((insumo) => (
            <InsumoCard 
              key={insumo.id} 
              insumo={insumo} 
              esDelSistema={insumo.fincaId === "sistema"}
              handleUpdatePrecio={handleUpdatePrecio}
              handleDelete={handleDelete}
            />
          ))}
          {insumos.length === 0 && <p className="status-text">No se encontraron ingredientes.</p>}
        </div>
      )}
    </div>
  );
}