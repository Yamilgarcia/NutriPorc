// src/features/monitoreoIA/ui/components/CameraScanner.jsx
import { useRef, useState, useEffect } from "react";
import "./CameraScanner.css";

export const CameraScanner = ({ onCapture, onClose }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment", 
            width: { ideal: 1280 }, 
            height: { ideal: 720 } 
          }
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accediendo a la cámara:", err);
        setError("No se pudo acceder a la cámara. Revisa los permisos.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageDataUrl = canvas.toDataURL("image/jpeg");
      onCapture(imageDataUrl);
    }
  };

  const apagarYCerrar = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
    onClose();
  };

  if (error) {
    return (
      <div className="scanner-overlay">
        <div className="scanner-error">
          <p>❌ {error}</p>
          <button onClick={onClose} className="btn-error-close">Cerrar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        
        {/* BARRA SUPERIOR ELEGANTE */}
        <div className="scanner-header">
          <button onClick={apagarYCerrar} className="btn-close-text">✕ Volver</button>
          <span className="scanner-title">Escáner NutriPorc</span>
          <div className="header-spacer"></div>
        </div>

        {/* CONTENEDOR DEL VISOR (CONTIENE LA PROPORCIÓN REAL) */}
        <div className="video-viewport">
          <video ref={videoRef} autoPlay playsInline muted className="scanner-video" />
          
          {/* MIRA DE ENCUADRE */}
          <div className="scanner-guide">
            <div className="guide-box">
              <span className="corner top-left"></span>
              <span className="corner top-right"></span>
              <span className="corner bottom-left"></span>
              <span className="corner bottom-right"></span>
            </div>
          </div>
        </div>

        {/* BARRA INFERIOR DE CONTROLES */}
        <div className="scanner-footer">
          <p className="guide-text">Encuadre el perfil del cerdo dentro de la mira</p>
          <div className="action-row">
            <button onClick={takeSnapshot} className="btn-capturar" title="Capturar peso con IA"></button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
};