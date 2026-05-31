import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
// Ajusta la ruta de importación según dónde tengas tu firebase.config.js
import { db } from "../../../../firebase.config"; 

const PESAJES_COLLECTION = "pesajes";
const MOCK_FINCA_ID = "finca_hackathon_01"; 

// CREAR (Manual y Con IA)
export const addPesaje = async (loteId, pesoPromedio, fecha, metodo = "manual") => {
  const docRef = await addDoc(collection(db, PESAJES_COLLECTION), {
    fincaId: MOCK_FINCA_ID,
    loteId,
    pesoPromedio: parseFloat(pesoPromedio),
    fecha, // Formato esperado: YYYY-MM-DD
    metodo, // "manual" o "ia"
    timestamp: new Date().toISOString()
  });
  return { id: docRef.id, fincaId: MOCK_FINCA_ID, loteId, pesoPromedio, fecha, metodo };
};

// LEER (Historial para la Curva de Crecimiento)
export const getPesajesPorLote = async (loteId) => {
  const q = query(
    collection(db, PESAJES_COLLECTION), 
    where("fincaId", "==", MOCK_FINCA_ID),
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

// ELIMINAR (Borrar registros anómalos)
export const deletePesaje = async (id) => {
  const pesajeRef = doc(db, PESAJES_COLLECTION, id);
  await deleteDoc(pesajeRef);
};