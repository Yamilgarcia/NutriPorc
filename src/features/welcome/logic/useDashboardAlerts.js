import { useState, useEffect } from "react";
import { getLotes } from "../../lotes/data/lotes.service"; 
import { getPesajesPorLote } from "../../monitoreoIA/data/pesajes.service";
import { calcularPuntoOptimoLote } from "../../maximizador/logic/calculadorOptimo";
import { useAuth } from "../../auth/logic/AuthContext";

export const useDashboardAlerts = () => {
  const { user } = useAuth();
  const [alertasOptimas, setAlertasOptimas] = useState([]);
  const [loadingAlertas, setLoadingAlertas] = useState(true);

  useEffect(() => {
    if (!user?.fincaId) {
      setAlertasOptimas([]);
      setLoadingAlertas(false);
      return;
    }

    const cargarAlertas = async () => {
      try {
        setLoadingAlertas(true);
        const listaLotes = await getLotes(user.fincaId);
        const activos = listaLotes.filter(lote => lote.estado === "Activo");
        
        const alertas = [];
        // Costos y precios promedios por defecto (o se podrían sacar de alguna config)
        const precioVentaDefault = 1.50;
        const costoAlimentoDefault = 0.45;

        for (const lote of activos) {
          const pesajes = await getPesajesPorLote(lote.id, user.fincaId);
          const resultado = calcularPuntoOptimoLote(lote, pesajes, precioVentaDefault, costoAlimentoDefault);
          
          if (resultado && resultado.diaOptimo) {
            const diasRestantes = resultado.diaOptimo.diaExt;
            
            // Si está en la semana óptima (0 a 7 días)
            if (diasRestantes >= 0 && diasRestantes <= 7) {
              alertas.push({
                loteId: lote.id,
                loteNombre: lote.nombre,
                diasRestantes,
                gananciaNeta: resultado.diaOptimo.gananciaNeta
              });
            }
          }
        }
        
        // Ordenar por urgencia (días restantes de menor a mayor)
        alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
        setAlertasOptimas(alertas);
        
      } catch (error) {
        console.error("Error al cargar alertas del dashboard:", error);
      } finally {
        setLoadingAlertas(false);
      }
    };

    cargarAlertas();
  }, [user?.fincaId]);

  return {
    alertasOptimas,
    loadingAlertas
  };
};
