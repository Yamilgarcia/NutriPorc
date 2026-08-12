import { useState, useEffect } from "react";
import { useAuth } from "../../auth/logic/AuthContext";
import { getLotes } from "../../lotes/data/lotes.service";
export const useInteligencia = () => {
  const { user } = useAuth();
  const [rankingDietas, setRankingDietas] = useState([]);
  const [insumosEstrella, setInsumosEstrella] = useState([]);
  const [loading, setLoading] = useState(true);

  const procesarInteligenciaNutricional = async () => {
    if (!user?.fincaId) return;
    setLoading(true);

    try {
      const todosLosLotes = await getLotes(user.fincaId);
      let analisisDietas = [];
      let conteoInsumosExitosos = {};

      todosLosLotes.forEach(lote => {
        // 1. EVALUAR PESAJES INTERMEDIOS (Lotes Activos)
        if (lote.pesajes && lote.pesajes.length > 0) {
          let pesoAnterior = 20; // Peso base estimado
          let fechaAnterior = new Date(lote.fechaInicio);

          lote.pesajes.forEach(p => {
            const fechaActual = new Date(p.fecha);
            let dias = Math.floor((fechaActual - fechaAnterior) / (1000 * 60 * 60 * 24));
            if (dias <= 0) dias = 1; 

            const gmd = ((p.peso - pesoAnterior) / dias) * 1000;

            // NUEVO: Guardamos los ingredientes en el análisis
            analisisDietas.push({ 
              nombre: p.dieta, 
              etapa: lote.etapa, 
              gmd: gmd,
              ingredientes: p.ingredientes ? p.ingredientes.join(", ") : "Ingredientes no especificados"
            });

            if (gmd > 500 && p.ingredientes) { 
              p.ingredientes.forEach(ing => {
                conteoInsumosExitosos[ing] = (conteoInsumosExitosos[ing] || 0) + 1;
              });
            }
            pesoAnterior = p.peso;
            fechaAnterior = fechaActual;
          });
        }

        // 2. EVALUAR CIERRE FINAL (Lotes Históricos)
        if (lote.estado === "Histórico" && lote.pesoFinal) {
          let dias = Math.floor((new Date(lote.fechaCreacion || Date.now()) - new Date(lote.fechaInicio)) / (1000 * 60 * 60 * 24));
          if (dias <= 0) dias = 1;
          const pesoAnterior = lote.pesajes?.length > 0 ? lote.pesajes[lote.pesajes.length - 1].peso : 20;
          const gmd = ((lote.pesoFinal - pesoAnterior) / dias) * 1000;

          // NUEVO: Guardamos los ingredientes en el análisis
          analisisDietas.push({ 
            nombre: lote.dietaAplicada, 
            etapa: lote.etapa, 
            gmd: gmd,
            ingredientes: lote.ingredientesClave ? lote.ingredientesClave.join(", ") : "Ingredientes no especificados"
          });

          if (gmd > 500 && lote.ingredientesClave) {
            lote.ingredientesClave.forEach(ing => {
              conteoInsumosExitosos[ing] = (conteoInsumosExitosos[ing] || 0) + 1;
            });
          }
        }
      });

      // Ordenar por GMD de mayor a menor
      analisisDietas.sort((a, b) => b.gmd - a.gmd);
      
      const topInsumos = Object.keys(conteoInsumosExitosos).map(key => ({
        nombre: key, casosDeExito: conteoInsumosExitosos[key]
      })).sort((a, b) => b.casosDeExito - a.casosDeExito);

      setRankingDietas(analisisDietas);
      setInsumosEstrella(topInsumos);

    } catch (error) {
      console.error("Error al procesar inteligencia nutricional:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    procesarInteligenciaNutricional();
  }, [user?.fincaId]);

  return {
    rankingDietas,
    insumosEstrella,
    loading,
    recargarAnalitica: procesarInteligenciaNutricional
  };
};