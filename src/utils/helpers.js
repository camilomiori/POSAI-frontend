// utils/helpers.js

/**
 * Función para combinar clases CSS (similar a clsx)
 * @param {...any} classes - Clases a combinar
 * @returns {string} String con las clases combinadas
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Genera un ID único
 * @returns {string} ID único
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function para optimizar búsquedas
 * @param {Function} func - Función a hacer debounce
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} Función con debounce
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function para limitar ejecuciones
 * @param {Function} func - Función a hacer throttle
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} Función con throttle
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Calcula el porcentaje de un valor
 * @param {number} value - Valor actual
 * @param {number} total - Valor total
 * @returns {number} Porcentaje
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Calcula el margen de ganancia
 * @param {number} price - Precio de venta
 * @param {number} cost - Precio de costo
 * @returns {number} Margen en porcentaje
 */
export const calculateMargin = (price, cost) => {
  if (price === 0) return 0;
  return ((price - cost) / price) * 100;
};

/**
 * Aplica descuento a un precio
 * @param {number} price - Precio original
 * @param {number} discountPercent - Porcentaje de descuento
 * @returns {number} Precio con descuento
 */
export const applyDiscount = (price, discountPercent) => {
  return price * (1 - discountPercent / 100);
};

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} true si es válido
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida CUIT argentino
 * @param {string} cuit - CUIT a validar
 * @returns {boolean} true si es válido
 */
export const isValidCUIT = (cuit) => {
  const cuitRegex = /^\d{2}-\d{8}-\d{1}$/;
  return cuitRegex.test(cuit);
};

/**
 * Genera color aleatorio para gráficos
 * @returns {string} Color en formato hex
 */
export const getRandomColor = () => {
  const colors = [
    '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
    '#6366F1', '#EC4899', '#14B8A6', '#F97316', '#8B5A2B'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Ordena array de objetos por una propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Propiedad por la que ordenar
 * @param {string} direction - 'asc' o 'desc'
 * @returns {Array} Array ordenado
 */
export const sortBy = (array, key, direction = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (typeof aVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return direction === 'asc' 
      ? aVal - bVal
      : bVal - aVal;
  });
};

/**
 * Filtra array de objetos por múltiples criterios
 * @param {Array} array - Array a filtrar
 * @param {Object} filters - Objeto con filtros
 * @returns {Array} Array filtrado
 */
export const filterBy = (array, filters) => {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value === 'all') return true;
      
      if (typeof item[key] === 'string') {
        return item[key].toLowerCase().includes(value.toLowerCase());
      }
      
      return item[key] === value;
    });
  });
};

/**
 * Agrupa array por una propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Propiedad por la que agrupar
 * @returns {Object} Objeto agrupado
 */
export const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Calcula la suma de una propiedad en un array
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a sumar
 * @returns {number} Suma total
 */
export const sumBy = (array, key) => {
  return array.reduce((sum, item) => sum + (item[key] || 0), 0);
};

/**
 * Encuentra el valor máximo de una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a evaluar
 * @returns {number} Valor máximo
 */
export const maxBy = (array, key) => {
  return Math.max(...array.map(item => item[key] || 0));
};

/**
 * Encuentra el valor mínimo de una propiedad
 * @param {Array} array - Array de objetos
 * @param {string} key - Propiedad a evaluar
 * @returns {number} Valor mínimo
 */
export const minBy = (array, key) => {
  return Math.min(...array.map(item => item[key] || 0));
};

/**
 * Copia texto al portapapeles
 * @param {string} text - Texto a copiar
 * @returns {Promise<boolean>} Promise que resuelve si se copió exitosamente
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback para navegadores que no soportan clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  }
};

/**
 * Detecta si es dispositivo móvil
 * @returns {boolean} true si es móvil
 */
export const isMobile = () => {
  return window.innerWidth < 768;
};

/**
 * Detecta el tema preferido del sistema
 * @returns {string} 'dark' o 'light'
 */
export const getSystemTheme = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

/**
 * Convierte archivo a base64
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} Promise con el base64
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

/**
 * Descarga archivo como JSON
 * @param {Object} data - Datos a descargar
 * @param {string} filename - Nombre del archivo
 */
export const downloadJSON = (data, filename = 'data.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};