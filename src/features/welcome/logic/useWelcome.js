// src/features/welcome/logic/useWelcome.js

export const useWelcome = () => {
  const handleEntrar = () => {
    // Aquí irá la redirección al Dashboard o Login más adelante
    console.log("Acción registrada: El usuario quiere entrar al sistema.");
  };

  return { handleEntrar };
};