import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where,onSnapshot } from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { auth, db } from "../../../../firebase.config";

// LEER ESTADÍSTICAS GLOBALES
export const obtenerEstadisticasFinca = async (fincaId) => {
  if (!fincaId) return { totalCerdos: 0, lotesHistoricos: 0 };
  
  const q = query(collection(db, "lotes"), where("fincaId", "==", fincaId));
  const snapshot = await getDocs(q);
  
  let totalCerdosActivos = 0;
  let totalLotesHistoricos = 0;
  
  snapshot.forEach(doc => {
    const lote = doc.data();
    if (lote.estado === "Activo") {
      totalCerdosActivos += (lote.cantidad || 0);
    } else {
      totalLotesHistoricos += 1;
    }
  });
  
  return { 
    totalCerdos: totalCerdosActivos, 
    lotesHistoricos: totalLotesHistoricos 
  };
};

// LEER PERFIL COMPLETO (Ubicación, Productor, etc.)
export const obtenerPerfilFinca = async (fincaId) => {
  const fincaRef = doc(db, "fincas", fincaId);
  const snapshot = await getDoc(fincaRef);
  if (snapshot.exists()) {
    return snapshot.data();
  }
  return null;
};

// ACTUALIZAR PERFIL
export const actualizarPerfilFinca = async (fincaId, datosActualizados) => {
  const fincaRef = doc(db, "fincas", fincaId);
  await updateDoc(fincaRef, datosActualizados);
};

// ELIMINAR CUENTA (PURGAR DATOS)
export const purgarCuentaFinca = async (fincaId, uid) => {
  await deleteDoc(doc(db, "usuarios", uid));
  await deleteDoc(doc(db, "fincas", fincaId));
  const currentUser = auth.currentUser;
  if (currentUser) {
    await deleteUser(currentUser);
  }
};


// NUEVA FUNCIÓN: Escucha los datos del perfil de la finca en tiempo real (Offline-First)
export const subscribeToPerfilFinca = (fincaId, callback) => {
  if (!fincaId) return () => {};
  const fincaRef = doc(db, "fincas", fincaId);
  
  const unsubscribe = onSnapshot(fincaRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error al escuchar perfil de finca:", error);
  });

  return unsubscribe;
};