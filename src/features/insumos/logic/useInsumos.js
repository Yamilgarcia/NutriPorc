import { useState, useEffect, useMemo } from "react";
import { addInsumo, updatePrecioInsumo, deleteInsumo, subscribeToInsumos } from "../data/insumos.service";
import { useAuth } from "../../auth/logic/AuthContext"; 

export const useInsumos = () => {
  const { user } = useAuth();

  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("nombre");

  // Suscripción en tiempo real a Firestore (Caché + Nube)
  useEffect(() => {
    if (!user?.fincaId) return; 
    
    setLoading(true);
    const unsubscribe = subscribeToInsumos(user.fincaId, (data) => {
      setInsumos(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.fincaId]); 

  const handleAdd = async (nuevoInsumo) => {
    if (!user?.fincaId) return;
    try {
      // Firebase onSnapshot actualizará la UI inmediatamente
      await addInsumo(nuevoInsumo, user.fincaId);
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
        
        // Actualización Optimista: Añadimos el clon visualmente de inmediato
        setInsumos((prev) => [...prev, { id: "temp-" + Date.now(), ...copiaLocal, fincaId: user.fincaId }]);
        
        // Guardamos en BD. ¡Ya no necesitamos loadInsumos()! onSnapshot lo manejará.
        await addInsumo(copiaLocal, user.fincaId);
      } else {
        // Actualización Optimista para insumo propio: Cambiamos precio en pantalla al instante
        setInsumos((prev) => 
          prev.map(item => item.id === insumo.id ? { ...item, costoPorLibra: nuevoPrecio } : item)
        );
        await updatePrecioInsumo(insumo.id, nuevoPrecio);
      }
    } catch (error) {
      console.error("Error al actualizar precio:", error);
    }
  };

  const handleDelete = async (id) => {
    // Eliminación Optimista: Borramos de la pantalla al instante
    setInsumos((prev) => prev.filter(item => item.id !== id));
    try {
      await deleteInsumo(id);
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  const filteredAndSortedInsumos = useMemo(() => {
    const insumosUnicos = [];
    const nombresLocales = new Set();

    // Lógica para priorizar insumos locales sobre los del "sistema"
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

    // Filtramos. Como .filter crea un array NUEVO, ya es seguro usar .sort() después
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