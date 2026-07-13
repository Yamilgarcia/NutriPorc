import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const HISTORIAL_COLLECTION = "historial_sanitario";

export const crearHistorialId = () => doc(collection(db, HISTORIAL_COLLECTION)).id;

export const registrarAccionSanitaria = async (id, accionData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido");
  const docRef = doc(db, HISTORIAL_COLLECTION, id);
  const dataFinal = { ...accionData, fincaId, fechaRegistro: new Date().toISOString() };
  setDoc(docRef, dataFinal).catch(e => console.warn("Guardado en caché local", e));
  return dataFinal;
};

// NUEVO: Función para actualizar (Offline First)
export const actualizarAccionSanitaria = async (id, nuevosDatos) => {
  const docRef = doc(db, HISTORIAL_COLLECTION, String(id));
  updateDoc(docRef, nuevosDatos).catch(e => console.warn("Actualizado en caché local", e));
};

// NUEVO: Función para eliminar (Offline First)
export const eliminarAccionSanitaria = async (id) => {
  const docRef = doc(db, HISTORIAL_COLLECTION, String(id));
  deleteDoc(docRef).catch(e => console.warn("Eliminado en caché local", e));
};

export const subscribeToTodoHistorialSanitario = (fincaId, callback) => {
  if (!fincaId) return () => {};
  const q = query(collection(db, HISTORIAL_COLLECTION), where("fincaId", "==", fincaId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const datos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(datos.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro)));
  }, (error) => console.error("Error en canal sanitario:", error));
  return unsubscribe;
};