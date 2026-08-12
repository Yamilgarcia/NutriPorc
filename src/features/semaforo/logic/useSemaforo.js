import { useState, useEffect } from "react";
import { useAuth } from "../../auth/logic/AuthContext";
import { subscribeToLotes } from "../../lotes/data/lotes.service";
import { 
  registrarAccionSanitaria, 
  actualizarAccionSanitaria, 
  eliminarAccionSanitaria, 
  crearHistorialId, 
  subscribeToTodoHistorialSanitario 
} from "../data/semaforo.service";

export const useSemaforo = () => {
  const { user } = useAuth();
  
  const [lotesActivos, setLotesActivos] = useState([]);
  const [historialGlobal, setHistorialGlobal] = useState([]);
  const [lotesEvaluados, setLotesEvaluados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.fincaId) return;
    setLoading(true);
    const unsubscribe = subscribeToLotes(user.fincaId, (lotesRaw) => {
      setLotesActivos(lotesRaw.filter(l => l.estado === "Activo"));
    });
    return () => unsubscribe();
  }, [user?.fincaId]);

  useEffect(() => {
    if (!user?.fincaId) return;
    const unsubscribe = subscribeToTodoHistorialSanitario(user.fincaId, (historial) => {
      setHistorialGlobal(historial);
    });
    return () => unsubscribe();
  }, [user?.fincaId]);

  useEffect(() => {
    if (!lotesActivos) return;

    const hoy = new Date();
    const tresDiasAtras = new Date(hoy);
    tresDiasAtras.setDate(hoy.getDate() - 3);

    const evaluados = lotesActivos.map(lote => {
      const bajasTotales = lote.bajas || [];
      const bajasRecientes = bajasTotales.filter(b => new Date(b.fecha) >= tresDiasAtras);
      const cantidadBajasRecientes = bajasRecientes.reduce((acc, b) => acc + parseInt(b.cantidad, 10), 0);
      
      const poblacionCalculada = parseInt(lote.cantidad, 10) + cantidadBajasRecientes;
      const porcentajeMortalidadReciente = poblacionCalculada > 0 ? (cantidadBajasRecientes / poblacionCalculada) * 100 : 0;

      const historialDelLote = historialGlobal.filter(h => h.loteId === lote.id);

      let estado = "Verde";
      let diagnostico = "El lote presenta parámetros de salud normales.";
      let accionRecomendada = "Continuar monitoreo habitual.";

      if (porcentajeMortalidadReciente >= 1) {
        estado = "Rojo";
        diagnostico = `¡Riesgo Alto! Se detectó un ${porcentajeMortalidadReciente.toFixed(1)}% de mortalidad en los últimos 3 días (${cantidadBajasRecientes} bajas recientes).`;
        accionRecomendada = "Aislar casos sospechosos e iniciar tratamiento veterinario urgente.";
      } else if (bajasTotales.length > 0) {
        estado = "Amarillo";
        diagnostico = `Observación. Se han registrado bajas históricas, aunque no críticas en los últimos 3 días.`;
        accionRecomendada = "Revisar calidad de agua, temperatura del galpón y comportamiento de los animales.";
      }

      return {
        ...lote,
        semaforo: estado,
        diagnostico,
        accionRecomendada,
        historialMedico: historialDelLote
      };
    });

    evaluados.sort((a, b) => {
      const valores = { "Rojo": 3, "Amarillo": 2, "Verde": 1 };
      return valores[b.semaforo] - valores[a.semaforo];
    });

    setLotesEvaluados(evaluados);
    setLoading(false);
  }, [lotesActivos, historialGlobal]);

  const handleAtenderAlerta = async (loteId, tipoAccion, medicamento, notas) => {
    const newId = crearHistorialId();
    const accionData = {
      loteId,
      tipo: tipoAccion, 
      medicamento: medicamento || "N/A",
      notas: notas || "",
      fecha: new Date().toISOString().split('T')[0]
    };
    await registrarAccionSanitaria(newId, accionData, user.fincaId);
    return true; 
  };

  // NUEVO: Editar
  const handleEditarAlerta = async (id, tipoAccion, medicamento, notas) => {
    await actualizarAccionSanitaria(id, {
      tipo: tipoAccion, 
      medicamento: medicamento || "N/A",
      notas: notas || ""
    });
    return true;
  };

  // NUEVO: Eliminar
  const handleEliminarAlerta = async (id) => {
    await eliminarAccionSanitaria(id);
    return true;
  };

  return { lotesEvaluados, loading, handleAtenderAlerta, handleEditarAlerta, handleEliminarAlerta };
};