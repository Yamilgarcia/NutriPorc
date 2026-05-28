import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore";
import { db } from "../../../../firebase.config";

const INSUMOS_COLLECTION = "insumos";
// Identificador temporal mientras se conecta el módulo de Autenticación
const MOCK_FINCA_ID = "finca_hackathon_01"; 

export const addInsumo = async (insumoData) => {
  const docRef = await addDoc(collection(db, INSUMOS_COLLECTION), {
    ...insumoData,
    fincaId: MOCK_FINCA_ID,
    estado: "activo",
    fechaCreacion: new Date()
  });
  return { id: docRef.id, ...insumoData };
};



export const getInsumos = async () => {
  // Aquí está la magia: el "in" le dice que traiga AMBOS tipos de fincaId
  const q = query(
    collection(db, INSUMOS_COLLECTION), 
    where("fincaId", "in", [MOCK_FINCA_ID, "sistema"])
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updatePrecioInsumo = async (id, nuevoPrecio) => {
  const insumoRef = doc(db, INSUMOS_COLLECTION, id);
  await updateDoc(insumoRef, { costoPorLibra: parseFloat(nuevoPrecio) });
};

export const deleteInsumo = async (id) => {
  const insumoRef = doc(db, INSUMOS_COLLECTION, id);
  await deleteDoc(insumoRef);
};