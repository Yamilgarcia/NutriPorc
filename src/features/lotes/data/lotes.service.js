import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const LOTES_COLLECTION = "lotes";

export const addLote = async (loteData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido para registrar un lote.");

  const docRef = await addDoc(collection(db, LOTES_COLLECTION), {
    ...loteData,
    fincaId: fincaId, 
    estado: "Activo", 
    bajas: [], 
    fechaCreacion: new Date().toISOString()
  });
  return { id: docRef.id, ...loteData, estado: "Activo", bajas: [] };
};

export const getLotes = async (fincaId) => {
  if (!fincaId) return []; 
  const q = query(collection(db, LOTES_COLLECTION), where("fincaId", "==", fincaId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateLote = async (id, loteData) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await updateDoc(loteRef, loteData);
};

export const archivarLote = async (id) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await updateDoc(loteRef, { estado: "Histórico" });
};

export const registrarBajaLote = async (id, bajasActuales, nuevaBaja, cantidadRestante) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await updateDoc(loteRef, { 
    bajas: [...(bajasActuales || []), nuevaBaja],
    cantidad: cantidadRestante
  });
};

export const deleteLote = async (id) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await deleteDoc(loteRef);
};

// NUEVA FUNCIÓN: Escucha cambios en tiempo real (Online y Offline)
export const subscribeToLotes = (fincaId, callback) => {
  if (!fincaId) return () => {};
  
  const q = query(collection(db, LOTES_COLLECTION), where("fincaId", "==", fincaId));
  
  // onSnapshot reacciona al instante a la caché local cuando estás offline
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const lotesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(lotesData);
  }, (error) => {
    console.error("Error al escuchar lotes:", error);
  });

  return unsubscribe;
};