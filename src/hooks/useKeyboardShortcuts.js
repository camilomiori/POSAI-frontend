// hooks/useKeyboardShortcuts.js
import { useEffect, useCallback } from 'react';

/**
 * Hook para manejar atajos de teclado globales
 * @param {Object} shortcuts - Objeto con las teclas y sus handlers
 * @param {Array} deps - Dependencias para los handlers
 */
const useKeyboardShortcuts = (shortcuts = {}, deps = []) => {
  const handleKeyDown = useCallback((event) => {
    // Ignorar si el usuario está escribiendo en un input
    const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
    if (isInputFocused) return;

    // Manejar teclas de función
    Object.keys(shortcuts).forEach(key => {
      const handler = shortcuts[key];
      
      // Verificar si la tecla presionada coincide
      if (event.key === key || event.code === key) {
        event.preventDefault();
        event.stopPropagation();
        
        if (typeof handler === 'function') {
          handler(event);
        }
      }
    });
  }, [shortcuts, ...deps]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return null;
};

export default useKeyboardShortcuts;