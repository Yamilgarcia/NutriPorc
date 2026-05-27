import { useState, useEffect, useMemo } from "react";
import { addLote, getLotes, updateLote, archivarLote, registrarBajaLote, deleteLote } from "../data/lotes.service";

export const useLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Activo"); // "Activo", "Histórico", "Todos"
  const [filterEtapa, setFilterEtapa] = useState("Todas"); // "Todas", "Destete", "Desarrollo", "Engorde"

  const loadLotes = async () => {
    setLoading(true);
    try {
      const data = await getLotes();
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLotes();
  }, []);

  const handleAdd = async (nuevoLote) => {
    try {
      const added = await addLote(nuevoLote);
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
          return {
            ...item,
            cantidad: cantidadRestante,
            bajas: [...(item.bajas || []), nuevaBaja]
          };
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

  // Motor de Búsqueda y Filtrado
  const filteredLotes = useMemo(() => {
    let result = lotes;

    // Filtro por Estado
    if (filterEstado !== "Todos") {
      result = result.filter(lote => lote.estado === filterEstado);
    }

    // Filtro por Etapa
    if (filterEtapa !== "Todas") {
      result = result.filter(lote => lote.etapa === filterEtapa);
    }

    // Búsqueda por término (nombre o código)
    if (searchTerm) {
      result = result.filter(lote => 
        lote.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lote.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Ordenar por fecha de inicio más reciente (por defecto)
    result.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));

    return result;
  }, [lotes, searchTerm, filterEstado, filterEtapa]);

  return {
    lotes: filteredLotes,
    loading,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterEtapa,
    setFilterEtapa,
    handleAdd,
    handleUpdate,
    handleArchivar,
    handleRegistrarBaja,
    handleDelete
  };
};
