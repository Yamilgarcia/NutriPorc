export const TablaGastos = ({ gastos = [], onEliminarGasto }) => {
  return (
    <div className="np-card" style={{ padding: "0" }}>
      <h3 style={{ padding: "15px", color: "#334155", margin: 0 }}>Historial de Gastos</h3>
      <div style={{ overflowX: "auto" }}>
        <table className="np-table" style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px" }}>Fecha</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Descripción</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Monto (C$)</th>
              <th style={{ textAlign: "center", padding: "12px" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                  No hay gastos registrados en este lote.
                </td>
              </tr>
            ) : (
              gastos.map((gasto) => (
                <tr key={gasto.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: "12px" }}>
                    {gasto.fecha ? new Date(gasto.fecha).toLocaleDateString() : "-"}
                  </td>
                  {/* Solución al Bug: Ahora mapea correctamente la propiedad 'concepto' */}
                  <td style={{ padding: "12px" }}>{gasto.concepto || "Sin concepto"}</td>
                  <td style={{ padding: "12px", fontWeight: "600" }}>
                    C$ {Number(gasto.monto || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "center", padding: "12px" }}>
                    <button 
                      className="np-btn-danger" 
                      onClick={() => onEliminarGasto(gasto.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};