import { useState } from "react";

export const FormGasto = ({ onAgregarGasto }) => {
  const [concepto, setconcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Alimento");

  const handleSubmit = (e) => {
    e.preventDefault();
    const montoNumerico = parseFloat(monto);
    
    if (!concepto || isNaN(montoNumerico)) return;

    onAgregarGasto({
      id: Date.now(),
      concepto,
      monto: montoNumerico,
      categoria,
      fecha: new Date().toISOString(),
    });
    
    setconcepto("");
    setMonto("");
    setCategoria("Alimento");
  };

  return (
    <div className="np-card" style={{ borderStyle: "dashed", borderColor: "#cbd5e1" }}>
      <h3 style={{ color: "#334155", marginTop: 0, marginBottom: "20px", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "20px", color: "#64748b", fontWeight: "bold" }}>+</span> 
        Agregar nuevo gasto adicional
      </h3>
      
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "15px", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div style={{ flex: "1", minWidth: "150px" }}>
          <label className="np-label">Categoría</label>
          <select className="np-input" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            <option value="Alimento">Alimento</option>
            <option value="Vacunas">Vacunas</option>
            <option value="Jornal">Pago de Jornal</option>
            <option value="Otros">Otros</option>
          </select>
        </div>
        
        <div style={{ flex: "2", minWidth: "200px" }}>
          <label className="np-label">Concepto</label>
          <input type="text" className="np-input" value={concepto} onChange={(e) => setconcepto(e.target.value)} placeholder="Ej. Desparasitante lote B" required />
        </div>
        
        <div style={{ flex: "1", minWidth: "120px" }}>
          <label className="np-label">Costo C$</label>
          <input type="number" step="0.01" className="np-input" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="0.00" required />
        </div>
        
        <div>
          <button type="submit" className="np-btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  );
};