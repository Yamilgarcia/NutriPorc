import { useState, useEffect, useMemo } from "react";
import { addLote, getLotes, updateLote, archivarLote, registrarBajaLote, deleteLote } from "../data/lotes.service";
// 1. IMPORTAMOS EL CONTEXTO DE AUTENTICACIÓN REAL
// Asegúrate de validar que esta ruta apunte correctamente a donde guardaste tu AuthContext
import { useAuth } from "../../auth/logic/AuthContext"; 

export const useLotes = () => {
  // 2. EXTRAEMOS LA SESIÓN ACTIVA DEL USUARIO
  const { user } = useAuth(); 
  
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("Activo"); 
  const [filterEtapa, setFilterEtapa] = useState("Todas"); 

  /**
   * Carga los lotes filtrando de forma segura por el fincaId del usuario.
   */
  const loadLotes = async () => {
    if (!user?.fincaId) return; // Si los datos del usuario aún no cargan, evitamos peticiones vacías
    setLoading(true);
    try {
      const data = await getLotes(user.fincaId); // <-- PASAMOS LA LLAVE DINÁMICA
      setLotes(data);
    } catch (error) {
      console.error("Error al cargar lotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLotes();
    // 3. SE EJECUTA CADA VEZ QUE EL ID DE LA FINCA ESTÉ DISPONIBLE
  }, [user?.fincaId]); 

  /**
   * Añade un nuevo lote vinculándolo permanentemente a la finca actual.
   */
  const handleAdd = async (nuevoLote) => {
    if (!user?.fincaId) return alert("Error de sesión: No se pudo identificar la granja.");
    try {
      const added = await addLote(nuevoLote, user.fincaId); // <-- PASAMOS LA LLAVE AL CREAR
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

  const filteredLotes = useMemo(() => {
    let result = lotes;

    if (filterEstado !== "Todos") {
      result = result.filter(lote => lote.estado === filterEstado);
    }

    if (filterEtapa !== "Todas") {
      result = result.filter(lote => lote.etapa === filterEtapa);
    }

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