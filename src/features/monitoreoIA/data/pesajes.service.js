import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore";
// Ajusta la ruta de importación según dónde tengas tu firebase.config.js
import { db } from "../../../../firebase.config"; 

const PESAJES_COLLECTION = "pesajes";

// CREAR (Manual y Con IA)
export const addPesaje = async (loteId, pesoPromedio, fecha, metodo = "manual", fincaId) => {
  if (!fincaId) throw new Error("ID de finca requerido.");
  
  const docRef = await addDoc(collection(db, PESAJES_COLLECTION), {
    fincaId: fincaId, // <-- Candado al crear
    loteId,
    pesoPromedio: parseFloat(pesoPromedio),
    fecha, // Formato esperado: YYYY-MM-DD
    metodo, // "manual" o "ia"
    timestamp: new Date().toISOString()
  });
  return { id: docRef.id, fincaId, loteId, pesoPromedio, fecha, metodo };
};

// LEER (Historial para la Curva de Crecimiento)
export const getPesajesPorLote = async (loteId, fincaId) => {
  if (!fincaId) return [];

  const q = query(
    collection(db, PESAJES_COLLECTION), 
    where("fincaId", "==", fincaId), // <-- Candado al leer
    where("loteId", "==", loteId)
  );
  
  const snapshot = await getDocs(q);
  const pesajes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  // Ordenamos cronológicamente en memoria
  return pesajes.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
};

// ACTUALIZAR (Corregir error tipográfico)
export const updatePesaje = async (id, nuevoPeso) => {
  const pesajeRef = doc(db, PESAJES_COLLECTION, id);
  await updateDoc(pesajeRef, { 
    pesoPromedio: parseFloat(nuevoPeso),
    editado: true // Marca de auditoría opcional
  });
};


// ELIMINAR (Añade esta función)
export const deletePesaje = async (id) => {
  const pesajeRef = doc(db, PESAJES_COLLECTION, id);
  await deleteDoc(pesajeRef);
};

// NUEVA FUNCIÓN: Escucha el historial de pesajes en tiempo real
export const subscribeToPesajes = (loteId, fincaId, callback) => {
  if (!fincaId || !loteId) return () => {};

  const q = query(
    collection(db, PESAJES_COLLECTION), 
    where("fincaId", "==", fincaId),
    where("loteId", "==", loteId)
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const pesajesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Ordenamos cronológicamente en memoria antes de enviar a la interfaz
    callback(pesajesData.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
  }, (error) => {
    console.error("Error al escuchar pesajes:", error);
  });

  return unsubscribe;
};