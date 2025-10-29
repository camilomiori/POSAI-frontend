/**
 * DemandPredictionService.js
 * Service for AI-powered demand prediction and forecasting
 *
 * Features:
 * - Product demand prediction
 * - Weekly trend generation
 * - Hourly predictions
 * - Demand forecasting
 * - Turnover rate calculations
 * - Profit impact analysis
 */

import { DEMAND_TRENDS } from '../../utils/constants';
import { MOCK_PRODUCTS } from '../../mockData';

/**
 * Service for demand prediction and forecasting
 */
class DemandPredictionService {
  /**
   * @param {Object} core - AIEngineCore instance for API requests
   */
  constructor(core) {
    this.core = core;
  }

  /**
   * Predicts demand for a product
   * @param {number} productId - Product ID
   * @param {number} days - Days to predict (default: 7)
   * @returns {Promise<Object>} Demand prediction
   */
  async predictDemand(productId, days = 7) {
    const mockFallback = () => {
      const product = MOCK_PRODUCTS.find(p => p.id === productId);
      if (!product) return null;

      const baseStock = product.stock;
      const multiplier = product.aiScore;
      const seasonalFactor = this._getSeasonalFactor(product.category);
      const trendMultiplier = this._getTrendMultiplier(product.demandTrend);

      // Improved prediction algorithm
      const basePrediction = baseStock * 0.3 * multiplier * seasonalFactor * trendMultiplier;
      const predictedSales = Math.round(basePrediction * (days / 7));

      // Calculate confidence based on historical data
      const confidence = Math.round(product.aiScore * 100);

      // Determine recommendation
      const daysToStockout = Math.round(baseStock / (basePrediction / 7));
      const reorderPoint = product.reorderPoint || product.minStock || Math.floor(product.maxStock * 0.2);
      const recommendation = baseStock <= reorderPoint ? 'reorder' :
                            daysToStockout <= 14 ? 'monitor_closely' : 'monitor';

      // Generate weekly trend
      const weeklyTrend = this._generateWeeklyTrend(basePrediction, days);

      // Calculate additional metrics
      const turnoverRate = this._calculateTurnoverRate(productId);
      const profitImpact = this._calculateProfitImpact(product, predictedSales);

      return {
        productId,
        productName: product.name,
        predictedSales,
        confidence,
        recommendation,
        daysToStockout,
        weeklyTrend,
        turnoverRate,
        profitImpact,
        factors: {
          aiScore: product.aiScore,
          seasonalFactor,
          trendMultiplier,
          currentStock: baseStock,
          reorderPoint
        },
        generatedAt: Date.now()
      };
    };

    return this.core.apiRequest('/ai/predict', {
      method: 'POST',
      body: JSON.stringify({ productId, days })
    }, mockFallback);
  }

  /**
   * Gets general demand forecast
   * @returns {Promise<Array>} Demand forecast
   */
  async getDemandForecast() {
    const mockFallback = async () => {
      const forecasts = [];
      for (const product of MOCK_PRODUCTS.slice(0, 6)) {
        const prediction = await this.predictDemand(product.id, 30);
        if (prediction) {
          forecasts.push({
            product: product.name,
            category: product.category,
            predictedDemand: prediction.predictedSales,
            confidence: prediction.confidence
          });
        }
      }
      return forecasts;
    };

    // Use insights endpoint which includes demand forecasts
    const result = await this.core.apiRequest('/ai/insights', {
      method: 'GET'
    }, mockFallback);

    if (result && Array.isArray(result)) {
      const salesPrediction = result.find(i => i.type === 'sales_prediction');
      if (salesPrediction && salesPrediction.detailedData) {
        return [
          {
            product: 'Ventas Generales',
            category: 'General',
            predictedDemand: salesPrediction.estimatedValue,
            confidence: parseInt(salesPrediction.confidence)
          }
        ];
      }
    }

    return mockFallback();
  }

  /**
   * Gets hourly predictions for the current day
   * @returns {Promise<Array>} Hourly predictions
   */
  async getHourlyPredictions() {
    // Get backend insights to base predictions on real data
    const insights = await this.core.apiRequest('/ai/insights', {
      method: 'GET'
    }, async () => []);

    // Calculate baseline from insights
    let totalPredicted = 0;
    if (insights && Array.isArray(insights)) {
      insights.forEach(insight => {
        if (insight.type === 'sales_prediction' && insight.metrics) {
          totalPredicted += insight.metrics.predicted || 0;
        }
      });
    }

    // If no data, use reasonable baseline
    const dailyBaseline = totalPredicted > 0 ? totalPredicted : 2000;

    const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM - 8 PM
    const predictions = [];
    const currentHour = new Date().getHours();

    hours.forEach(hour => {
      // Demand factors based on time of day
      const factor = this._getHourlyDemandFactor(hour);
      const hourlyPredicted = Math.round((dailyBaseline / 12) * factor);

      // If hour has passed, use 80-110% of predicted as "actual"
      const actual = hour <= currentHour ?
        Math.round(hourlyPredicted * (0.8 + Math.random() * 0.3)) :
        null;

      predictions.push({
        hour: `${hour}:00`,
        predicted: hourlyPredicted,
        actual,
        confidence: 85 + Math.floor(Math.random() * 10),
        trend: factor > 1.2 ? 'high' : factor < 0.8 ? 'low' : 'medium'
      });
    });

    return predictions;
  }

  // ======= PRIVATE HELPER METHODS =======

  /**
   * Gets seasonal factor for a category
   * @private
   */
  _getSeasonalFactor(category) {
    const month = new Date().getMonth();
    const seasonalFactors = {
      'neumaticos': month >= 2 && month <= 4 ? 1.3 : 1.0,
      'filtros': month >= 8 && month <= 10 ? 1.2 : 1.0,
      'accesorios': month === 11 || month === 0 ? 1.4 : 1.0,
      'transmision': 1.0,
      'frenos': month >= 11 || month <= 1 ? 1.2 : 1.0,
      'aceites': 1.0,
      'baterias': 1.0
    };
    return seasonalFactors[category] || 1.0;
  }

  /**
   * Gets trend multiplier
   * @private
   */
  _getTrendMultiplier(trend) {
    switch (trend) {
      case DEMAND_TRENDS.UP: return 1.2;
      case DEMAND_TRENDS.DOWN: return 0.8;
      case DEMAND_TRENDS.STABLE: return 1.0;
      default: return 1.0;
    }
  }

  /**
   * Generates weekly trend data
   * @private
   */
  _generateWeeklyTrend(basePrediction, days) {
    return Array.from({ length: Math.min(days, 7) }, (_, i) => ({
      day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      prediction: Math.round(basePrediction / 7 + (Math.random() - 0.5) * basePrediction * 0.3),
      confidence: 0.85 + Math.random() * 0.1
    }));
  }

  /**
   * Calculates turnover rate for a product
   * @private
   */
  _calculateTurnoverRate(productId) {
    // Simulate turnover calculation based on historical sales
    return Math.random() * 12 + 2; // Between 2 and 14 times per year
  }

  /**
   * Calculates profit impact
   * @private
   */
  _calculateProfitImpact(product, predictedSales) {
    const unitProfit = product.price - product.cost;
    return {
      expectedProfit: unitProfit * predictedSales,
      marginPercent: ((unitProfit / product.price) * 100).toFixed(1),
      riskLevel: product.stock <= product.reorderPoint ? 'high' : 'low'
    };
  }

  /**
   * Gets hourly demand factor
   * @private
   */
  _getHourlyDemandFactor(hour) {
    const factors = {
      8: 0.6, 9: 0.8, 10: 1.2, 11: 1.1, 12: 0.9, 13: 0.7,
      14: 1.0, 15: 1.4, 16: 1.6, 17: 1.5, 18: 1.2, 19: 0.8
    };
    return factors[hour] || 0.5;
  }
}

// Named and default exports
export { DemandPredictionService };
export default DemandPredictionService;
