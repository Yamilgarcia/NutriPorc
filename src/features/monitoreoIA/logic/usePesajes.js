import { useState, useEffect } from "react";
// Importamos la función de la rama de tu compañera
import { getLotes } from "../../lotes/data/lotes.service"; 
import { addPesaje, getPesajesPorLote, updatePesaje, deletePesaje } from "../data/pesajes.service";

export const usePesajes = () => {
  const [lotes, setLotes] = useState([]);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState("");
  const [pesajes, setPesajes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingPesajes, setLoadingPesajes] = useState(false);

  // 1. Cargar los lotes activos al entrar al módulo
  useEffect(() => {
    const cargarLotes = async () => {
      try {
        setLoadingLotes(true);
        const listaLotes = await getLotes();
        // Filtramos para mostrar solo los lotes con los que se puede trabajar
        const activos = listaLotes.filter(lote => lote.estado === "Activo");
        setLotes(activos);
        
        if (activos.length > 0) {
          setLoteSeleccionadoId(activos[0].id);
        }
      } catch (error) {
        console.error("Error al cargar lotes:", error);
      } finally {
        setLoadingLotes(false);
      }
    };
    cargarLotes();
  }, []);

  // 2. Cargar historial cuando el usuario cambia de lote en el select
  useEffect(() => {
    if (!loteSeleccionadoId) return;
    const cargarHistorial = async () => {
      try {
        setLoadingPesajes(true);
        const historial = await getPesajesPorLote(loteSeleccionadoId);
        setPesajes(historial);
      } catch (error) {
        console.error("Error al cargar historial de pesajes:", error);
      } finally {
        setLoadingPesajes(false);
      }
    };
    cargarHistorial();
  }, [loteSeleccionadoId]);

  // 3. Crear Registro
  const handleAdd = async (pesoPromedio, fecha, metodo = "manual") => {
    if (!loteSeleccionadoId) return false;
    try {
      const nuevoPesaje = await addPesaje(loteSeleccionadoId, pesoPromedio, fecha, metodo);
      setPesajes(prev => [...prev, nuevoPesaje].sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
      return true;
    } catch (error) {
      console.error("Error al guardar pesaje:", error);
      return false;
    }
  };

  // 4. Actualizar Registro
  const handleUpdate = async (id, nuevoPeso) => {
    try {
      await updatePesaje(id, nuevoPeso);
      setPesajes(prev => prev.map(p => p.id === id ? { ...p, pesoPromedio: parseFloat(nuevoPeso) } : p));
      return true;
    } catch (error) {
      console.error("Error al actualizar pesaje:", error);
      return false;
    }
  };

  // 5. Eliminar Registro
  const handleDelete = async (id) => {
    try {
      await deletePesaje(id);
      setPesajes(prev => prev.filter(p => p.id !== id));
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