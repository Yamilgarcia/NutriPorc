// Agrega "collection" a tus importaciones si no estaba
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config"; 

const GASTOS_COLLECTION = "gastos";
const LOTES_COLLECTION = "lotes"; // Colección observada en tu Firestore

/**
 * Obtiene todos los lotes activos que pertenecen exclusivamente a la finca del usuario.
 */
export const obtenerLotesPorFinca = async (fincaId) => {
  if (!fincaId) return [];
  
  try {
    const q = query(
      collection(db, LOTES_COLLECTION),
      where("fincaId", "==", fincaId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error al obtener los lotes de la finca:", error);
    return [];
  }
};

/**
 * Obtiene todos los gastos filtrados por loteId y fincaId.
 */
export const obtenerGastosPorLote = async (fincaId, loteId) => {
  if (!fincaId || !loteId) return [];
  
  try {
    const q = query(
      collection(db, GASTOS_COLLECTION), 
      where("fincaId", "==", fincaId),
      where("loteId", "==", loteId)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error al obtener gastos de la finca:", error);
    return [];
  }
};

export const guardarGasto = async (fincaId, loteId, gasto) => {
  try {
    const dataToSave = {
      fincaId,
      loteId,
      categoria: gasto.categoria || "General",
      concepto: gasto.concepto || "",
      monto: Number(gasto.monto || 0),
      fecha: gasto.fecha || new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, GASTOS_COLLECTION), dataToSave);
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error("Error al guardar gasto en Firestore:", error);
    throw error;
  }
};

export const eliminarGasto = async (gastoId) => {
  if (!gastoId) return false;
  try {
    const gastoRef = doc(db, GASTOS_COLLECTION, String(gastoId));
    await deleteDoc(gastoRef);
    return true;
  } catch (error) {
    // Ahora sí estamos usando la variable 'error'
    console.error("Error al eliminar gasto en Firestore:", error);
    return false;
  }
};