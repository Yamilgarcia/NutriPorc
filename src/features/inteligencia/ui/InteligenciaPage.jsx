import { useState, useMemo } from "react";
import { useInteligencia } from "../logic/useInteligencia";
import ProPaywall from "../../../components/ProPaywall";
import "./InteligenciaPage.css";

export default function InteligenciaPage() {
  const { rankingDietas, insumosEstrella, loading } = useInteligencia();
  
  // Estados para filtros y UI
  const [filtroEtapa, setFiltroEtapa] = useState("Todas");
  const [unidadPeso, setUnidadPeso] = useState("lb");
  const [isModalOpen, setModalOpen] = useState(false);

  // Filtrado por etapa
  const dietasFiltradas = useMemo(() => {
    if (filtroEtapa === "Todas") return rankingDietas;
    return rankingDietas.filter(d => d.etapa === filtroEtapa);
  }, [rankingDietas, filtroEtapa]);

  const mostrarDemo = rankingDietas.length === 0;

  // Datos demo o reales
  const datosDietas = mostrarDemo ? [
    { nombre: "Engorde Máximo Fase 2", gmd: 850, etapa: "Engorde", ingredientes: "Soya, Maíz, Núcleo Mineral" },
    { nombre: "Desarrollo Base", gmd: 620, etapa: "Desarrollo", ingredientes: "Sorgo, Soya" },
    { nombre: "Dieta Económica", gmd: 540, etapa: "Engorde", ingredientes: "Mandioca, Suero, Soya" }
  ] : dietasFiltradas;

  const MEJOR_DIETA = datosDietas.length > 0 ? datosDietas[0] : null;

  // Motor de conversión de unidades
  const convertirPeso = (gramos) => {
    if (unidadPeso === "kg") return (gramos / 1000).toFixed(2);
    if (unidadPeso === "lb") return (gramos / 453.592).toFixed(2);
    return gramos.toFixed(0); 
  };

  const getEtiquetaUnidad = () => {
    if (unidadPeso === "kg") return "kg/día";
    if (unidadPeso === "lb") return "lb/día";
    return "g/día";
  };

  return (
    <ProPaywall 
      tituloFeature="Inteligencia Nutricional 🧠" 
      descripcion="Descubre qué dietas e insumos han generado la mayor rentabilidad histórica en tu granja."
    >
      <div className="inteligencia-page animate-fade-in">
        
        {/* HEADER Y FILTROS PREMIUM */}
        <header className="module-header premium-header">
          <div className="header-titles">
            <h2>Motor Analítico de Nutrición 🧠</h2>
            <p>Tus datos reales, convertidos en máxima rentabilidad.</p>
          </div>
          
          <div className="filtros-wrapper">
            <div className="filtro-grupo">
              <label>⚖️ Medida</label>
              <div className="select-estilizado">
                <select value={unidadPeso} onChange={(e) => setUnidadPeso(e.target.value)}>
                  <option value="lb">Libras (lb)</option>
                  <option value="kg">Kilos (kg)</option>
                  <option value="g">Gramos (g)</option>
                </select>
              </div>
            </div>

            <div className="filtro-grupo">
              <label>🔍 Etapa</label>
              <div className="select-estilizado">
                <select value={filtroEtapa} onChange={(e) => setFiltroEtapa(e.target.value)}>
                  <option value="Todas">🏆 Top Histórico</option>
                  <option value="Destete">Destete</option>
                  <option value="Desarrollo">Desarrollo</option>
                  <option value="Engorde">Engorde</option>
                  <option value="Reproducción">Reproducción</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="loading-state">
            <span className="spinner">🐷</span> Procesando historial zootécnico...
          </div>
        ) : (
          <div className="dashboard-content">
            
            {/* TARJETA CAMPEONA (HERO) */}
            {MEJOR_DIETA ? (
              <div className="card-campeona premium-shadow">
                <div className="campeona-header">
                  <div className="titulo-seccion">
                    <span className="badge-top glow">🏆 DIETA CAMPEONA EN {MEJOR_DIETA.etapa.toUpperCase()}</span>
                    <h3 className="dieta-titulo">{MEJOR_DIETA.nombre}</h3>
                  </div>
                  <div className="gmd-highlight">
                    <span className="gmd-valor">{convertirPeso(MEJOR_DIETA.gmd)}</span>
                    <span className="gmd-unidad">{getEtiquetaUnidad()}</span>
                  </div>
                </div>

                <div className="impacto-grid">
                  <div className="impacto-box glass-effect">
                    <div className="box-icon">📈</div>
                    <div className="box-content">
                      <p className="impacto-label">Proyección de Mercado</p>
                      <p className="impacto-valor">Alcanza 100kg en <span>{Math.round(100000 / (MEJOR_DIETA.gmd || 1))} días</span></p>
                    </div>
                  </div>
                  <div className="impacto-box glass-effect">
                    <div className="box-icon">🌾</div>
                    <div className="box-content">
                      <p className="impacto-label">Base Nutricional</p>
                      <p className="impacto-valor truncate">{MEJOR_DIETA.ingredientes}</p>
                    </div>
                  </div>
                </div>

                <button className="btn-formular pulse-hover" onClick={() => setModalOpen(true)}>
                  <span className="icon">📋</span> Desglosar Receta y Formular
                </button>
              </div>
            ) : (
              <div className="card-empty">
                <div className="empty-icon">📂</div>
                <p>No hay datos registrados suficientes para la etapa de <strong>{filtroEtapa}</strong>.</p>
                <span>Registra más pesajes para desbloquear el análisis.</span>
              </div>
            )}

            {/* RANKING NATIVO (LISTA ESTILIZADA) */}
            {datosDietas.length > 1 && (
              <div className="ranking-section">
                <h3 className="section-title">📊 Otras alternativas evaluadas</h3>
                <div className="ranking-list">
                  {datosDietas.slice(1).map((dieta, index) => {
                    let porcentajeWidth = Math.max(0, Math.min(100, (dieta.gmd / MEJOR_DIETA.gmd) * 100));
                    
                    return (
                      <div key={index} className="ranking-item slide-up">
                        <div className="ranking-info">
                          <div className="ranking-badge">#{index + 2}</div>
                          <div>
                            <div className="ranking-nombre">{dieta.nombre}</div>
                            <div className="ranking-ing">{dieta.ingredientes}</div>
                          </div>
                        </div>
                        <div className="ranking-stats">
                          <div className="bar-container">
                            <div className="bar-fill gradient-bar" style={{ width: `${porcentajeWidth}%` }}></div>
                          </div>
                          <span className="gmd-text">{convertirPeso(dieta.gmd)} {getEtiquetaUnidad()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        )}

        {/* MODAL DETALLE DE RECETA */}
        {isModalOpen && MEJOR_DIETA && (
          <div className="modal-overlay">
            <div className="modal-content receta-modal scale-in">
              <div className="modal-header">
                <h3>📋 Receta Optimizada</h3>
                <button className="close-x" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              
              <div className="receta-box">
                <div className="receta-row">
                  <span>Dieta:</span>
                  <strong>{MEJOR_DIETA.nombre}</strong>
                </div>
                <div className="receta-row">
                  <span>Etapa Ideal:</span>
                  <span className="badge-etapa">{MEJOR_DIETA.etapa}</span>
                </div>
              </div>
              
              <h4 className="modal-subtitle">Materias Primas Necesarias:</h4>
              <div className="ingredientes-tags">
                {MEJOR_DIETA.ingredientes.split(',').map((ing, i) => (
                  <span key={i} className="tag-ingrediente">✅ {ing.trim()}</span>
                ))}
              </div>
              
              <button className="btn-close-modal" onClick={() => setModalOpen(false)}>
                Cerrar Panel
              </button>
            </div>
          </div>
        )}

      </div>
    </ProPaywall>
  );
}