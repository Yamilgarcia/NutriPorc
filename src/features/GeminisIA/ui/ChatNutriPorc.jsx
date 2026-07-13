import { useState, useRef, useEffect } from 'react';
import { iniciarChatPorcino } from '../data/geminiService'; 
import './ChatNutriPorc.css';

const formatearTexto = (texto) => {
  if (!texto) return '';
  let html = texto.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); 
  html = html.replace(/### (.*?)\n/g, '<h3 class="ia-subtitle">$1</h3>'); 
  html = html.replace(/\*(.*?)\n/g, '<li>$1</li>'); // Para listas
  html = html.replace(/\n/g, '<br/>'); 
  return html;
};

export default function ChatNutriPorc() {
  const [mensajes, setMensajes] = useState([
    { role: 'model', text: '¡Hola! Soy NutriPorc AI, el núcleo de inteligencia de tu granja. ¿En qué te asesoro hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const chatSessionRef = useRef(null);
  const mensajesFinRef = useRef(null);

  useEffect(() => {
    mensajesFinRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  const enviarPregunta = async (textoUsuario) => {
    if (!textoUsuario.trim()) return;

    setInput(''); 
    setMensajes(prev => [...prev, { role: 'user', text: textoUsuario }]);
    setCargando(true);

    try {
      if (!chatSessionRef.current) {
        chatSessionRef.current = iniciarChatPorcino();
      }
      const result = await chatSessionRef.current.sendMessage(textoUsuario);
      const response = await result.response;
      setMensajes(prev => [...prev, { role: 'model', text: response.text() }]);
    } catch (error) {
      console.error("Error en NutriPorc AI:", error);
      setMensajes(prev => [...prev, { role: 'model', text: "Error de conexión satelital con los servidores. Reintenta." }]);
    } finally {
      setCargando(false);
    }
  };

  const handleEnviar = (e) => {
    e.preventDefault();
    enviarPregunta(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarPregunta(input);
    }
  };

  return (
    <div className="chat-wrapper">
      <div className="chat-container">
        
        {/* Header Ultra Premium */}
        <header className="chat-header">
          <div className="header-glass">
            <div className="ai-avatar pulse-glow">
              <span className="emoji-pig">🐷</span>
            </div>
            <div className="header-titles">
              <h2>NutriPorc <span>AI</span></h2>
              <div className="status-badge">
                <span className="dot pulse-animation"></span> En línea y listo
              </div>
            </div>
          </div>
        </header>

        {/* Zona de Chat */}
        <div className="chat-history">
          {/* Sugerencias cuando el chat está recién iniciado */}
          {mensajes.length === 1 && (
            <div className="quick-actions">
              <p className="actions-title">Consultas frecuentes:</p>
              <div className="actions-grid">
                <button onClick={() => enviarPregunta("¿Cuál es la fórmula ideal para cerdos de engorde?")}>Raciones de Engorde</button>
                <button onClick={() => enviarPregunta("¿Cómo identificar síntomas de peste porcina?")}>Control de Enfermedades</button>
                <button onClick={() => enviarPregunta("¿Cuánta agua debe beber una cerda gestante?")}>Manejo de Gestación</button>
              </div>
            </div>
          )}

          {mensajes.map((msg, index) => (
            <div key={index} className={`message-row ${msg.role === 'user' ? 'row-user' : 'row-model'}`}>
              {msg.role === 'model' && <div className="msg-icon">NP</div>}
              
              <div 
                className={`message-bubble ${msg.role === 'user' ? 'bubble-user' : 'bubble-model'}`}
                dangerouslySetInnerHTML={{ __html: formatearTexto(msg.text) }}
              />
            </div>
          ))}
          
          {cargando && (
            <div className="message-row row-model">
              <div className="msg-icon">NP</div>
              <div className="message-bubble bubble-model typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={mensajesFinRef} />
        </div>

        {/* Caja de Texto Altamente Visible */}
        <div className="chat-input-wrapper">
          <form onSubmit={handleEnviar} className="chat-input-form">
            <textarea
              className="prompt-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta o métrica aquí..."
              rows={1}
            />
            <button type="submit" disabled={cargando || !input.trim()} className="send-button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}