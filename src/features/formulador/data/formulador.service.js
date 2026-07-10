import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const FORMULAS_COLLECTION = "formulas";

export const saveFormula = async (formulaData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido para guardar la receta.");
  const docRef = await addDoc(collection(db, FORMULAS_COLLECTION), {
    ...formulaData,
    fincaId: fincaId,
    fechaCreacion: new Date().toISOString()
  });
  return { id: docRef.id, ...formulaData };
};

export const getFormulas = async (fincaId) => {
  if (!fincaId) return [];
  const q = query(collection(db, FORMULAS_COLLECTION), where("fincaId", "==", fincaId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const deleteFormula = async (id) => {
  const formulaRef = doc(db, FORMULAS_COLLECTION, id);
  await deleteDoc(formulaRef);
};

// NUEVA FUNCIÓN: Escucha el historial de fórmulas en tiempo real
export const subscribeToFormulas = (fincaId, callback) => {
  if (!fincaId) return () => {};
  const q = query(collection(db, FORMULAS_COLLECTION), where("fincaId", "==", fincaId));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const formulasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(formulasData);
  }, (error) => {
    console.error("Error al escuchar fórmulas:", error);
  });

  return unsubscribe;
};