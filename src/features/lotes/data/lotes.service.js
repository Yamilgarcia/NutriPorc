import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const LOTES_COLLECTION = "lotes";
// Identificador temporal mientras se conecta el módulo de Autenticación
const MOCK_FINCA_ID = "finca_hackathon_01"; 

export const addLote = async (loteData) => {
  const docRef = await addDoc(collection(db, LOTES_COLLECTION), {
    ...loteData,
    fincaId: MOCK_FINCA_ID,
    estado: "Activo", // "Activo" o "Histórico"
    bajas: [], // array para registrar bajas
    fechaCreacion: new Date().toISOString()
  });
  return { id: docRef.id, ...loteData, estado: "Activo", bajas: [] };
};

export const getLotes = async () => {
  const q = query(collection(db, LOTES_COLLECTION), where("fincaId", "==", MOCK_FINCA_ID));
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
