/**
 * InventoryManagementService.js
 * Service for AI-powered inventory management and stock alerts
 *
 * Features:
 * - Stock alert generation
 * - Critical alerts monitoring
 * - Inventory optimizations
 * - Advanced stock alerts with predictions
 * - Sales velocity calculations
 * - Optimal order quantity recommendations
 */

import { MOCK_PRODUCTS } from '../../mockData';
import api from '../../api';

/**
 * Service for inventory management and stock optimization
 */
class InventoryManagementService {
  /**
   * @param {Object} core - AIEngineCore instance for API requests
   */
  constructor(core) {
    this.core = core;
  }

  /**
   * Gets stock alerts from backend
   * @returns {Promise<Object>} Stock alerts
   */
  async getStockAlerts() {
    try {
      const response = await api.getStockAlerts();
      console.log('[InventoryManagementService] getStockAlerts response:', response);
      return response;
    } catch (error) {
      console.error('[InventoryManagementService] Error getting stock alerts:', error);
      return { data: [], summary: { total: 0, critical: 0, warning: 0 } };
    }
  }

  /**
   * Gets critical alerts from the system
   * @returns {Promise<Array>} Critical alerts
   */
  async getCriticalAlerts() {
    const mockFallback = () => {
      const alerts = [];

      // Critical stock alerts
      const criticalStock = MOCK_PRODUCTS.filter(p => p.stock <= p.reorderPoint);
      if (criticalStock.length > 0) {
        alerts.push({
          title: 'Stock Crítico',
          message: `${criticalStock.length} productos con stock bajo`,
          severity: 'high',
          timestamp: Date.now(),
          type: 'inventory'
        });
      }

      return alerts;
    };

    const result = await this.core.apiRequest('/ai/stock-alerts', {
      method: 'GET'
    }, mockFallback);

    // Transform backend response to match expected format
    if (result && result.data) {
      return result.data.filter(alert => alert.level === 'critical').map(alert => ({
        title: alert.message,
        message: alert.recommendation,
        severity: 'high',
        timestamp: Date.now(),
        type: 'inventory'
      }));
    }

    return result || mockFallback();
  }

  /**
   * Gets inventory optimizations
   * @returns {Promise<Array>} Inventory optimizations
   */
  async getInventoryOptimizations() {
    const mockFallback = async () => {
      const optimizations = [];

      // Import predictDemand dynamically to avoid circular dependencies
      const { default: aiEngine } = await import('../../aiEngine');

      for (const product of MOCK_PRODUCTS.slice(0, 5)) {
        const prediction = await aiEngine.predictDemand(product.id, 30);
        if (prediction && prediction.recommendation === 'reorder') {
          optimizations.push({
            product: product.name,
            suggestion: `Reponer stock: ${prediction.daysToStockout} días restantes`,
            impact: 'high',
            potentialSavings: `$${(product.price * product.reorderPoint * 0.1).toFixed(0)}`
          });
        }
      }

      return optimizations;
    };

    const result = await this.core.apiRequest('/ai/opportunities', {
      method: 'GET'
    }, mockFallback);

    // Filter for inventory opportunities
    if (result && Array.isArray(result)) {
      return result
        .filter(opp => opp.type === 'inventory_critical')
        .map(opp => ({
          product: opp.title.replace('Ordenar ', ''),
          suggestion: opp.description,
          impact: opp.impact,
          potentialSavings: `$${opp.estimatedValue}`
        }))
        .slice(0, 5);
    }

    return mockFallback();
  }

  /**
   * Gets advanced stock alerts with predictions
   * @returns {Promise<Array>} Advanced stock alerts
   */
  async getAdvancedStockAlerts() {
    // Use backend data - getStockAlerts already calls /api/v1/ai/stock-alerts
    const backendData = await this.getStockAlerts();

    if (!backendData || !backendData.data || backendData.data.length === 0) {
      return [];
    }

    // Transform backend data to advanced format expected by component
    const alerts = backendData.data.map(item => ({
      id: item.id || `alert_${item.productId}_${Date.now()}`,
      productId: item.productId,
      productName: item.productName,
      category: item.category || 'Sin categoría',
      currentStock: item.currentStock,
      minimumStock: item.minStock,
      reorderPoint: item.minStock,
      daysUntilStockout: item.daysToStockout,
      salesVelocity: item.salesVelocity || 0,
      trend: item.trend || 'stable',
      priority: item.priority,
      level: item.priority, // urgent, critical, warning
      title: `⚠️ ${item.productName} - Stock ${item.priority === 'urgent' ? 'Urgente' : 'Bajo'}`,
      message: `Stock actual: ${item.currentStock} unidades. Se agotará en ${item.daysToStockout} días`,
      recommendedAction: `Ordenar ${item.reorderQuantity} unidades`,
      recommendedOrder: item.reorderQuantity,
      suggestedOrderQuantity: item.reorderQuantity,
      supplier: 'Proveedor Principal',
      estimatedCost: item.estimatedCost || 0,
      predictedLoss: item.potentialLoss || 0,
      confidence: 90,
      timestamp: Date.now(),
      aiGenerated: true
    }));

    // Sort by priority (urgent > critical > warning)
    const priorityOrder = { urgent: 3, critical: 2, warning: 1 };
    return alerts.sort((a, b) => priorityOrder[b.level] - priorityOrder[a.level]);
  }

  // ======= PRIVATE HELPER METHODS =======

  /**
   * Calculates sales velocity for a product
   * @private
   */
  _calculateSalesVelocity(product) {
    const sales30Days = product.sales30Days || Math.floor(Math.random() * 20) + 5;
    const sales7Days = Math.floor(sales30Days * 0.3);
    const dailyRate = sales30Days / 30;

    // Determine trend
    const recentRate = sales7Days / 7;
    const olderRate = (sales30Days - sales7Days) / 23;
    const trend = recentRate > olderRate * 1.1 ? 'increasing' :
                  recentRate < olderRate * 0.9 ? 'decreasing' : 'stable';

    return {
      dailyRate: Math.round(dailyRate * 10) / 10,
      weeklyRate: Math.round(dailyRate * 7 * 10) / 10,
      monthlyRate: sales30Days,
      trend,
      acceleration: Math.round((recentRate - olderRate) * 100) / 100
    };
  }

  /**
   * Generates alert title based on level
   * @private
   */
  _getAlertTitle(level, productName) {
    const titles = {
      urgent: `🚨 STOCK CRÍTICO: ${productName}`,
      critical: `⚠️ ALERTA STOCK: ${productName}`,
      warning: `📊 MONITOREO: ${productName}`
    };
    return titles[level];
  }

  /**
   * Generates personalized alert message
   * @private
   */
  _getAlertMessage(level, daysToStockout, salesVelocity) {
    if (level === 'urgent') {
      return `Stock se agotará en ${daysToStockout} días. Velocidad actual: ${salesVelocity.dailyRate} unidades/día`;
    } else if (level === 'critical') {
      return `Quedan ${daysToStockout} días de stock. Tendencia: ${salesVelocity.trend}`;
    }
    return `Stock bajo detectado. Monitorear de cerca las próximas ventas`;
  }

  /**
   * Recommends actions based on alerts
   * @private
   */
  _getRecommendedAction(level, product, salesVelocity) {
    const reorderPoint = product.reorderPoint || product.minStock || Math.floor(product.maxStock * 0.2);
    if (level === 'urgent') {
      return `REPOSICIÓN INMEDIATA: Ordenar ${reorderPoint * 2} unidades HOY`;
    } else if (level === 'critical') {
      return `Programar reposición esta semana: ${Math.max(reorderPoint, salesVelocity.weeklyRate * 2)} unidades`;
    }
    return `Preparar orden de compra para próxima semana`;
  }

  /**
   * Calculates potential loss from stockout
   * @private
   */
  _calculatePotentialLoss(product, daysToStockout, salesVelocity) {
    if (daysToStockout >= 30) return 0;

    const potentialSales = salesVelocity.dailyRate * Math.max(0, 7 - daysToStockout);
    const unitProfit = product.price - (product.cost || product.price * 0.7);
    return Math.round(potentialSales * unitProfit);
  }

  /**
   * Calculates optimal order quantity
   * @private
   */
  _calculateOptimalOrderQuantity(product, salesVelocity) {
    const leadTimeDays = 7; // Estimated delivery time
    const safetyStock = Math.ceil(salesVelocity.dailyRate * 3); // 3 days safety
    const leadTimeStock = Math.ceil(salesVelocity.dailyRate * leadTimeDays);
    const reorderPoint = product.reorderPoint || product.minStock || Math.floor(product.maxStock * 0.2);

    return Math.max(reorderPoint, leadTimeStock + safetyStock);
  }
}

// Named and default exports
export { InventoryManagementService };
export default InventoryManagementService;
