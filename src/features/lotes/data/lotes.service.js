import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const LOTES_COLLECTION = "lotes";
// Identificador temporal mientras se conecta el módulo de Autenticación
const MOCK_FINCA_ID = "finca_hackathon_01"; 

/**
 * Crea un nuevo lote en Firestore.
 * Inicializa el estado en "Activo" y crea el array vacío para futuras bajas.
 */
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

/**
 * Obtiene todos los lotes asociados a la finca actual.
 */
export const getLotes = async () => {
  const q = query(collection(db, LOTES_COLLECTION), where("fincaId", "==", MOCK_FINCA_ID));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Actualiza los campos especificados de un lote existente.
 */
export const updateLote = async (id, loteData) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await updateDoc(loteRef, loteData);
};

/**
 * Cambia el estado del lote a "Histórico" (soft-delete).
 */
export const archivarLote = async (id) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await updateDoc(loteRef, { estado: "Histórico" });
};

/**
 * Añade un registro de baja al historial del lote y actualiza su cantidad de animales vivos.
 */
export const registrarBajaLote = async (id, bajasActuales, nuevaBaja, cantidadRestante) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await updateDoc(loteRef, { 
    bajas: [...(bajasActuales || []), nuevaBaja],
    cantidad: cantidadRestante
  });
};

/**
 * Elimina físicamente el documento del lote en Firestore (hard-delete).
 */
export const deleteLote = async (id) => {
  const loteRef = doc(db, LOTES_COLLECTION, id);
  await deleteDoc(loteRef);
};