import "./PuntoOptimoWidget.css";

export const PuntoOptimoWidget = ({ 
  lote, 
  pesajes,
  precioVenta, 
  setPrecioVenta,
  costoAlimento, 
  setCostoAlimento,
  diasSimulacion, 
  setDiasSimulacion,
  simulacion 
}) => {

  if (!lote || !pesajes || pesajes.length === 0) {
    return (
      <div className="punto-optimo-widget">
        <p>No hay datos suficientes para calcular el punto óptimo. Registra al menos un pesaje.</p>
      </div>
    );
  }

  const { historial, diaOptimo, diaSeleccionado } = simulacion;

  // Lógica para dibujar el SVG
  // Mapeamos los días (0-30) al ancho (0-100%) y ganancia al alto
  const width = 1000;
  const height = 200;
  
  const minGanancia = Math.min(...historial.map(h => h.gananciaNeta));
  const maxGanancia = Math.max(...historial.map(h => h.gananciaNeta));
  const rangoGanancia = maxGanancia - minGanancia || 1;

  const getX = (dia) => (dia / 30) * width;
  const getY = (ganancia) => height - ((ganancia - minGanancia) / rangoGanancia) * (height - 40) - 20;

  const pathData = historial.map((h, i) => 
    `${i === 0 ? 'M' : 'L'} ${getX(h.diaExt)} ${getY(h.gananciaNeta)}`
  ).join(' ');

  const areaData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  const esOptimoHoy = diaOptimo.diaExt === 0;
  const yaPasoOptimo = diaOptimo.diaExt < 0; // En esta simulación siempre es >=0, pero conceptualmente.
  const diasRestantes = diaOptimo.diaExt;

  return (
    <div className="punto-optimo-widget">
      <div className="widget-header">
        <h3>Predicción: Punto Óptimo de Venta</h3>
        <p>Cruza costo de alimento vs. crecimiento para maximizar tu ganancia.</p>
      </div>

      <div className={`optimo-alert ${diasRestantes <= 5 ? 'warning' : ''}`}>
        <div className="icon">
          {diasRestantes === 0 ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '32px', height: '32px'}}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width: '32px', height: '32px'}}>
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          )}
        </div>
        <div>
          <h4>
            {diasRestantes === 0 
              ? "¡Lote en máxima rentabilidad HOY!"
              : `Ventana Óptima de Venta: en ${diasRestantes} días`}
          </h4>
          <p>Ganancia neta máxima proyectada: <strong>C$ {diaOptimo.gananciaNeta.toLocaleString()}</strong></p>
        </div>
      </div>

      <div className="inputs-row">
        <div className="input-group">
          <label>Precio de Venta (por lb en pie)</label>
          <div className="input-with-symbol">
            <span>C$</span>
            <input 
              type="number" 
              step="0.5"
              value={precioVenta} 
              onChange={e => setPrecioVenta(parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>
        <div className="input-group">
          <label>Costo de Alimento (por lb)</label>
          <div className="input-with-symbol">
            <span>C$</span>
            <input 
              type="number" 
              step="0.5"
              value={costoAlimento} 
              onChange={e => setCostoAlimento(parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>
      </div>

      {/* Gráfico SVG Puro (Cero librerías pesadas) */}
      <div className="svg-chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1={height/2} x2={width} y2={height/2} className="chart-axis-line" strokeDasharray="4 4" />
          
          {/* Area & Line */}
          <path d={areaData} className="chart-area" />
          <path d={pathData} className="chart-line" />
          
          {/* Optimum Point */}
          <circle 
            cx={getX(diaOptimo.diaExt)} 
            cy={getY(diaOptimo.gananciaNeta)} 
            r="6" 
            className="chart-dot-optimo" 
          />
          <text x={getX(diaOptimo.diaExt)} y={getY(diaOptimo.gananciaNeta) - 15} textAnchor="middle" className="chart-text" fill="#10b981" fontWeight="bold">
            Pico Óptimo
          </text>

          {/* Current Selected Point (Slider) */}
          <circle 
            cx={getX(diaSeleccionado.diaExt)} 
            cy={getY(diaSeleccionado.gananciaNeta)} 
            r="5" 
            className="chart-dot-current" 
          />
        </svg>
      </div>

      <div className="slider-section">
        <div className="slider-header">
          <h4>Simulador de Tiempo (¿Qué pasa si...)</h4>
          <span className="badge-days">+{diasSimulacion} días</span>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max="30" 
          value={diasSimulacion} 
          onChange={e => setDiasSimulacion(parseInt(e.target.value))}
          className="range-slider"
        />
        
        <div className="simulation-result">
          {diasSimulacion === diaOptimo.diaExt ? (
            <span>Este es el <strong>punto exacto</strong> de máxima rentabilidad.</span>
          ) : (
            <span>
              Si vendes en +{diasSimulacion} días, tu ganancia será de <strong>C$ {diaSeleccionado.gananciaNeta.toLocaleString()}</strong>.
              <br/>
              <span className={diaSeleccionado.porcentajeCambio >= 0 ? "sim-positive" : "sim-negative"}>
                ({diaSeleccionado.porcentajeCambio > 0 ? '+' : ''}{diaSeleccionado.porcentajeCambio}% respecto a hoy)
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
