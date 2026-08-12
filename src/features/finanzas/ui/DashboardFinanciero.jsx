import "./finanzas.css";
import { useState, useMemo } from "react";
import { useFinanzas } from "../logic/useFinanzas";

export const DashboardFinanciero = () => {
  const {
    lotesActivos,
    lotesHistoricos,
    loteActivo,
    loteIdSeleccionado,
    setLoteIdSeleccionado,
    transacciones,
    pesoPromedio,
    totalEgresos,
    totalIngresosParciales,
    costoPorLibra,
    procesandoCierre,
    handleAgregarTransaccion,
    handleEliminarTransaccion,
    handleEditarTransaccion,
    handleCerrarLote,
  } = useFinanzas();

  const [vistaActiva, setVistaActiva] = useState("operacion"); // "operacion" | "reportes"

  // ==========================================
  // ESTADOS PARA FILTROS DE REPORTES HISTÓRICOS
  // ==========================================
  const [filtroAnio, setFiltroAnio] = useState("Todos");
  const [filtroMes, setFiltroMes] = useState("Todos");
  const [busquedaLote, setBusquedaLote] = useState("");

  // Obtener años únicos para el select de filtros
  const aniosDisponibles = useMemo(() => {
    const anios = lotesHistoricos
      .filter(l => l.fechaCierre)
      .map(l => new Date(l.fechaCierre).getFullYear().toString());
    return ["Todos", ...new Set(anios)].sort((a, b) => b.localeCompare(a));
  }, [lotesHistoricos]);

  // Aplicar filtros al historial
  const historialFiltrado = useMemo(() => {
    return lotesHistoricos.filter((lote) => {
      if (!lote.fechaCierre) return false;
      const fecha = new Date(lote.fechaCierre);
      const anioLote = fecha.getFullYear().toString();
      const mesLote = (fecha.getMonth() + 1).toString().padStart(2, "0");

      const cumpleAnio = filtroAnio === "Todos" || anioLote === filtroAnio;
      const cumpleMes = filtroMes === "Todos" || mesLote === filtroMes;
      const cumpleBusqueda = lote.nombre.toLowerCase().includes(busquedaLote.toLowerCase());

      return cumpleAnio && cumpleMes && cumpleBusqueda;
    }).sort((a, b) => new Date(b.fechaCierre) - new Date(a.fechaCierre));
  }, [lotesHistoricos, filtroAnio, filtroMes, busquedaLote]);

  // Recalcular KPIs basados SOLO en los lotes filtrados
  const metricasFiltradas = useMemo(() => {
    let gananciaTotal = 0;
    let inversionTotal = 0;
    let cerdosVendidos = 0;

    historialFiltrado.forEach(lote => {
      if (lote.finanzas) {
        gananciaTotal += (lote.finanzas.gananciaNeta || 0);
        inversionTotal += (lote.finanzas.gastosTotales || 0);
        cerdosVendidos += (lote.finanzas.poblacionFinal || 0);
      }
    });
    return { gananciaTotal, inversionTotal, cerdosVendidos };
  }, [historialFiltrado]);

  return (
    <div className="modulo-finanzas" style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", color: "#1e293b", margin: 0 }}>Libro Mayor y Rentabilidad</h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
            Controla tu inversión y analiza tus reportes de ganancias.
          </p>
        </div>
      </div>

      {/* INTERRUPTOR DE PESTAÑAS (TABS) */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "2px solid #e2e8f0" }}>
        <button 
          onClick={() => setVistaActiva("operacion")}
          style={{ padding: "10px 20px", fontSize: "15px", fontWeight: "bold", border: "none", backgroundColor: "transparent", borderBottom: vistaActiva === "operacion" ? "3px solid #8F1914" : "3px solid transparent", color: vistaActiva === "operacion" ? "#8F1914" : "#64748b", cursor: "pointer", transition: "all 0.2s" }}
        >
          🐖 Operación Actual
        </button>
        <button 
          onClick={() => setVistaActiva("reportes")}
          style={{ padding: "10px 20px", fontSize: "15px", fontWeight: "bold", border: "none", backgroundColor: "transparent", borderBottom: vistaActiva === "reportes" ? "3px solid #137E35" : "3px solid transparent", color: vistaActiva === "reportes" ? "#137E35" : "#64748b", cursor: "pointer", transition: "all 0.2s" }}
        >
          📊 Historial y Reportes
        </button>
      </div>

      {/* =========================================
          VISTA 1: OPERACIÓN ACTUAL (DÍA A DÍA)
          ========================================= */}
      {vistaActiva === "operacion" && (
        <>
          <div style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: "250px" }}>
              <label className="np-label">Seleccionar Lote Activo</label>
              <select
                className="np-input" value={loteIdSeleccionado}
                onChange={(e) => setLoteIdSeleccionado(e.target.value)} style={{ fontWeight: "bold" }}
              >
                {lotesActivos.length === 0 ? <option value="">No hay lotes activos</option> : 
                  lotesActivos.map((lote) => <option key={lote.id} value={lote.id}>{lote.nombre} ({lote.cantidad} cerdos)</option>)}
              </select>
            </div>
          </div>

          {loteActivo ? (
            <>
              <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
                <div className="np-card" style={{ flex: 1, backgroundColor: "#ffffff" }}>
                  <p className="np-label" style={{ color: "#000000" }}>Estado de Biomasa Real</p>
                  <h4 style={{ margin: "12px 0 6px 0", fontSize: "16px", color: "#000000a9" }}>
                    Peso Actual: <strong style={{ color: "#000000" }}>{pesoPromedio} lbs</strong> / cerdo
                  </h4>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                    Masa estimada: <strong>{loteActivo.cantidad * pesoPromedio} lbs</strong> en corral.
                  </p>
                  <span style={{ fontSize: "11px", display: "inline-block", marginTop: "10px", backgroundColor: "#8f181480", color: "#000000", padding: "2px 6px", borderRadius: "4px", fontWeight: "500" }}>Sincronizado con Monitoreo</span>
                </div>

                <div className="np-card" style={{ borderLeft: "4px solid #8f1814d0", flex: 1 }}>
                  <p className="np-label">Inversión Total (Gastos)</p>
                  <h2 style={{ fontSize: "32px", color: "#0f172a", margin: "10px 0" }}>C$ {totalEgresos.toFixed(2)}</h2>
                  {totalIngresosParciales > 0 && (
                    <p style={{ margin: 0, fontSize: "12px", color: "#10b981", fontWeight: "600" }}>+ C$ {totalIngresosParciales.toFixed(2)} en ventas previas</p>
                  )}
                </div>

                <div className="np-card" style={{ borderLeft: "4px solid #137e35de", flex: 1 }}>
                  <p className="np-label" title="Gastos / Libras Totales">Costo de Prod. por Libra</p>
                  <h2 style={{ fontSize: "32px", color: "#0f172a", margin: "10px 0" }}>C$ {costoPorLibra.toFixed(2)}</h2>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <FormTransaccion onAgregar={handleAgregarTransaccion} />
                <TablaTransacciones transacciones={transacciones} onEliminar={handleEliminarTransaccion} onEditar={handleEditarTransaccion} />
                <FormCierreLote gastosTotales={totalEgresos} ingresosPrevios={totalIngresosParciales} onCerrarLote={handleCerrarLote} isProcessing={procesandoCierre} />
              </div>
            </>
          ) : (
            <div className="np-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", borderStyle: "dashed" }}>
              No hay lotes activos en este momento. Registra un nuevo lote en el módulo de Inventario para iniciar el control financiero.
            </div>
          )}
        </>
      )}

      {/* =========================================
          VISTA 2: HISTORIAL Y REPORTES GLOBALES
          ========================================= */}
      {vistaActiva === "reportes" && (
        <div>
          {/* BARRA DE FILTROS DE REPORTES */}
          <div className="np-card" style={{ marginBottom: "20px", display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "flex-end", backgroundColor: "#137e3571" }}>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label className="np-label">Filtrar por Año</label>
              <select className="np-input" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
                {aniosDisponibles.map(anio => <option key={anio} value={anio}>{anio}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: "150px" }}>
              <label className="np-label">Filtrar por Mes</label>
              <select className="np-input" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
                <option value="Todos">Todos los meses</option>
                <option value="01">Enero</option>
                <option value="02">Febrero</option>
                <option value="03">Marzo</option>
                <option value="04">Abril</option>
                <option value="05">Mayo</option>
                <option value="06">Junio</option>
                <option value="07">Julio</option>
                <option value="08">Agosto</option>
                <option value="09">Septiembre</option>
                <option value="10">Octubre</option>
                <option value="11">Noviembre</option>
                <option value="12">Diciembre</option>
              </select>
            </div>
            <div style={{ flex: 2, minWidth: "200px" }}>
              <label className="np-label">Buscar por Lote</label>
              <input type="text" className="np-input" placeholder="Ej. Lote San José..." value={busquedaLote} onChange={e => setBusquedaLote(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", gap: "20px", marginBottom: "30px", flexWrap: "wrap" }}>
            <div className="np-card" style={{ flex: 1, borderTop: "4px solid #8F1914", backgroundColor: "#ffd0ce70" }}>
              <p className="np-label" style={{ color: "#000000" }}>Ganancia Neta (Periodo)</p>
              <h2 style={{ fontSize: "32px", color: metricasFiltradas.gananciaTotal >= 0 ? "#8F1914" : "#991b1b", margin: "10px 0" }}>
                C$ {metricasFiltradas.gananciaTotal.toFixed(2)}
              </h2>
            </div>
            <div className="np-card" style={{ flex: 1, borderTop: "4px solid #137E35", backgroundColor: "#c7ffd8" }}>
              <p className="np-label" style={{ color: "#000000" }}>Total Invertido (Periodo)</p>
              <h2 style={{ fontSize: "32px", color: "#137E35", margin: "10px 0" }}>C$ {metricasFiltradas.inversionTotal.toFixed(2)}</h2>
            </div>
            <div className="np-card" style={{ flex: 1, borderTop: "4px solid #F49F97", backgroundColor: "#ffc8c3" }}>
              <p className="np-label" style={{ color: "#000000" }}>Cerdos Vendidos (Periodo)</p>
              <h2 style={{ fontSize: "32px", color: "#F49F97", margin: "10px 0" }}>{metricasFiltradas.cerdosVendidos} 🐷</h2>
            </div>
          </div>

          <div className="np-card" style={{ padding: "0" }}>
            <h3 style={{ padding: "15px 20px", margin: 0, borderBottom: "1px solid #e5e7eb", color: "#334155" }}>Registro de Lotes Finalizados</h3>
            <div style={{ overflowX: "auto" }}>
              <table className="np-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px" }}>Fecha de Cierre</th>
                    <th style={{ padding: "12px" }}>Nombre del Lote</th>
                    <th style={{ padding: "12px" }}>Cerdos</th>
                    <th style={{ padding: "12px" }}>Costo Total</th>
                    <th style={{ padding: "12px" }}>Ingresos Totales</th>
                    <th style={{ padding: "12px" }}>Rentabilidad Final</th>
                  </tr>
                </thead>
                <tbody>
                  {historialFiltrado.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No hay lotes que coincidan con tus filtros.</td></tr>
                  ) : (
                    historialFiltrado.map((lote) => {
                      const ingresosTotales = (lote.finanzas?.ingresoVentaFinal || 0) + (lote.finanzas?.ingresosParciales || 0);
                      const ganancia = lote.finanzas?.gananciaNeta || 0;
                      return (
                        <tr key={lote.id} style={{ borderTop: "1px solid #eee" }}>
                          <td style={{ padding: "12px" }}>{lote.fechaCierre ? new Date(lote.fechaCierre).toLocaleDateString() : "-"}</td>
                          <td style={{ padding: "12px", fontWeight: "600" }}>{lote.nombre}</td>
                          <td style={{ padding: "12px" }}>{lote.finanzas?.poblacionFinal || lote.cantidad}</td>
                          <td style={{ padding: "12px", color: "#ef4444" }}>C$ {(lote.finanzas?.gastosTotales || 0).toFixed(2)}</td>
                          <td style={{ padding: "12px", color: "#3b82f6" }}>C$ {ingresosTotales.toFixed(2)}</td>
                          <td style={{ padding: "12px", fontWeight: "bold", color: ganancia >= 0 ? "#10b981" : "#ef4444" }}>
                            {ganancia > 0 ? "+" : ""}C$ {ganancia.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// COMPONENTE: FORMULARIO MULTI-TRANSACCIÓN
const FormTransaccion = ({ onAgregar }) => {
  const [tipo, setTipo] = useState("Egreso");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Vacunas/Medicinas");

  const categoriasGasto = ["Vacunas/Medicinas", "Alimento", "Jornal", "Transporte", "Mantenimiento", "Otros"];
  const categoriasIngreso = ["Venta de Cerdo (Parcial)", "Venta de Subproducto", "Ajuste a favor", "Otros"];

  const handleTipoChange = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setCategoria(nuevoTipo === "Egreso" ? "Vacunas/Medicinas" : "Venta de Cerdo (Parcial)");
    if(nuevoTipo === "Ingreso") setConcepto("Venta de 1 cerdo");
    else setConcepto("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!concepto || isNaN(parseFloat(monto))) return;
    onAgregar({ tipo, concepto, monto: parseFloat(monto), categoria });
    setConcepto(""); setMonto("");
  };

  return (
    <div className="np-card" style={{ borderStyle: "dashed", borderColor: tipo === "Egreso" ? "#fca5a5" : "#86efac" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
          <span style={{ color: tipo === "Egreso" ? "#8F1914" : "#137E35" }}>{tipo === "Egreso" ? "📉" : "📈"}</span> 
          Registrar Transacción
        </h3>
        <div style={{ display: "flex", gap: "5px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "8px" }}>
          <button type="button" onClick={() => handleTipoChange("Egreso")} style={{ padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px", backgroundColor: tipo === "Egreso" ? "#ef4444" : "transparent", color: tipo === "Egreso" ? "white" : "#64748b" }}>
            Registrar Gasto
          </button>
          <button type="button" onClick={() => handleTipoChange("Ingreso")} style={{ padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "600", fontSize: "13px", backgroundColor: tipo === "Ingreso" ? "#10b981" : "transparent", color: tipo === "Ingreso" ? "white" : "#64748b" }}>
            Venta Parcial
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <label className="np-label">Categoría</label>
          <select className="np-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {(tipo === "Egreso" ? categoriasGasto : categoriasIngreso).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ flex: "2", minWidth: "200px" }}>
          <label className="np-label">Concepto / Descripción</label>
          <input type="text" className="np-input" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder={tipo === "Egreso" ? "Ej. Hierro y Vitaminas" : "Ej. Venta a don Juan"} required />
        </div>
        <div style={{ flex: "1", minWidth: "120px" }}>
          <label className="np-label">Monto (C$)</label>
          <input type="number" step="0.01" className="np-input" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" required min="1" />
        </div>
        <div>
          <button type="submit" className="np-btn-primary" style={{ backgroundColor: tipo === "Egreso" ? "#ef4444" : "#10b981" }}>
            Guardar {tipo}
          </button>
        </div>
      </form>
    </div>
  );
};

// COMPONENTE: TABLA DE TRANSACCIONES CON FILTRO DE CATEGORÍA
const TablaTransacciones = ({ transacciones = [], onEliminar, onEditar }) => {
  const [editandoId, setEditandoId] = useState(null);
  const [formEdit, setFormEdit] = useState({ concepto: "", monto: "", categoria: "", tipo: "" });
  const [filtroCat, setFiltroCat] = useState("Todas"); // NUEVO FILTRO PARA LA TABLA

  const iniciarEdicion = (t) => {
    setEditandoId(t.id);
    setFormEdit({ concepto: t.concepto, monto: t.monto, categoria: t.categoria, tipo: t.tipo || "Egreso" });
  };

  const guardarEdicion = (id) => {
    if (!formEdit.concepto.trim() || isNaN(parseFloat(formEdit.monto))) return;
    onEditar(id, formEdit);
    setEditandoId(null);
  };

  const transaccionesFiltradas = filtroCat === "Todas" 
    ? transacciones 
    : transacciones.filter(t => t.categoria === filtroCat);

  return (
    <div className="np-card" style={{ padding: "0" }}>
      <div style={{ padding: "15px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", flexWrap: "wrap", gap: "10px" }}>
        <h3 style={{ margin: 0, color: "#334155" }}>Libro de Movimientos</h3>
        
        {/* FILTRO DE CATEGORÍA EN LA TABLA */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "13px", color: "#64748b", fontWeight: "bold" }}>Ver solo:</label>
          <select className="np-input" style={{ padding: "4px 8px", width: "auto" }} value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}>
            <option value="Todas">Todas las transacciones</option>
            <option value="Alimento">Alimento</option>
            <option value="Vacunas/Medicinas">Vacunas/Medicinas</option>
            <option value="Jornal">Jornal</option>
            <option value="Venta de Cerdo (Parcial)">Ventas Parciales</option>
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="np-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: "12px" }}>Fecha</th>
              <th style={{ padding: "12px" }}>Tipo</th>
              <th style={{ padding: "12px" }}>Categoría / Concepto</th>
              <th style={{ padding: "12px" }}>Monto</th>
              <th style={{ textAlign: "center", padding: "12px" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {transaccionesFiltradas.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No hay registros financieros que coincidan.</td></tr>
            ) : (
              transaccionesFiltradas.map((t) => {
                const esFilaEditable = editandoId === t.id;
                const esIngreso = t.tipo === "Ingreso";
                
                return (
                  <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: "12px" }}>{t.fecha ? new Date(t.fecha).toLocaleDateString() : "-"}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ backgroundColor: esIngreso ? "#ecfdf5" : "#fef2f2", color: esIngreso ? "#059669" : "#dc2626", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
                        {esIngreso ? "INGRESO" : "GASTO"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      {esFilaEditable ? (
                        <input type="text" className="np-input" style={{ padding: "4px" }} value={formEdit.concepto} onChange={e => setFormEdit({ ...formEdit, concepto: e.target.value })} />
                      ) : (
                        <div><strong>{t.categoria}</strong><br/><span style={{fontSize: "12px", color: "#64748b"}}>{t.concepto}</span></div>
                      )}
                    </td>
                    <td style={{ padding: "12px", fontWeight: "600", color: esIngreso ? "#10b981" : "#0f172a" }}>
                      {esFilaEditable ? (
                        <input type="number" className="np-input" style={{ padding: "4px", width: "100px" }} value={formEdit.monto} onChange={e => setFormEdit({ ...formEdit, monto: e.target.value })} />
                      ) : (
                
                        <>{esIngreso ? "+" : "-"} C$ {Number(t.monto || 0).toFixed(2)}</>

                        
                      )}
                    </td>
                    <td style={{ textAlign: "center", padding: "12px" }}>
                      {esFilaEditable ? (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button className="np-btn-action-table success" onClick={() => guardarEdicion(t.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Guardar
                          </button>
                          <button className="np-btn-action-table" onClick={() => setEditandoId(null)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                          <button className="np-btn-action-table warning" onClick={() => iniciarEdicion(t)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            Editar
                          </button>
                          <button className="np-btn-action-table danger" onClick={() => onEliminar(t.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                            Anular
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// SIMULADOR DE CIERRE MEJORADO
const FormCierreLote = ({ gastosTotales, ingresosPrevios, onCerrarLote, isProcessing }) => {
  const [precioVenta, setPrecioVenta] = useState("");
  const [previsualizacion, setPrevisualizacion] = useState(null);

  const handleCalcularRendimiento = (e) => {
    e.preventDefault();
    const ingresoFinal = parseFloat(precioVenta);
    if (isNaN(ingresoFinal) || ingresoFinal <= 0) return;

    const gananciaNeta = (ingresoFinal + ingresosPrevios) - gastosTotales;
    setPrevisualizacion({ ingresoFinal, gananciaNeta, esRentable: gananciaNeta >= 0 });
  };

  const handleConfirmarCierre = () => {
    if (!previsualizacion) return;
    onCerrarLote(previsualizacion.ingresoFinal);
    setPrevisualizacion(null);
    setPrecioVenta("");
  };

  return (
    <div className="np-card" style={{ backgroundColor: "#f8fafc", border: "1px solid #cbd5e1" }}>
      <h3 style={{ color: "#334155", marginTop: 0, marginBottom: "15px", fontSize: "18px" }}>Venta y Cierre de Lote</h3>
      <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
        Simula tu cierre final ingresando el dinero que recibiste por los cerdos que quedan en el corral.
      </p>

      <form onSubmit={handleCalcularRendimiento} style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: previsualizacion ? "20px" : "0" }}>
        <div>
          <label className="np-label">Ingreso Final por Venta (C$)</label>
          <input type="number" step="0.01" className="np-input" style={{ width: "250px" }} value={precioVenta} onChange={(e) => { setPrecioVenta(e.target.value); if (previsualizacion) setPrevisualizacion(null); }} placeholder="Ej. 45000.00" required disabled={isProcessing} min="1" />
        </div>
        <button type="submit" className="np-btn-primary" style={{ backgroundColor: "#F49F97", height: "42px" }} disabled={isProcessing}>
          Calcular Rendimiento
        </button>
      </form>

      {previsualizacion && (
        <div style={{ marginTop: "15px", padding: "20px", borderRadius: "6px", backgroundColor: previsualizacion.esRentable ? "#ecfdf5" : "#fff5f5", border: `1px solid ${previsualizacion.esRentable ? "#a7f3d0" : "#feb2b2"}` }}>
          <h4 style={{ margin: "0 0 15px 0", color: previsualizacion.esRentable ? "#065f46" : "#9b2c2c", fontSize: "16px" }}>📊 Balance de Cierre de Lote</h4>
          
          <div style={{ display: "flex", gap: "30px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Venta Final</span>
              <strong style={{ fontSize: "16px", color: "#1e293b" }}>C$ {previsualizacion.ingresoFinal.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>+ Ventas Parciales Previas</span>
              <strong style={{ fontSize: "16px", color: "#10b981" }}>C$ {ingresosPrevios.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>- Total Invertido (Gastos)</span>
              <strong style={{ fontSize: "16px", color: "#ef4444" }}>C$ {gastosTotales.toFixed(2)}</strong>
            </div>
            <div style={{ borderLeft: "2px solid #cbd5e1", paddingLeft: "20px" }}>
              <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>{previsualizacion.esRentable ? "Ganancia Neta" : "Pérdida Neta"}</span>
              <strong style={{ fontSize: "20px", color: previsualizacion.esRentable ? "#10b981" : "#ef4444" }}>C$ {previsualizacion.gananciaNeta.toFixed(2)}</strong>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" className="np-btn-primary" style={{ backgroundColor: previsualizacion.esRentable ? "#10b981" : "#ef4444", height: "38px" }} onClick={handleConfirmarCierre} disabled={isProcessing}>
              {isProcessing ? "Archivando..." : "✔️ Confirmar y Archivar Lote"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};