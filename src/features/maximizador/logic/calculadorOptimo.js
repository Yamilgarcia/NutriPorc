export const calcularPuntoOptimoLote = (lote, pesajes, precioVenta, costoAlimento) => {
  if (!lote || !pesajes || pesajes.length === 0) return null;

  // Obtener el último peso real registrado
  const ultimoPesaje = [...pesajes].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
  let pesoActual = ultimoPesaje.pesoPromedio;
  const cantidadCerdos = lote.cantidad;
  
  let historial = [];
  let gananciaMaxima = -Infinity;
  let diaOptimoIndex = 0;

  // Simular 30 días en el futuro
  let pesoSimulado = pesoActual;
  let costoAcumulado = 0; // Costo de alimentar *a un cerdo* desde HOY

  for (let dia = 0; dia <= 30; dia++) {
    // Ingreso total si se vende hoy
    const ingresoPorCerdo = pesoSimulado * precioVenta;
    const gananciaNetaPorCerdo = ingresoPorCerdo - costoAcumulado;
    const gananciaNetaLote = gananciaNetaPorCerdo * cantidadCerdos;

    historial.push({
      diaExt: dia,
      peso: parseFloat(pesoSimulado.toFixed(1)),
      ingreso: ingresoPorCerdo,
      costoMantenimiento: costoAcumulado,
      gananciaNeta: parseFloat(gananciaNetaLote.toFixed(2))
    });

    if (gananciaNetaLote > gananciaMaxima) {
      gananciaMaxima = gananciaNetaLote;
      diaOptimoIndex = dia;
    }

    // Lógica de simulación para el siguiente día:
    const gananciaDiariaPeso = pesoSimulado > 220 ? 1.2 : 1.8;
    pesoSimulado += gananciaDiariaPeso;

    // El cerdo come aprox 4% de su peso vivo en lbs
    const consumoDiarioLbs = pesoSimulado * 0.04; 
    costoAcumulado += consumoDiarioLbs * costoAlimento;
  }

  // Calcula cómo cambia la ganancia respecto al día 0
  const gananciaDiaCero = historial[0].gananciaNeta;
  historial = historial.map(h => {
    const porcentajeCambio = ((h.gananciaNeta - gananciaDiaCero) / (gananciaDiaCero || 1)) * 100;
    return { ...h, porcentajeCambio: parseFloat(porcentajeCambio.toFixed(2)) };
  });

  const diaOptimo = historial[diaOptimoIndex];

  return {
    historial,
    diaOptimo
  };
};
