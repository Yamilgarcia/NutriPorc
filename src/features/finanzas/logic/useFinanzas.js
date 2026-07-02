import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../../auth/logic/AuthContext"; 
// Importamos las funciones puras exactas que compartiste de tu finanzas.service
import { 
  obtenerLotesPorFinca, 
  obtenerGastosPorLote, 
  guardarGasto, 
  eliminarGasto 
} from "../data/finanzas.service";

export const useFinanzas = (pesoTotalEstimado) => {
  const { user } = useAuth();
  const fincaId = user?.fincaId; // Regla de Oro Multi-tenant

  // CRÍTICO: Inicializar siempre como arrays vacíos [] para evitar errores de 'undefined' en la UI
  const [lotes, setLotes] = useState([]);
  const [loteIdSeleccionado, setLoteIdSeleccionado] = useState("");
  const [gastos, setGastos] = useState([]);
  const [isLoteCerrado, setIsLoteCerrado] = useState(false);
  const [resultadoFinal, setResultadoFinal] = useState(null);

  /**
   * 1. Carga inicial de todos los lotes que pertenecen a la finca activa
   */
  useEffect(() => {
    const cargarLotes = async () => {
      if (!fincaId) return;
      try {
        const listaLotes = await obtenerLotesPorFinca(fincaId);
        // Garantizamos que si Firestore falla o viene vacío, guarde un array y no un undefined
        setLotes(listaLotes || []);
        
        // Auto-seleccionar el primer lote disponible para agilizar la UX del productor
        if (listaLotes && listaLotes.length > 0) {
          setLoteIdSeleccionado(listaLotes[0].id);
        }
      } catch (error) {
        console.error("Error en la carga inicial de lotes:", error);
        setLotes([]);
      }
    };
    cargarLotes();
  }, [fincaId]);

  /**
   * 2. Carga reactiva de los gastos del lote seleccionado
   */
  const cargarGastosDelLote = useCallback(async () => {
    if (!fincaId || !loteIdSeleccionado) {
      setGastos([]);
      return;
    }
    try {
      const datosGastos = await obtenerGastosPorLote(fincaId, loteIdSeleccionado);
      setGastos(datosGastos || []);
      
      // Resetear estados de cierre al cambiar de lote de trabajo
      setIsLoteCerrado(false);
      setResultadoFinal(null);
    } catch (error) {
      console.error("Error al cargar los gastos del lote seleccionado:", error);
      setGastos([]);
    }
  }, [fincaId, loteIdSeleccionado]);

  useEffect(() => {
    cargarGastosDelLote();
  }, [cargarGastosDelLote]);

  /**
   * 3. Cálculos financieros computados (useMemo para alto rendimiento)
   */
  const costoAcumulado = useMemo(() => {
    return gastos.reduce((total, gasto) => total + Number(gasto.monto || 0), 0);
  }, [gastos]);

  const costoPorLibra = useMemo(() => {
    return pesoTotalEstimado > 0 ? costoAcumulado / pesoTotalEstimado : 0;
  }, [costoAcumulado, pesoTotalEstimado]);

  /**
   * 4. Acciones de mutación expuestas a la interfaz
   */
  const handleAgregarGasto = async (nuevoGasto) => {
    if (!fincaId || !loteIdSeleccionado) return;
    try {
      const guardado = await guardarGasto(fincaId, loteIdSeleccionado, nuevoGasto);
      if (guardado) {
        setGastos(prev => [...prev, guardado]);
      }
    } catch (error) {
      console.error("Error en flujo handleAgregarGasto:", error);
    }
  };

  const handleEliminarGasto = async (id) => {
    try {
      const exito = await eliminarGasto(id);
      if (exito) {
        setGastos(prev => prev.filter(g => g.id !== id));
      }
    } catch (error) {
      console.error("Error en flujo handleEliminarGasto:", error);
    }
  };

  const handleCerrarLote = (datos) => {
    setIsLoteCerrado(true);
    setResultadoFinal(datos);
  };

  return {
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
  };
};