import { useState, useEffect, useMemo } from "react";
// IMPORTANTE: Traemos las funciones reactivas de los otros servicios
import { subscribeToLotes } from "../../lotes/data/lotes.service";
import { subscribeToInsumos } from "../../insumos/data/insumos.service";
import { saveFormula, deleteFormula, subscribeToFormulas } from "../data/formulador.service";
import { useAuth } from "../../auth/logic/AuthContext";

export const useFormulador = () => {
  const { user } = useAuth();
  
  const [lotes, setLotes] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [historialFormulas, setHistorialFormulas] = useState([]); // Nuevo estado para las guardadas
  const [loading, setLoading] = useState(true);

  // Estado del creador de mezcla
  const [selectedLoteId, setSelectedLoteId] = useState("");
  const [selectedInsumoIds, setSelectedInsumoIds] = useState([]);
  const [mezclaActual, setMezclaActual] = useState([]); 

  // Suscripción triple (Lotes, Insumos y Fórmulas)
  useEffect(() => {
    if (!user?.fincaId) return;

    setLoading(true);

    // 1. Escuchamos Lotes activos
    const unLotes = subscribeToLotes(user.fincaId, (data) => {
      setLotes(data.filter(l => l.estado === "Activo"));
    });

    // 2. Escuchamos Insumos
    const unInsumos = subscribeToInsumos(user.fincaId, (data) => {
      setInsumos(data);
    });

    // 3. Escuchamos el Historial de Fórmulas
    const unFormulas = subscribeToFormulas(user.fincaId, (data) => {
      setHistorialFormulas(data);
      setLoading(false); // Quitamos loading cuando cargan
    });

    // Limpiamos las 3 suscripciones al desmontar
    return () => {
      unLotes();
      unInsumos();
      unFormulas();
    };
  }, [user?.fincaId]);

  // --- LÓGICA DE FORMULACIÓN INTACTA ---
  const loteSeleccionado = useMemo(() => {
    return lotes.find(l => l.id === selectedLoteId) || null;
  }, [lotes, selectedLoteId]);

  const requerimientos = useMemo(() => {
    if (!loteSeleccionado) return { proteina: 0, energia: 0, consumoDiario: 0, semanasEdad: 0 };
    
    let semanasEdad = 0;
    if (loteSeleccionado.fechaInicio) {
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

    let proteina = 15; let energia = 3000; let consumoDiario = 2.0;

    switch (loteSeleccionado.etapa) {
      case "Destete": 
        proteina = 20; energia = 3200; consumoDiario = 0.4 + (semanasEdad * 0.15); break;
      case "Desarrollo": 
        proteina = 16; energia = 3000; consumoDiario = 1.2 + (semanasEdad * 0.15); break;
      case "Engorde": 
        proteina = 14; energia = 3000; consumoDiario = Math.min(2.0 + (semanasEdad * 0.1), 3.2); break;
      case "Reproducción": 
        proteina = 14; energia = 3000; consumoDiario = 2.5; break;
      case "Gestación": 
        proteina = 13; energia = 2900; consumoDiario = 2.2; break;
      case "Lactancia": 
        proteina = 16; energia = 3200; consumoDiario = 5.5; break;
    }

    consumoDiario = Math.round(consumoDiario * 100) / 100;
    return { proteina, energia, consumoDiario, semanasEdad };
  }, [loteSeleccionado]);

  const handleCalcularMezcla = () => {
    const insumosDisponibles = insumos.filter(i => selectedInsumoIds.includes(i.id));
    if (insumosDisponibles.length === 0) return;

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
    let proteinaTotal = 0; let energiaTotal = 0; let costoTotal = 0; let pesoTotal = 0;

    mezclaActual.forEach(item => {
      const fraccion = item.porcentaje / 100;
      proteinaTotal += item.proteina * fraccion;
      energiaTotal += item.energia * fraccion;
      costoTotal += item.costo * item.porcentaje; 
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

  // --- NUEVAS FUNCIONES PARA GUARDAR Y ELIMINAR FÓRMULAS OPTIMISTAMENTE ---
  const handleSaveFormula = async (nombreFormula) => {
    if (!user?.fincaId || mezclaActual.length === 0) return;
    
    const nuevaFormula = {
      nombre: nombreFormula,
      loteId: selectedLoteId,
      totales: totalesMezcla,
      ingredientes: mezclaActual,
    };

    try {
      await saveFormula(nuevaFormula, user.fincaId);
      // No necesitamos actualizar el estado manualmente, onSnapshot lo hará al instante
    } catch (error) {
      console.error("Error al guardar la fórmula:", error);
    }
  };

  const handleDeleteFormula = async (id) => {
    // Actualización optimista: lo borramos de la pantalla al instante
    setHistorialFormulas(prev => prev.filter(f => f.id !== id));
    try {
      await deleteFormula(id);
    } catch (error) {
      console.error("Error al eliminar la fórmula:", error);
    }
  };

  return {
    lotes,
    insumos,
    historialFormulas, // Retornamos el historial para usarlo en tu componente
    loading,
    selectedLoteId,
    setSelectedLoteId,
    selectedInsumoIds,
    toggleInsumo,
    mezclaActual,
    requerimientos,
    totalesMezcla,
    handleCalcularMezcla,
    handleActualizarPorcentaje,
    handleSaveFormula,
    handleDeleteFormula
  };
};