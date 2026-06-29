// src/features/monitoreo/logic/useIA.js
import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';

export const useIA = () => {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fórmula matemática simulada para el Hackathon:
  // Relaciona el área en píxeles del cerdo detectado con un peso estimado.
  // Ajustaremos este factor para que dé pesos realistas (ej. entre 20 y 250 lbs)
  const calcularPesoPorArea = (width, height) => {
    const areaRectangulo = width * height;
    // Factor mágico de conversión (Área -> Libras). 
    // Puedes modificar el '0.0008' si ves que da pesos muy locos.
    let pesoEstimado = areaRectangulo * 0.0008; 
    
    // Ponemos límites biológicos lógicos para que la IA no diga que un cerdo pesa 1 libra o 1000 libras
    if (pesoEstimado < 15) pesoEstimado = 15 + (Math.random() * 10);
    if (pesoEstimado > 300) pesoEstimado = 250 + (Math.random() * 20);

    return parseFloat(pesoEstimado.toFixed(1));
  };

  const analizarImagen = async (imageBase64) => {
    setIsAnalyzing(true);
    try {
      // 1. Cargar el modelo de IA (Pesa unos megas, así que toma un par de segundos)
      setIsModelLoading(true);
      await tf.ready(); // Esperar a que el motor WebGL esté listo
      const model = await cocossd.load();
      setIsModelLoading(false);

      // 2. Convertir el Base64 en una imagen de HTML que TensorFlow pueda leer
      const imgElement = document.createElement('img');
      imgElement.src = imageBase64;
      
      // Esperamos a que la imagen "cargue" en memoria
      await new Promise((resolve) => { imgElement.onload = resolve; });

      // 3. Ejecutar la red neuronal
      const predictions = await model.detect(imgElement);
      
      // 4. Buscar si detectó un animal (COCO-SSD a veces confunde cerdos con perros, vacas u ovejas, así que buscamos cualquier animal grande o el objeto principal)
      const animalesValidos = ['pig', 'cow', 'sheep', 'dog', 'horse', 'bear'];
      const deteccionCerdo = predictions.find(p => animalesValidos.includes(p.class)) || predictions[0];

      if (deteccionCerdo) {
        // Obtenemos las dimensiones de la caja que encierra al animal [x, y, width, height]
        const [x, y, width, height] = deteccionCerdo.bbox;
        const pesoCalculado = calcularPesoPorArea(width, height);
        
        return {
          exito: true,
          peso: pesoCalculado,
          objeto: deteccionCerdo.class,
          confianza: Math.round(deteccionCerdo.score * 100)
        };
      } else {
        return { exito: false, mensaje: "No se detectó ningún cerdo en la imagen. Intenta acercarte más." };
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