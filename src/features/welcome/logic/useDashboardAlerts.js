import { useState, useEffect } from "react";
import { subscribeToLotes } from "../../lotes/data/lotes.service";
import { subscribeToPesajes } from "../../monitoreoIA/data/pesajes.service"; // Importamos la versión reactiva
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

    setLoadingAlertas(true);
    const unsubsPesajes = {}; // Almacén para las sub-suscripciones de pesajes por lote

    // Escuchamos los lotes en tiempo real
    const unLotes = subscribeToLotes(user.fincaId, async (listaLotes) => {
      const activos = listaLotes.filter(lote => lote.estado === "Activo");
      const precioVentaDefault = 1.50;
      const costoAlimentoDefault = 0.45;

      const mapaPesajesPorLote = {};

      // Cancelamos suscripciones anteriores de pesajes para evitar fugas de memoria
      Object.values(unsubsPesajes).forEach(unsub => unsub());

      if (activos.length === 0) {
        setAlertasOptimas([]);
        setLoadingAlertas(false);
        return;
      }

      // Creamos una función interna para recalcular las alertas globales del panel
      const ejecutarCalculoAlertas = () => {
        const alertas = [];
        activos.forEach(lote => {
          const pesajes = mapaPesajesPorLote[lote.id] || [];
          const resultado = calcularPuntoOptimoLote(lote, pesajes, precioVentaDefault, costoAlimentoDefault);

          if (resultado && resultado.diaOptimo) {
            const diasRestantes = resultado.diaOptimo.diaExt;
            if (diasRestantes >= 0 && diasRestantes <= 7) {
              alertas.push({
                loteId: lote.id,
                loteNombre: lote.nombre,
                diasRestantes,
                gananciaNeta: resultado.diaOptimo.gananciaNeta
              });
            }
          }
        });

        alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
        setAlertasOptimas(alertas);
        setLoadingAlertas(false);
      };

      // Para cada lote activo, nos suscribimos a sus pesajes en tiempo real
      activos.forEach(lote => {
        unsubsPesajes[lote.id] = subscribeToPesajes(lote.id, user.fincaId, (historialPesajes) => {
          mapaPesajesPorLote[lote.id] = historialPesajes;
          // Cada vez que un lote reciba un pesaje nuevo (online/offline), recalculamos el panel
          ejecutarCalculoAlertas();
        });
      });
    });

    // Limpieza masiva al desmontar el Dashboard
    return () => {
      unLotes();
      Object.values(unsubsPesajes).forEach(unsub => unsub());
    };
  }, [user?.fincaId]);

  return { alertasOptimas, loadingAlertas };
};