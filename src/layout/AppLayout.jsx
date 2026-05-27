import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import "./AppLayout.css";
import InstallPWAButton from "../components/InstallPWAButton";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* APPBAR LIGERA Y DE ALTO CONTRASTE */}
      <header className="app-header">
        <div className="header-content">
          <button
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            {/* Icono de hamburguesa SVG puro */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <h1 className="header-title">
            <span>Nutri</span>Porc
          </h1>
        </div>

        {/* Espacio reservado para el botón de PWA */}
        <div className="header-actions">
          <InstallPWAButton />
        </div>
      </header>

      {/* MENÚ LATERAL (SIDEBAR) */}
      <aside className={`side-menu ${menuOpen ? "open" : ""}`}>
        <div className="side-menu-header">
          <h2>Menú</h2>
          <button className="close-button" onClick={() => setMenuOpen(false)}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav className="side-menu-nav">
          <NavLink 
            to="/" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Inicio
          </NavLink>
          
          <NavLink 
            to="/lotes" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Lotes y Cerdos
          </NavLink>
          
          <NavLink 
            to="/insumos" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Biblioteca de Insumos
          </NavLink>
          
          <NavLink 
            to="/formulador" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Formulador de Dietas
          </NavLink>
          
          <NavLink 
            to="/finanzas" 
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            onClick={() => setMenuOpen(false)}
          >
            Rentabilidad
          </NavLink>
        </nav>
      </aside>

      {/* OVERLAY OSCURO PARA CERRAR EL MENÚ */}
      {menuOpen && (
        <div className="menu-overlay" onClick={() => setMenuOpen(false)}></div>
      )}

      {/* CONTENEDOR PRINCIPAL DONDE RENDERIZAN LAS VISTAS */}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}