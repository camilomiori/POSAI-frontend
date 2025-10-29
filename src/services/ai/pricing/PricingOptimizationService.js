/**
 * PricingOptimizationService.js
 * Service for AI-powered price optimization and dynamic pricing suggestions
 *
 * Features:
 * - Price optimization based on demand, stock, and market conditions
 * - Real-time dynamic pricing suggestions
 * - Market condition analysis
 * - Demand elasticity calculations
 * - Competitive pricing analysis
 */

import { DEMAND_TRENDS } from '../../utils/constants';
import { MOCK_PRODUCTS } from '../../mockData';

/**
 * Service for pricing optimization and dynamic pricing strategies
 */
class PricingOptimizationService {
  /**
   * @param {Object} core - AIEngineCore instance for API requests
   */
  constructor(core) {
    this.core = core;
  }

  /**
   * Optimizes the price of a product based on multiple factors
   * @param {number} productId - ID of the product
   * @returns {Promise<Object>} Price optimization recommendations
   */
  async optimizePrice(productId) {
    const mockFallback = () => {
      const product = MOCK_PRODUCTS.find(p => p.id === productId);
      if (!product) return null;

      const marketConditions = this._analyzeMarketConditions(product.category);
      const demandElasticity = this._calculateDemandElasticity(product);
      const competitorPrice = product.price * (1 + (Math.random() * 0.1 - 0.05));

      // Price optimization algorithm
      let suggestedPrice = product.price;
      let reasoning = 'Mantener precio actual';

      if (product.demandTrend === DEMAND_TRENDS.UP && product.stock <= product.reorderPoint) {
        // High demand + low stock = increase price
        suggestedPrice = Math.round(product.price * 1.08);
        reasoning = 'Alta demanda y stock bajo detectados';
      } else if (product.demandTrend === DEMAND_TRENDS.DOWN) {
        // Low demand = reduce price to accelerate turnover
        suggestedPrice = Math.round(product.price * 0.95);
        reasoning = 'Optimizar rotación por baja demanda';
      } else if (product.stock > product.reorderPoint * 3) {
        // Excess stock = promotional pricing
        suggestedPrice = Math.round(product.price * 0.92);
        reasoning = 'Reducir exceso de inventario';
      } else if (marketConditions.averagePrice > product.price * 1.1) {
        // Price well below market
        suggestedPrice = Math.round(product.price * 1.06);
        reasoning = 'Ajuste a precio de mercado';
      }

      const potentialIncrease = ((suggestedPrice - product.price) / product.price * 100);
      const newMargin = ((suggestedPrice - product.cost) / suggestedPrice * 100);

      return {
        productId,
        productName: product.name,
        currentPrice: product.price,
        suggestedPrice,
        potentialIncrease: potentialIncrease.toFixed(1),
        reasoning,
        marketConditions,
        demandElasticity,
        competitorPrice: Math.round(competitorPrice),
        currentMargin: ((product.price - product.cost) / product.price * 100).toFixed(1),
        newMargin: newMargin.toFixed(1),
        confidence: Math.round(product.aiScore * 100),
        generatedAt: Date.now()
      };
    };

    return this.core.apiRequest('/ai/optimize-price', {
      method: 'POST',
      body: JSON.stringify({ productId })
    }, mockFallback);
  }

  /**
   * Gets pricing insights for multiple products
   * @returns {Promise<Array>} Array of pricing insights
   */
  async getPricingInsights() {
    const mockFallback = async () => {
      const insights = [];
      for (const product of MOCK_PRODUCTS.slice(0, 4)) {
        const optimization = await this.optimizePrice(product.id);
        if (optimization) {
          insights.push({
            product: product.name,
            currentPrice: product.price,
            suggestedPrice: optimization.suggestedPrice,
            reasoning: optimization.reasoning,
            impact: optimization.potentialIncrease
          });
        }
      }
      return insights;
    };

    const result = await this.core.apiRequest('/ai/pricing-suggestions', {
      method: 'GET'
    }, mockFallback);

    if (result && Array.isArray(result)) {
      return result.slice(0, 4).map(item => ({
        product: item.productName,
        currentPrice: item.currentPrice,
        suggestedPrice: item.suggestedPrice,
        reasoning: item.reason,
        impact: item.priceChange
      }));
    }

    return mockFallback();
  }

  /**
   * Gets dynamic price suggestions based on real-time demand
   * @param {number} productId - Optional product ID, analyzes all if null
   * @returns {Array} Dynamic pricing suggestions
   */
  getDynamicPriceSuggestions(productId = null) {
    const products = productId
      ? [MOCK_PRODUCTS.find(p => p.id === productId)].filter(Boolean)
      : MOCK_PRODUCTS;

    const suggestions = [];

    products.forEach(product => {
      const demandMetrics = this._calculateRealTimeDemand(product);
      const marketConditions = this._analyzeRealTimeMarket(product);
      const competitorPricing = this._estimateCompetitorPricing(product);
      const elasticity = this._calculateDemandElasticity(product);

      // Dynamic pricing algorithm based on multiple factors
      let suggestedPrice = product.price;
      let confidence = 0.75;
      let reasoning = [];
      let expectedImpact = 0;

      // Factor 1: Real-time demand
      if (demandMetrics.currentDemand > demandMetrics.avgDemand * 1.3) {
        // High demand - increase price
        const demandMultiplier = Math.min(1.15, 1 + (demandMetrics.demandRatio - 1) * 0.5);
        suggestedPrice *= demandMultiplier;
        confidence += 0.1;
        reasoning.push(`Alta demanda detectada (+${((demandMultiplier - 1) * 100).toFixed(1)}%)`);
        expectedImpact += (demandMultiplier - 1) * product.stock * product.price;
      } else if (demandMetrics.currentDemand < demandMetrics.avgDemand * 0.7) {
        // Low demand - reduce price to accelerate turnover
        const demandMultiplier = Math.max(0.88, 1 - (1 - demandMetrics.demandRatio) * 0.4);
        suggestedPrice *= demandMultiplier;
        confidence += 0.05;
        reasoning.push(`Baja demanda detectada (${((1 - demandMultiplier) * 100).toFixed(1)}%)`);
        expectedImpact += (demandMultiplier - 1) * product.stock * product.price;
      }

      // Factor 2: Critical stock
      const stockRatio = product.stock / product.reorderPoint;
      if (stockRatio <= 1.2 && demandMetrics.trend === 'increasing') {
        // Low stock + increasing demand = premium pricing
        suggestedPrice *= 1.08;
        confidence += 0.08;
        reasoning.push('Stock crítico con demanda creciente (+8%)');
      } else if (stockRatio >= 3 && demandMetrics.trend !== 'increasing') {
        // Excess stock = promotional price
        suggestedPrice *= 0.93;
        confidence += 0.06;
        reasoning.push('Exceso de inventario (-7%)');
      }

      // Factor 3: Time of day (peak hour dynamic pricing)
      const currentHour = new Date().getHours();
      if (this._isPeakHour(currentHour)) {
        suggestedPrice *= 1.03;
        reasoning.push('Hora pico (+3%)');
      }

      // Factor 4: Competition
      if (competitorPricing.averagePrice > product.price * 1.1) {
        // We are well below market
        const maxIncrease = Math.min(1.08, competitorPricing.averagePrice / product.price * 0.95);
        suggestedPrice *= maxIncrease;
        confidence += 0.05;
        reasoning.push(`Ajuste competitivo (+${((maxIncrease - 1) * 100).toFixed(1)}%)`);
      }

      // Round suggested price
      suggestedPrice = Math.round(suggestedPrice);

      // Only suggest if change is significant (>= 2%)
      const priceChange = Math.abs((suggestedPrice - product.price) / product.price);
      if (priceChange >= 0.02) {
        suggestions.push({
          productId: product.id,
          productName: product.name,
          category: product.category,
          currentPrice: product.price,
          suggestedPrice,
          priceChange: ((suggestedPrice - product.price) / product.price * 100).toFixed(1),
          reasoning: reasoning.join(', '),
          confidence: Math.min(0.95, confidence),
          demandMetrics,
          marketConditions,
          expectedImpact: Math.round(expectedImpact),
          urgency: this._calculatePriceUrgency(demandMetrics, stockRatio),
          validUntil: Date.now() + (2 * 60 * 60 * 1000), // 2 hours
          timestamp: Date.now(),
          source: 'dynamic_ai'
        });
      }
    });

    // Sort by urgency and expected impact
    return suggestions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      }
      return Math.abs(b.expectedImpact) - Math.abs(a.expectedImpact);
    });
  }

  // ======= PRIVATE HELPER METHODS =======

  /**
   * Analyzes market conditions for a category
   * @private
   */
  _analyzeMarketConditions(category) {
    return {
      demand: Math.random() > 0.5 ? 'high' : 'medium',
      competition: Math.random() > 0.3 ? 'high' : 'medium',
      averagePrice: MOCK_PRODUCTS.find(p => p.category === category)?.price * (0.95 + Math.random() * 0.1) || 0,
      priceVolatility: Math.random() * 0.2,
      marketGrowth: (Math.random() - 0.3) * 0.4
    };
  }

  /**
   * Calculates demand elasticity for a product
   * @private
   */
  _calculateDemandElasticity(product) {
    const categoryElasticity = {
      'neumaticos': -1.2,
      'filtros': -0.8,
      'accesorios': -1.5,
      'transmision': -0.9,
      'frenos': -0.7,
      'aceites': -0.9,
      'baterias': -1.1
    };

    return {
      coefficient: categoryElasticity[product.category] || -1.0,
      interpretation: Math.abs(categoryElasticity[product.category] || 1) > 1 ? 'Elástico' : 'Inelástico',
      priceFlexibility: Math.abs(categoryElasticity[product.category] || 1) > 1 ? 'Alta' : 'Baja'
    };
  }

  /**
   * Calculates real-time demand for a product
   * @private
   */
  _calculateRealTimeDemand(product) {
    const currentHour = new Date().getHours();
    const baseHourlyFactor = this._getHourlyDemandFactor(currentHour);
    const sales30Days = product.sales30Days || Math.floor(Math.random() * 20) + 5;

    const avgHourlyDemand = sales30Days / (30 * 12);
    const currentDemand = avgHourlyDemand * baseHourlyFactor * (0.8 + Math.random() * 0.4);

    const trend = Math.random() > 0.6 ? 'increasing' :
                  Math.random() > 0.3 ? 'stable' : 'decreasing';

    return {
      currentDemand: Math.round(currentDemand * 10) / 10,
      avgDemand: Math.round(avgHourlyDemand * 10) / 10,
      demandRatio: currentDemand / avgHourlyDemand,
      trend,
      peakFactor: baseHourlyFactor
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

  /**
   * Analyzes real-time market conditions
   * @private
   */
  _analyzeRealTimeMarket(product) {
    return {
      volatility: Math.random() * 0.3,
      competitiveness: Math.random() > 0.5 ? 'high' : 'medium',
      marketGrowth: (Math.random() - 0.4) * 0.3,
      demandStrength: Math.random() > 0.3 ? 'strong' : 'weak',
      priceFlexibility: Math.random() > 0.5 ? 'high' : 'medium'
    };
  }

  /**
   * Estimates competitor pricing
   * @private
   */
  _estimateCompetitorPricing(product) {
    const basePrice = product.price;
    const variation = 0.15;

    return {
      averagePrice: Math.round(basePrice * (1 + (Math.random() - 0.5) * variation)),
      minPrice: Math.round(basePrice * (0.9 + Math.random() * 0.1)),
      maxPrice: Math.round(basePrice * (1.1 + Math.random() * 0.1)),
      ourPosition: Math.random() > 0.5 ? 'competitive' : 'premium'
    };
  }

  /**
   * Checks if current hour is peak hour
   * @private
   */
  _isPeakHour(hour) {
    return [10, 15, 16, 17].includes(hour);
  }

  /**
   * Calculates price change urgency
   * @private
   */
  _calculatePriceUrgency(demandMetrics, stockRatio) {
    if (demandMetrics.trend === 'increasing' && stockRatio <= 1.2) return 'high';
    if (demandMetrics.demandRatio > 1.5 || stockRatio <= 0.8) return 'high';
    if (demandMetrics.demandRatio > 1.2 || stockRatio <= 1.0) return 'medium';
    return 'low';
  }
}

// Named and default exports
export { PricingOptimizationService };
export default PricingOptimizationService;
