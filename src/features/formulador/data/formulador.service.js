import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

// Identificador de la colección de fórmulas
const FORMULAS_COLLECTION = "formulas";

/**
 * Guarda una nueva receta en Firestore.
 */
export const saveFormula = async (formulaData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido para guardar la receta.");
  const docRef = await addDoc(collection(db, FORMULAS_COLLECTION), {
    ...formulaData,
    fincaId: fincaId,
    fechaCreacion: new Date().toISOString()
  });
  return { id: docRef.id, ...formulaData };
};

/**
 * Obtiene el historial de recetas de la finca.
 */
export const getFormulas = async (fincaId) => {
  if (!fincaId) return [];
  const q = query(collection(db, FORMULAS_COLLECTION), where("fincaId", "==", fincaId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Elimina una receta del historial.
 */
export const deleteFormula = async (id) => {
  const formulaRef = doc(db, FORMULAS_COLLECTION, id);
  await deleteDoc(formulaRef);
};
