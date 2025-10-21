// services/salesHistory.js
import { STORAGE_KEYS } from '../utils/constants';
import { formatDateTime, formatARS } from '../utils/formatters';
import { MOCK_SALES } from './mockData';

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
      if (sales) {
        const parsedSales = JSON.parse(sales);
        // Si hay pocas ventas y sin categorías, usar MOCK_SALES como base
        const hasCategories = parsedSales.some(sale =>
          sale.items && sale.items.some(item => item.category)
        );

        // Si hay pocas ventas y sin categorías, combinar con MOCK_SALES
        if (parsedSales.length < 3 && !hasCategories) {
          console.log('📊 Usando MOCK_SALES junto a datos locales para mejor visualización');
          const mockWithMetadata = MOCK_SALES.map(sale => ({
            ...sale,
            date: sale.date || new Date(sale.timestamp).toISOString(),
            formattedDate: formatDateTime(new Date(sale.timestamp)),
            formattedTotal: formatARS(sale.total)
          }));
          return [...parsedSales, ...mockWithMetadata];
        }

        // Migrar datos antiguos: agregar categorías faltantes a items
        return parsedSales.map(sale => ({
          ...sale,
          items: sale.items ? sale.items.map(item => ({
            ...item,
            category: item.category || 'General'
          })) : []
        }));
      }
      // Devolver mock sales cuando localStorage está vacío (desarrollo/fallback)
      return MOCK_SALES.map(sale => ({
        ...sale,
        date: sale.date || new Date(sale.timestamp).toISOString(),
        formattedDate: formatDateTime(new Date(sale.timestamp)),
        formattedTotal: formatARS(sale.total)
      }));
    } catch (error) {
      console.error('Error loading sales history:', error);
      return MOCK_SALES.map(sale => ({
        ...sale,
        date: sale.date || new Date(sale.timestamp).toISOString(),
        formattedDate: formatDateTime(new Date(sale.timestamp)),
        formattedTotal: formatARS(sale.total)
      }));
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