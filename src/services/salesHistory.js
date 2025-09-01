// services/salesHistory.js
import { STORAGE_KEYS } from '../utils/constants';
import { formatDateTime, formatARS } from '../utils/formatters';

/**
 * Servicio para manejar el historial de ventas en localStorage
 */
class SalesHistoryService {
  constructor() {
    this.storageKey = STORAGE_KEYS.SALES_HISTORY || 'pos_ai_sales_history';
  }

  /**
   * Obtener todas las ventas del historial
   */
  getAllSales() {
    try {
      const sales = localStorage.getItem(this.storageKey);
      return sales ? JSON.parse(sales) : [];
    } catch (error) {
      console.error('Error loading sales history:', error);
      return [];
    }
  }

  /**
   * Agregar una nueva venta al historial
   */
  addSale(saleData) {
    try {
      const sales = this.getAllSales();
      const newSale = {
        id: `VTA-${Date.now()}`,
        timestamp: Date.now(),
        date: new Date().toISOString(),
        ...saleData,
        // Formatear datos para mejor visualización
        formattedDate: formatDateTime(new Date()),
        formattedTotal: formatARS(saleData.total)
      };

      sales.unshift(newSale); // Agregar al inicio (más reciente primero)
      
      // Mantener solo las últimas 1000 ventas para evitar llenar localStorage
      if (sales.length > 1000) {
        sales.splice(1000);
      }

      localStorage.setItem(this.storageKey, JSON.stringify(sales));
      return newSale;
    } catch (error) {
      console.error('Error saving sale:', error);
      return null;
    }
  }

  /**
   * Obtener ventas de hoy
   */
  getTodaySales() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.getAllSales().filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= today;
    });
  }

  /**
   * Obtener métricas del día
   */
  getTodayMetrics() {
    const todaySales = this.getTodaySales();
    
    return {
      totalSales: todaySales.length,
      totalAmount: todaySales.reduce((sum, sale) => sum + sale.total, 0),
      averageTicket: todaySales.length > 0 
        ? todaySales.reduce((sum, sale) => sum + sale.total, 0) / todaySales.length 
        : 0,
      paymentMethods: todaySales.reduce((acc, sale) => {
        const method = sale.payment?.method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {})
    };
  }

  /**
   * Obtener ventas por rango de fechas
   */
  getSalesByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return this.getAllSales().filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= start && saleDate <= end;
    });
  }

  /**
   * Buscar ventas por término
   */
  searchSales(searchTerm) {
    if (!searchTerm) return this.getAllSales();
    
    const term = searchTerm.toLowerCase();
    return this.getAllSales().filter(sale => 
      sale.id.toLowerCase().includes(term) ||
      sale.customer?.name?.toLowerCase().includes(term) ||
      sale.items?.some(item => item.name.toLowerCase().includes(term))
    );
  }

  /**
   * Limpiar historial (para testing)
   */
  clearHistory() {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing sales history:', error);
      return false;
    }
  }
}

// Exportar instancia singleton
export const salesHistoryService = new SalesHistoryService();
export default salesHistoryService;