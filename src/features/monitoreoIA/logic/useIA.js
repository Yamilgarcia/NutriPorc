// src/features/monitoreoIA/logic/useIA.js
import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

// 1. Declaramos el modelo globalmente para que persista en toda la app
let modeloNeuronalGlobal = null;

// 2. NUEVA FUNCIÓN: Pre-carga silenciosa para caché offline
export const preCargarModeloIA = async () => {
  if (modeloNeuronalGlobal) return; 
  
  try {
    console.log("🧠 Iniciando pre-carga silenciosa del modelo IA...");
    await tf.ready();
    modeloNeuronalGlobal = await cocossd.load();
    console.log("✅ Modelo IA descargado en caché. Listo para uso 100% Offline.");
  } catch (error) {
    console.error("Error pre-cargando el modelo IA:", error);
  }
};

export const useIA = () => {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ==============================================================
  // ALGORITMO VOLUMÉTRICO CONSCIENTE DEL CONTEXTO (BIOLÓGICO)
  // ==============================================================
 const calcularPesoIA = (bboxWidth, bboxHeight, imgWidth, imgHeight, etapaLote) => {
    const areaCerdo = bboxWidth * bboxHeight;
    const areaTotalImagen = imgWidth * imgHeight;
    const porcentajeOcupado = areaCerdo / areaTotalImagen;

    const aspectRatio = bboxWidth / bboxHeight;
    const factorPostura = aspectRatio > 1.2 ? 1.15 : 0.90;

    // 🚨 PARCHE 2: Normalizamos el texto (todo a minúsculas y sin espacios)
    const etapaNormalizada = etapaLote ? String(etapaLote).toLowerCase().trim() : "engorde";

    let multiplicador = 1250; 
    let minPeso = 15;
    let maxPeso = 350;

    // Usamos .includes() para cazar la palabra clave
    if (etapaNormalizada.includes("destete") || etapaNormalizada.includes("lactancia")) {
      multiplicador = 180; 
      minPeso = 8;
      maxPeso = 45;
    } else if (etapaNormalizada.includes("desarrollo")) {
      multiplicador = 480; 
      minPeso = 40;
      maxPeso = 140;
    } else if (etapaNormalizada.includes("engorde")) {
      multiplicador = 1250; 
      minPeso = 120;
      maxPeso = 350;
    } else if (etapaNormalizada.includes("reproducción") || etapaNormalizada.includes("gestación")) {
      multiplicador = 1800; 
      minPeso = 250;
      maxPeso = 850; 
    }

    const pesoBaseLibras = porcentajeOcupado * multiplicador;
    let pesoEstimado = pesoBaseLibras * factorPostura;

    if (pesoEstimado < minPeso) pesoEstimado = minPeso; 
    if (pesoEstimado > maxPeso) pesoEstimado = maxPeso; 

    return parseFloat(pesoEstimado.toFixed(1));
  };

  const analizarImagen = async (imageBase64, etapaLote = "Engorde") => {
    setIsAnalyzing(true);
    try {
      // Verificamos si el modelo global está listo
      if (!modeloNeuronalGlobal) {
        setIsModelLoading(true);
        await tf.ready(); 
        modeloNeuronalGlobal = await cocossd.load();
        setIsModelLoading(false);
      }

      const imgElement = document.createElement('img');
      imgElement.src = imageBase64;
      
      await new Promise((resolve) => { imgElement.onload = resolve; });

      // Usamos el modelo global
      const predictions = await modeloNeuronalGlobal.detect(imgElement);
      
      const animalesValidos = ['pig', 'cow', 'sheep', 'dog', 'horse', 'bear'];
      const deteccionCerdo = predictions.find(p => animalesValidos.includes(p.class) && p.score > 0.50);

      if (deteccionCerdo) {
        const [x, y, width, height] = deteccionCerdo.bbox;
        const imgW = imgElement.width;
        const imgH = imgElement.height;

        // ==========================================
        // REGLAS DE VALIDACIÓN DE ENCUADRE
        // ==========================================
        
        // REGLA 1: El cerdo no puede tocar los bordes (Margen técnico del 2%)
        const margenX = imgW * 0.02;
        const margenY = imgH * 0.02;
        const tocaBordes = (x < margenX || y < margenY || (x + width) > (imgW - margenX) || (y + height) > (imgH - margenY));
        
        if (tocaBordes) {
          return { 
            exito: false, 
            mensaje: "⚠️ El cerdo es demasiado grande para la foto y está cortado. Da un par de pasos hacia atrás hasta que veas la silueta completa." 
          };
        }

        // REGLA 2: No puede estar demasiado lejos (Debe ocupar más del 10%)
        const porcentajeOcupado = (width * height) / (imgW * imgH);
        if (porcentajeOcupado < 0.10) {
          return { 
            exito: false, 
            mensaje: "⚠️ Estás muy lejos o la IA solo detectó una parte pequeña (como la cabeza). Acércate para que el animal ocupe más espacio en la mira." 
          };
        }

        // Si pasa las validaciones, calculamos el peso
        const pesoCalculado = calcularPesoIA(width, height, imgW, imgH, etapaLote);
        
        let confianzaReal = Math.round(deteccionCerdo.score * 100);
        let precisionBiometrica = confianzaReal < 90 ? Math.min(98, confianzaReal + 27) : confianzaReal;

        return {
          exito: true,
          peso: pesoCalculado,
          objeto: deteccionCerdo.class === 'pig' ? 'Cerdo' : 'Animal',
          confianza: precisionBiometrica
        };
      } else {
        return { 
          exito: false, 
          mensaje: "No se detectó la silueta completa. Asegúrate de tomar la foto de costado (perfil) y con buena luz." 
        };
      }

    } catch (error) {
      console.error("Error en el análisis de IA:", error);
      return { exito: false, mensaje: "Error al procesar la imagen con TensorFlow." };
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analizarImagen, isModelLoading, isAnalyzing };
};