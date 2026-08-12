import { useState, useEffect } from "react";
// IMPORTANTE: Traemos el suscriptor de lotes del otro módulo
import { subscribeToLotes } from "../../lotes/data/lotes.service"; 
import { addPesaje, updatePesaje, deletePesaje, subscribeToPesajes } from "../data/pesajes.service";
import { useAuth } from "../../auth/logic/AuthContext";

export const usePesajes = () => {
  const { user } = useAuth();

  const [lotes, setLotes] = useState([]);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState("");
  const [pesajes, setPesajes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingPesajes, setLoadingPesajes] = useState(false);

  // 1. Cargar los lotes activos (Ahora con suscripción reactiva)
  useEffect(() => {
    if (!user?.fincaId) return; 
    setLoadingLotes(true);
    
    const unsubscribe = subscribeToLotes(user.fincaId, (listaLotes) => {
      const activos = listaLotes.filter(lote => lote.estado === "Activo");
      setLotes(activos);
      
      // Auto-seleccionar el primer lote si no hay ninguno seleccionado
      setLoteSeleccionadoId((prevId) => {
        if (!prevId && activos.length > 0) return activos[0].id;
        return prevId;
      });
      
      setLoadingLotes(false);
    });

    return () => unsubscribe();
  }, [user?.fincaId]); 

  // 2. Cargar historial reactivo cuando el usuario cambia de lote
  useEffect(() => {
    if (!loteSeleccionadoId || !user?.fincaId) {
      setPesajes([]); // Limpiamos la gráfica si no hay lote
      return;
    }
    
    setLoadingPesajes(true);
    
    const unsubscribe = subscribeToPesajes(loteSeleccionadoId, user.fincaId, (historial) => {
      setPesajes(historial);
      setLoadingPesajes(false);
    });

    return () => unsubscribe();
  }, [loteSeleccionadoId, user?.fincaId]); 

  // 3. Crear Registro
  const handleAdd = async (pesoPromedio, fecha, metodo = "manual") => {
    if (!loteSeleccionadoId || !user?.fincaId) return false;
    try {
      // Firebase onSnapshot actualizará la gráfica inmediatamente
      await addPesaje(loteSeleccionadoId, pesoPromedio, fecha, metodo, user.fincaId);
      return true;
    } catch (error) {
      console.error("Error al guardar pesaje:", error);
      return false;
    }
  };

  // 4. Actualizar Registro (Estrategia Optimista)
  const handleUpdate = async (id, nuevoPeso) => {
    setPesajes(prev => prev.map(p => p.id === id ? { ...p, pesoPromedio: parseFloat(nuevoPeso) } : p));
    try {
      await updatePesaje(id, nuevoPeso);
      return true;
    } catch (error) {
      console.error("Error al actualizar pesaje:", error);
      return false;
    }
  };

  // 5. Eliminar Registro (Estrategia Optimista)
  const handleDelete = async (id) => {
    setPesajes(prev => prev.filter(p => p.id !== id));
    try {
      await deletePesaje(id);
      return true;
    } catch (error) {
      console.error("Error al eliminar pesaje:", error);
      return false;
    }
  };

  return {
    lotes,
    loteSeleccionadoId,
    setLoteSeleccionadoId,
    pesajes,
    loadingLotes,
    loadingPesajes,
    handleAdd,
    handleUpdate,
    handleDelete
  };
};