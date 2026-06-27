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
    if (!loteSeleccionado) return { proteina: 0, energia: 0, consumoDiario: 0, semanasEdad: 0 };
    
    // Calcular edad en semanas basado en fechaInicio real del lote
    let semanasEdad = 0;
    if (loteSeleccionado.fechaInicio) {
      // Separamos la fecha (viene en formato DD/MM/YYYY del objeto lote)
      // Ojo: en JS new Date("DD/MM/YYYY") no es estándar.
      // Para estar seguros si es string de fecha local, pero sabemos que se guardó desde input type="date" o local date.
      // Revisando en LotesPage, usa new Date(Date.now()).toLocaleDateString() para guardarlo.
      // Es más robusto intentar parsearlo. En la UI actual el inicio viene de date.toLocaleDateString() que es "D/M/YYYY".
      const partes = loteSeleccionado.fechaInicio.split('/');
      let fechaObjeto = new Date();
      if (partes.length === 3) {
        fechaObjeto = new Date(partes[2], partes[1] - 1, partes[0]);
      } else {
        fechaObjeto = new Date(loteSeleccionado.fechaInicio);
      }
      
      const hoy = new Date();
      const dias = Math.max(0, Math.floor((hoy - fechaObjeto) / (1000 * 60 * 60 * 24)));
      semanasEdad = Math.floor(dias / 7);
    }

    let proteina = 15;
    let energia = 3000;
    let consumoDiario = 2.0;

    switch (loteSeleccionado.etapa) {
      case "Destete": 
        proteina = 20; energia = 3200; 
        consumoDiario = 0.4 + (semanasEdad * 0.15);
        break;
      case "Desarrollo": 
        proteina = 16; energia = 3000; 
        consumoDiario = 1.2 + (semanasEdad * 0.15);
        break;
      case "Engorde": 
        proteina = 14; energia = 3000; 
        consumoDiario = Math.min(2.0 + (semanasEdad * 0.1), 3.2); // Toppe en 3.2 kg
        break;
      case "Reproducción": 
        proteina = 14; energia = 3000; consumoDiario = 2.5; 
        break;
      case "Gestación": 
        proteina = 13; energia = 2900; consumoDiario = 2.2; 
        break;
      case "Lactancia": 
        proteina = 16; energia = 3200; consumoDiario = 5.5; 
        break;
    }

    consumoDiario = Math.round(consumoDiario * 100) / 100;

    return { proteina, energia, consumoDiario, semanasEdad };
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
