import { useState, useEffect, useMemo } from "react";
import { addInsumo, getInsumos, updatePrecioInsumo, deleteInsumo } from "../data/insumos.service";

export const useInsumos = () => {
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");

  const loadInsumos = async () => {
    setLoading(true);
    try {
      const data = await getInsumos();
      setInsumos(data);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsumos();
  }, []);

  const handleAdd = async (nuevoInsumo) => {
    try {
      const added = await addInsumo(nuevoInsumo);
      setInsumos([...insumos, added]);
    } catch (error) {
      console.error("Error al añadir:", error);
    }
  };

  const handleUpdatePrecio = async (id, nuevoPrecio) => {
    try {
      await updatePrecioInsumo(id, nuevoPrecio);
      setInsumos(insumos.map(item => item.id === id ? { ...item, costoPorLibra: nuevoPrecio } : item));
    } catch (error) {
      console.error("Error al actualizar precio:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteInsumo(id);
      setInsumos(insumos.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  // Motor de Búsqueda y Ordenamiento procesado en memoria para máxima velocidad
  const filteredAndSortedInsumos = useMemo(() => {
    let result = insumos.filter(insumo => 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === "precio") return a.costoPorLibra - b.costoPorLibra;
      if (sortBy === "proteina") return b.porcentajeProteina - a.porcentajeProteina; // Mayor a menor
      return a.nombre.localeCompare(b.nombre);
    });

    return result;
  }, [insumos, searchTerm, sortBy]);

  return {
    insumos: filteredAndSortedInsumos,
    loading,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    handleAdd,
    handleUpdatePrecio,
    handleDelete
  };
};