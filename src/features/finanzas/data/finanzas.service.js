import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config"; 

const GASTOS_COLLECTION = "gastos";

/**
 * Obtiene todos los gastos filtrados por loteId.
 */
export const obtenerGastosPorLote = async (loteId) => {
  if (!loteId) return [];
  
  try {
    const q = query(collection(db, GASTOS_COLLECTION), where("loteId", "==", loteId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ 
      id: doc.id,
      ...doc.data() 
    }));
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return [];
  }
};

/**
 * Guarda un nuevo gasto.
 */
export const guardarGasto = async (gasto) => {
  try {
    const dataToSave = {
      categoria: gasto.categoria || "General",
      descripcion: gasto.descripcion || "",
      monto: Number(gasto.monto || 0),
      loteId: gasto.loteId,
      fecha: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, GASTOS_COLLECTION), dataToSave);
    
    return { id: docRef.id, ...dataToSave };
  } catch (error) {
    console.error("Error al guardar gasto:", error);
    throw error;
  }
};

/**
 * Elimina un gasto usando el ID del documento.
 */
export const eliminarGasto = async (gastoId) => {
  if (!gastoId) {
    console.error("Intento de eliminar sin ID");
    return false;
  }

  try {
    const gastoRef = doc(db, GASTOS_COLLECTION, String(gastoId));
    await deleteDoc(gastoRef);
    
    console.log(`Documento ${gastoId} eliminado exitosamente`);
    return true;
  } catch (error) {
    console.error("Error al eliminar gasto en Firestore:", error);
    return false;
  }
};