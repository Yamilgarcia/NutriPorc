import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const INSUMOS_COLLECTION = "insumos";

export const addInsumo = async (insumoData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido para registrar un insumo.");

  const docRef = await addDoc(collection(db, INSUMOS_COLLECTION), {
    ...insumoData,
    fincaId: fincaId, 
    estado: "activo",
    fechaCreacion: new Date()
  });
  return { id: docRef.id, ...insumoData, fincaId };
};

export const getInsumos = async (fincaId) => {
  if (!fincaId) return [];
  const q = query(
    collection(db, INSUMOS_COLLECTION), 
    where("fincaId", "in", [fincaId, "sistema"]) 
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updatePrecioInsumo = async (id, nuevoPrecio) => {
  const insumoRef = doc(db, INSUMOS_COLLECTION, id);
  await updateDoc(insumoRef, { costoPorLibra: parseFloat(nuevoPrecio) });
};

export const deleteInsumo = async (id) => {
  const insumoRef = doc(db, INSUMOS_COLLECTION, id);
  await deleteDoc(insumoRef);
};

// NUEVA FUNCIÓN: Escucha cambios en tiempo real (Online y Offline)
export const subscribeToInsumos = (fincaId, callback) => {
  if (!fincaId) return () => {};

  const q = query(
    collection(db, INSUMOS_COLLECTION), 
    where("fincaId", "in", [fincaId, "sistema"]) 
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const insumosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(insumosData);
  }, (error) => {
    console.error("Error al escuchar insumos:", error);
  });

  return unsubscribe;
};