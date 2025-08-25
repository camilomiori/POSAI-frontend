// services/aiEngine.js
import { MOCK_PRODUCTS, MOCK_SALES } from './mockData';
import { DEMAND_TRENDS, PRODUCT_CATEGORIES } from '../utils/constants';
import { sumBy, groupBy, maxBy, minBy } from '../utils/helpers';

/**
 * AI Engine - Sistema de Inteligencia Artificial para POS
 * Incluye predicción de demanda, optimización de precios, recomendaciones, etc.
 */
class AIEngine {
  constructor() {
    this.modelVersion = '2.1.0';
    this.lastTraining = Date.now();
    this.confidence = 0.94;
  }

  /**
   * Predice la demanda de un producto
   * @param {number} productId - ID del producto
   * @param {number} days - Días a predecir (default: 7)
   * @returns {Object} Predicción de demanda
   */
  predictDemand(productId, days = 7) {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    if (!product) return null;
    
    const baseStock = product.stock;
    const multiplier = product.aiScore;
    const seasonalFactor = this._getSeasonalFactor(product.category);
    const trendMultiplier = this._getTrendMultiplier(product.demandTrend);
    
    // Algoritmo de predicción mejorado
    const basePrediction = baseStock * 0.3 * multiplier * seasonalFactor * trendMultiplier;
    const predictedSales = Math.round(basePrediction * (days / 7));
    
    // Calcular confianza basada en datos históricos
    const confidence = Math.round(product.aiScore * 100);
    
    // Determinar recomendación
    const daysToStockout = Math.round(baseStock / (basePrediction / 7));
    const recommendation = baseStock <= product.reorderPoint ? 'reorder' : 
                          daysToStockout <= 14 ? 'monitor_closely' : 'monitor';
    
    // Generar tendencia semanal
    const weeklyTrend = this._generateWeeklyTrend(basePrediction, days);
    
    // Calcular métricas adicionales
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
        reorderPoint: product.reorderPoint
      },
      generatedAt: Date.now()
    };
  }

  /**
   * Obtiene recomendaciones de productos basadas en el carrito
   * @param {Array} cartItems - Items en el carrito
   * @returns {Array} Recomendaciones
   */
  getRecommendations(cartItems) {
    if (!cartItems || cartItems.length === 0) return [];
    
    const recommendations = [];
    const cartProductIds = cartItems.map(item => item.id);
    
    // Reglas de recomendación basadas en categorías
    cartItems.forEach(item => {
      const product = MOCK_PRODUCTS.find(p => p.id === item.id);
      if (!product) return;
      
      const categoryRecommendations = this._getCategoryRecommendations(product.category, cartProductIds);
      recommendations.push(...categoryRecommendations);
    });
    
    // Remover duplicados y productos ya en el carrito
    const uniqueRecommendations = recommendations
      .filter((rec, index, self) => 
        index === self.findIndex(r => r.product.id === rec.product.id) &&
        !cartProductIds.includes(rec.product.id)
      )
      .slice(0, 5); // Limitar a 5 recomendaciones
    
    // Ordenar por confianza
    return uniqueRecommendations.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Optimiza el precio de un producto
   * @param {number} productId - ID del producto
   * @returns {Object} Optimización de precio
   */
  optimizePrice(productId) {
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    if (!product) return null;
    
    const marketConditions = this._analyzeMarketConditions(product.category);
    const demandElasticity = this._calculateDemandElasticity(product);
    const competitorPrice = product.price * (1 + (Math.random() * 0.1 - 0.05)); // Simular precio competencia
    
    // Algoritmo de optimización de precios
    let suggestedPrice = product.price;
    let reasoning = 'Mantener precio actual';
    
    if (product.demandTrend === DEMAND_TRENDS.UP && product.stock <= product.reorderPoint) {
      // Alta demanda + stock bajo = aumentar precio
      suggestedPrice = Math.round(product.price * 1.08);
      reasoning = 'Alta demanda y stock bajo detectados';
    } else if (product.demandTrend === DEMAND_TRENDS.DOWN) {
      // Baja demanda = reducir precio para acelerar rotación
      suggestedPrice = Math.round(product.price * 0.95);
      reasoning = 'Optimizar rotación por baja demanda';
    } else if (product.stock > product.reorderPoint * 3) {
      // Exceso de stock = precio promocional
      suggestedPrice = Math.round(product.price * 0.92);
      reasoning = 'Reducir exceso de inventario';
    } else if (marketConditions.averagePrice > product.price * 1.1) {
      // Precio muy por debajo del mercado
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
  }

  /**
   * Genera insights de negocio
   * @returns {Array} Array de insights
   */
  getBusinessInsights() {
    const insights = [];
    
    // Análisis de tendencias de ventas
    const salesTrend = this._analyzeSalesTrend();
    if (salesTrend.growth > 0.1) {
      insights.push({
        type: 'trend',
        title: 'Tendencia de ventas positiva',
        message: `Las ventas aumentaron ${(salesTrend.growth * 100).toFixed(1)}% esta semana`,
        icon: 'TrendingUp',
        color: 'success',
        action: 'Ver detalles',
        priority: 'high',
        impact: 'positive'
      });
    }
    
    // Análisis de stock crítico
    const lowStockProducts = MOCK_PRODUCTS.filter(p => p.stock <= p.reorderPoint);
    if (lowStockProducts.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Stock crítico detectado',
        message: `${lowStockProducts.length} productos necesitan reposición urgente`,
        icon: 'AlertTriangle',
        color: 'warning',
        action: 'Revisar inventario',
        priority: 'urgent',
        impact: 'negative',
        affectedProducts: lowStockProducts.map(p => p.name)
      });
    }
    
    // Oportunidades de optimización de precios
    const priceOpportunities = this._findPriceOpportunities();
    if (priceOpportunities.length > 0) {
      insights.push({
        type: 'ai',
        title: 'Oportunidades de precios detectadas',
        message: `${priceOpportunities.length} productos pueden optimizar sus precios`,
        icon: 'Brain',
        color: 'ai',
        action: 'Aplicar sugerencias',
        priority: 'medium',
        impact: 'positive',
        potentialRevenue: priceOpportunities.reduce((sum, p) => sum + p.impact, 0)
      });
    }
    
    // Predicciones semanales
    const weeklyForecast = this._generateWeeklyForecast();
    insights.push({
      type: 'forecast',
      title: 'Predicción semanal',
      message: `Se espera ${weeklyForecast.trend} del ${weeklyForecast.percentage}% en ventas`,
      icon: 'BarChart3',
      color: 'default',
      action: 'Preparar estrategia',
      priority: 'medium',
      impact: weeklyForecast.trend === 'incremento' ? 'positive' : 'neutral'
    });
    
    return insights.sort((a, b) => {
      const priorityOrder = { urgent: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Análisis de mercado
   * @returns {Object} Análisis de mercado
   */
  getMarketAnalysis() {
    return {
      marketShare: 23.5,
      competitorAnalysis: [
        { name: 'Competidor A', share: 31.2, trend: 'down', strength: 'Precios bajos', weakness: 'Menor calidad' },
        { name: 'Competidor B', share: 28.7, trend: 'stable', strength: 'Variedad de productos', weakness: 'Servicio lento' },
        { name: 'Competidor C', share: 16.6, trend: 'up', strength: 'Innovación', weakness: 'Precios altos' }
      ],
      pricePosition: 'Competitivo',
      qualityPosition: 'Superior',
      servicePosition: 'Excelente',
      recommendations: [
        'Aumentar stock de neumáticos para capturar mayor market share durante la temporada alta',
        'Implementar programa de fidelización para competir con precios bajos de Competidor A',
        'Desarrollar línea de productos premium para diferenciarse de la competencia',
        'Mejorar presencia digital para alcanzar nuevos segmentos de mercado'
      ],
      threats: [
        'Nuevos competidores online con menores costos operativos',
        'Fluctuaciones en el tipo de cambio afectando costos de importación'
      ],
      opportunities: [
        'Crecimiento del mercado de motocicletas eléctricas',
        'Expansión a ciudades del interior con menor competencia'
      ],
      generatedAt: Date.now()
    };
  }

  /**
   * Segmentación de clientes
   * @returns {Array} Segmentos de clientes
   */
  getCustomerSegmentation() {
    return [
      { 
        segment: 'Clientes Premium', 
        count: 156, 
        revenue: 45, 
        color: '#8B5CF6',
        avgTicket: 75000,
        frequency: 'Alta',
        loyalty: 'Muy Alta',
        characteristics: ['Compran productos premium', 'Frecuencia de compra alta', 'Sensibilidad baja al precio'],
        recommendations: ['Programa VIP', 'Productos exclusivos', 'Descuentos por volumen']
      },
      { 
        segment: 'Ocasionales', 
        count: 423, 
        revenue: 35, 
        color: '#3B82F6',
        avgTicket: 35000,
        frequency: 'Media',
        loyalty: 'Media',
        characteristics: ['Compras estacionales', 'Sensibles a promociones', 'Buscan calidad-precio'],
        recommendations: ['Campañas estacionales', 'Promociones 2x1', 'Newsletter con ofertas']
      },
      { 
        segment: 'Mayoristas', 
        count: 67, 
        revenue: 20, 
        color: '#10B981',
        avgTicket: 125000,
        frequency: 'Baja',
        loyalty: 'Alta',
        characteristics: ['Compras por volumen', 'Buscan descuentos', 'Relaciones a largo plazo'],
        recommendations: ['Descuentos por volumen', 'Términos de pago extendidos', 'Atención personalizada']
      }
    ];
  }

  /**
   * Optimiza el inventario completo
   * @returns {Object} Recomendaciones de inventario
   */
  optimizeInventory() {
    const analysis = {
      totalValue: sumBy(MOCK_PRODUCTS, (p) => p.price * p.stock),
      criticalItems: MOCK_PRODUCTS.filter(p => p.stock <= p.reorderPoint),
      overStockItems: MOCK_PRODUCTS.filter(p => p.stock > p.reorderPoint * 3),
      fastMovingItems: MOCK_PRODUCTS.filter(p => p.fastMoving),
      slowMovingItems: MOCK_PRODUCTS.filter(p => !p.fastMoving && p.aiScore < 0.7),
      recommendations: []
    };

    // Generar recomendaciones específicas
    analysis.criticalItems.forEach(product => {
      const prediction = this.predictDemand(product.id, 30);
      analysis.recommendations.push({
        type: 'reorder',
        priority: 'urgent',
        product: product.name,
        currentStock: product.stock,
        suggestedOrder: Math.max(product.reorderPoint * 2, prediction.predictedSales),
        reason: 'Stock crítico detectado',
        impact: 'Evitar pérdida de ventas'
      });
    });

    analysis.overStockItems.forEach(product => {
      analysis.recommendations.push({
        type: 'promotion',
        priority: 'medium',
        product: product.name,
        currentStock: product.stock,
        suggestedAction: 'Promoción especial',
        discount: '15-20%',
        reason: 'Exceso de inventario',
        impact: 'Liberar capital de trabajo'
      });
    });

    return analysis;
  }

  // Métodos privados auxiliares

  _getSeasonalFactor(category) {
    const month = new Date().getMonth();
    const seasonalFactors = {
      [PRODUCT_CATEGORIES.NEUMATICOS]: month >= 2 && month <= 4 ? 1.3 : 1.0, // Primavera
      [PRODUCT_CATEGORIES.FILTROS]: month >= 8 && month <= 10 ? 1.2 : 1.0, // Primavera (mantenimiento)
      [PRODUCT_CATEGORIES.ACCESORIOS]: month === 11 || month === 0 ? 1.4 : 1.0, // Vacaciones
      [PRODUCT_CATEGORIES.TRANSMISION]: 1.0,
      [PRODUCT_CATEGORIES.FRENOS]: month >= 11 || month <= 1 ? 1.2 : 1.0 // Verano (viajes)
    };
    return seasonalFactors[category] || 1.0;
  }

  _getTrendMultiplier(trend) {
    switch (trend) {
      case DEMAND_TRENDS.UP: return 1.2;
      case DEMAND_TRENDS.DOWN: return 0.8;
      case DEMAND_TRENDS.STABLE: return 1.0;
      default: return 1.0;
    }
  }

  _generateWeeklyTrend(basePrediction, days) {
    return Array.from({ length: Math.min(days, 7) }, (_, i) => ({
      day: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][i],
      prediction: Math.round(basePrediction / 7 + (Math.random() - 0.5) * basePrediction * 0.3),
      confidence: 0.85 + Math.random() * 0.1
    }));
  }

  _calculateTurnoverRate(productId) {
    // Simular cálculo de rotación basado en ventas históricas
    return Math.random() * 12 + 2; // Entre 2 y 14 veces por año
  }

  _calculateProfitImpact(product, predictedSales) {
    const unitProfit = product.price - product.cost;
    return {
      expectedProfit: unitProfit * predictedSales,
      marginPercent: ((unitProfit / product.price) * 100).toFixed(1),
      riskLevel: product.stock <= product.reorderPoint ? 'high' : 'low'
    };
  }

  _getCategoryRecommendations(category, excludeIds) {
    const recommendations = [];
    
    const rules = {
      [PRODUCT_CATEGORIES.NEUMATICOS]: [
        { category: PRODUCT_CATEGORIES.ACCESORIOS, reason: 'Frecuentemente comprado junto', confidence: 0.87, uplift: '+15% conversión' },
        { category: PRODUCT_CATEGORIES.FRENOS, reason: 'Mantenimiento complementario', confidence: 0.73, uplift: '+8% ticket promedio' }
      ],
      [PRODUCT_CATEGORIES.TRANSMISION]: [
        { category: PRODUCT_CATEGORIES.FILTROS, reason: 'Mantenimiento integral', confidence: 0.79, uplift: '+12% satisfacción' },
        { category: PRODUCT_CATEGORIES.ACCESORIOS, reason: 'Accesorios relacionados', confidence: 0.65, uplift: '+6% ticket promedio' }
      ],
      [PRODUCT_CATEGORIES.FRENOS]: [
        { category: PRODUCT_CATEGORIES.NEUMATICOS, reason: 'Seguridad integral', confidence: 0.82, uplift: '+18% conversión' }
      ]
    };

    const categoryRules = rules[category] || [];
    
    categoryRules.forEach(rule => {
      const relatedProducts = MOCK_PRODUCTS.filter(p => 
        p.category === rule.category && !excludeIds.includes(p.id)
      );
      
      if (relatedProducts.length > 0) {
        // Seleccionar el mejor producto de la categoría (mayor AI score)
        const bestProduct = relatedProducts.reduce((best, current) => 
          current.aiScore > best.aiScore ? current : best
        );
        
        recommendations.push({
          product: bestProduct,
          reason: rule.reason,
          confidence: rule.confidence,
          uplift: rule.uplift,
          category: rule.category
        });
      }
    });

    return recommendations;
  }

  _analyzeMarketConditions(category) {
    // Simular análisis de condiciones de mercado
    return {
      demand: Math.random() > 0.5 ? 'high' : 'medium',
      competition: Math.random() > 0.3 ? 'high' : 'medium',
      averagePrice: MOCK_PRODUCTS.find(p => p.category === category)?.price * (0.95 + Math.random() * 0.1) || 0,
      priceVolatility: Math.random() * 0.2,
      marketGrowth: (Math.random() - 0.3) * 0.4 // -0.3 a +0.1
    };
  }

  _calculateDemandElasticity(product) {
    // Simular elasticidad de demanda
    const categoryElasticity = {
      [PRODUCT_CATEGORIES.NEUMATICOS]: -1.2, // Elástico
      [PRODUCT_CATEGORIES.FILTROS]: -0.8, // Inelástico
      [PRODUCT_CATEGORIES.ACCESORIOS]: -1.5, // Muy elástico
      [PRODUCT_CATEGORIES.TRANSMISION]: -0.9, // Ligeramente inelástico
      [PRODUCT_CATEGORIES.FRENOS]: -0.7 // Inelástico
    };
    
    return {
      coefficient: categoryElasticity[product.category] || -1.0,
      interpretation: Math.abs(categoryElasticity[product.category] || 1) > 1 ? 'Elástico' : 'Inelástico',
      priceFlexibility: Math.abs(categoryElasticity[product.category] || 1) > 1 ? 'Alta' : 'Baja'
    };
  }

  _analyzeSalesTrend() {
    // Simular análisis de tendencia de ventas
    const recentSales = MOCK_SALES.filter(sale => 
      sale.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    const previousWeekSales = MOCK_SALES.filter(sale => 
      sale.timestamp > Date.now() - 14 * 24 * 60 * 60 * 1000 &&
      sale.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    
    const recentTotal = sumBy(recentSales, 'total');
    const previousTotal = sumBy(previousWeekSales, 'total');
    
    return {
      growth: previousTotal > 0 ? (recentTotal - previousTotal) / previousTotal : 0,
      recentTotal,
      previousTotal,
      trend: recentTotal > previousTotal ? 'up' : recentTotal < previousTotal ? 'down' : 'stable'
    };
  }

  _findPriceOpportunities() {
    return MOCK_PRODUCTS
      .map(product => {
        const optimization = this.optimizePrice(product.id);
        return {
          product,
          optimization,
          impact: Math.abs(optimization.potentialIncrease) * product.stock * product.price / 100
        };
      })
      .filter(item => Math.abs(item.optimization.potentialIncrease) > 2)
      .sort((a, b) => b.impact - a.impact);
  }

  _generateWeeklyForecast() {
    const trends = ['incremento', 'decremento', 'estabilidad'];
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const percentage = Math.floor(Math.random() * 25) + 5; // 5-30%
    
    return { trend, percentage };
  }

  /**
   * Obtiene métricas del sistema de IA
   * @returns {Object} Métricas del sistema
   */
  getSystemMetrics() {
    return {
      modelVersion: this.modelVersion,
      lastTraining: this.lastTraining,
      overallConfidence: this.confidence,
      predictionsToday: Math.floor(Math.random() * 2000) + 1000,
      accuracy: {
        demandPrediction: 0.943,
        priceOptimization: 0.921,
        recommendations: 0.887,
        customerSegmentation: 0.956
      },
      processingTime: {
        avgPrediction: '245ms',
        avgRecommendation: '180ms',
        avgOptimization: '320ms'
      },
      dataPoints: {
        salesAnalyzed: MOCK_SALES.length,
        productsTracked: MOCK_PRODUCTS.length,
        patterns: 147,
        rules: 89
      },
      status: 'optimal',
      nextUpdate: Date.now() + 6 * 60 * 60 * 1000 // 6 horas
    };
  }
}

// Exportar instancia singleton
const aiEngine = new AIEngine();
export default aiEngine;