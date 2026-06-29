import { useState, useEffect, useMemo } from "react";
import { addInsumo, getInsumos, updatePrecioInsumo, deleteInsumo } from "../data/insumos.service";
// 1. IMPORTAMOS EL CONTEXTO DE AUTENTICACIÓN
import { useAuth } from "../../auth/logic/AuthContext"; 

export const useInsumos = () => {
  // 2. EXTRAEMOS LA SESIÓN DEL USUARIO
  const { user } = useAuth();

  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");

  const loadInsumos = async () => {
    if (!user?.fincaId) return; // Evitamos peticiones antes de tener la sesión
    
    setLoading(true);
    try {
      const data = await getInsumos(user.fincaId); // <-- PASAMOS LA LLAVE
      setInsumos(data);
    } catch (error) {
      console.error("Error al cargar insumos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsumos();
  }, [user?.fincaId]); // Recargamos si cambia el usuario

  const handleAdd = async (nuevoInsumo) => {
    if (!user?.fincaId) return;
    try {
      const added = await addInsumo(nuevoInsumo, user.fincaId); // <-- PASAMOS LA LLAVE
      setInsumos([...insumos, added]);
    } catch (error) {
      console.error("Error al añadir:", error);
    }
  };

  const handleUpdatePrecio = async (insumo, nuevoPrecio) => {
    if (!user?.fincaId) return;
    
    try {
      if (insumo.fincaId === "sistema") {
        // Es un insumo global. Creamos una copia local anclada al usuario actual.
        const copiaLocal = {
          nombre: insumo.nombre, 
          porcentajeProteina: insumo.porcentajeProteina,
          porcentajeEnergia: insumo.porcentajeEnergia,
          porcentajeFibra: insumo.porcentajeFibra,
          costoPorLibra: nuevoPrecio,
        };
        
        await addInsumo(copiaLocal, user.fincaId); // <-- PASAMOS LA LLAVE AL CLONAR
        await loadInsumos(); 
      } else {
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

  const filteredAndSortedInsumos = useMemo(() => {
    const insumosUnicos = [];
    const nombresLocales = new Set();

    insumos.forEach(insumo => {
      if (insumo.fincaId !== "sistema") {
        nombresLocales.add(insumo.nombre.toLowerCase());
        insumosUnicos.push(insumo);
      }
    });

    insumos.forEach(insumo => {
      if (insumo.fincaId === "sistema" && !nombresLocales.has(insumo.nombre.toLowerCase())) {
        insumosUnicos.push(insumo);
      }
    });

    let result = insumosUnicos.filter(insumo => 
      insumo.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === "precio") return a.costoPorLibra - b.costoPorLibra;
      if (sortBy === "proteina") return b.porcentajeProteina - a.porcentajeProteina;
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