import { useState, useMemo } from "react";
import { useMaximizador } from "../logic/useMaximizador";
import { PuntoOptimoWidget } from "./PuntoOptimoWidget";
import "./MaximizadorPage.css";

export default function MaximizadorPage() {
  const {
    lotes,
    loteSeleccionadoId,
    setLoteSeleccionadoId,
    pesajes,
    loadingLotes,
    loadingPesajes,
    precioVenta, setPrecioVenta,
    costoAlimento, setCostoAlimento,
    diasSimulacion, setDiasSimulacion,
    simulacion
  } = useMaximizador();

  const [isLoteSelectOpen, setIsLoteSelectOpen] = useState(false);
  const [loteSearch, setLoteSearch] = useState("");

  const filteredLotes = useMemo(() => {
    return lotes.filter(lote => 
      lote.nombre.toLowerCase().includes(loteSearch.toLowerCase()) || 
      (lote.etapa && lote.etapa.toLowerCase().includes(loteSearch.toLowerCase()))
    );
  }, [lotes, loteSearch]);

  if (loadingLotes) return <p className="status-text">Cargando datos del sistema...</p>;
  if (lotes.length === 0) return <p className="status-text">⚠️ No hay lotes activos. Registra uno en el Módulo de Lotes primero.</p>;

  const loteActivo = lotes.find(l => l.id === loteSeleccionadoId);

  return (
    <div className="maximizador-page">
      <header className="module-header">
        <h2>Maximizador de Ganancia</h2>
        <p>Selecciona un lote para predecir su punto óptimo de venta basado en el consumo de alimento y ganancia de peso.</p>
      </header>

      <div className="maximizador-layout">
        <div className="card">
          <h3>Selecciona un Lote</h3>
          <div className="custom-select-wrapper">
            <div 
              className={`custom-select-trigger ${isLoteSelectOpen ? 'open' : ''}`}
              onClick={() => setIsLoteSelectOpen(!isLoteSelectOpen)}
            >
              <span>{loteActivo ? `${loteActivo.nombre} (Etapa: ${loteActivo.etapa}) - ${loteActivo.cantidad} cerdos` : "-- Selecciona un lote --"}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            
            {isLoteSelectOpen && (
              <div className="custom-select-dropdown">
                <div className="custom-select-search">
                  <input 
                    type="text" 
                    placeholder="🔍 Buscar por nombre o etapa..." 
                    value={loteSearch}
                    onChange={(e) => setLoteSearch(e.target.value)}
                    autoFocus
                  />
                </div>
                <ul className="custom-select-options">
                  {filteredLotes.length > 0 ? (
                    filteredLotes.map(lote => (
                      <li 
                        key={lote.id} 
                        className={loteSeleccionadoId === lote.id ? 'selected' : ''}
                        onClick={() => {
                          setLoteSeleccionadoId(lote.id);
                          setIsLoteSelectOpen(false);
                          setLoteSearch("");
                        }}
                      >
                        {lote.nombre} ({lote.cantidad} cerdos)
                        <span className={`etapa-badge etapa-${(lote.etapa || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {lote.etapa}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li style={{ color: '#9ca3af', textAlign: 'center' }}>No se encontraron lotes</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>

        {loadingPesajes ? (
          <p className="status-text">Analizando registros de peso...</p>
        ) : (
          <div className="widget-wrapper">
            <PuntoOptimoWidget 
              lote={loteActivo} 
              pesajes={pesajes} 
              precioVenta={precioVenta}
              setPrecioVenta={setPrecioVenta}
              costoAlimento={costoAlimento}
              setCostoAlimento={setCostoAlimento}
              diasSimulacion={diasSimulacion}
              setDiasSimulacion={setDiasSimulacion}
              simulacion={simulacion}
            />
          </div>
        )}
      </div>
    </div>
  );
}
