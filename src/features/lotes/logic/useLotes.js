import { useState, useEffect, useMemo } from "react";
import { addLote, updateLote, archivarLote, registrarBajaLote, deleteLote, subscribeToLotes } from "../data/lotes.service";
import { useAuth } from "../../auth/logic/AuthContext"; 

export const useLotes = () => {
  const { user } = useAuth(); 
  
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Activo"); 
  const [filterEtapa, setFilterEtapa] = useState("Todas"); 

  // Suscripción en tiempo real a Firestore (Caché + Nube)
  useEffect(() => {
    if (!user?.fincaId) return;
    setLoading(true);

    const unsubscribe = subscribeToLotes(user.fincaId, (data) => {
      setLotes(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.fincaId]); 

  const handleAdd = async (nuevoLote) => {
    if (!user?.fincaId) return alert("Error de sesión: No se pudo identificar la granja.");
    try {
      await addLote(nuevoLote, user.fincaId); 
    } catch (error) {
      console.error("Error al añadir lote:", error);
    }
  };

  // ACTUALIZACIÓN OPTIMISTA: Modifica el estado local de inmediato para reflejar el cambio en la UI
  const handleUpdate = async (id, newData) => {
    setLotes((prevLotes) =>
      prevLotes.map((item) => (item.id === id ? { ...item, ...newData } : item))
    );
    try {
      await updateLote(id, newData);
    } catch (error) {
      console.error("Error al actualizar lote:", error);
    }
  };

  // ARCHIVADO OPTIMISTA: Cambia el estado a "Histórico" de inmediato
  const handleArchivar = async (id) => {
    setLotes((prevLotes) =>
      prevLotes.map((item) => (item.id === id ? { ...item, estado: "Histórico" } : item))
    );
    try {
      await archivarLote(id);
    } catch (error) {
      console.error("Error al archivar lote:", error);
    }
  };

  // REGISTRO DE BAJA OPTIMISTA: Resta la población y añade la baja al instante
  const handleRegistrarBaja = async (id, bajasActuales, nuevaBaja, cantidadRestante) => {
    setLotes((prevLotes) =>
      prevLotes.map((item) => {
        if (item.id === id) {
          return { 
            ...item, 
            cantidad: cantidadRestante, 
            bajas: [...(item.bajas || []), nuevaBaja] 
          };
        }
        return item;
      })
    );
    try {
      await registrarBajaLote(id, bajasActuales, nuevaBaja, cantidadRestante);
    } catch (error) {
      console.error("Error al registrar baja:", error);
    }
  };

  // ELIMINACIÓN OPTIMISTA: Saca el lote de la lista inmediatamente
  const handleDelete = async (id) => {
    setLotes((prevLotes) => prevLotes.filter((item) => item.id !== id));
    try {
      await deleteLote(id);
    } catch (error) {
      console.error("Error al eliminar lote:", error);
    }
  };

  // CORRECCIÓN DE MUTACIÓN: Usamos [...lotes] para crear una copia segura antes de filtrar u ordenar
  const filteredLotes = useMemo(() => {
    let result = [...lotes]; 

    if (filterEstado !== "Todos") result = result.filter(lote => lote.estado === filterEstado);
    if (filterEtapa !== "Todas") result = result.filter(lote => lote.etapa === filterEtapa);
    if (searchTerm) {
      result = result.filter(lote => 
        lote.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lote.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ahora el ordenamiento se hace sobre la copia segura sin romper React
    result.sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio));
    return result;
  }, [lotes, searchTerm, filterEstado, filterEtapa]);

  return {
    lotes: filteredLotes, loading, searchTerm, setSearchTerm, filterEstado, setFilterEstado, filterEtapa, setFilterEtapa,
    handleAdd, handleUpdate, handleArchivar, handleRegistrarBaja, handleDelete
  };
};