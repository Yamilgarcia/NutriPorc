import { useState, useEffect, useMemo } from "react";
import { addLote, getLotes, updateLote, archivarLote, registrarBajaLote, deleteLote } from "../data/lotes.service";

/**
 * Hook personalizado para manejar la lógica de negocio y estado de los Lotes.
 */
export const useLotes = () => {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Activo"); // "Activo", "Histórico", "Todos"
  const [filterEtapa, setFilterEtapa] = useState("Todas"); // "Todas", "Destete", "Desarrollo", "Engorde"

  /**
   * Carga los lotes desde Firebase y actualiza el estado local.
   */
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

  /**
   * Añade un nuevo lote a Firebase y al estado local.
   * @param {Object} nuevoLote - Datos del lote a crear.
   */
  const handleAdd = async (nuevoLote) => {
    try {
      const added = await addLote(nuevoLote);
      setLotes([...lotes, added]);
    } catch (error) {
      console.error("Error al añadir lote:", error);
    }
  };

  /**
   * Actualiza los datos de un lote existente.
   * @param {string} id - ID del lote.
   * @param {Object} newData - Nuevos datos a actualizar.
   */
  const handleUpdate = async (id, newData) => {
    try {
      await updateLote(id, newData);
      setLotes(lotes.map(item => item.id === id ? { ...item, ...newData } : item));
    } catch (error) {
      console.error("Error al actualizar lote:", error);
    }
  };

  /**
   * Pasa el estado de un lote a "Histórico".
   * @param {string} id - ID del lote a archivar.
   */
  const handleArchivar = async (id) => {
    try {
      await archivarLote(id);
      setLotes(lotes.map(item => item.id === id ? { ...item, estado: "Histórico" } : item));
    } catch (error) {
      console.error("Error al archivar lote:", error);
    }
  };

  /**
   * Registra una nueva baja (muerte) en un lote y actualiza el inventario.
   * @param {string} id - ID del lote.
   * @param {Array} bajasActuales - Lista actual de bajas en el lote.
   * @param {Object} nuevaBaja - Datos de la nueva baja a agregar.
   * @param {number} cantidadRestante - Nueva cantidad total de cerdos vivos en el lote.
   */
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

  /**
   * Elimina permanentemente un lote de Firebase.
   * @param {string} id - ID del lote a borrar.
   */
  const handleDelete = async (id) => {
    try {
      await deleteLote(id);
      setLotes(lotes.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar lote:", error);
    }
  };

  /**
   * Lotes filtrados y ordenados según los criterios de búsqueda y filtros seleccionados.
   */
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