//import { useWelcome } from '../logic/useWelcome';
import './Welcome.css';

export default function Welcome() {
  //const { handleEntrar } = useWelcome();

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="logo-placeholder">🐷</div>
        <h1 className="welcome-title">Bienvenido a NutriPorc Pro</h1>
        <p className="welcome-subtitle">
          Ciencia nutricional al alcance del pequeño productor.
        </p>
        
        {/* <button className="btn-entrar" onClick={handleEntrar}>
  Entrar al Sistema
</button> */}
      </div>
    </div>
  );
}