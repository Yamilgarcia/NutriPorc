import { collection, getDocs, doc, setDoc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const HISTORIAL_COLLECTION = "historial_sanitario";

// 1. Generar ID instantáneo para UI Optimista
export const crearHistorialId = () => doc(collection(db, HISTORIAL_COLLECTION)).id;

// 2. Registrar una acción médica o descarte (Offline First)
export const registrarAccionSanitaria = async (id, accionData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido");

  const docRef = doc(db, HISTORIAL_COLLECTION, id);
  const dataFinal = {
    ...accionData,
    fincaId: fincaId,
    fechaRegistro: new Date().toISOString()
  };

  await setDoc(docRef, dataFinal);
  return dataFinal;
};

// 3. Obtener el historial de un lote específico
export const getHistorialPorLote = async (fincaId, loteId) => {
  if (!fincaId || !loteId) return [];
  const q = query(
    collection(db, HISTORIAL_COLLECTION), 
    where("fincaId", "==", fincaId),
    where("loteId", "==", loteId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};