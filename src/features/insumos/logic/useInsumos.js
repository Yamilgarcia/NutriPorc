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

  const handleUpdatePrecio = async (insumo, nuevoPrecio) => {
    try {
      if (insumo.fincaId === "sistema") {
        // Es un insumo global. NO lo modificamos. Creamos una copia local.
        const copiaLocal = {
          nombre: insumo.nombre, // Mantenemos el mismo nombre para que el algoritmo lo reconozca
          porcentajeProteina: insumo.porcentajeProteina,
          porcentajeEnergia: insumo.porcentajeEnergia,
          porcentajeFibra: insumo.porcentajeFibra,
          costoPorLibra: nuevoPrecio,
        };
        
        await addInsumo(copiaLocal);
        await loadInsumos(); // Recargamos para traer la nueva copia y aplicar el filtro de duplicados
      } else {
        // Es un insumo propio del usuario, lo actualizamos normalmente
        await updatePrecioInsumo(insumo.id, nuevoPrecio);
        setInsumos(insumos.map(item => item.id === insumo.id ? { ...item, costoPorLibra: nuevoPrecio } : item));
      }
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

  // Motor de Búsqueda, Ordenamiento y FILTRO DE DUPLICADOS
  const filteredAndSortedInsumos = useMemo(() => {
    const insumosUnicos = [];
    const nombresLocales = new Set();

    // 1A. Guardamos primero los insumos propios (locales) del usuario
    insumos.forEach(insumo => {
      if (insumo.fincaId !== "sistema") {
        nombresLocales.add(insumo.nombre.toLowerCase());
        insumosUnicos.push(insumo);
      }
    });

    // 1B. Agregamos los del sistema SOLO si el usuario no ha creado una copia modificada
    insumos.forEach(insumo => {
      if (insumo.fincaId === "sistema" && !nombresLocales.has(insumo.nombre.toLowerCase())) {
        insumosUnicos.push(insumo);
      }
    });

    // 2. Aplicamos la búsqueda del usuario
    let result = insumosUnicos.filter(insumo => 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 3. Aplicamos el ordenamiento
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