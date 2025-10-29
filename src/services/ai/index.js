/**
 * AI Engine v4.0.0
 * Modular AI system with facade pattern for backwards compatibility
 *
 * Architecture:
 * - Core: Shared infrastructure (API, cache, metrics)
 * - Modules: Focused services (Pricing, Demand, Inventory)
 * - Facade: Backwards-compatible API
 *
 * @version 4.0.0
 */

import AIEngineCore from './core/AIEngineCore';
import PricingOptimizationService from './pricing/PricingOptimizationService';
import DemandPredictionService from './demand/DemandPredictionService';
import InventoryManagementService from './inventory/InventoryManagementService';
import { MODEL_CONFIG } from './utils/constants';

/**
 * Main AI Engine class with lazy-loaded modules
 * Provides backwards compatibility while using new modular architecture
 */
class AIEngine {
  constructor(config = {}) {
    // Initialize core infrastructure
    this.core = new AIEngineCore(config);

    // Module instances (lazy loaded)
    this._pricing = null;
    this._demand = null;
    this._inventory = null;

    // Metadata
    this.modelVersion = this.core.version;
    this.lastTraining = this.core.lastTraining;
    this.confidence = this.core.confidence;
  }

  // ============================================
  // LAZY-LOADED MODULE GETTERS
  // ============================================

  /**
   * Get Pricing Optimization Service (lazy loaded)
   */
  get pricing() {
    if (!this._pricing) {
      this._pricing = new PricingOptimizationService(this.core);
    }
    return this._pricing;
  }

  /**
   * Get Demand Prediction Service (lazy loaded)
   */
  get demand() {
    if (!this._demand) {
      this._demand = new DemandPredictionService(this.core);
    }
    return this._demand;
  }

  /**
   * Get Inventory Management Service (lazy loaded)
   */
  get inventory() {
    if (!this._inventory) {
      this._inventory = new InventoryManagementService(this.core);
    }
    return this._inventory;
  }

  // ============================================
  // BACKWARDS COMPATIBILITY METHODS
  // Delegates to new modular services
  // ============================================

  // --- Demand Prediction ---

  /**
   * Predict demand for a product (LEGACY)
   * @deprecated Use aiEngine.demand.predict() instead
   */
  async predictDemand(productId, days = 7) {
    return this.demand.predict(productId, days);
  }

  /**
   * Get demand forecast (LEGACY)
   * @deprecated Use aiEngine.demand.getForecast() instead
   */
  async getDemandForecast() {
    return this.demand.getForecast();
  }

  /**
   * Get hourly predictions (LEGACY)
   * @deprecated Use aiEngine.demand.getHourlyPredictions() instead
   */
  getHourlyPredictions() {
    return this.demand.getHourlyPredictions();
  }

  // --- Pricing Optimization ---

  /**
   * Optimize price for a product (LEGACY)
   * @deprecated Use aiEngine.pricing.optimize() instead
   */
  async optimizePrice(productId) {
    return this.pricing.optimize(productId);
  }

  /**
   * Get pricing insights (LEGACY)
   * @deprecated Use aiEngine.pricing.getInsights() instead
   */
  async getPricingInsights() {
    return this.pricing.getInsights();
  }

  /**
   * Get dynamic price suggestions (LEGACY)
   * @deprecated Use aiEngine.pricing.getDynamicSuggestions() instead
   */
  getDynamicPriceSuggestions(productId) {
    return this.pricing.getDynamicSuggestions(productId);
  }

  // --- Inventory Management ---

  /**
   * Get stock alerts (LEGACY)
   * @deprecated Use aiEngine.inventory.getStockAlerts() instead
   */
  async getStockAlerts() {
    return this.inventory.getStockAlerts();
  }

  /**
   * Get critical alerts (LEGACY)
   * @deprecated Use aiEngine.inventory.getCriticalAlerts() instead
   */
  getCriticalAlerts() {
    return this.inventory.getCriticalAlerts();
  }

  /**
   * Get inventory optimizations (LEGACY)
   * @deprecated Use aiEngine.inventory.getOptimizations() instead
   */
  getInventoryOptimizations() {
    return this.inventory.getOptimizations();
  }

  /**
   * Get advanced stock alerts (LEGACY)
   * @deprecated Use aiEngine.inventory.getAdvancedAlerts() instead
   */
  async getAdvancedStockAlerts() {
    return this.inventory.getAdvancedAlerts();
  }

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Get AI Engine configuration
   */
  getConfiguration() {
    return {
      ...this.core.getConfig(),
      modules: {
        pricing: this._pricing !== null,
        demand: this._demand !== null,
        inventory: this._inventory !== null
      }
    };
  }

  /**
   * Update AI Engine configuration
   */
  updateConfiguration(config) {
    this.core.updateConfig(config);

    if (config.confidence !== undefined) {
      this.confidence = config.confidence;
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.core.getPerformanceMetrics();
  }

  /**
   * Get model statistics
   */
  getModelStatistics() {
    const metrics = this.core.getPerformanceMetrics();
    const cacheStats = this.core.getCacheStats();

    return {
      version: this.modelVersion,
      confidence: this.confidence,
      lastTraining: new Date(this.lastTraining).toISOString(),
      performance: {
        requests: metrics.requestCount,
        errors: metrics.errorCount,
        errorRate: metrics.errorRate,
        avgResponseTime: metrics.avgResponseTime
      },
      cache: cacheStats,
      modules: {
        loaded: [
          this._pricing && 'pricing',
          this._demand && 'demand',
          this._inventory && 'inventory'
        ].filter(Boolean)
      }
    };
  }

  /**
   * Reset AI model
   */
  resetModel() {
    this.core.resetMetrics();
    this.core.clearCache();
    this.lastTraining = Date.now();

    return {
      success: true,
      message: 'AI model reset successfully',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Retrain AI model
   */
  retrainModel() {
    this.lastTraining = Date.now();
    this.core.resetMetrics();

    return {
      success: true,
      message: 'AI model retrained successfully',
      timestamp: new Date().toISOString(),
      nextTraining: new Date(this.lastTraining + MODEL_CONFIG.TRAINING_FREQUENCY_DAYS * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match
   */
  clearCache(pattern) {
    this.core.clearCache(pattern);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.core.getCacheStats();
  }

  /**
   * Get system metrics
   */
  getSystemMetrics() {
    const metrics = this.core.getPerformanceMetrics();

    return {
      version: this.modelVersion,
      uptime: metrics.uptime,
      performance: {
        requests: metrics.requestCount,
        errors: metrics.errorCount,
        errorRate: metrics.errorRate,
        avgResponseTime: metrics.avgResponseTime
      },
      cache: metrics.cache,
      modules: {
        pricing: this._pricing !== null,
        demand: this._demand !== null,
        inventory: this._inventory !== null
      },
      health: this._getHealthStatus(metrics)
    };
  }

  /**
   * Get health status based on metrics
   * @private
   */
  _getHealthStatus(metrics) {
    const errorRate = parseFloat(metrics.errorRate);
    const avgTime = parseInt(metrics.avgResponseTime);

    if (errorRate > 10 || avgTime > 3000) {
      return 'critical';
    } else if (errorRate > 5 || avgTime > 1000) {
      return 'warning';
    }
    return 'healthy';
  }
}

// Create and export singleton instance
const aiEngineInstance = new AIEngine();

// Export both the class and the singleton instance
export { AIEngine };
export default aiEngineInstance;
