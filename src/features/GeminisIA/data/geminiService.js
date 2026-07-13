import { GoogleGenerativeAI } from "@google/generative-ai";

// Traemos la llave desde el archivo .env
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);

// 1. Configuramos el modelo y su personalidad estricta una sola vez
const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash",
  systemInstruction: `Eres NutriPorc AI, un asistente experto estrictamente enfocado en porcinocultura, veterinaria, manejo de granjas y nutrición de cerdos. 
    
  REGLA ABSOLUTA: Si la consulta del usuario NO está relacionada con cerdos, lechones, cerdas, granjas porcinas, o alimentación animal, DEBES negarte a responder. En ese caso, responde únicamente con una variación educada de: "Lo siento, como Asistente Especializado de NutriPorc, mi conocimiento está limitado exclusivamente a la crianza, salud y manejo de cerdos. ¿En qué puedo ayudarte sobre tu granja hoy?".`
});

// 2. Exportamos la función que inicia la sesión con memoria
export const iniciarChatPorcino = () => {
  try {
    return model.startChat({
      history: [], // El historial arranca vacío cada vez que se carga el componente
    });
  } catch (error) {
    console.error("Error al iniciar el chat de NutriPorc AI:", error);
    throw error;
  }
};