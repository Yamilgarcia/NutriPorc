import { useMemo } from "react";
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

  if (!lote || !pesajes || pesajes.length === 0 || !simulacion?.historial) {
    return (
      <div className="punto-optimo-widget">
        <p className="widget-empty">No hay datos suficientes para calcular el punto óptimo. Registra al menos un pesaje en este lote.</p>
      </div>
    );
  }

  const { historial, diaOptimo, diaSeleccionado } = simulacion;

  // --- NUEVA LÓGICA DE NEGOCIO EN UI ---
  // 1. Encontrar Ventana Óptima (Rango de días donde la ganancia está a más del 98% del pico máximo)
  const ventanaOptima = useMemo(() => {
    const umbral98 = diaOptimo.gananciaNeta * 0.98;
    const diasEnVentana = historial.filter(h => h.gananciaNeta >= umbral98).map(h => h.diaExt);
    
    if (diasEnVentana.length === 0) return { inicio: diaOptimo.diaExt, fin: diaOptimo.diaExt };
    
    // Formatear fechas simuladas basadas en el día de hoy
    const formatearFecha = (diasDesdeHoy) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + diasDesdeHoy);
      return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return {
      inicioDias: diasEnVentana[0],
      finDias: diasEnVentana[diasEnVentana.length - 1],
      inicioFecha: formatearFecha(diasEnVentana[0]),
      finFecha: formatearFecha(diasEnVentana[diasEnVentana.length - 1])
    };
  }, [historial, diaOptimo]);

  // 2. Calcular Margen de Ganancia Máximo Proyectado (Simulado)
  const margenMaximo = useMemo(() => {
    // Estimación de margen sobre ingresos brutos totales proyectados
    const ingresosProyectados = diaOptimo.pesoProyectadoTotal * precioVenta;
    if (!ingresosProyectados) return 0;
    return Math.round((diaOptimo.gananciaNeta / ingresosProyectados) * 100);
  }, [diaOptimo, precioVenta]);

  // --- DIMENSIONES Y PROYECCIONES DEL SVG ---
  const width = 1000;
  const height = 240; // Un poco más alto para el nuevo diseño de curvas
  const paddingX = 40; 
  const paddingY = 40; 

  const minGanancia = Math.min(...historial.map(h => h.gananciaNeta));
  const maxGanancia = Math.max(...historial.map(h => h.gananciaNeta));
  const rangoGanancia = maxGanancia - minGanancia || 1;

  const getX = (dia) => paddingX + (dia / 30) * (width - paddingX * 2);
  const getY = (ganancia) => height - paddingY - ((ganancia - minGanancia) / rangoGanancia) * (height - paddingY * 2);

  // Generar curva suave bezier en lugar de líneas rectas rígidas
  const pathData = useMemo(() => {
    return historial.reduce((acc, h, i) => {
      const x = getX(h.diaExt);
      const y = getY(h.gananciaNeta);
      if (i === 0) return `M ${x} ${y}`;
      
      // Punto de control anterior para suavizado
      const prevX = getX(historial[i - 1].diaExt);
      const prevY = getY(historial[i - 1].gananciaNeta);
      const cpX1 = prevX + (x - prevX) / 2;
      return `${acc} C ${cpX1} ${prevY}, ${cpX1} ${y}, ${x} ${y}`;
    }, "");
  }, [historial]);

  const areaData = `${pathData} L ${getX(30)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  const diasRestantes = diaOptimo.diaExt;

  return (
    <div className="punto-optimo-widget">
      {/* Encabezado */}
      <div className="widget-header">
        <div className="header-title-container">
          <h3>Módulo de Predicción: Punto Óptimo de Venta</h3>
          <p>Análisis marginal: Cruce automatizado entre curva de crecimiento alimentario y precio de mercado en pie.</p>
        </div>
      </div>

      {/* NUEVO: Widget de Decisión (Tarjeta Destacada) */}
      <div className={`optimo-alert-container ${diasRestantes <= 5 ? 'urgente' : ''}`}>
        <div className="alert-badge-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div className="alert-content-grid">
          <div className="alert-main-info">
            <h4>
              {diasRestantes === 0 
                ? "¡Lote en Máxima Rentabilidad HOY!" 
                : `Ventana Óptima de Venta: Del ${ventanaOptima.inicioFecha} al ${ventanaOptima.finFecha}`}
            </h4>
            <p>Sugerencia de salida al mercado óptima en un rango de <strong>+{ventanaOptima.inicioDias} a +{ventanaOptima.finDias} días</strong>.</p>
          </div>
          <div className="alert-metrics-aside">
            <div className="metric-box">
              <span className="label">Ganancia Máxima</span>
              <span className="value">C$ {diaOptimo.gananciaNeta.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
            </div>
            <div className="metric-box highlighted">
              <span className="label">Margen Máximo</span>
              <span className="value">{margenMaximo}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fila de Inputs Flexibles */}
      <div className="inputs-row">
        <div className="input-group">
          <label>Precio de Venta Mercado (por lb en pie)</label>
          <div className="input-with-symbol">
            <span>C$</span>
            <input 
              type="number" 
              step="0.1"
              value={precioVenta} 
              onChange={e => setPrecioVenta(parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>
        <div className="input-group">
          <label>Costo de Alimento Actual (por lb)</label>
          <div className="input-with-symbol">
            <span>C$</span>
            <input 
              type="number" 
              step="0.1"
              value={costoAlimento} 
              onChange={e => setCostoAlimento(parseFloat(e.target.value) || 0)} 
            />
          </div>
        </div>
      </div>

      {/* Gráfico de Rentabilidad con Curva Suave */}
      <div className="chart-wrapper-box">
        <div className="chart-legend-top">
          <span className="legend-item"><span className="dot optimo"></span>Pico Óptimo Proyectado</span>
          <span className="legend-item"><span className="dot actual"></span>Simulación Actual</span>
        </div>
        <div className="svg-chart-container">
          <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            {/* Guías de Ejes */}
            <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="2" />
            <line x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} stroke="#e2e8f0" strokeWidth="1" />
            
            {/* Línea segmentada del punto óptimo */}
            <line 
              x1={getX(diaOptimo.diaExt)} 
              y1={paddingY} 
              x2={getX(diaOptimo.diaExt)} 
              y2={height - paddingY} 
              stroke="#10b981" 
              strokeDasharray="5 5" 
              strokeWidth="1.5"
            />

            {/* Renderizado de Áreas y Curvas Bézier */}
            <path d={areaData} className="chart-area" />
            <path d={pathData} className="chart-line" />
            
            {/* Nodo: Pico de Ganancia Máxima */}
            <circle 
              cx={getX(diaOptimo.diaExt)} 
              cy={getY(diaOptimo.gananciaNeta)} 
              r="7" 
              className="chart-dot-optimo" 
            />
            <text x={getX(diaOptimo.diaExt)} y={getY(diaOptimo.gananciaNeta) - 18} textAnchor="middle" className="chart-text highlight-green">
              Pico Óptimo (+{diaOptimo.diaExt}d)
            </text>

            {/* Nodo Interactivo del Slider */}
            <circle 
              cx={getX(diaSeleccionado.diaExt)} 
              cy={getY(diaSeleccionado.gananciaNeta)} 
              r="7" 
              className="chart-dot-current" 
            />
            
            {/* Etiquetas de Días en el Eje X */}
            <text x={getX(0)} y={height - 15} textAnchor="middle" className="axis-label-x">Hoy</text>
            <text x={getX(15)} y={height - 15} textAnchor="middle" className="axis-label-x">+15 días</text>
            <text x={getX(30)} y={height - 15} textAnchor="middle" className="axis-label-x">+30 días</text>
          </svg>
        </div>
      </div>

      {/* Sección Simulador Interactiva (Slider) */}
      <div className="slider-section">
        <div className="slider-header">
          <div className="slider-title-wrapper">
            <h4>Simulador de Tiempo Temporal <span>(Proyección Dinámica)</span></h4>
          </div>
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
        
        {/* Desglose Analítico en tiempo real */}
        <div className="simulation-result-card">
          {diasSimulacion === diaOptimo.diaExt ? (
            <div className="result-status-message success">
              <span>🎯 <strong>Estás posicionado en el punto exacto de rentabilidad máxima.</strong> El Ingreso Marginal se iguala al Costo Marginal de alimentación.</span>
            </div>
          ) : (
            <div className="result-status-message info">
              <p>
                Si decides retener y vender el lote en <strong>+{diasSimulacion} días</strong>, la ganancia neta estimada cambia a <strong>C$ {diaSeleccionado.gananciaNeta.toLocaleString(undefined, {maximumFractionDigits:2})}</strong>.
              </p>
              <div className="analysis-badge-row">
                <span className={`analysis-badge ${diaSeleccionado.porcentajeCambio >= 0 ? "positive" : "negative"}`}>
                  {diaSeleccionado.porcentajeCambio > 0 ? 'Ganancia sube' : 'Ganancia cae'} {diaSeleccionado.porcentajeCambio}% respecto a hoy
                </span>
                {diasSimulacion > diaOptimo.diaExt && (
                  <span className="analysis-subtext">
                    ⚠️ Pérdida de eficiencia: El sobrecosto de mantenimiento por lb supera la tasa de crecimiento del cerdo.
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};