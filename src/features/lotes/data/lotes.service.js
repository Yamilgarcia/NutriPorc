
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  increment,
  arrayUnion
} from "firebase/firestore";

import { db } from "../../../../firebase.config";

const LOTES_COLLECTION = "lotes";

// ==========================================
// AGREGAR NUEVO LOTE
// ==========================================
export const addLote = async (
  loteData,
  fincaId
) => {
  if (!fincaId) {
    throw new Error(
      "ID de finca requerido para registrar un lote."
    );
  }

  const cantidad = Number(
    loteData.cantidad
  );

  if (
    !Number.isSafeInteger(cantidad) ||
    cantidad <= 0
  ) {
    throw new Error(
      "Indica una cantidad inicial válida de cerdos."
    );
  }

  const data = {
    ...loteData,
    fincaId,
    cantidad,

    // Población original del lote.
    cantidadInicial: cantidad,

    // Animales vendidos parcialmente.
    vendidosParciales: 0,

    estado: "Activo",
    bajas: [],

    fechaCreacion:
      new Date().toISOString()
  };

  const referencia = await addDoc(
    collection(db, LOTES_COLLECTION),
    data
  );

  return {
    id: referencia.id,
    ...data
  };
};

// ==========================================
// OBTENER LOTES POR FINCA
// ==========================================
export const getLotes = async (fincaId) => {
  if (!fincaId) return [];

  const q = query(
    collection(db, LOTES_COLLECTION),
    where("fincaId", "==", fincaId)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((documento) => ({
    id: documento.id,
    ...documento.data()
  }));
};

// ==========================================
// ACTUALIZAR DATOS DEL LOTE
// ==========================================
export const updateLote = async (
  id,
  loteData
) => {
  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    id
  );

  await updateDoc(
    loteRef,
    loteData
  );
};

// ==========================================
// ARCHIVAR LOTE
// ==========================================
export const archivarLote = async (
  id,
  datosCierre
) => {
  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    id
  );

  await updateDoc(loteRef, {
    estado: "Histórico",
    ...datosCierre
  });
};

// ==========================================
// REGISTRAR BAJA POR MORTALIDAD
// ==========================================
export const registrarBajaLote = async (
  id,
  bajasActuales,
  nuevaBaja,
  cantidadRestante
) => {
  const cantidad = Number(
    nuevaBaja.cantidad
  );

  if (
    !Number.isSafeInteger(cantidad) ||
    cantidad <= 0
  ) {
    throw new Error(
      "Indica una cantidad válida para la baja."
    );
  }

  // Genera un identificador para cada baja.
  const registroId = doc(
    collection(db, LOTES_COLLECTION)
  ).id;

  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    id
  );

  // Incremento atómico para no sobrescribir
  // una población que haya cambiado.
  await updateDoc(loteRef, {
    cantidad: increment(-cantidad),

    bajas: arrayUnion({
      ...nuevaBaja,
      cantidad,
      registroId
    })
  });
};

// ==========================================
// ELIMINAR LOTE
// ==========================================
export const deleteLote = async (id) => {
  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    id
  );

  await deleteDoc(loteRef);
};

// ==========================================
// SUSCRIPCION EN TIEMPO REAL
// ==========================================
export const subscribeToLotes = (
  fincaId,
  callback
) => {
  if (!fincaId) {
    return () => {};
  }

  const q = query(
    collection(db, LOTES_COLLECTION),
    where("fincaId", "==", fincaId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lotes = snapshot.docs.map(
        (documento) => ({
          id: documento.id,
          ...documento.data()
        })
      );

      callback(lotes);
    },
    (error) => {
      console.error(
        "Error al escuchar lotes:",
        error
      );
    }
  );
};

// ==========================================
// REGISTRAR PESAJE DEL LOTE
// ==========================================
export const registrarPesajeLote = async (
  id,
  pesajesActuales,
  nuevoPesaje
) => {
  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    id
  );

  await updateDoc(loteRef, {
    pesajes: [
      ...(pesajesActuales || []),
      nuevoPesaje
    ]
  });
};
