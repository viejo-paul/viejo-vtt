import { useState, useEffect } from 'react';

// Esta función es un "Hook" personalizado.
// key: Es el nombre con el que se guardará en el navegador (ej: 'posicion-ventana')
// initialValue: El valor por defecto si no hay nada guardado (ej: {x:0, y:0})
export function usePersistentState(key, initialValue) {
  
  // 1. INICIALIZAR: Intentamos leer del localStorage
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      // Si existe algo guardado, lo convertimos de texto a datos (JSON)
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error leyendo localStorage:", error);
      return initialValue;
    }
  });

  // 2. GUARDAR: Cada vez que 'state' cambia, lo guardamos en localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error guardando en localStorage:", error);
    }
  }, [key, state]);

  return [state, setState];
}