import  { useState, useMemo } from "react";
import { useInteligencia } from "../logic/useInteligencia";
import ProPaywall from "../../../components/ProPaywall";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "./InteligenciaPage.css";

export default function InteligenciaPage() {
  const { rankingDietas, insumosEstrella, loading } = useInteligencia();
  
  // NUEVOS ESTADOS: Filtro y Modal
  const [filtroEtapa, setFiltroEtapa] = useState("Todas");
  const [isModalOpen, setModalOpen] = useState(false);

  // Filtrado de dietas según la etapa seleccionada
  const dietasFiltradas = useMemo(() => {
    if (filtroEtapa === "Todas") return rankingDietas;
    return rankingDietas.filter(d => d.etapa === filtroEtapa);
  }, [rankingDietas, filtroEtapa]);

  const mostrarDemo = rankingDietas.length === 0;

  // Datos demo o reales filtrados
  const datosDietas = mostrarDemo ? [
    { nombre: "Mezcla Verano 2025", gmd: 850, etapa: "Desarrollo", ingredientes: "Soya, Maíz, Núcleo" },
    { nombre: "Engorde Plus", gmd: 790, etapa: "Engorde", ingredientes: "Sorgo, Aceite, Soya" }
  ] : dietasFiltradas.slice(0, 5);

  const datosInsumos = mostrarDemo ? [
    { nombre: "Harina de Soya", casosDeExito: 15 },
    { nombre: "Sorgo", casosDeExito: 10 }
  ] : insumosEstrella.slice(0, 4);

  const MEJOR_DIETA = datosDietas.length > 0 ? datosDietas[0] : null;
  const COLORES_PIE = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  return (
    <ProPaywall 
      tituloFeature="Inteligencia Nutricional 🧠" 
      descripcion="Descubre qué dietas e insumos han generado la mayor rentabilidad histórica en tu granja mediante análisis de datos."
    >
      <div className="inteligencia-page">
        <header className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h2>Motor de Inteligencia Nutricional 🧠🐷</h2>
            <p>Análisis histórico de conversión alimenticia y rendimiento por lote.</p>
          </div>
          
          {/* NUEVO FILTRO POR ETAPA */}
          <div className="filtro-container">
            <label style={{ fontWeight: 'bold', marginRight: '10px', color: '#475569' }}>🔍 Filtrar ranking por etapa:</label>
            <select 
              value={filtroEtapa} 
              onChange={(e) => setFiltroEtapa(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
            >
              <option value="Todas">🏆 Top Histórico General</option>
              <option value="Destete">Destete</option>
              <option value="Desarrollo">Desarrollo</option>
              <option value="Engorde">Engorde</option>
              <option value="Reproducción">Reproducción</option>
              <option value="Gestación">Gestación</option>
              <option value="Lactancia">Lactancia</option>
            </select>
          </div>
        </header>

        {loading ? (
          <p className="loading-text">Procesando años de historial de la granja...</p>
        ) : (
          <div className="dashboard-content">
            
            {/* TARJETA DE RECOMENDACIÓN INTELIGENTE */}
            {MEJOR_DIETA ? (
              <div className="card-recomendacion glow-effect">
                <div className="recomendacion-icon">💡</div>
                <div className="recomendacion-texto">
                  <h3>La Mejor Opción para {filtroEtapa === "Todas" ? "tu Granja" : filtroEtapa}</h3>
                  <p>
                    Revisando los registros de tus corrales, la comida <strong>"{MEJOR_DIETA.nombre}"</strong> es la que mejor te rinde para los cerdos en <strong>{MEJOR_DIETA.etapa}</strong>. 
                    Con esta mezcla, lograste que cada cerdo engordara unos <span className="highlight-green">{(MEJOR_DIETA.gmd / 1000).toFixed(2)} kilos diarios</span>.
                  </p>
                </div>
                {/* NUEVO BOTÓN FUNCIONAL */}
                <button className="btn-aplicar" onClick={() => setModalOpen(true)}>
                  📋 Ver Receta Completa
                </button>
              </div>
            ) : (
              <div className="card-recomendacion" style={{ background: '#f8fafc', borderLeftColor: '#94a3b8' }}>
                <div className="recomendacion-texto">
                  <h3>No hay datos para esta etapa</h3>
                  <p>Aún no has registrado pesajes o cerrado lotes en la etapa de <strong>{filtroEtapa}</strong>.</p>
                </div>
              </div>
            )}

            <div className="charts-grid">
              {/* GRÁFICO DE BARRAS */}
              <div className="chart-card">
                <h3>🏆 Top 5 Dietas {filtroEtapa !== "Todas" && `en ${filtroEtapa}`}</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosDietas} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="nombre" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tick={{ fill: '#64748b' }} />
                      <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.1)'}} contentStyle={{ borderRadius: '8px' }} />
                      <Bar dataKey="gmd" fill="#137E35" radius={[6, 6, 0, 0]} name="Gramos / Día" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GRÁFICO DE PASTEL */}
              <div className="chart-card">
                <h3>⭐ Insumos de Mayor Impacto</h3>
                <p className="chart-subtitle">Ingredientes repetidos en dietas exitosas.</p>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={datosInsumos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="casosDeExito" nameKey="nombre">
                        {datosInsumos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES_PIE[index % COLORES_PIE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* NUEVO MODAL DE DETALLES DE LA RECETA */}
        {isModalOpen && MEJOR_DIETA && (
          <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '16px', maxWidth: '400px', width: '90%' }}>
              <h3 style={{ color: '#0f172a', margin: '0 0 5px 0' }}>📋 Detalle de la Receta</h3>
              <p style={{ color: '#64748b', margin: '0 0 20px 0', fontSize: '0.9rem' }}>Lleva esta información a tu bodega de alimentos.</p>
              
              <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p><strong>Dieta:</strong> {MEJOR_DIETA.nombre}</p>
                <p><strong>Etapa Ideal:</strong> {MEJOR_DIETA.etapa}</p>
                <p><strong>Rendimiento Esperado:</strong> <span style={{ color: '#10b981', fontWeight: 'bold' }}>+{(MEJOR_DIETA.gmd / 1000).toFixed(2)} kilos al día por cerdo</span></p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#334155', marginBottom: '10px' }}>Ingredientes Clave a Mezclar:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {MEJOR_DIETA.ingredientes.split(',').map((ingrediente, i) => (
                    <span key={i} style={{ background: '#ede9fe', color: '#7c3aed', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {ingrediente.trim()}
                    </span>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setModalOpen(false)}
                style={{ width: '100%', background: '#0f172a', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
              >
                Cerrar Receta
              </button>
            </div>
          </div>
        )}

      </div>
    </ProPaywall>
  );
}