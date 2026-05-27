import { useState } from "react";
import { useInsumos } from "../logic/useInsumos";
import "./InsumosPage.css";

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
        <p>Inventario nutricional y costos base para el algoritmo.</p>
      </header>

      {/* PANEL DE CONTROL */}
      <div className="control-panel">
        <input 
          type="text" 
          placeholder="Buscar subproducto..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
          <option value="nombre">A-Z</option>
          <option value="precio">Menor Precio</option>
          <option value="proteina">Mayor Proteína</option>
        </select>
      </div>

      {/* FORMULARIO DE CREACIÓN */}
      <form className="add-insumo-form" onSubmit={onSubmit}>
        <input required type="text" placeholder="Nombre (ej. Yuca)" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
        <input required type="number" step="0.01" placeholder="% Proteína" value={formData.porcentajeProteina} onChange={e => setFormData({...formData, porcentajeProteina: e.target.value})} />
        <input required type="number" placeholder="Energía (Kcal)" value={formData.porcentajeEnergia} onChange={e => setFormData({...formData, porcentajeEnergia: e.target.value})} />
        <input required type="number" step="0.01" placeholder="% Fibra" value={formData.porcentajeFibra} onChange={e => setFormData({...formData, porcentajeFibra: e.target.value})} />
        <input required type="number" step="0.01" placeholder="Costo C$/lb" value={formData.costoPorLibra} onChange={e => setFormData({...formData, costoPorLibra: e.target.value})} />
        <button type="submit" className="btn-add">Añadir</button>
      </form>

      {/* RENDERIZADO DEL CATÁLOGO */}
      {loading ? (
        <p className="status-text">Cargando base de datos...</p>
      ) : (
        <div className="insumos-grid">
          {insumos.map((insumo) => (
            <div key={insumo.id} className="insumo-card">
              <div className="card-header">
                <h3>{insumo.nombre}</h3>
                <button onClick={() => handleDelete(insumo.id)} className="btn-delete">X</button>
              </div>
              
              <div className="card-body">
                <div className="stat"><span>Proteína:</span> <span>{insumo.porcentajeProteina}%</span></div>
                <div className="stat"><span>Energía:</span> <span>{insumo.porcentajeEnergia} Kcal</span></div>
                <div className="stat"><span>Fibra:</span> <span>{insumo.porcentajeFibra}%</span></div>
              </div>

              <div className="card-footer">
                <label>Precio C$/lb:</label>
                <input 
                  type="number" 
                  step="0.01"
                  defaultValue={insumo.costoPorLibra}
                  className="price-input"
                  onBlur={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if(newValue !== insumo.costoPorLibra && !isNaN(newValue)) {
                      handleUpdatePrecio(insumo.id, newValue);
                    }
                  }}
                />
              </div>
            </div>
          ))}
          {insumos.length === 0 && <p className="status-text">Sin registros locales activos.</p>}
        </div>
      )}
    </div>
  );
}