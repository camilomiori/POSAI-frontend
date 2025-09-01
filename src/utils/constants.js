// utils/constants.js

/**
 * Roles de usuario del sistema
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  CAJERO: 'cajero',
  SUPERVISOR: 'supervisor'
};

/**
 * Permisos del sistema
 */
export const PERMISSIONS = {
  // Permisos de administración
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES: 'manage_roles',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SYSTEM: 'manage_system',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  
  // Permisos de ventas
  CREATE_SALE: 'create_sale',
  CANCEL_SALE: 'cancel_sale',
  VIEW_SALES: 'view_sales',
  MANAGE_DISCOUNTS: 'manage_discounts',
  
  // Permisos de productos
  MANAGE_PRODUCTS: 'manage_products',
  VIEW_INVENTORY: 'view_inventory',
  ADJUST_STOCK: 'adjust_stock',
  
  // Permisos de AI
  USE_AI_FEATURES: 'use_ai_features',
  MANAGE_AI_SETTINGS: 'manage_ai_settings',
  VIEW_AI_ANALYTICS: 'view_ai_analytics'
};

/**
 * Secciones de navegación
 */
export const NAVIGATION_SECTIONS = {
  DASHBOARD: 'dashboard',
  VENTAS: 'ventas',
  PRODUCTOS: 'productos',
  AI_CENTER: 'ai',
  ADMIN: 'admin',
  USUARIO: 'usuario',
  CONFIG: 'config'
};

/**
 * Tipos de notificaciones
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  AI: 'ai'
};

/**
 * Estados de stock
 */
export const STOCK_STATUS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  OUT: 'out'
};

/**
 * Tendencias de demanda
 */
export const DEMAND_TRENDS = {
  UP: 'up',
  DOWN: 'down',
  STABLE: 'stable'
};

/**
 * Tipos de factura
 */
export const INVOICE_TYPES = {
  A: 'A',
  B: 'B',
  C: 'C',
  X: 'X'
};

/**
 * Métodos de pago
 */
export const PAYMENT_METHODS = {
  CASH: 'efectivo',
  CREDIT_CARD: 'tarjeta_credito',
  DEBIT_CARD: 'tarjeta_debito',
  TRANSFER: 'transferencia',
  CHECK: 'cheque'
};

/**
 * Categorías de productos
 */
export const PRODUCT_CATEGORIES = {
  NEUMATICOS: 'Neumáticos',
  ACCESORIOS: 'Accesorios',
  TRANSMISION: 'Transmisión',
  FILTROS: 'Filtros',
  FRENOS: 'Frenos',
  MOTOR: 'Motor',
  CARROCERIA: 'Carrocería',
  ELECTRICIDAD: 'Electricidad'
};

/**
 * Configuración de temas
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  AUTO: 'auto'
};

/**
 * Configuración de idiomas
 */
export const LANGUAGES = {
  ES: 'es',
  EN: 'en',
  PT: 'pt'
};

/**
 * Configuración de monedas
 */
export const CURRENCIES = {
  ARS: 'ARS',
  USD: 'USD',
  EUR: 'EUR'
};

/**
 * Colores para gráficos
 */
export const CHART_COLORS = [
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#6366F1', // indigo-500
  '#EC4899', // pink-500
  '#14B8A6', // teal-500
  '#F97316', // orange-500
  '#8B5A2B'  // brown-500
];

/**
 * Configuración de la aplicación
 */
export const APP_CONFIG = {
  NAME: 'POS AI System',
  VERSION: '2.1.0',
  DESCRIPTION: 'Sistema de Punto de Venta con Inteligencia Artificial',
  AUTHOR: 'Tu Empresa',
  CONTACT_EMAIL: 'soporte@posai.com',
  WEBSITE: 'https://posai.com'
};

/**
 * Configuración de API
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/mock',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 1, // Reducir reintentos para desarrollo
  MOCK_MODE: true // Forzar modo mock para desarrollo
};

/**
 * Configuración de localStorage
 */
export const STORAGE_KEYS = {
  USER: 'pos_ai_user',
  THEME: 'pos_ai_theme',
  LANGUAGE: 'pos_ai_language',
  SETTINGS: 'pos_ai_settings',
  CART: 'pos_ai_cart',
  CART_DISCOUNT: 'pos_ai_cart_discount',
  NOTIFICATIONS: 'pos_ai_notifications',
  SALES_HISTORY: 'pos_ai_sales_history',
  CASH_REGISTER: 'pos_ai_cash_register',
  CASH_MOVEMENTS: 'pos_ai_cash_movements',
  CASH_SESSION: 'pos_ai_cash_session'
};

/**
 * Mensajes predeterminados
 */
export const MESSAGES = {
  SUCCESS: {
    SAVE: 'Guardado exitosamente',
    DELETE: 'Eliminado exitosamente',
    UPDATE: 'Actualizado exitosamente',
    LOGIN: 'Inicio de sesión exitoso',
    LOGOUT: 'Sesión cerrada exitosamente'
  },
  ERROR: {
    GENERAL: 'Ha ocurrido un error inesperado',
    NETWORK: 'Error de conexión. Verifique su internet',
    UNAUTHORIZED: 'No tiene permisos para realizar esta acción',
    NOT_FOUND: 'Recurso no encontrado',
    VALIDATION: 'Por favor verifique los datos ingresados'
  },
  CONFIRM: {
    DELETE: '¿Está seguro que desea eliminar este elemento?',
    LOGOUT: '¿Está seguro que desea cerrar sesión?',
    DISCARD: '¿Está seguro que desea descartar los cambios?'
  }
};

/**
 * Configuración de validaciones
 */
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  USERNAME_MIN_LENGTH: 3,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\+]?[1-9][\d]{0,15}$/,
  CUIT_REGEX: /^\d{2}-\d{8}-\d{1}$/
};

/**
 * Límites del sistema
 */
export const SYSTEM_LIMITS = {
  MAX_CART_ITEMS: 100,
  MAX_DISCOUNT_PERCENT: 50,
  MAX_FILE_SIZE: 10485760, // 10MB
  MAX_PRODUCTS_PER_PAGE: 50,
  SESSION_TIMEOUT: 3600000 // 1 hora en millisegundos
};