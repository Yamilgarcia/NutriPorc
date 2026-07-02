import { useState, useMemo, useEffect } from "react";
import "./finanzas.css"; 
// Asegúrate de que las rutas relativas sean correctas según tu estructura UI/components
import { FormGasto } from "./components/FormGasto";
import { TablaGastos } from "./components/TablaGastos";
import { FormCierreLote } from "./components/FormCierreLote";
// Ajusta esta ruta a tu carpeta data: ../../data/finanzas.service
import { guardarGasto, obtenerGastosPorLote, eliminarGasto } from "../../finanzas/data/finanzas.service";

export const DashboardFinanciero = ({ loteId = "LOTE-001", pesoTotalEstimado = 147 }) => {
  const [gastos, setGastos] = useState([]);
  const [isLoteCerrado, setIsLoteCerrado] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  // Carga de datos desde Firestore
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const datos = await obtenerGastosPorLote(loteId);
        setGastos(datos);
      } catch (error) {
        console.error("Error al cargar gastos:", error);
        setGastos([]);
      }
    };
    cargarDatos();
  }, [loteId]);

  const costoAcumulado = useMemo(() => {
    return gastos.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);
  }, [gastos]);

  const costoPorLibra = useMemo(() => {
    return pesoTotalEstimado > 0 ? costoAcumulado / pesoTotalEstimado : 0;
  }, [costoAcumulado, pesoTotalEstimado]);

  const handleAgregarGasto = async (nuevoGasto) => {
    // Se envía el gasto con el loteId adjunto para mantener la relación en Firestore
    const gastoConLote = { ...nuevoGasto, loteId };
    const guardado = await guardarGasto(gastoConLote);
    setGastos(prev => [...prev, guardado]);
  };

  const handleEliminar = async (id) => {
    await eliminarGasto(id);
    setGastos(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="modulo-finanzas" style={{ padding: "24px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ marginBottom: "30px" }}>
        <h2 style={{ fontSize: "24px", color: "#1e293b" }}>Control Financiero: {loteId}</h2>
      </div>

      {/* Tarjetas de Resumen */}
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
            onEliminarGasto={handleEliminar} 
          />
          <FormCierreLote 
            gastosTotales={costoAcumulado} 
            onCerrarLote={(datos) => { setIsLoteCerrado(true); setResultadoFinal(datos); }} 
          />
        </div>
      ) : (
        <div className="np-card">
          <h3>¡Lote Cerrado!</h3>
          <p>Ganancia Neta: C$ {resultadoFinal?.gananciaNeta.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};