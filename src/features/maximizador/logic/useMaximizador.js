import { useState, useEffect, useMemo } from "react";
// REUTILIZAMOS tus suscriptores en tiempo real (Caché + Nube)
import { subscribeToLotes } from "../../lotes/data/lotes.service"; 
import { subscribeToPesajes } from "../../monitoreoIA/data/pesajes.service";
import { calcularPuntoOptimoLote } from "./calculadorOptimo";
import { useAuth } from "../../auth/logic/AuthContext";

export const useMaximizador = () => {
  const { user } = useAuth();
  const [lotes, setLotes] = useState([]);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState("");
  const [pesajes, setPesajes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingPesajes, setLoadingPesajes] = useState(false);

  // Configuración del simulador predictivo
  const [precioVenta, setPrecioVenta] = useState(41); 
  const [costoAlimento, setCostoAlimento] = useState(16.50); 
  const [diasSimulacion, setDiasSimulacion] = useState(0);

  // 1. ESCUCHA DE LOTES ACTIVO EN TIEMPO REAL (Offline-First)
  useEffect(() => {
    if (!user?.fincaId) return;
    setLoadingLotes(true);

    const unsubscribe = subscribeToLotes(user.fincaId, (listaLotes) => {
      const activos = listaLotes.filter(lote => 
        lote.estado === "Activo" &&
        (!lote.etapa || ['Destete', 'Desarrollo', 'Engorde', 'Reproducción', 'Gestación', 'Lactancia'].includes(lote.etapa))
      );
      setLotes(activos);
      
      // Auto-selección inteligente del primer lote disponible
      setLoteSeleccionadoId((prevId) => {
        if (!prevId && activos.length > 0) return activos[0].id;
        if (prevId && !activos.find(l => l.id === prevId)) return activos.length > 0 ? activos[0].id : "";
        return prevId;
      });
      setLoadingLotes(false);
    });

    return () => unsubscribe();
  }, [user?.fincaId]);

  // 2. ESCUCHA DE PESAJES DEL LOTE SELECCIONADO EN TIEMPO REAL (Offline-First)
  useEffect(() => {
    if (!loteSeleccionadoId || !user?.fincaId) {
      setPesajes([]);
      setLoadingPesajes(false);
      return;
    }
    setLoadingPesajes(true);

    const unsubscribe = subscribeToPesajes(loteSeleccionadoId, user.fincaId, (historialPesajes) => {
      setPesajes(historialPesajes);
      setLoadingPesajes(false);
    });

    return () => unsubscribe();
  }, [loteSeleccionadoId, user?.fincaId]);

  // 3. CÁLCULO PREDICTIVO EN MEMORIA LOCAL (Latencia 0ms)
  const simulacion = useMemo(() => {
    const lote = lotes.find(l => l.id === loteSeleccionadoId);
    const resultado = calcularPuntoOptimoLote(lote, pesajes, precioVenta, costoAlimento);
    if (!resultado) return null;

    const diaSeleccionado = resultado.historial[diasSimulacion];

    return {
      historial: resultado.historial,
      diaOptimo: resultado.diaOptimo,
      diaSeleccionado
    };
  }, [lotes, loteSeleccionadoId, pesajes, precioVenta, costoAlimento, diasSimulacion]);

  return {
    lotes,
    loteSeleccionadoId,
    setLoteSeleccionadoId,
    pesajes,
    loadingLotes,
    loadingPesajes,
    precioVenta, setPrecioVenta,
    costoAlimento, setCostoAlimento,
    diasSimulacion, setDiasSimulacion,
    simulacion
  };
};