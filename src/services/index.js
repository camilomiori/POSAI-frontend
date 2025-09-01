// Importar directamente sin usar export *
import apiService from './api';
import { salesHistoryService } from './salesHistory';
import { cashRegisterService } from './cashRegister';

// Re-exportar servicios principales
export { apiService, salesHistoryService, cashRegisterService };

// Re-exportar datos mock y aiEngine usando imports dinámicos para consistencia
export const getMockData = () => import('./mockData');
export const getAiEngine = () => import('./aiEngine');