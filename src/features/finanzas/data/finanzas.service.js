
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  onSnapshot,
  runTransaction
} from "firebase/firestore";

import { db } from "../../../../firebase.config";

const GASTOS_COLLECTION = "gastos";
const LOTES_COLLECTION = "lotes";

export const CATEGORIA_VENTA_CERDO =
  "Venta de Cerdo (Parcial)";

// ==========================================
// ESCUCHAR TODOS LOS LOTES
// ==========================================
export const subscribeToLotesFinanzas = (
  fincaId,
  callback
) => {
  if (!fincaId) return () => {};

  const q = query(
    collection(db, LOTES_COLLECTION),
    where("fincaId", "==", fincaId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lotes = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data()
      }));

      callback(lotes);
    },
    (error) => {
      console.error(
        "Error al escuchar lotes para finanzas:",
        error
      );
    }
  );
};

// ==========================================
// ESCUCHAR GASTOS E INGRESOS
// ==========================================
export const subscribeToGastos = (
  fincaId,
  loteId,
  callback
) => {
  if (!fincaId || !loteId) return () => {};

  const q = query(
    collection(db, GASTOS_COLLECTION),
    where("fincaId", "==", fincaId),
    where("loteId", "==", loteId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const transacciones = snapshot.docs.map(
        (documento) => ({
          id: documento.id,
          ...documento.data()
        })
      );

      transacciones.sort(
        (a, b) =>
          new Date(b.fecha) - new Date(a.fecha)
      );

      callback(transacciones);
    },
    (error) => {
      console.error(
        "Error al escuchar transacciones:",
        error
      );
    }
  );
};

// ==========================================
// GUARDAR GASTOS, INGRESOS Y VENTAS
// ==========================================
export const guardarGasto = async (
  fincaId,
  loteId,
  transaccion
) => {
  if (!fincaId || !loteId) {
    throw new Error(
      "Debes seleccionar una finca y un lote."
    );
  }

  const monto = Number(transaccion.monto);

  if (!Number.isFinite(monto) || monto <= 0) {
    throw new Error(
      "El monto debe ser mayor que cero."
    );
  }

  const dataToSave = {
    fincaId,
    loteId,
    tipo: transaccion.tipo || "Egreso",
    categoria: transaccion.categoria || "General",
    concepto: String(
      transaccion.concepto || ""
    ).trim(),
    monto,
    fecha:
      transaccion.fecha ||
      new Date().toISOString()
  };

  const esVentaCerdos =
    dataToSave.tipo === "Ingreso" &&
    dataToSave.categoria === CATEGORIA_VENTA_CERDO;

  // Los gastos y otros ingresos no modifican
  // la cantidad de cerdos.
  if (!esVentaCerdos) {
    const referencia = await addDoc(
      collection(db, GASTOS_COLLECTION),
      dataToSave
    );

    return {
      id: referencia.id,
      ...dataToSave
    };
  }

  // ==========================================
  // VENTA PARCIAL DE CERDOS
  // ==========================================
  const cantidadVendida = Number(
    transaccion.cantidadVendida
  );

  if (
    !Number.isSafeInteger(cantidadVendida) ||
    cantidadVendida <= 0
  ) {
    throw new Error(
      "Indica cuántos cerdos vendiste (número entero mayor que 0)."
    );
  }

  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    loteId
  );

  const ingresoRef = doc(
    collection(db, GASTOS_COLLECTION)
  );

  const venta = {
    ...dataToSave,
    cantidadVendida
  };

  // Transacción atómica:
  // 1. Consulta la población actual.
  // 2. Verifica que exista suficiente inventario.
  // 3. Resta los animales vendidos.
  // 4. Guarda el ingreso financiero.
  await runTransaction(db, async (transaction) => {
    const snapshotLote = await transaction.get(
      loteRef
    );

    if (!snapshotLote.exists()) {
      throw new Error(
        "El lote ya no existe."
      );
    }

    const lote = snapshotLote.data();

    if (lote.fincaId !== fincaId) {
      throw new Error(
        "Este lote no pertenece a la finca seleccionada."
      );
    }

    if (lote.estado !== "Activo") {
      throw new Error(
        "Solo puedes vender animales de lotes activos."
      );
    }

    const disponibles = Number(
      lote.cantidad
    );

    const vendidosPrevios = Number(
      lote.vendidosParciales ?? 0
    );

    if (
      !Number.isSafeInteger(disponibles) ||
      disponibles < 0 ||
      !Number.isSafeInteger(vendidosPrevios) ||
      vendidosPrevios < 0
    ) {
      throw new Error(
        "El inventario del lote contiene datos no válidos."
      );
    }

    if (cantidadVendida > disponibles) {
      throw new Error(
        `Solo quedan ${disponibles} cerdos disponibles.`
      );
    }

    transaction.update(loteRef, {
      cantidad:
        disponibles - cantidadVendida,
      vendidosParciales:
        vendidosPrevios + cantidadVendida
    });

    transaction.set(
      ingresoRef,
      venta
    );
  });

  return {
    id: ingresoRef.id,
    ...venta
  };
};

// ==========================================
// ACTUALIZAR TRANSACCION FINANCIERA
// ==========================================
export const updateGastoInm = async (
  gastoId,
  nuevosDatos
) => {
  const monto = Number(
    nuevosDatos.monto
  );

  const concepto = String(
    nuevosDatos.concepto || ""
  ).trim();

  if (
    !Number.isFinite(monto) ||
    monto <= 0 ||
    !concepto
  ) {
    throw new Error(
      "Ingresa un concepto y un monto válidos."
    );
  }

  // No cambia tipo, categoría o cantidadVendida.
  // Para corregir los animales vendidos:
  // anular la venta y volver a registrarla.
  await updateDoc(
    doc(
      db,
      GASTOS_COLLECTION,
      String(gastoId)
    ),
    {
      concepto,
      monto
    }
  );
};

// ==========================================
// ELIMINAR MOVIMIENTO NORMAL
// ==========================================
export const eliminarGasto = async (gastoId) => {
  await deleteDoc(
    doc(
      db,
      GASTOS_COLLECTION,
      String(gastoId)
    )
  );
};

// ==========================================
// ANULAR VENTA PARCIAL
// ==========================================
export const anularVentaParcial = async (
  fincaId,
  loteId,
  gastoId
) => {
  if (!fincaId || !loteId || !gastoId) {
    throw new Error(
      "Faltan datos para anular la venta."
    );
  }

  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    loteId
  );

  const ingresoRef = doc(
    db,
    GASTOS_COLLECTION,
    String(gastoId)
  );

  await runTransaction(db, async (transaction) => {
    const ingresoSnap = await transaction.get(
      ingresoRef
    );

    const loteSnap = await transaction.get(
      loteRef
    );

    if (
      !ingresoSnap.exists() ||
      !loteSnap.exists()
    ) {
      throw new Error(
        "El lote o la venta ya no existen."
      );
    }

    const venta = ingresoSnap.data();
    const lote = loteSnap.data();

    if (
      venta.fincaId !== fincaId ||
      venta.loteId !== loteId ||
      lote.fincaId !== fincaId
    ) {
      throw new Error(
        "La venta no pertenece al lote seleccionado."
      );
    }

    if (lote.estado !== "Activo") {
      throw new Error(
        "No se pueden anular ventas de un lote cerrado."
      );
    }

    if (
      venta.tipo !== "Ingreso" ||
      venta.categoria !== CATEGORIA_VENTA_CERDO
    ) {
      throw new Error(
        "El movimiento no es una venta parcial de cerdos."
      );
    }

    const cantidadVendida = Number(
      venta.cantidadVendida
    );

    const disponibles = Number(
      lote.cantidad
    );

    const vendidos = Number(
      lote.vendidosParciales ?? 0
    );

    if (
      !Number.isSafeInteger(cantidadVendida) ||
      cantidadVendida <= 0 ||
      !Number.isSafeInteger(disponibles) ||
      disponibles < 0 ||
      !Number.isSafeInteger(vendidos) ||
      vendidos < cantidadVendida
    ) {
      throw new Error(
        "La venta es antigua o el inventario necesita revisión."
      );
    }

    // Devuelve los animales y elimina el ingreso
    // en la misma operación.
    transaction.update(loteRef, {
      cantidad:
        disponibles + cantidadVendida,
      vendidosParciales:
        vendidos - cantidadVendida
    });

    transaction.delete(ingresoRef);
  });
};

// ==========================================
// CIERRE FINANCIERO DEL LOTE
// ==========================================
export const procesarCierreLote = async (
  loteId,
  resumenFinanciero
) => {
  const loteRef = doc(
    db,
    LOTES_COLLECTION,
    loteId
  );

  await updateDoc(loteRef, {
    estado: "Histórico",
    fechaCierre: new Date().toISOString(),
    finanzas: resumenFinanciero
  });
};
  