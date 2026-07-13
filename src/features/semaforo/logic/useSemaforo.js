import { useState, useEffect } from "react";
import { useAuth } from "../../auth/logic/AuthContext";
// Importamos getLotes de tu servicio existente
import { getLotes } from "../../lotes/data/lotes.service";
import { registrarAccionSanitaria, crearHistorialId } from "../data/semaforo.service";

export const useSemaforo = () => {
  const { user } = useAuth();
  
  const [lotesEvaluados, setLotesEvaluados] = useState([]);
  const [loading, setLoading] = useState(true);

  // ALGORITMO DE EVALUACIÓN EPIDEMIOLÓGICA
  const evaluarLotes = async () => {
    if (!user?.fincaId) return;
    setLoading(true);
    try {
      // 1. Traemos los lotes activos
      const lotesRaw = await getLotes(user.fincaId);
      const lotesActivos = lotesRaw.filter(l => l.estado === "Activo");

      const hoy = new Date();
      const tresDiasAtras = new Date(hoy);
      tresDiasAtras.setDate(hoy.getDate() - 3);

      const evaluados = lotesActivos.map(lote => {
        // Analizar Bajas
        const bajasTotales = lote.bajas || [];
        
        // Bajas en los últimos 3 días
        const bajasRecientes = bajasTotales.filter(b => new Date(b.fecha) >= tresDiasAtras);
        const cantidadBajasRecientes = bajasRecientes.reduce((acc, b) => acc + parseInt(b.cantidad, 10), 0);
        
        const poblacionCalculada = parseInt(lote.cantidad, 10) + cantidadBajasRecientes;
        const porcentajeMortalidadReciente = poblacionCalculada > 0 ? (cantidadBajasRecientes / poblacionCalculada) * 100 : 0;

        // LÓGICA DEL SEMÁFORO
        let estado = "Verde";
        let diagnostico = "El lote presenta parámetros de salud normales.";
        let accionRecomendada = "Continuar monitoreo habitual.";

        if (porcentajeMortalidadReciente >= 1) {
          estado = "Rojo";
          diagnostico = `¡Riesgo Alto! Se detectó un ${porcentajeMortalidadReciente.toFixed(1)}% de mortalidad en los últimos 3 días (${cantidadBajasRecientes} bajas recientes).`;
          accionRecomendada = "Aislar casos sospechosos e iniciar tratamiento veterinario urgente.";
        } else if (bajasTotales.length > 0) {
          estado = "Amarillo";
          diagnostico = `Observación. Se han registrado bajas históricas en este lote, aunque no críticas en los últimos 3 días.`;
          accionRecomendada = "Revisar calidad de agua, temperatura del galpón y comportamiento de los animales.";
        }

        return {
          ...lote,
          semaforo: estado,
          diagnostico,
          accionRecomendada,
          porcentajeMortalidadReciente
        };
      });

      // Ordenamos para que los Rojos salgan primero
      evaluados.sort((a, b) => {
        const valores = { "Rojo": 3, "Amarillo": 2, "Verde": 1 };
        return valores[b.semaforo] - valores[a.semaforo];
      });

      setLotesEvaluados(evaluados);
    } catch (error) {
      console.error("Error al evaluar semáforo:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    evaluarLotes();
  }, [user?.fincaId]);

  // Manejador para registrar tratamientos (UI Optimista)
  const handleAtenderAlerta = async (loteId, tipoAccion, medicamento, notas) => {
    const newId = crearHistorialId();
    const accionData = {
      loteId,
      tipo: tipoAccion, // "Tratamiento" o "Falsa Alarma"
      medicamento: medicamento || "N/A",
      notas,
      fecha: new Date().toISOString().split('T')[0]
    };

    // UI Optimista (Aquí podríamos pintar algo visual si tuviéramos historial en pantalla)
    try {
      await registrarAccionSanitaria(newId, accionData, user.fincaId);
      // Opcional: Re-evaluar para limpiar alertas si el algoritmo lo requiere
    } catch (error) {
      console.warn("Offline: Acción médica guardada en caché.");
    }
  };

  return {
    lotesEvaluados,
    loading,
    handleAtenderAlerta,
    recargarSemaforo: evaluarLotes
  };
};