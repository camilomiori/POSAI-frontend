/**
 * AI Engine Constants
 * Centralized business rules and configuration values
 * Version 4.0.0
 */

// ============================================
// PRICING CONSTANTS
// ============================================

/**
 * Price elasticity coefficients by category
 * Based on Context7 research 2024
 * Negative values: higher price = lower demand
 * |value| > 1: Elastic (demand sensitive to price)
 * |value| < 1: Inelastic (demand less sensitive)
 */
export const PRICE_ELASTICITY = {
  'Bebidas': -0.7,
  'Alimentos': -0.6,
  'Limpieza': -0.65,
  'Electrónica': -1.3,
  'default': -1.0
};

/**
 * Target profit margins by category (%)
 */
export const TARGET_MARGINS = {
  'Bebidas': 35,
  'Alimentos': 30,
  'Limpieza': 40,
  'Electrónica': 25,
  'default': 30
};

/**
 * Minimum acceptable margin (%)
 */
export const MINIMUM_MARGIN = 20;

/**
 * Maximum price increase/decrease limits (%)
 */
export const PRICE_LIMITS = {
  MAX_INCREASE: 15,
  MAX_DECREASE: 20
};

/**
 * Competitor price variance (±%)
 */
export const COMPETITOR_VARIANCE = 0.05; // ±5%

// ============================================
// SEASONAL FACTORS
// ============================================

/**
 * Seasonal demand multipliers by month (0-11)
 * Based on retail patterns
 */
export const SEASONAL_FACTORS_BY_MONTH = {
  0: 0.95,  // January - post holiday
  1: 0.90,  // February - low season
  2: 0.95,  // March
  3: 1.0,   // April
  4: 1.05,  // May
  5: 1.0,   // June
  6: 1.1,   // July - summer
  7: 1.1,   // August - summer
  8: 1.0,   // September
  9: 1.05,  // October
  10: 1.1,  // November - pre-holiday
  11: 1.2   // December - holiday season
};

/**
 * Seasonal multipliers by category
 */
export const SEASONAL_FACTORS_BY_CATEGORY = {
  'Bebidas': {
    summer: 1.3,   // High demand in summer
    winter: 0.8,
    default: 1.0
  },
  'Alimentos': {
    summer: 1.1,
    winter: 1.1,
    default: 1.0
  },
  'Limpieza': {
    summer: 0.9,
    winter: 1.2,   // Higher cleaning during holidays
    default: 1.0
  },
  'Electrónica': {
    summer: 0.9,
    winter: 1.4,   // High demand during holidays
    default: 1.0
  }
};

// ============================================
// DEMAND PREDICTION CONSTANTS
// ============================================

/**
 * Demand trend multipliers
 */
export const TREND_MULTIPLIERS = {
  'increasing': 1.3,
  'stable': 1.0,
  'decreasing': 0.7,
  'volatile': 0.85,
  'seasonal': 1.1
};

/**
 * Base demand calculation factor
 */
export const BASE_DEMAND_FACTOR = 0.3;

/**
 * Confidence score thresholds
 */
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40
};

// ============================================
// INVENTORY CONSTANTS
// ============================================

/**
 * Stock alert levels (days to stockout)
 */
export const STOCK_ALERT_LEVELS = {
  CRITICAL: 3,
  WARNING: 7,
  MONITOR: 14
};

/**
 * Turnover rate categories
 */
export const TURNOVER_CATEGORIES = {
  EXCELLENT: 4,
  GOOD: 2,
  REGULAR: 1,
  LOW: 0
};

/**
 * Safety stock multiplier
 */
export const SAFETY_STOCK_MULTIPLIER = 1.5;

/**
 * Reorder point calculation
 * If product doesn't have reorderPoint defined
 */
export const DEFAULT_REORDER_RATIO = 0.2; // 20% of maxStock

// ============================================
// TIME-BASED FACTORS
// ============================================

/**
 * Hourly demand factors (0-23)
 * Multipliers for demand by hour of day
 */
export const HOURLY_DEMAND_FACTORS = {
  6: 0.4,   // Early morning
  7: 0.6,
  8: 0.8,
  9: 0.9,
  10: 1.0,
  11: 1.1,
  12: 1.3,  // Lunch peak
  13: 1.2,
  14: 1.0,
  15: 0.9,
  16: 0.9,
  17: 1.1,
  18: 1.2,  // Evening peak
  19: 1.1,
  20: 0.9,
  21: 0.7,
  22: 0.5,
  23: 0.3,
  default: 0.8
};

/**
 * Peak hours for pricing
 */
export const PEAK_HOURS = [12, 13, 18, 19];

// ============================================
// RECOMMENDATION ENGINE RULES
// ============================================

/**
 * Category recommendation rules
 * When customer buys from one category, suggest from another
 */
export const RECOMMENDATION_RULES = {
  'Bebidas': {
    suggests: ['Alimentos', 'Bebidas'],
    reason: 'Productos complementarios para bebidas',
    uplift: 0.25
  },
  'Alimentos': {
    suggests: ['Bebidas', 'Alimentos'],
    reason: 'Combinaciones populares de comida',
    uplift: 0.30
  },
  'Limpieza': {
    suggests: ['Limpieza', 'Alimentos'],
    reason: 'Productos de limpieza relacionados',
    uplift: 0.20
  },
  'Electrónica': {
    suggests: ['Electrónica', 'Limpieza'],
    reason: 'Accesorios y productos de mantenimiento',
    uplift: 0.35
  }
};

/**
 * Minimum confidence for recommendations
 */
export const MIN_RECOMMENDATION_CONFIDENCE = 60;

// ============================================
// CUSTOMER SEGMENTATION
// ============================================

/**
 * Customer segment thresholds
 */
export const SEGMENT_THRESHOLDS = {
  PREMIUM: {
    minPurchases: 20,
    minAvgTicket: 50000
  },
  OCCASIONAL: {
    minPurchases: 5,
    minAvgTicket: 20000
  },
  WHOLESALE: {
    minPurchases: 10,
    minQuantity: 50
  }
};

// ============================================
// ANALYTICS CONSTANTS
// ============================================

/**
 * ROI calculation constants
 */
export const ROI_CONSTANTS = {
  MARKETING_COST_RATIO: 0.15,  // 15% of revenue
  OPERATIONAL_COST_RATIO: 0.20  // 20% of revenue
};

/**
 * Profitability score weights
 */
export const PROFITABILITY_WEIGHTS = {
  MARGIN: 0.4,
  TURNOVER: 0.3,
  DEMAND_TREND: 0.2,
  STOCK_EFFICIENCY: 0.1
};

// ============================================
// MODEL CONFIGURATION
// ============================================

/**
 * AI Model version and metadata
 */
export const MODEL_CONFIG = {
  VERSION: '4.0.0',
  BASE_CONFIDENCE: 0.94,
  TRAINING_FREQUENCY_DAYS: 7,
  CACHE_TTL_MINUTES: 5
};

// ============================================
// PERFORMANCE LIMITS
// ============================================

/**
 * Performance and data limits
 */
export const PERFORMANCE_LIMITS = {
  MAX_PREDICTIONS_PER_REQUEST: 100,
  MAX_RECOMMENDATIONS: 10,
  MAX_ALERTS: 20,
  MAX_HEATMAP_DAYS: 30
};

// ============================================
// ERROR THRESHOLDS
// ============================================

/**
 * System health thresholds
 */
export const HEALTH_THRESHOLDS = {
  ERROR_RATE_WARNING: 0.05,    // 5% error rate
  ERROR_RATE_CRITICAL: 0.10,   // 10% error rate
  RESPONSE_TIME_WARNING: 1000, // 1 second
  RESPONSE_TIME_CRITICAL: 3000 // 3 seconds
};

// ============================================
// SIMULATION PARAMETERS
// ============================================

/**
 * Scenario simulation parameters
 */
export const SIMULATION_PARAMS = {
  MIN_PRICE_CHANGE: -50,  // -50%
  MAX_PRICE_CHANGE: 100,  // +100%
  MIN_STOCK_CHANGE: -90,  // -90%
  MAX_STOCK_CHANGE: 500,  // +500%
  PROMOTION_IMPACT_MULTIPLIER: 1.5
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get seasonal factor for a specific month and category
 */
export function getSeasonalFactor(category, month = new Date().getMonth()) {
  const baseFactor = SEASONAL_FACTORS_BY_MONTH[month] || 1.0;
  const categoryFactors = SEASONAL_FACTORS_BY_CATEGORY[category];

  if (!categoryFactors) return baseFactor;

  // Determine season
  const isSummer = month >= 5 && month <= 8;
  const isWinter = month >= 11 || month <= 2;

  let categoryFactor = categoryFactors.default;
  if (isSummer) categoryFactor = categoryFactors.summer;
  else if (isWinter) categoryFactor = categoryFactors.winter;

  return baseFactor * categoryFactor;
}

/**
 * Get trend multiplier for a demand trend
 */
export function getTrendMultiplier(trend) {
  return TREND_MULTIPLIERS[trend] || TREND_MULTIPLIERS.stable;
}

/**
 * Get hourly demand factor
 */
export function getHourlyDemandFactor(hour = new Date().getHours()) {
  return HOURLY_DEMAND_FACTORS[hour] || HOURLY_DEMAND_FACTORS.default;
}

/**
 * Check if current hour is peak hour
 */
export function isPeakHour(hour = new Date().getHours()) {
  return PEAK_HOURS.includes(hour);
}

/**
 * Calculate default reorder point
 */
export function calculateDefaultReorderPoint(product) {
  return product.reorderPoint ||
         product.minStock ||
         Math.floor((product.maxStock || product.stock) * DEFAULT_REORDER_RATIO);
}

/**
 * Get price elasticity coefficient for category
 */
export function getPriceElasticity(category) {
  return PRICE_ELASTICITY[category] || PRICE_ELASTICITY.default;
}

/**
 * Get target margin for category
 */
export function getTargetMargin(category) {
  return TARGET_MARGINS[category] || TARGET_MARGINS.default;
}

/**
 * Validate price change is within limits
 */
export function isValidPriceChange(currentPrice, newPrice) {
  const changePercent = ((newPrice - currentPrice) / currentPrice) * 100;
  return changePercent >= -PRICE_LIMITS.MAX_DECREASE &&
         changePercent <= PRICE_LIMITS.MAX_INCREASE;
}

/**
 * Ensure minimum margin is maintained
 */
export function enforceMinimumMargin(price, cost) {
  const minPrice = cost * (1 + MINIMUM_MARGIN / 100);
  return Math.max(price, minPrice);
}

export default {
  // Export all constants
  PRICE_ELASTICITY,
  TARGET_MARGINS,
  MINIMUM_MARGIN,
  PRICE_LIMITS,
  COMPETITOR_VARIANCE,
  SEASONAL_FACTORS_BY_MONTH,
  SEASONAL_FACTORS_BY_CATEGORY,
  TREND_MULTIPLIERS,
  BASE_DEMAND_FACTOR,
  CONFIDENCE_THRESHOLDS,
  STOCK_ALERT_LEVELS,
  TURNOVER_CATEGORIES,
  SAFETY_STOCK_MULTIPLIER,
  DEFAULT_REORDER_RATIO,
  HOURLY_DEMAND_FACTORS,
  PEAK_HOURS,
  RECOMMENDATION_RULES,
  MIN_RECOMMENDATION_CONFIDENCE,
  SEGMENT_THRESHOLDS,
  ROI_CONSTANTS,
  PROFITABILITY_WEIGHTS,
  MODEL_CONFIG,
  PERFORMANCE_LIMITS,
  HEALTH_THRESHOLDS,
  SIMULATION_PARAMS,

  // Export helper functions
  getSeasonalFactor,
  getTrendMultiplier,
  getHourlyDemandFactor,
  isPeakHour,
  calculateDefaultReorderPoint,
  getPriceElasticity,
  getTargetMargin,
  isValidPriceChange,
  enforceMinimumMargin
};
