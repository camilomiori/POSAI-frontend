// services/aiEngine.js
import { MOCK_PRODUCTS, MOCK_SALES } from './mockData';
import { sumBy, groupBy, maxBy, minBy } from '../utils/helpers';
import { DEMAND_TRENDS } from '../utils/constants';

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
      trends: [
        {
          category: 'Neumáticos',
          trend: 'up',
          change: 34.2,
          analysis: 'Pico estacional + nuevas regulaciones UE impulsan demanda premium'
        },
        {
          category: 'Aceites y Lubricantes',
          trend: 'up',
          change: 18.7,
          analysis: 'Tendencia hacia aceites sintéticos de larga duración'
        },
        {
          category: 'Repuestos de Motor',
          trend: 'stable',
          change: -2.1,
          analysis: 'Mercado maduro con crecimiento estable en recambios'
        },
        {
          category: 'Frenos',
          trend: 'up',
          change: 12.5,
          analysis: 'Mayor conciencia sobre seguridad impulsa renovación preventiva'
        }
      ],
      opportunities: [
        {
          title: 'Neumáticos Premium',
          description: 'Demanda creciente por neumáticos de alto rendimiento',
          impact: 'high',
          probability: 78,
          revenueIncrease: 15600
        },
        {
          title: 'Servicios de Mantenimiento',
          description: 'Expansión a servicios integrales de mantenimiento',
          impact: 'high',
          probability: 72,
          revenueIncrease: 12800
        },
        {
          title: 'E-commerce',
          description: 'Plataforma online para ampliar alcance geográfico',
          impact: 'medium',
          probability: 67,
          revenueIncrease: 5400
        }
      ],
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
      'neumaticos': month >= 2 && month <= 4 ? 1.3 : 1.0, // Primavera
      'filtros': month >= 8 && month <= 10 ? 1.2 : 1.0, // Primavera (mantenimiento)
      'accesorios': month === 11 || month === 0 ? 1.4 : 1.0, // Vacaciones
      'transmision': 1.0,
      'frenos': month >= 11 || month <= 1 ? 1.2 : 1.0, // Verano (viajes)
      'aceites': 1.0,
      'baterias': 1.0
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
      'neumaticos': [
        { category: 'accesorios', reason: 'Frecuentemente comprado junto', confidence: 0.87, uplift: '+15% conversión' },
        { category: 'frenos', reason: 'Mantenimiento complementario', confidence: 0.73, uplift: '+8% ticket promedio' }
      ],
      'transmision': [
        { category: 'filtros', reason: 'Mantenimiento integral', confidence: 0.79, uplift: '+12% satisfacción' },
        { category: 'accesorios', reason: 'Accesorios relacionados', confidence: 0.65, uplift: '+6% ticket promedio' }
      ],
      'frenos': [
        { category: 'neumaticos', reason: 'Seguridad integral', confidence: 0.82, uplift: '+18% conversión' }
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
    // Simular elasticidad de demanda con valores por string literal
    const categoryElasticity = {
      'neumaticos': -1.2, // Elástico
      'filtros': -0.8, // Inelástico
      'accesorios': -1.5, // Muy elástico
      'transmision': -0.9, // Ligeramente inelástico
      'frenos': -0.7, // Inelástico
      'aceites': -0.9, // Inelástico
      'baterias': -1.1 // Elástico
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
   * Obtiene alertas críticas del sistema
   * @returns {Array} Alertas críticas
   */
  getCriticalAlerts() {
    const alerts = [];
    
    // Alertas de stock crítico
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

    // Alertas de tendencias negativas
    const salesTrend = this._analyzeSalesTrend();
    if (salesTrend.growth < -0.1) {
      alerts.push({
        title: 'Tendencia de Ventas Negativa',
        message: `Ventas bajaron ${Math.abs(salesTrend.growth * 100).toFixed(1)}%`,
        severity: 'medium',
        timestamp: Date.now(),
        type: 'sales'
      });
    }

    return alerts;
  }

  /**
   * Obtiene optimizaciones de inventario
   * @returns {Array} Optimizaciones de inventario
   */
  getInventoryOptimizations() {
    const optimizations = [];
    
    MOCK_PRODUCTS.forEach(product => {
      const prediction = this.predictDemand(product.id, 30);
      if (prediction.recommendation === 'reorder') {
        optimizations.push({
          product: product.name,
          suggestion: `Reponer stock: ${prediction.daysToStockout} días restantes`,
          impact: 'high',
          potentialSavings: `$${(product.price * product.reorderPoint * 0.1).toFixed(0)}`
        });
      }
    });

    return optimizations.slice(0, 5);
  }

  /**
   * Obtiene pronóstico de demanda general
   * @returns {Array} Pronóstico de demanda
   */
  getDemandForecast() {
    return MOCK_PRODUCTS.slice(0, 6).map(product => {
      const prediction = this.predictDemand(product.id, 30);
      return {
        product: product.name,
        category: product.category,
        predictedDemand: prediction.predictedSales,
        confidence: prediction.confidence
      };
    });
  }

  /**
   * Obtiene insights de precios
   * @returns {Array} Insights de precios
   */
  getPricingInsights() {
    return MOCK_PRODUCTS.slice(0, 4).map(product => {
      const optimization = this.optimizePrice(product.id);
      return {
        product: product.name,
        currentPrice: product.price,
        suggestedPrice: optimization.suggestedPrice,
        reasoning: optimization.reasoning,
        impact: optimization.potentialIncrease
      };
    });
  }

  /**
   * Obtiene insights de ventas
   * @param {Array} cartItems - Items del carrito
   * @returns {Array} Insights de ventas
   */
  getSalesInsights(cartItems) {
    const insights = [];
    
    if (cartItems.length > 0) {
      const totalValue = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      insights.push({
        title: 'Venta Promedio Superior',
        message: `Esta venta supera el ticket promedio en ${((totalValue / 45000 - 1) * 100).toFixed(0)}%`,
        impact: '+$' + (totalValue - 45000).toFixed(0)
      });
    }

    return insights;
  }

  /**
   * Obtiene optimizaciones de precios para ventas
   * @param {Array} cartItems - Items del carrito
   * @returns {Array} Optimizaciones de precios
   */
  getPriceOptimizations(cartItems) {
    return cartItems.slice(0, 2).map(item => {
      const product = MOCK_PRODUCTS.find(p => p.id === item.id);
      if (!product) return null;
      
      const optimization = this.optimizePrice(product.id);
      return {
        product: product.name,
        currentPrice: product.price,
        suggestedPrice: optimization.suggestedPrice,
        reason: optimization.reasoning
      };
    }).filter(Boolean);
  }

  /**
   * Obtiene sugerencias de venta cruzada
   * @param {Array} cartItems - Items del carrito
   * @returns {Array} Sugerencias de venta cruzada
   */
  getCrossSellSuggestions(cartItems) {
    const recommendations = this.getRecommendations(cartItems);
    return recommendations.slice(0, 3);
  }

  /**
   * Genera perfil de cliente
   * @param {string} email - Email del cliente
   * @returns {Object} Perfil de cliente
   */
  generateCustomerProfile(email) {
    const segments = ['Premium', 'Ocasional', 'Mayorista'];
    const segment = segments[Math.floor(Math.random() * segments.length)];
    
    return {
      segment,
      avgTicket: 35000 + Math.random() * 40000,
      loyaltyScore: Math.floor(Math.random() * 40) + 60,
      preferences: ['Neumáticos', 'Filtros', 'Accesorios'].slice(0, Math.floor(Math.random() * 3) + 1)
    };
  }

  /**
   * Obtiene métricas de performance
   * @returns {Object} Métricas de performance
   */
  getPerformanceMetrics() {
    return {
      systemEfficiency: 0.89 + Math.random() * 0.1,
      userProductivity: 75 + Math.floor(Math.random() * 20),
      aiAccuracy: 84 + Math.floor(Math.random() * 12),
      costOptimization: 12 + Math.floor(Math.random() * 15)
    };
  }

  /**
   * Obtiene alertas de seguridad
   * @returns {Array} Alertas de seguridad
   */
  getSecurityAlerts() {
    const alerts = [];
    
    if (Math.random() > 0.7) {
      alerts.push({
        title: 'Acceso Inusual Detectado',
        message: 'Login desde nueva ubicación',
        timestamp: Date.now() - Math.random() * 3600000
      });
    }

    return alerts;
  }

  /**
   * Obtiene recomendaciones operacionales
   * @returns {Array} Recomendaciones operacionales
   */
  getOperationalRecommendations() {
    return [
      {
        title: 'Optimizar Horarios de Reposición',
        description: 'Realizar reposición durante horas de menor afluencia',
        priority: 'alta',
        potentialBenefit: '15% eficiencia'
      },
      {
        title: 'Implementar Descuentos Automáticos',
        description: 'Para productos con exceso de stock',
        priority: 'media',
        potentialBenefit: '8% rotación'
      }
    ];
  }

  /**
   * Obtiene recomendaciones personalizadas
   * @param {number} userId - ID del usuario
   * @returns {Array} Recomendaciones personalizadas
   */
  getPersonalizedRecommendations(userId) {
    return [
      {
        title: 'Mejorar Tiempo de Atención',
        description: 'Promedio actual: 4.2 min, objetivo: 3.5 min',
        category: 'Productividad',
        potentialImpact: '12% satisfacción'
      },
      {
        title: 'Aumentar Venta Sugerida',
        description: 'Sugerir productos complementarios activamente',
        category: 'Ventas',
        potentialImpact: '18% ticket promedio'
      }
    ];
  }

  /**
   * Obtiene insights de performance personal
   * @param {number} userId - ID del usuario
   * @returns {Array} Insights de performance
   */
  getPerformanceInsights(userId) {
    return [
      {
        metric: 'Ventas del Mes',
        value: '$124,500',
        trend: 'up',
        comparison: '+15% vs mes anterior',
        analysis: 'Excelente performance en productos premium',
        recommendation: 'Continuar enfoque en productos de alto valor'
      },
      {
        metric: 'Tiempo Promedio por Venta',
        value: '4.2 min',
        trend: 'down',
        comparison: '-0.8 min vs mes anterior',
        analysis: 'Mejora significativa en eficiencia',
        recommendation: 'Mantener ritmo actual'
      }
    ];
  }

  /**
   * Obtiene progreso de objetivos
   * @param {number} userId - ID del usuario
   * @returns {Object} Progreso de objetivos
   */
  getGoalProgress(userId) {
    return {
      goals: [
        {
          title: 'Ventas Mensuales',
          progress: 78,
          target: '$150,000',
          current: '$124,500',
          status: 'on_track',
          aiPrediction: 'Alcanzará $147,000 (98% del objetivo)'
        },
        {
          title: 'Productos Nuevos Vendidos',
          progress: 65,
          target: '20 productos',
          current: '13 productos',
          status: 'behind',
          aiPrediction: 'Necesita vender 2 productos más esta semana'
        }
      ]
    };
  }

  /**
   * Obtiene tips personalizados
   * @param {number} userId - ID del usuario
   * @returns {Array} Tips personalizados
   */
  getPersonalizedTips(userId) {
    return [
      {
        title: 'Hora Pico de Ventas',
        description: 'Tus mejores ventas son entre 10-12h y 15-17h',
        priority: 'alta'
      },
      {
        title: 'Producto Estrella Personal',
        description: 'Los filtros de aceite son tu especialidad (+23% conversión)',
        priority: 'media'
      },
      {
        title: 'Oportunidad de Cross-sell',
        description: 'Cuando vendes neumáticos, sugiere balanceado (+32% aceptación)',
        priority: 'alta'
      }
    ];
  }

  /**
   * Obtiene configuración de IA
   * @returns {Object} Configuración de IA
   */
  getConfiguration() {
    return {
      enabled: true,
      predictionAccuracy: 0.85,
      autoOptimization: true,
      realTimeAnalysis: true,
      priceOptimization: true,
      inventoryPrediction: true,
      customerSegmentation: true,
      marketAnalysis: false,
      notifications: {
        criticalAlerts: true,
        dailyReports: true,
        priceChanges: false,
        stockAlerts: true
      },
      thresholds: {
        lowStockAlert: 10,
        highDemandThreshold: 80,
        priceVariationLimit: 15,
        confidenceLevel: 75
      },
      modelSettings: {
        trainingFrequency: 'weekly',
        dataRetention: 365,
        useExternalData: false,
        learningRate: 0.01
      }
    };
  }

  /**
   * Actualiza configuración de IA
   * @param {Object} config - Nueva configuración
   * @returns {Promise<boolean>} Resultado de la actualización
   */
  async updateConfiguration(config) {
    // Simular guardado de configuración
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  }

  /**
   * Obtiene estadísticas del modelo
   * @returns {Object} Estadísticas del modelo
   */
  getModelStatistics() {
    return {
      accuracy: 0.852,
      predictionsToday: 247,
      lastTraining: Date.now() - 86400000, // Ayer
      dataPoints: '15.2K',
      totalPredictions: 12847,
      moduleAccuracy: {
        demand: 0.87,
        pricing: 0.82,
        segmentation: 0.79
      }
    };
  }

  /**
   * Resetea el modelo de IA
   * @returns {Promise<boolean>} Resultado del reset
   */
  async resetModel() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.lastTraining = Date.now();
    return true;
  }

  /**
   * Reentrena el modelo de IA
   * @returns {Promise<boolean>} Resultado del reentrenamiento
   */
  async retrainModel() {
    await new Promise(resolve => setTimeout(resolve, 5000));
    this.lastTraining = Date.now();
    this.confidence = Math.min(0.98, this.confidence + 0.02);
    return true;
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