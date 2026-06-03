import { useState, useEffect, useMemo } from "react";
import { getLotes } from "../../lotes/data/lotes.service";
import { getInsumos } from "../../insumos/data/insumos.service";
import { saveFormula, getFormulas } from "../data/formulador.service";

export const useFormulador = () => {
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado del creador de mezcla
  const [selectedLoteId, setSelectedLoteId] = useState("");
  const [selectedInsumoIds, setSelectedInsumoIds] = useState([]);
  const [mezclaActual, setMezclaActual] = useState([]); // [{ insumo, porcentaje }]

  const loadData = async () => {
    setLoading(true);
    try {
      const [lotesData, insumosData] = await Promise.all([
        getLotes(),
        getInsumos()
      ]);
      setLotes(lotesData.filter(l => l.estado === "Activo"));
      setInsumos(insumosData);
    } catch (error) {
      console.error("Error al cargar datos para el formulador:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loteSeleccionado = useMemo(() => {
    return lotes.find(l => l.id === selectedLoteId) || null;
  }, [lotes, selectedLoteId]);

  const requerimientos = useMemo(() => {
    if (!loteSeleccionado) return { proteina: 0, energia: 0 };
    // Valores estándar aproximados por etapa
    switch (loteSeleccionado.etapa) {
      case "Destete": return { proteina: 20, energia: 3200 };
      case "Desarrollo": return { proteina: 16, energia: 3000 };
      case "Engorde": return { proteina: 14, energia: 3000 };
      default: return { proteina: 15, energia: 3000 };
    }
  }, [loteSeleccionado]);

  const handleCalcularMezcla = () => {
    const insumosDisponibles = insumos.filter(i => selectedInsumoIds.includes(i.id));
    if (insumosDisponibles.length === 0) return;

    // Algoritmo Heurístico Local (Aproximación de Mínimo Costo)
    // Para no usar librerías externas pesadas, inicializamos dando prioridad a los insumos más baratos.
    let totalCostoInverso = insumosDisponibles.reduce((acc, ins) => acc + (1 / (ins.costoPorLibra || 1)), 0);
    
    let nuevaMezcla = insumosDisponibles.map(insumo => {
      const proporcion = (1 / (insumo.costoPorLibra || 1)) / totalCostoInverso;
      return {
        id: insumo.id,
        nombre: insumo.nombre,
        proteina: parseFloat(insumo.porcentajeProteina || 0),
        energia: parseFloat(insumo.porcentajeEnergia || 0),
        costo: parseFloat(insumo.costoPorLibra || 0),
        porcentaje: parseFloat((proporcion * 100).toFixed(2))
      };
    });

    // Corrección para que sume exactamente 100%
    const sumaPorcentajes = nuevaMezcla.reduce((acc, item) => acc + item.porcentaje, 0);
    if (nuevaMezcla.length > 0 && sumaPorcentajes !== 100) {
      nuevaMezcla[0].porcentaje = parseFloat((nuevaMezcla[0].porcentaje + (100 - sumaPorcentajes)).toFixed(2));
    }

    setMezclaActual(nuevaMezcla);
  };

  const handleActualizarPorcentaje = (id, nuevoPorcentaje) => {
    const parsed = parseFloat(nuevoPorcentaje) || 0;
    setMezclaActual(prev => prev.map(item => 
      item.id === id ? { ...item, porcentaje: parsed } : item
    ));
  };

  const totalesMezcla = useMemo(() => {
    let proteinaTotal = 0;
    let energiaTotal = 0;
    let costoTotal = 0; // Costo por cada 100 lbs (ya que usamos porcentajes)
    let pesoTotal = 0;

    mezclaActual.forEach(item => {
      const fraccion = item.porcentaje / 100;
      proteinaTotal += item.proteina * fraccion;
      energiaTotal += item.energia * fraccion;
      costoTotal += item.costo * item.porcentaje; // Si costo es por lb, y porcentaje asume 100 lbs totales
      pesoTotal += item.porcentaje;
    });

    return {
      proteina: parseFloat(proteinaTotal.toFixed(2)),
      energia: parseFloat(energiaTotal.toFixed(2)),
      costoCienLibras: parseFloat(costoTotal.toFixed(2)),
      pesoTotal: parseFloat(pesoTotal.toFixed(2))
    };
  }, [mezclaActual]);

  const toggleInsumo = (id) => {
    setSelectedInsumoIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return {
    lotes,
    insumos,
    loading,
    selectedLoteId,
    setSelectedLoteId,
    selectedInsumoIds,
    toggleInsumo,
    mezclaActual,
    requerimientos,
    totalesMezcla,
    handleCalcularMezcla,
    handleActualizarPorcentaje
  };
};
