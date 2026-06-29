import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const LOTES_COLLECTION = "lotes";

/**
 * Crea un nuevo lote en Firestore vinculado a la finca del usuario actual.
 */
export const addLote = async (loteData, fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido para registrar un lote.");

  const docRef = await addDoc(collection(db, LOTES_COLLECTION), {
    ...loteData,
    fincaId: fincaId, // <-- Guardamos la llave de pertenencia real
    estado: "Activo", 
    bajas: [], 
    fechaCreacion: new Date().toISOString()
  });
  return { id: docRef.id, ...loteData, estado: "Activo", bajas: [] };
};

/**
 * Obtiene únicamente los lotes asociados a la finca autenticada.
 */
export const getLotes = async (fincaId) => {
  if (!fincaId) return []; // Si no hay ID, devolvemos un array vacío por seguridad

  const q = query(
    collection(db, LOTES_COLLECTION), 
    where("fincaId", "==", fincaId) // <-- El candado de lectura multi-tenant
  );
  
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