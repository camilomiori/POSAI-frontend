// utils/formatters.js

/**
 * Formateador de moneda argentina
 */
const arsFormatter = new Intl.NumberFormat('es-AR', { 
  style: 'currency', 
  currency: 'ARS', 
  maximumFractionDigits: 2 
});

export const formatARS = (amount) => {
  return arsFormatter.format(amount || 0);
};

/**
 * Formatea fecha y hora en formato argentino
 * @param {number|Date} timestamp - Timestamp o fecha
 * @returns {string} Fecha formateada
 */
export const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea solo la fecha
 * @param {number|Date} timestamp - Timestamp o fecha
 * @returns {string} Fecha formateada
 */
export const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  });
};

/**
 * Formatea solo la hora
 * @param {number|Date} timestamp - Timestamp o fecha
 * @returns {string} Hora formateada
 */
export const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formatea números con separadores de miles
 * @param {number} number - Número a formatear
 * @returns {string} Número formateado
 */
export const formatNumber = (number) => {
  return new Intl.NumberFormat('es-AR').format(number);
};

/**
 * Formatea porcentajes
 * @param {number} value - Valor entre 0 y 1
 * @param {number} decimals - Cantidad de decimales
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export const capitalize = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Trunca texto con puntos suspensivos
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

/**
 * Formatea tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} Tamaño formateado
 */
export const formatFileSize = (bytes) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Función auxiliar para formatear precios usando formatARS
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Precio formateado
 */
export const formatPrice = (amount) => {
  return formatARS(amount || 0);
};