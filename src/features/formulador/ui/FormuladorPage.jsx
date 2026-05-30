import React from "react";
import { useFormulador } from "../logic/useFormulador";
import "./FormuladorPage.css";

export default function FormuladorPage() {
  const {
    lotes,
    insumos,
    loading,
    selectedLoteId,
    setSelectedLoteId,
    selectedInsumoIds,
    toggleInsumo,
    mezclaActual,
    requerimientos,
    totalesMezcla,
    handleCalcularMezcla,
    handleActualizarPorcentaje
  } = useFormulador();

  const [isLoteSelectOpen, setIsLoteSelectOpen] = React.useState(false);
  const [loteSearch, setLoteSearch] = React.useState("");
  const [insumoSearch, setInsumoSearch] = React.useState("");

  const handlePrint = () => {
    window.print();
  };

  const filteredLotes = React.useMemo(() => {
    return lotes.filter(lote => 
      lote.nombre.toLowerCase().includes(loteSearch.toLowerCase()) || 
      (lote.etapa && lote.etapa.toLowerCase().includes(loteSearch.toLowerCase()))
    );
  }, [lotes, loteSearch]);

  const filteredInsumos = React.useMemo(() => {
    return insumos.filter(insumo =>
      insumo.nombre.toLowerCase().includes(insumoSearch.toLowerCase())
    );
  }, [insumos, insumoSearch]);

  const selectedLote = lotes.find(l => l.id === selectedLoteId);

  if (loading) {
    return <div className="formulador-page"><p>Cargando datos del formulador...</p></div>;
  }

  // Cálculos para gráficos de progreso
  const getProgressWidth = (actual, target) => {
    if (target === 0) return "0%";
    const percent = (actual / target) * 100;
    return `${Math.min(percent, 100)}%`;
  };

  const isExceso = (actual, target) => actual > target * 1.1; // 10% de margen

  return (
    <div className="formulador-page">
      <header className="module-header">
        <h2>Formulador de Dietas</h2>
        <p>Genera raciones de mínimo costo basadas en los requerimientos nutricionales.</p>
      </header>

      <div className="formulador-grid">
        {/* PANEL IZQUIERDO: CREADOR */}
        <div className="panel">
          <h3>Configurar Ración</h3>
          
          <div className="form-group">
            <label>Seleccionar Lote Destino:</label>
            <div className="custom-select-wrapper">
              <div 
                className={`custom-select-trigger ${isLoteSelectOpen ? 'open' : ''}`}
                onClick={() => setIsLoteSelectOpen(!isLoteSelectOpen)}
              >
                <span>{selectedLote ? `${selectedLote.nombre} (Etapa: ${selectedLote.etapa})` : "-- Selecciona un lote --"}</span>
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
                          className={selectedLoteId === lote.id ? 'selected' : ''}
                          onClick={() => {
                            setSelectedLoteId(lote.id);
                            setIsLoteSelectOpen(false);
                            setLoteSearch("");
                          }}
                        >
                          {lote.nombre}
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

          <div className="form-group">
            <label>Insumos Disponibles (Marca para incluir en la mezcla):</label>
            <input 
              type="text"
              placeholder="🔍 Buscar insumo..."
              value={insumoSearch}
              onChange={(e) => setInsumoSearch(e.target.value)}
              className="insumo-search-input"
            />
            <div className="insumos-list">
              {filteredInsumos.map(insumo => (
                <label key={insumo.id} className={`insumo-checkbox ${selectedInsumoIds.includes(insumo.id) ? 'selected' : ''}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedInsumoIds.includes(insumo.id)}
                    onChange={() => toggleInsumo(insumo.id)}
                  />
                  <span>{insumo.nombre}</span>
                </label>
              ))}
              {filteredInsumos.length === 0 && <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No se encontraron insumos.</p>}
            </div>
            <div className="insumos-footer">
              {selectedInsumoIds.length} seleccionados
            </div>
          </div>

          <button 
            className="btn-calcular"
            onClick={handleCalcularMezcla}
            disabled={!selectedLoteId || selectedInsumoIds.length === 0}
          >
            Generar Mezcla Sugerida
          </button>
        </div>

        {/* PANEL DERECHO: HOJA DE MEZCLA */}
        <div className="panel hoja-mezcla">
          <h3>Hoja de Mezcla</h3>
          
          {mezclaActual.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>
              Configura y calcula la ración para ver los resultados aquí.
            </p>
          ) : (
            <>
              <div className="mezcla-header">
                <div>
                  <h4>Receta Sugerida</h4>
                  <span style={{fontSize: '0.875rem', color: '#4b5563'}}>
                    Base de cálculo: 100 lbs
                  </span>
                </div>
                <p>Mínimo Costo</p>
              </div>

              {/* GRÁFICOS DE ANÁLISIS NUTRICIONAL */}
              <div className="graficos-container">
                <div className="grafico-item">
                  <div className="grafico-labels">
                    <span>Proteína Bruta</span>
                    <span>{totalesMezcla.proteina}% / {requerimientos.proteina}%</span>
                  </div>
                  <div className="barra-fondo">
                    <div 
                      className={`barra-progreso ${isExceso(totalesMezcla.proteina, requerimientos.proteina) ? 'progreso-exceso' : 'progreso-proteina'}`} 
                      style={{ width: getProgressWidth(totalesMezcla.proteina, requerimientos.proteina) }}
                    ></div>
                  </div>
                </div>

                <div className="grafico-item">
                  <div className="grafico-labels">
                    <span>Energía (Kcal)</span>
                    <span>{totalesMezcla.energia} / {requerimientos.energia}</span>
                  </div>
                  <div className="barra-fondo">
                    <div 
                      className={`barra-progreso ${isExceso(totalesMezcla.energia, requerimientos.energia) ? 'progreso-exceso' : 'progreso-energia'}`} 
                      style={{ width: getProgressWidth(totalesMezcla.energia, requerimientos.energia) }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* AJUSTE MANUAL DE PORCENTAJES */}
              <div className="ajustes-lista">
                {mezclaActual.map(item => (
                  <div key={item.id} className="ajuste-item">
                    <span>{item.nombre}</span>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      step="0.5"
                      value={item.porcentaje}
                      onChange={(e) => handleActualizarPorcentaje(item.id, e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <input 
                        type="number" 
                        min="0" 
                        max="100" 
                        step="0.5"
                        value={item.porcentaje}
                        onChange={(e) => handleActualizarPorcentaje(item.id, e.target.value)}
                      />
                      <span style={{ color: '#6b7280' }}>%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* RESUMEN TOTAL */}
              <div className="resumen-total">
                <div>
                  <span style={{display: 'block', fontSize: '0.875rem', opacity: 0.8}}>Peso Total Mezcla</span>
                  <span className={`total-peso ${Math.abs(totalesMezcla.pesoTotal - 100) > 0.1 ? 'error' : ''}`}>
                    {totalesMezcla.pesoTotal}%
                  </span>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span style={{display: 'block', fontSize: '0.875rem', opacity: 0.8}}>Costo x 100 lbs</span>
                  <span className="total-costo">C$ {totalesMezcla.costoCienLibras}</span>
                </div>
              </div>

              {Math.abs(totalesMezcla.pesoTotal - 100) > 0.1 && (
                <p style={{ color: '#ef4444', fontSize: '0.875rem', margin: 0 }}>
                  ⚠️ Atención: La suma de porcentajes no es 100%. Por favor, ajusta los valores.
                </p>
              )}

              <button className="btn-exportar" onClick={handlePrint}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                Imprimir / Exportar PDF
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
