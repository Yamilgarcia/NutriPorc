import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../auth/logic/AuthContext"; 
import { subscribeToLotesFinanzas, subscribeToGastos, guardarGasto, eliminarGasto, updateGastoInm, procesarCierreLote } from "../data/finanzas.service";
import { subscribeToPesajes } from "../../monitoreoIA/data/pesajes.service"; 

export const useFinanzas = () => {
  const { user } = useAuth();
  const fincaId = user?.fincaId;

  // ESTADOS SEPARADOS PARA LOTES
  const [lotesActivos, setLotesActivos] = useState([]);
  const [lotesHistoricos, setLotesHistoricos] = useState([]);
  
  const [loteIdSeleccionado, setLoteIdSeleccionado] = useState("");
  const [transacciones, setTransacciones] = useState([]); 
  const [pesajesLoteActivo, setPesajesLoteActivo] = useState([]);
  const [procesandoCierre, setProcesandoCierre] = useState(false);

  useEffect(() => {
    if (!fincaId) return;
    const unsubscribe = subscribeToLotesFinanzas(fincaId, (todosLosLotes) => {
      // Separamos los lotes para las dos vistas del dashboard
      const activos = todosLosLotes.filter(l => l.estado === "Activo");
      const historicos = todosLosLotes.filter(l => l.estado === "Histórico");
      
      setLotesActivos(activos);
      setLotesHistoricos(historicos);

      // Auto-seleccionar lote activo
      setLoteIdSeleccionado(prev => {
        if (!prev && activos.length > 0) return activos[0].id;
        if (prev && !activos.find(l => l.id === prev)) return activos.length > 0 ? activos[0].id : "";
        return prev;
      });
    });
    return () => unsubscribe();
  }, [fincaId]);

  useEffect(() => {
    if (!fincaId || !loteIdSeleccionado) { setTransacciones([]); return; }
    const unsubscribe = subscribeToGastos(fincaId, loteIdSeleccionado, (lista) => setTransacciones(lista));
    return () => unsubscribe();
  }, [fincaId, loteIdSeleccionado]);

  useEffect(() => {
    if (!fincaId || !loteIdSeleccionado) { setPesajesLoteActivo([]); return; }
    const unsubscribe = subscribeToPesajes(loteIdSeleccionado, fincaId, (historial) => setPesajesLoteActivo(historial));
    return () => unsubscribe();
  }, [fincaId, loteIdSeleccionado]);

  const loteActivo = useMemo(() => lotesActivos.find(l => l.id === loteIdSeleccionado) || null, [lotesActivos, loteIdSeleccionado]);

  const pesoPromedio = useMemo(() => {
    if (pesajesLoteActivo.length > 0) return Number(pesajesLoteActivo[pesajesLoteActivo.length - 1].pesoPromedio || 0);
    if (loteActivo) {
      switch (loteActivo.etapa) {
        case "Destete": return 25;
        case "Desarrollo": return 70;
        case "Engorde": return 160;
        default: return 150;
      }
    }
    return 0;
  }, [pesajesLoteActivo, loteActivo]);

  // MATEMÁTICA LOTE ACTIVO
  const totalEgresos = useMemo(() => transacciones.filter(t => t.tipo !== "Ingreso").reduce((acc, t) => acc + Number(t.monto || 0), 0), [transacciones]);
  const totalIngresosParciales = useMemo(() => transacciones.filter(t => t.tipo === "Ingreso").reduce((acc, t) => acc + Number(t.monto || 0), 0), [transacciones]);
  const costoPorLibra = useMemo(() => {
    if (!loteActivo || loteActivo.cantidad <= 0 || pesoPromedio <= 0) return 0;
    return totalEgresos / (loteActivo.cantidad * pesoPromedio); 
  }, [totalEgresos, loteActivo, pesoPromedio]);

  // NUEVO: KPI GLOBALES (Para la pestaña de reportes)
  const metricasGlobales = useMemo(() => {
    let gananciaTotal = 0;
    let inversionTotal = 0;
    let cerdosVendidos = 0;

    lotesHistoricos.forEach(lote => {
      if (lote.finanzas) {
        gananciaTotal += (lote.finanzas.gananciaNeta || 0);
        inversionTotal += (lote.finanzas.gastosTotales || 0);
        cerdosVendidos += (lote.finanzas.poblacionFinal || 0);
      }
    });
    return { gananciaTotal, inversionTotal, cerdosVendidos };
  }, [lotesHistoricos]);

  // MUTACIONES
  const handleAgregarTransaccion = async (nuevaTransaccion) => {
    if (!fincaId || !loteIdSeleccionado) return;
    try { await guardarGasto(fincaId, loteIdSeleccionado, nuevaTransaccion); } catch (error) { console.error(error); }
  };
  const handleEditarTransaccion = async (id, datosActualizados) => {
    setTransacciones(prev => prev.map(t => t.id === id ? { ...t, ...datosActualizados, monto: Number(datosActualizados.monto) } : t));
    try { await updateGastoInm(id, datosActualizados); } catch (error) { console.error(error); }
  };
  const handleEliminarTransaccion = async (id) => {
    setTransacciones(prev => prev.filter(t => t.id !== id));
    try { await eliminarGasto(id); } catch (error) { console.error(error); }
  };

  const handleCerrarLote = async (ingresoFinal) => {
    if (!loteActivo) return;
    setProcesandoCierre(true);
    const gananciaNeta = (ingresoFinal + totalIngresosParciales) - totalEgresos;
    const resumenFinanciero = {
      gastosTotales: totalEgresos,
      ingresosParciales: totalIngresosParciales,
      ingresoVentaFinal: ingresoFinal,
      gananciaNeta: gananciaNeta,
      costoPorLibraCierre: costoPorLibra,
      poblacionFinal: loteActivo.cantidad
    };
    try {
      await procesarCierreLote(loteIdSeleccionado, resumenFinanciero);
      alert(`¡Lote archivado exitosamente!`);
    } catch (error) {
      console.error(error);
    } finally {
      setProcesandoCierre(false);
    }
  };

  return {
    lotesActivos, lotesHistoricos, loteActivo, loteIdSeleccionado, setLoteIdSeleccionado, transacciones,
    pesoPromedio, totalEgresos, totalIngresosParciales, costoPorLibra, procesandoCierre, metricasGlobales,
    handleAgregarTransaccion, handleEliminarTransaccion, handleEditarTransaccion, handleCerrarLote
  };
};