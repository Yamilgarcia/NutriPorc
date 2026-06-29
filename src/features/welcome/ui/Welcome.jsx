import { useDashboardAlerts } from '../logic/useDashboardAlerts';
import { useNavigate } from 'react-router-dom';
import './Welcome.css';

export default function Welcome() {
  const { alertasOptimas, loadingAlertas } = useDashboardAlerts();
  const navigate = useNavigate();

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="logo-placeholder">🐷</div>
        <h1 className="welcome-title">Bienvenido a NutriPorc Pro</h1>
        <p className="welcome-subtitle">
          Ciencia nutricional al alcance del pequeño productor.
        </p>
        {/* Alertas del Maximizador */}
        {!loadingAlertas && alertasOptimas.length > 0 && (
          <div className="dashboard-alerts">
            <h3 className="alerts-title">Alertas de Rentabilidad</h3>
            {alertasOptimas.map(alerta => (
              <div key={alerta.loteId} className="alert-card verde-tierno" onClick={() => navigate('/maximizador')}>
                <div className="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                    <polyline points="17 6 23 6 23 12"></polyline>
                  </svg>
                </div>
                <div className="alert-content">
                  <strong>{alerta.loteNombre}</strong>
                  <span>
                    {alerta.diasRestantes === 0 
                      ? "¡Vender HOY!" 
                      : `Vender en ${alerta.diasRestantes} días`}
                  </span>
                  <span className="alert-profit">Margen: ${alerta.gananciaNeta.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}