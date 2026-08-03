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

  // Estados para análisis de duración y planificación
  const [vecesAlDia, setVecesAlDia] = React.useState(2);
  const [calcMode, setCalcMode] = React.useState("cantidad"); // "duracion" o "cantidad"
  const [cantidadPreparar, setCantidadPreparar] = React.useState(10);
  const [unidadPreparar, setUnidadPreparar] = React.useState("quintales"); // "kg", "lbs", "quintales"
  const [duracionObjetivo, setDuracionObjetivo] = React.useState(2);
  const [unidadDuracionObjetivo, setUnidadDuracionObjetivo] = React.useState("semanas"); // "dias", "semanas"

  const selectedLote = lotes.find(l => l.id === selectedLoteId);

  const analisisPlanificacion = React.useMemo(() => {
    if (!selectedLote || !requerimientos.consumoDiario || mezclaActual.length === 0) {
      return null;
    }

    const cantidadCerdos = selectedLote.cantidad || 0;
    const consumoDiarioLoteKg = requerimientos.consumoDiario * cantidadCerdos;
    const consumoDiarioLoteLbs = consumoDiarioLoteKg * 2.20462;
    const costoPorLibra = (totalesMezcla.costoCienLibras || 0) / 100;

    // Consumo por comida/ración
    const consumoPorComidaKg = vecesAlDia > 0 ? (consumoDiarioLoteKg / vecesAlDia) : 0;
    const consumoPorComidaLbs = vecesAlDia > 0 ? (consumoDiarioLoteLbs / vecesAlDia) : 0;

    // --- MODO 1: CALCULAR DURACIÓN ---
    let cantidadLbs = 0;
    if (unidadPreparar === "kg") {
      cantidadLbs = cantidadPreparar * 2.20462;
    } else if (unidadPreparar === "lbs") {
      cantidadLbs = cantidadPreparar;
    } else if (unidadPreparar === "quintales") {
      cantidadLbs = cantidadPreparar * 100;
    }

    const diasEstimados = consumoDiarioLoteLbs > 0 ? (cantidadLbs / consumoDiarioLoteLbs) : 0;
    const racionesTotales = diasEstimados * vecesAlDia;
    const costoPreparacion = cantidadLbs * costoPorLibra;

    // --- MODO 2: CALCULAR CANTIDAD REQUERIDA ---
    const diasObjetivo = unidadDuracionObjetivo === "semanas" ? duracionObjetivo * 7 : duracionObjetivo;
    const totalLbsRequeridas = consumoDiarioLoteLbs * diasObjetivo;
    const totalKgRequeridos = consumoDiarioLoteKg * diasObjetivo;
    const totalQuintalesRequeridos = totalLbsRequeridas / 100;
    const costoTotalRequerido = totalLbsRequeridas * costoPorLibra;

    // Breakdown de ingredientes necesarios
    const ingredientesRequeridos = mezclaActual.map(item => {
      const porcentaje = item.porcentaje || 0;
      const ingLbs = (porcentaje / 100) * totalLbsRequeridas;
      const ingKg = ingLbs / 2.20462;
      return {
        ...item,
        lbs: parseFloat(ingLbs.toFixed(1)),
        kg: parseFloat(ingKg.toFixed(1)),
        quintales: parseFloat((ingLbs / 100).toFixed(2))
      };
    });

    return {
      consumoDiarioLoteKg: parseFloat(consumoDiarioLoteKg.toFixed(1)),
      consumoDiarioLoteLbs: parseFloat(consumoDiarioLoteLbs.toFixed(1)),
      consumoPorComidaKg: parseFloat(consumoPorComidaKg.toFixed(1)),
      consumoPorComidaLbs: parseFloat(consumoPorComidaLbs.toFixed(1)),
      // Modo 1
      diasEstimados: parseFloat(diasEstimados.toFixed(1)),
      racionesTotales: Math.round(racionesTotales),
      costoPreparacion: parseFloat(costoPreparacion.toFixed(2)),
      // Modo 2
      diasObjetivo,
      totalLbsRequeridas: parseFloat(totalLbsRequeridas.toFixed(1)),
      totalKgRequeridos: parseFloat(totalKgRequeridos.toFixed(1)),
      totalQuintalesRequeridos: parseFloat(totalQuintalesRequeridos.toFixed(2)),
      costoTotalRequerido: parseFloat(costoTotalRequerido.toFixed(2)),
      ingredientesRequeridos
    };
  }, [
    selectedLote,
    requerimientos,
    totalesMezcla,
    mezclaActual,
    vecesAlDia,
    cantidadPreparar,
    unidadPreparar,
    duracionObjetivo,
    unidadDuracionObjetivo
  ]);

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

              {/* PLAN DE ALIMENTACIÓN */}
              {selectedLote && (
                <div className="plan-alimentacion">
                  <h4>Plan de Alimentación Diaria</h4>
                  <div className="plan-grid">
                    <div className="plan-card">
                      <span className="plan-label">Por Cerdo</span>
                      <span className="plan-value">{requerimientos.consumoDiario} kg</span>
                    </div>
                    <div className="plan-card highlight">
                      <span className="plan-label">Lote ({selectedLote.cantidad} cerdos)</span>
                      <span className="plan-value">{(requerimientos.consumoDiario * selectedLote.cantidad).toFixed(1)} kg</span>
                    </div>
                  </div>
                  <div className="plan-note">
                    <strong>
                      Etapa: {selectedLote.etapa}
                      {['Destete', 'Desarrollo', 'Engorde'].includes(selectedLote.etapa) && ` (Edad real: ${requerimientos.semanasEdad} semanas)`}
                    </strong>
                    <p>Preparar aprox. <span className="highlight-text">{((requerimientos.consumoDiario * selectedLote.cantidad) / 45.3592).toFixed(2)} quintales</span> (100 lbs) de esta mezcla al día.</p>
                  </div>
                </div>
              )}

              {/* ANÁLISIS DE RENDIMIENTO Y PLANIFICACIÓN */}
              {selectedLote && mezclaActual.length > 0 && analisisPlanificacion && (
                <div className="analisis-duracion">
                  <h4>Análisis de Duración y Planificación</h4>
                  
                  {/* Frecuencia de Alimentación */}
                  <div className="analisis-frecuencia">
                    <label>Frecuencia de alimentación al día:</label>
                    <div className="frecuencia-control">
                      <button 
                        type="button" 
                        onClick={() => setVecesAlDia(prev => Math.max(1, prev - 1))}
                        disabled={vecesAlDia <= 1}
                        className="frecuencia-btn"
                      >
                        -
                      </button>
                      <span className="frecuencia-valor">{vecesAlDia} {vecesAlDia === 1 ? 'comida' : 'comidas'} al día</span>
                      <button 
                        type="button" 
                        onClick={() => setVecesAlDia(prev => Math.min(6, prev + 1))}
                        disabled={vecesAlDia >= 6}
                        className="frecuencia-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Tabs para seleccionar el Modo */}
                  <div className="analisis-tabs">
                    <button 
                      type="button" 
                      className={`tab-btn ${calcMode === "cantidad" ? "active" : ""}`}
                      onClick={() => setCalcMode("cantidad")}
                    >
                      Planificar lote
                    </button>
                    <button 
                      type="button" 
                      className={`tab-btn ${calcMode === "duracion" ? "active" : ""}`}
                      onClick={() => setCalcMode("duracion")}
                    >
                      ¿Cuánto durará?
                    </button>
                  </div>

                  <div className="analisis-body">
                    {calcMode === "cantidad" ? (
                      <div className="tab-content">
                        <p className="tab-desc">Calcula cuánto alimento preparar y qué cantidad de cada insumo comprar para una duración objetivo.</p>
                        
                        <div className="analisis-inputs">
                          <div className="input-group-calc">
                            <label>Duración deseada:</label>
                            <div className="input-with-select">
                              <input 
                                type="number" 
                                min="1" 
                                value={duracionObjetivo}
                                onChange={(e) => setDuracionObjetivo(Math.max(1, parseInt(e.target.value) || 1))}
                                className="number-input-calc"
                              />
                              <select 
                                value={unidadDuracionObjetivo} 
                                onChange={(e) => setUnidadDuracionObjetivo(e.target.value)}
                                className="select-input-calc"
                              >
                                <option value="dias">Día(s)</option>
                                <option value="semanas">Semana(s)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Resultados del Lote Planificado */}
                        <div className="resultado-principal card-plan">
                          <span className="resultado-label">Total de mezcla a preparar:</span>
                          <span className="resultado-valor">
                            {analisisPlanificacion.totalQuintalesRequeridos} qq
                            <small className="resultado-subvalor">
                              ({analisisPlanificacion.totalLbsRequeridas} lbs / {analisisPlanificacion.totalKgRequeridos} kg)
                            </small>
                          </span>
                          
                          <div className="resultado-detalles-row">
                            <div className="detalle-calc-item">
                              <span className="detalle-calc-label">Costo estimado</span>
                              <span className="detalle-calc-val highlight-val">C$ {analisisPlanificacion.costoTotalRequerido.toLocaleString()}</span>
                            </div>
                            <div className="detalle-calc-item">
                              <span className="detalle-calc-label">Raciones totales</span>
                              <span className="detalle-calc-val">{analisisPlanificacion.diasObjetivo * vecesAlDia} comidas</span>
                            </div>
                          </div>

                          <div className="detalle-calc-item" style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                            <span className="detalle-calc-label">Ración para el lote por comida:</span>
                            <span className="detalle-calc-val">
                              {analisisPlanificacion.consumoPorComidaKg} kg / {analisisPlanificacion.consumoPorComidaLbs} lbs
                            </span>
                          </div>
                        </div>

                        {/* Desglose de Insumos */}
                        <div className="desglose-insumos">
                          <h5>Ingredientes para preparar (Mezcla de lote):</h5>
                          <div className="insumos-grid-calc">
                            {analisisPlanificacion.ingredientesRequeridos.map(item => (
                              <div key={item.id} className="insumo-calc-card">
                                <span className="insumo-calc-nombre">{item.nombre}</span>
                                <span className="insumo-calc-porcentaje">{item.porcentaje}% de la mezcla</span>
                                <div className="insumo-calc-valores">
                                  <span className="insumo-calc-peso-qq">{item.quintales} qq</span>
                                  <span className="insumo-calc-peso-lbs">({item.lbs} lbs / {item.kg} kg)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="tab-content">
                        <p className="tab-desc">Calcula cuántos días durará una cantidad específica de alimento preparado.</p>
                        
                        <div className="analisis-inputs">
                          <div className="input-group-calc">
                            <label>Cantidad de alimento preparado:</label>
                            <div className="input-with-select">
                              <input 
                                type="number" 
                                min="1" 
                                value={cantidadPreparar}
                                onChange={(e) => setCantidadPreparar(Math.max(1, parseFloat(e.target.value) || 1))}
                                className="number-input-calc"
                              />
                              <select 
                                value={unidadPreparar} 
                                onChange={(e) => setUnidadPreparar(e.target.value)}
                                className="select-input-calc"
                              >
                                <option value="quintales">Quintal(es) (100 lbs)</option>
                                <option value="lbs">Libra(s)</option>
                                <option value="kg">Kilogramo(s)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Resultados de Durabilidad */}
                        <div className="resultado-principal card-duracion">
                          <span className="resultado-label">Duración estimada del alimento:</span>
                          <span className="resultado-valor text-duracion">
                            {analisisPlanificacion.diasEstimados} días
                            <small className="resultado-subvalor text-duracion-sub">
                              (~ {(analisisPlanificacion.diasEstimados / 7).toFixed(1)} semanas)
                            </small>
                          </span>

                          <div className="resultado-detalles-row">
                            <div className="detalle-calc-item">
                              <span className="detalle-calc-label">Costo del lote preparado</span>
                              <span className="detalle-calc-val highlight-val">C$ {analisisPlanificacion.costoPreparacion.toLocaleString()}</span>
                            </div>
                            <div className="detalle-calc-item">
                              <span className="detalle-calc-label">Comidas que rinde</span>
                              <span className="detalle-calc-val">{analisisPlanificacion.racionesTotales} raciones</span>
                            </div>
                          </div>

                          <div className="detalle-calc-item" style={{ marginTop: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                            <span className="detalle-calc-label">Ración para el lote por comida:</span>
                            <span className="detalle-calc-val">
                              {analisisPlanificacion.consumoPorComidaKg} kg / {analisisPlanificacion.consumoPorComidaLbs} lbs
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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