import  { useState } from "react";

export const FormCierreLote = ({ gastosTotales, onCerrarLote }) => {
  const [precioVenta, setPrecioVenta] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const ingreso = parseFloat(precioVenta);
    if (isNaN(ingreso)) return;
    
    onCerrarLote({ 
      ingresoTotal: ingreso, 
      gananciaNeta: ingreso - gastosTotales 
    });
  };

  return (
    <div className="np-card" style={{ backgroundColor: "#f8fafc", marginTop: "24px" }}>
      <h3 style={{ color: "#334155", marginTop: 0, marginBottom: "20px", fontSize: "18px" }}>
        Cierre de Lote y Análisis
      </h3>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
        <div>
          <p className="np-label">Total Invertido (Gastos Acumulados)</p>
          <p style={{ margin: "5px 0 0 0", color: "#0f172a", fontSize: "24px", fontWeight: "bold" }}>
            C$ {gastosTotales.toFixed(2)}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
          <div>
            <label className="np-label">Ingreso Total por Venta (C$)</label>
            <input 
              type="number" 
              step="0.01" 
              className="np-input"
              style={{ width: "240px" }}
              value={precioVenta} 
              onChange={(e) => setPrecioVenta(e.target.value)} 
              placeholder="Ej. 25000"
              required 
            />
          </div>
          <button type="submit" className="np-btn-primary" style={{ backgroundColor: "#10b981" }}>
            Finalizar Lote
          </button>
        </form>
      </div>
    </div>
  );
};