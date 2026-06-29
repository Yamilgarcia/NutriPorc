import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const FORMULAS_COLLECTION = "formulas";
// Identificador temporal mientras se conecta el módulo de Autenticación
const MOCK_FINCA_ID = "finca_hackathon_01";

/**
 * Guarda una nueva receta en Firestore.
 */
export const saveFormula = async (formulaData) => {
  const docRef = await addDoc(collection(db, FORMULAS_COLLECTION), {
    ...formulaData,
    fincaId: MOCK_FINCA_ID,
    fechaCreacion: new Date().toISOString()
  });
  return { id: docRef.id, ...formulaData };
};

/**
 * Obtiene el historial de recetas de la finca.
 */
export const getFormulas = async () => {
  const q = query(collection(db, FORMULAS_COLLECTION), where("fincaId", "==", MOCK_FINCA_ID));
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