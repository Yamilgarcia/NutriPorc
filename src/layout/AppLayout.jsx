import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
// 1. Importamos tu contexto de autenticación
import { useAuth } from "../features/auth/logic/AuthContext";
import "./AppLayout.css";
import InstallPWAButton from "../components/InstallPWAButton";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  // 2. Extraemos la función logout
  const { logout } = useAuth();

  // Función manejadora para cerrar el menú antes de salir
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

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
      {/* Añadimos display flex en línea para garantizar que el botón se vaya al fondo */}
      <aside
        className={`side-menu ${menuOpen ? "open" : ""}`}
        style={{ display: "flex", flexDirection: "column" }}
      >
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

        <nav className="side-menu-nav" style={{ flex: 1 }}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Inicio
          </NavLink>

          <NavLink
            to="/lotes"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Lotes y Cerdos
          </NavLink>

          <NavLink
            to="/insumos"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Biblioteca de Insumos
          </NavLink>

          <NavLink
            to="/formulador"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Formulador de Dietas
          </NavLink>

          <NavLink
            to="/monitoreo"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Módulo de Monitoreo de Peso
          </NavLink>

          <NavLink
            to="/maximizador"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Maximizador de Ganancia
          </NavLink>

          <NavLink
            to="/finanzas"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
            onClick={() => setMenuOpen(false)}
          >
            Control Financiero
          </NavLink>
        </nav>

        {/* 3. BOTÓN DE CERRAR SESIÓN AL FINAL DEL MENÚ */}
        <div
          style={{
            padding: "20px",
            borderTop: "1px solid #e2e8f0",
            marginTop: "auto",
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              backgroundColor: "#ef4444",
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#ef4444")}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Cerrar Sesión
          </button>
        </div>
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
