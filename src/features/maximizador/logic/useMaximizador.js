import { useState, useEffect, useMemo } from "react";
import { getLotes } from "../../lotes/data/lotes.service"; 
import { getPesajesPorLote } from "../../monitoreoIA/data/pesajes.service";
import { calcularPuntoOptimoLote } from "./calculadorOptimo";

export const useMaximizador = () => {
  const [lotes, setLotes] = useState([]);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState("");
  const [pesajes, setPesajes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingPesajes, setLoadingPesajes] = useState(false);

  // Configuración del simulador
  const [precioVenta, setPrecioVenta] = useState(41); // C$ 41 promedio en pie (C$ 33 - 49)
  const [costoAlimento, setCostoAlimento] = useState(16.50); // C$ 16.50 aprox por lb de alimento
  const [diasSimulacion, setDiasSimulacion] = useState(0);

  useEffect(() => {
    const cargarLotes = async () => {
      try {
        setLoadingLotes(true);
        const listaLotes = await getLotes();
        const activos = listaLotes.filter(lote => 
          lote.estado === "Activo" &&
          (!lote.etapa || ['Destete', 'Desarrollo', 'Engorde'].includes(lote.etapa))
        );
        setLotes(activos);
        
        if (activos.length > 0) {
          setLoteSeleccionadoId(activos[0].id);
        }
      } catch (error) {
        console.error("Error al cargar lotes para maximizador:", error);
      } finally {
        setLoadingLotes(false);
      }
    };
    cargarLotes();
  }, []);

  useEffect(() => {
    if (!loteSeleccionadoId) return;
    const cargarHistorial = async () => {
      try {
        setLoadingPesajes(true);
        const historial = await getPesajesPorLote(loteSeleccionadoId);
        setPesajes(historial);
      } catch (error) {
        console.error("Error al cargar historial de pesajes para maximizador:", error);
      } finally {
        setLoadingPesajes(false);
      }
    };
    cargarHistorial();
  }, [loteSeleccionadoId]);

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
