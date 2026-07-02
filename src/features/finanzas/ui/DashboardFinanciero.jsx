import "./finanzas.css"; 
import { FormGasto } from "./FormGasto";
import { TablaGastos } from "./TablaGastos";
import { FormCierreLote } from "./FormCierreLote";
import { useFinanzas } from "../logic/useFinanzas";

export const DashboardFinanciero = ({ pesoTotalEstimado = 147 }) => {
  const {
    lotes,
    loteIdSeleccionado,
    setLoteIdSeleccionado,
    gastos,
    isLoteCerrado,
    resultadoFinal,
    costoAcumulado,
    costoPorLibra,
    handleAgregarGasto,
    handleEliminarGasto,
    handleCerrarLote
  } = useFinanzas(pesoTotalEstimado);

  return (
    <div className="modulo-finanzas" style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      
      {/* SECCIÓN SUPERIOR: Título del módulo y Selector de Lotes Dinámicos */}
      <div style={{ marginBottom: "30px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <h2 style={{ fontSize: "24px", color: "#1e293b", margin: 0 }}>Control Financiero de Porcinos</h2>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>Gestión multi-lote en tiempo real</p>
        </div>

        {/* Menú Desplegable Multi-Lote */}
        <div style={{ minWidth: "220px" }}>
          <label className="np-label" style={{ display: "block", marginBottom: "6px" }}>Lote de Trabajo Activo</label>
          <select 
            className="np-input"
            value={loteIdSeleccionado}
            onChange={(e) => setLoteIdSeleccionado(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", cursor: "pointer" }}
          >
            {/* SOLUCIÓN: Agregamos (lotes || []) para evitar el error de undefined */}
            {(lotes || []).length === 0 ? (
              <option value="">No hay lotes registrados</option>
            ) : (
              (lotes || []).map((lote) => (
                <option key={lote.id} value={lote.id}>
                  {lote.nombre || lote.codigo || `Lote: ${lote.id.substring(0, 6)}`}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* RENDERIZADO CONDICIONAL: Solo muestra las finanzas si hay un lote seleccionado */}
      {loteIdSeleccionado ? (
        <>
          {/* Tarjetas de Resumen Financiero */}
          <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
            <div className="np-card" style={{ borderLeft: "4px solid #3b82f6", flex: 1 }}>
              <p className="np-label">Costo Acumulado Total</p>
              <h2 style={{ fontSize: "28px", color: "#0f172a" }}>C$ {costoAcumulado.toFixed(2)}</h2>
            </div>
            <div className="np-card" style={{ borderLeft: "4px solid #10b981", flex: 1 }}>
              <p className="np-label">Costo por Libra</p>
              <h2 style={{ fontSize: "28px", color: "#0f172a" }}>C$ {costoPorLibra.toFixed(2)}</h2>
            </div>
          </div>

          {!isLoteCerrado ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <FormGasto onAgregarGasto={handleAgregarGasto} />
              
              <TablaGastos 
                gastos={gastos} 
                onEliminarGasto={handleEliminarGasto} 
              />
              
              <FormCierreLote 
                gastosTotales={costoAcumulado} 
                onCerrarLote={handleCerrarLote} 
              />
            </div>
          ) : (
            <div className="np-card">
              <h3 style={{ color: "#10b981", marginTop: 0 }}>¡Lote Cerrado Exitosamente!</h3>
              <p style={{ margin: "10px 0 0 0", fontSize: "16px", color: "#1e293b" }}>
                <strong>Ganancia Neta del Periodo:</strong> C$ {resultadoFinal?.gananciaNeta.toFixed(2)}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="np-card" style={{ textAlign: "center", padding: "40px", color: "#64748b", borderStyle: "dashed" }}>
          Debe registrar o activar un lote porcino en el sistema para inicializar el análisis financiero.
        </div>
      )}
    </div>
  );
};