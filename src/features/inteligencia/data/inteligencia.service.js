import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const LOTES_COLLECTION = "lotes";
const DIETAS_COLLECTION = "dietas";

// 1. Obtener lotes que ya finalizaron su ciclo (Históricos)
export const getLotesHistoricos = async (fincaId) => {
  if (!fincaId) return [];
  // Buscamos solo los lotes archivados
  const q = query(
    collection(db, LOTES_COLLECTION), 
    where("fincaId", "==", fincaId),
    where("estado", "==", "Histórico")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 2. Obtener la biblioteca de dietas/recetas de la granja
export const getDietasGranja = async (fincaId) => {
  if (!fincaId) return [];
  const q = query(
    collection(db, DIETAS_COLLECTION), 
    where("fincaId", "==", fincaId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};