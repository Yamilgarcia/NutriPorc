import { useState, useEffect } from "react";
import { actualizarPerfilFinca, purgarCuentaFinca, obtenerEstadisticasFinca, obtenerPerfilFinca } from "../data/perfil.service";
import { useAuth } from "../../auth/logic/AuthContext";

export const usePerfil = () => {
  const { user, logout } = useAuth();
  
  // Datos del perfil y estadísticas
  const [estadisticas, setEstadisticas] = useState({ totalCerdos: 0, lotesHistoricos: 0 });
  const [datosFinca, setDatosFinca] = useState(null);
  const [loadingDatos, setLoadingDatos] = useState(true);

  // Estados para Edición
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre: "",
    productor: "",
    ubicacion: ""
  });
  
  // Estados para Eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      if (user?.fincaId) {
        setLoadingDatos(true);
        try {
          const stats = await obtenerEstadisticasFinca(user.fincaId);
          setEstadisticas(stats);
          
          const perfil = await obtenerPerfilFinca(user.fincaId);
          if (perfil) {
            setDatosFinca(perfil);
            setEditData({
              nombre: perfil.nombre || user.fincaNombre || "",
              productor: perfil.productor || "",
              ubicacion: perfil.ubicacion || ""
            });
          }
        } catch (error) {
          console.error("Error al cargar perfil:", error);
        } finally {
          setLoadingDatos(false);
        }
      }
    };
    cargarDatos();
  }, [user]);

  // Manejador para Guardar Cambios
  const handleUpdate = async () => {
    if (!editData.nombre.trim() || !user?.fincaId) return;
    setIsProcessing(true);
    try {
      await actualizarPerfilFinca(user.fincaId, editData);
      
      const sesionGuardada = JSON.parse(localStorage.getItem("nutriporc_session"));
      if (sesionGuardada) {
        sesionGuardada.fincaNombre = editData.nombre;
        localStorage.setItem("nutriporc_session", JSON.stringify(sesionGuardada));
      }
      
      // Actualizamos los estados visuales sin recargar toda la página
      setDatosFinca({ ...datosFinca, ...editData });
      setIsEditing(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Hubo un error al guardar los cambios.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Manejador para Eliminar Cuenta
  const handleDelete = async () => {
    if (!user?.fincaId || !user?.uid) return;
    setIsProcessing(true);
    try {
      await purgarCuentaFinca(user.fincaId, user.uid);
      alert("Tu cuenta y todos tus datos han sido eliminados.");
      logout(); 
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      if (error.code === 'auth/requires-recent-login') {
        alert("Por seguridad, debes cerrar sesión y volver a entrar antes de eliminar tu cuenta.");
      } else {
        alert("Hubo un error al intentar eliminar la cuenta.");
      }
    } finally {
      setIsProcessing(false);
      setShowDeleteModal(false);
    }
  };

  return {
    isEditing, setIsEditing,
    editData, setEditData,
    estadisticas, datosFinca, loadingDatos,
    showDeleteModal, setShowDeleteModal,
    isProcessing,
    handleUpdate,
    handleDelete
  };
};