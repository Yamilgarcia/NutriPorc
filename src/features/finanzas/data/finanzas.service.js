import { collection, addDoc, deleteDoc, doc, updateDoc, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../../firebase.config"; 

const GASTOS_COLLECTION = "gastos";
const LOTES_COLLECTION = "lotes";

// ESCUCHAR LOTES
// ESCUCHAR LOTES (Ahora trae TODOS para poder ver el historial)
export const subscribeToLotesFinanzas = (fincaId, callback) => {
  if (!fincaId) return () => {};
  const q = query(collection(db, LOTES_COLLECTION), where("fincaId", "==", fincaId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const lotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Quitamos el filtro aquí, mandamos todos los lotes al hook
    callback(lotes);
  }, (error) => console.error("Error lotes:", error));
  return unsubscribe;
};

// ESCUCHAR TRANSACCIONES (Gastos e Ingresos Parciales)
export const subscribeToGastos = (fincaId, loteId, callback) => {
  if (!fincaId || !loteId) return () => {};
  const q = query(collection(db, GASTOS_COLLECTION), where("fincaId", "==", fincaId), where("loteId", "==", loteId));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const gastos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(gastos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
  }, (error) => console.error("Error transacciones:", error));
  return unsubscribe;
};

// GUARDAR TRANSACCIÓN (Ahora soporta 'tipo')
export const guardarGasto = async (fincaId, loteId, transaccion) => {
  const dataToSave = {
    fincaId,
    loteId,
    tipo: transaccion.tipo || "Egreso", // "Egreso" o "Ingreso"
    categoria: transaccion.categoria || "General",
    concepto: transaccion.concepto || "",
    monto: Number(transaccion.monto || 0),
    fecha: transaccion.fecha || new Date().toISOString()
  };
  const docRef = await addDoc(collection(db, GASTOS_COLLECTION), dataToSave);
  return { id: docRef.id, ...dataToSave };
};

// ACTUALIZAR TRANSACCIÓN
export const updateGastoInm = async (gastoId, nuevosDatos) => {
  const gastoRef = doc(db, GASTOS_COLLECTION, String(gastoId));
  await updateDoc(gastoRef, {
    tipo: nuevosDatos.tipo,
    concepto: nuevosDatos.concepto,
    monto: Number(nuevosDatos.monto || 0),
    categoria: nuevosDatos.categoria
  });
};

export const eliminarGasto = async (gastoId) => {
  await deleteDoc(doc(db, GASTOS_COLLECTION, String(gastoId)));
};

// CIERRE DE LOTE (Añadimos los ingresos parciales al historial)
export const procesarCierreLote = async (loteId, resumenFinanciero) => {
  const loteRef = doc(db, LOTES_COLLECTION, loteId);
  await updateDoc(loteRef, {
    estado: "Histórico",
    fechaCierre: new Date().toISOString(),
    finanzas: resumenFinanciero
  });
};