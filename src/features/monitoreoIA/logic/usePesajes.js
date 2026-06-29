import { useState, useEffect } from "react";
import { getLotes } from "../../lotes/data/lotes.service"; 
import { addPesaje, getPesajesPorLote, updatePesaje, deletePesaje } from "../data/pesajes.service";
// 1. IMPORTAMOS EL CONTEXTO DE AUTENTICACIÓN
import { useAuth } from "../../auth/logic/AuthContext";

export const usePesajes = () => {
  // 2. EXTRAEMOS LA SESIÓN DEL USUARIO
  const { user } = useAuth();

  const [lotes, setLotes] = useState([]);
  const [loteSeleccionadoId, setLoteSeleccionadoId] = useState("");
  const [pesajes, setPesajes] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(true);
  const [loadingPesajes, setLoadingPesajes] = useState(false);

  // 1. Cargar los lotes activos al entrar al módulo
  useEffect(() => {
    const cargarLotes = async () => {
      if (!user?.fincaId) return; // Evitamos ejecución si no hay sesión
      try {
        setLoadingLotes(true);
        // PASAMOS EL FINCA ID PARA QUE EL SELECT SOLO MUESTRE LOTES DE ESTA GRANJA
        const listaLotes = await getLotes(user.fincaId); 
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
  }, [user?.fincaId]); // Dependencia actualizada

  // 2. Cargar historial cuando el usuario cambia de lote en el select
  useEffect(() => {
    if (!loteSeleccionadoId || !user?.fincaId) return;
    const cargarHistorial = async () => {
      try {
        setLoadingPesajes(true);
        // PASAMOS EL FINCA ID A LA CONSULTA DE PESAJES
        const historial = await getPesajesPorLote(loteSeleccionadoId, user.fincaId);
        setPesajes(historial);
      } catch (error) {
        console.error("Error al cargar historial de pesajes:", error);
      } finally {
        setLoadingPesajes(false);
      }
    };
    cargarHistorial();
  }, [loteSeleccionadoId, user?.fincaId]); // Dependencia actualizada

  // 3. Crear Registro
  const handleAdd = async (pesoPromedio, fecha, metodo = "manual") => {
    if (!loteSeleccionadoId || !user?.fincaId) return false;
    try {
      // PASAMOS EL FINCA ID AL CREAR
      const nuevoPesaje = await addPesaje(loteSeleccionadoId, pesoPromedio, fecha, metodo, user.fincaId);
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