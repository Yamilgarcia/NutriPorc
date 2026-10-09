
import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "../../auth/logic/AuthContext";
import {
  subscribeToLotesFinanzas,
  subscribeToGastos,
  guardarGasto,
  eliminarGasto,
  updateGastoInm,
  anularVentaParcial,
  procesarCierreLote,
  CATEGORIA_VENTA_CERDO
} from "../data/finanzas.service";
import { subscribeToPesajes } from "../../monitoreoIA/data/pesajes.service";

export const useFinanzas = () => {
  const { user } = useAuth();
  const fincaId = user?.fincaId;

  const [lotesActivos, setLotesActivos] = useState([]);
  const [lotesHistoricos, setLotesHistoricos] = useState([]);
  const [loteIdSeleccionado, setLoteIdSeleccionado] = useState("");
  const [transacciones, setTransacciones] = useState([]);
  const [pesajesLoteActivo, setPesajesLoteActivo] = useState([]);
  const [procesandoCierre, setProcesandoCierre] = useState(false);
  const [procesandoTransaccion, setProcesandoTransaccion] = useState(false);

  const guardadoEnCurso = useRef(false);
  const cierreEnCurso = useRef(false);

  // ==========================================
  // SUSCRIPCION A LOTES
  // ==========================================
  useEffect(() => {
    if (!fincaId) {
      setLotesActivos([]);
      setLotesHistoricos([]);
      setLoteIdSeleccionado("");
      return;
    }

    return subscribeToLotesFinanzas(fincaId, (todosLosLotes) => {
      const activos = todosLosLotes.filter(
        (l) => l.estado === "Activo"
      );

      const historicos = todosLosLotes.filter(
        (l) => l.estado === "Histórico"
      );

      setLotesActivos(activos);
      setLotesHistoricos(historicos);

      setLoteIdSeleccionado((anterior) => {
        if (
          anterior &&
          activos.some((l) => l.id === anterior)
        ) {
          return anterior;
        }

        return activos[0]?.id || "";
      });
    });
  }, [fincaId]);

  // ==========================================
  // SUSCRIPCION A TRANSACCIONES
  // ==========================================
  useEffect(() => {
    setTransacciones([]);

    if (!fincaId || !loteIdSeleccionado) return;

    return subscribeToGastos(
      fincaId,
      loteIdSeleccionado,
      setTransacciones
    );
  }, [fincaId, loteIdSeleccionado]);

  // ==========================================
  // SUSCRIPCION A PESAJES IA
  // ==========================================
  useEffect(() => {
    setPesajesLoteActivo([]);

    if (!fincaId || !loteIdSeleccionado) return;

    return subscribeToPesajes(
      loteIdSeleccionado,
      fincaId,
      setPesajesLoteActivo
    );
  }, [fincaId, loteIdSeleccionado]);

  const loteActivo = useMemo(
    () =>
      lotesActivos.find(
        (l) => l.id === loteIdSeleccionado
      ) || null,
    [lotesActivos, loteIdSeleccionado]
  );

  // ==========================================
  // PESO PROMEDIO
  // ==========================================
  const pesoPromedio = useMemo(() => {
    if (pesajesLoteActivo.length > 0) {
      return Number(
        pesajesLoteActivo[
          pesajesLoteActivo.length - 1
        ].pesoPromedio || 0
      );
    }

    if (loteActivo) {
      switch (loteActivo.etapa) {
        case "Destete":
          return 25;
        case "Desarrollo":
          return 70;
        case "Engorde":
          return 160;
        default:
          return 150;
      }
    }

    return 0;
  }, [pesajesLoteActivo, loteActivo]);

  // ==========================================
  // CALCULOS FINANCIEROS
  // ==========================================
  const totalEgresos = useMemo(
    () =>
      transacciones
        .filter((t) => t.tipo !== "Ingreso")
        .reduce(
          (acc, t) => acc + Number(t.monto || 0),
          0
        ),
    [transacciones]
  );

  const totalIngresosParciales = useMemo(
    () =>
      transacciones
        .filter((t) => t.tipo === "Ingreso")
        .reduce(
          (acc, t) => acc + Number(t.monto || 0),
          0
        ),
    [transacciones]
  );

  const costoPorLibra = useMemo(() => {
    if (
      !loteActivo ||
      Number(loteActivo.cantidad) <= 0 ||
      pesoPromedio <= 0
    ) {
      return 0;
    }

    return (
      totalEgresos /
      (Number(loteActivo.cantidad) * pesoPromedio)
    );
  }, [totalEgresos, loteActivo, pesoPromedio]);

  // ==========================================
  // METRICAS HISTORICAS
  // ==========================================
  const metricasGlobales = useMemo(() => {
    let gananciaTotal = 0;
    let inversionTotal = 0;
    let cerdosVendidos = 0;

    lotesHistoricos.forEach((lote) => {
      if (!lote.finanzas) return;

      gananciaTotal += Number(
        lote.finanzas.gananciaNeta || 0
      );

      inversionTotal += Number(
        lote.finanzas.gastosTotales || 0
      );

      cerdosVendidos +=
        Number(lote.finanzas.poblacionFinal ?? 0) +
        Number(lote.vendidosParciales ?? 0);
    });

    return {
      gananciaTotal,
      inversionTotal,
      cerdosVendidos
    };
  }, [lotesHistoricos]);

  // ==========================================
  // GUARDADO DE MOVIMIENTOS
  // ==========================================
  const guardarMovimiento = async (datos) => {
    if (
      !fincaId ||
      !loteIdSeleccionado ||
      guardadoEnCurso.current
    ) {
      return false;
    }

    guardadoEnCurso.current = true;
    setProcesandoTransaccion(true);

    try {
      await guardarGasto(
        fincaId,
        loteIdSeleccionado,
        datos
      );

      return true;
    } catch (error) {
      console.error(
        "Error al registrar movimiento:",
        error
      );

      alert(
        error.message ||
        "No se pudo registrar el movimiento."
      );

      return false;
    } finally {
      guardadoEnCurso.current = false;
      setProcesandoTransaccion(false);
    }
  };

  // ==========================================
  // AGREGAR GASTOS Y OTROS INGRESOS
  // ==========================================
  const handleAgregarTransaccion = async (
    nuevaTransaccion
  ) => {
    if (
      nuevaTransaccion.tipo === "Ingreso" &&
      nuevaTransaccion.categoria === CATEGORIA_VENTA_CERDO
    ) {
      alert(
        "Usa el formulario específico de Venta Parcial de Cerdos."
      );
      return false;
    }

    return guardarMovimiento(nuevaTransaccion);
  };

  // ==========================================
  // REGISTRAR VENTA PARCIAL
  // ==========================================
  const handleRegistrarVentaParcial = async ({
    cantidadCerdos,
    montoTotal
  }) => {
    const cantidad = Number(cantidadCerdos);
    const monto = Number(montoTotal);

    if (
      !Number.isSafeInteger(cantidad) ||
      cantidad <= 0 ||
      !Number.isFinite(monto) ||
      monto <= 0
    ) {
      alert(
        "Revisa la cantidad de cerdos y el monto de la venta."
      );
      return false;
    }

    return guardarMovimiento({
      tipo: "Ingreso",
      categoria: CATEGORIA_VENTA_CERDO,
      concepto: `Venta de ${cantidad} cerdo${
        cantidad === 1 ? "" : "s"
      }`,
      monto,
      cantidadVendida: cantidad
    });
  };

  // ==========================================
  // EDITAR TRANSACCION
  // ==========================================
  const handleEditarTransaccion = async (
    id,
    datosActualizados
  ) => {
    try {
      await updateGastoInm(
        id,
        datosActualizados
      );

      return true;
    } catch (error) {
      console.error(
        "Error al editar movimiento:",
        error
      );

      alert(
        error.message ||
        "No se pudo editar la transacción."
      );

      return false;
    }
  };

  // ==========================================
  // ELIMINAR O ANULAR TRANSACCION
  // ==========================================
  const handleEliminarTransaccion = async (id) => {
    const movimiento = transacciones.find(
      (t) => t.id === id
    );

    if (!movimiento) return false;

    const esVenta =
      movimiento.tipo === "Ingreso" &&
      movimiento.categoria === CATEGORIA_VENTA_CERDO;

    if (
      esVenta &&
      !Number.isSafeInteger(
        Number(movimiento.cantidadVendida)
      )
    ) {
      alert(
        "Esta venta antigua no guarda la cantidad de animales. " +
        "Revisa el inventario antes de anularla; no se puede reintegrar automáticamente."
      );

      return false;
    }

    if (
      !window.confirm(
        esVenta
          ? `¿Anular esta venta y devolver ${movimiento.cantidadVendida} cerdo(s) al lote?`
          : "¿Anular este movimiento financiero?"
      )
    ) {
      return false;
    }

    try {
      if (esVenta) {
        await anularVentaParcial(
          fincaId,
          loteIdSeleccionado,
          id
        );
      } else {
        await eliminarGasto(id);
      }

      return true;
    } catch (error) {
      console.error(
        "Error al anular movimiento:",
        error
      );

      alert(
        error.message ||
        "No se pudo anular el movimiento."
      );

      return false;
    }
  };

  // ==========================================
  // CIERRE FINANCIERO DEL LOTE
  // ==========================================
  const handleCerrarLote = async (ingresoFinal) => {
    if (
      !loteActivo ||
      cierreEnCurso.current
    ) {
      return false;
    }

    const ingreso = Number(ingresoFinal);

    if (
      !Number.isFinite(ingreso) ||
      ingreso < 0 ||
      (
        Number(loteActivo.cantidad) > 0 &&
        ingreso <= 0
      )
    ) {
      alert(
        "Indica el ingreso final de la venta."
      );

      return false;
    }

    cierreEnCurso.current = true;
    setProcesandoCierre(true);

    const resumenFinanciero = {
      gastosTotales: totalEgresos,
      ingresosParciales: totalIngresosParciales,
      ingresoVentaFinal: ingreso,
      gananciaNeta:
        ingreso +
        totalIngresosParciales -
        totalEgresos,
      costoPorLibraCierre: costoPorLibra,
      poblacionFinal: Number(loteActivo.cantidad)
    };

    try {
      await procesarCierreLote(
        loteIdSeleccionado,
        resumenFinanciero
      );

      alert("¡Lote archivado exitosamente!");

      return true;
    } catch (error) {
      console.error(
        "Error al cerrar lote:",
        error
      );

      alert(
        error.message ||
        "No se pudo cerrar el lote."
      );

      return false;
    } finally {
      cierreEnCurso.current = false;
      setProcesandoCierre(false);
    }
  };

  // ==========================================
  // RETORNO DEL HOOK
  // ==========================================
  return {
    lotesActivos,
    lotesHistoricos,
    loteActivo,
    loteIdSeleccionado,
    setLoteIdSeleccionado,
    transacciones,
    pesoPromedio,
    totalEgresos,
    totalIngresosParciales,
    costoPorLibra,
    procesandoCierre,
    procesandoTransaccion,
    metricasGlobales,
    handleAgregarTransaccion,
    handleRegistrarVentaParcial,
    handleEliminarTransaccion,
    handleEditarTransaccion,
    handleCerrarLote
  };
};
