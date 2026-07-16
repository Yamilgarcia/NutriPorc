import { useAuth } from "../features/auth/logic/AuthContext";

export default function ProPaywall({ children, tituloFeature, descripcion }) {
  const { user } = useAuth();

  // Si el usuario es Pro (o si por alguna razón no hay plan definido y queremos ser permisivos en dev, aunque aquí forzamos 'Pro')
  if (user?.plan === 'Pro') {
    return children;
  }

  // Si no es Pro, mostramos el muro de pago
  return (
    <div style={{
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '70vh', 
      padding: '20px'
    }}>
      <div style={{ 
        padding: '40px 30px', 
        textAlign: 'center', 
        maxWidth: '500px', 
        width: '100%',
        backgroundColor: 'white', 
        borderRadius: '20px', 
        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.05)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🔒</div>
        
        <h2 style={{ color: '#0f172a', marginBottom: '15px', fontSize: '1.5rem', fontWeight: '800' }}>
          {tituloFeature}
        </h2>
        
        <p style={{ color: '#64748b', marginBottom: '30px', lineHeight: '1.6', fontSize: '1rem' }}>
          {descripcion || "Esta herramienta utiliza algoritmos avanzados para optimizar tu producción. Actualiza tu granja a NutriPorc Pro para desbloquearla."}
        </p>
        
        <button 
          onClick={() => {
            const stripeLink = "https://buy.stripe.com/test_7sY8wP14i67J4XyeUe7ss00";
            window.location.href = `${stripeLink}?prefilled_email=${encodeURIComponent(user?.email || '')}&client_reference_id=${user?.fincaId || ''}`;
          }}
          style={{ 
            backgroundColor: '#f59e0b', 
            color: 'white', 
            padding: '14px 24px', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            width: '100%', 
            fontSize: '1.1rem',
            transition: 'transform 0.2s',
            boxShadow: '0 4px 6px rgba(245, 158, 11, 0.2)'
          }}
          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
        >
          🚀 Adquirir Licencia Pro ($49/mes)
        </button>
      </div>
    </div>
  );
}