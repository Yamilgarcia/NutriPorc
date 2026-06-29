import { useState, useEffect, useMemo } from "react";
import { addLote, getLotes, updateLote, archivarLote, registrarBajaLote, deleteLote } from "../data/lotes.service";
import { useAuth } from "../../auth/logic/AuthContext"; 

export const useLotes = () => {
  const { user } = useAuth(); 
  
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Activo"); 
  const [filterEtapa, setFilterEtapa] = useState("Todas"); 

  const loadLotes = async () => {
    if (!user?.fincaId) return; 
    setLoading(true);
    try {
      const data = await getLotes(user.fincaId); 
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLotes();
  }, [user?.fincaId]); 

  const handleAdd = async (nuevoLote) => {
    if (!user?.fincaId) return alert("Error de sesión: No se pudo identificar la granja.");
    try {
      const added = await addLote(nuevoLote, user.fincaId); 
      setLotes([...lotes, added]);
    } catch (error) {
      console.error("Error al añadir lote:", error);
    }
  };

  const handleUpdate = async (id, newData) => {
    try {
      await updateLote(id, newData);
      setLotes(lotes.map(item => item.id === id ? { ...item, ...newData } : item));
    } catch (error) {
      console.error("Error al actualizar lote:", error);
    }
  };

  const handleArchivar = async (id) => {
    try {
      await archivarLote(id);
      setLotes(lotes.map(item => item.id === id ? { ...item, estado: "Histórico" } : item));
    } catch (error) {
      console.error("Error al archivar lote:", error);
    }
  };

  const handleRegistrarBaja = async (id, bajasActuales, nuevaBaja, cantidadRestante) => {
    try {
      await registrarBajaLote(id, bajasActuales, nuevaBaja, cantidadRestante);
      setLotes(lotes.map(item => {
        if (item.id === id) {
          return { ...item, cantidad: cantidadRestante, bajas: [...(item.bajas || []), nuevaBaja] };
        }
        return item;
      }));
    } catch (error) {
      console.error("Error al registrar baja:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteLote(id);
      setLotes(lotes.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar lote:", error);
    }
  };

  const filteredLotes = useMemo(() => {
    let result = lotes;
    if (filterEstado !== "Todos") result = result.filter(lote => lote.estado === filterEstado);
    if (filterEtapa !== "Todas") result = result.filter(lote => lote.etapa === filterEtapa);
    if (searchTerm) {
      result = result.filter(lote => 
        lote.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lote.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    result.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
    return result;
  }, [lotes, searchTerm, filterEstado, filterEtapa]);

  return {
    lotes: filteredLotes, loading, searchTerm, setSearchTerm, filterEstado, setFilterEstado, filterEtapa, setFilterEtapa,
    handleAdd, handleUpdate, handleArchivar, handleRegistrarBaja, handleDelete
  };
};