/**
 * AI Engine Core
 * Core infrastructure for all AI modules
 * Handles API requests, caching, and shared utilities
 * Version 4.0.0
 */

import { MODEL_CONFIG } from '../utils/constants';
import { API_CONFIG } from '../../../utils/constants';

export class AIEngineCore {
  constructor(config = {}) {
    this.version = config.version || MODEL_CONFIG.VERSION;
    this.confidence = config.confidence || MODEL_CONFIG.BASE_CONFIDENCE;
    this.useBackend = !API_CONFIG.MOCK_MODE;
    this.baseURL = API_CONFIG.BASE_URL;
    this.lastTraining = Date.now();

    // Simple in-memory cache
    this.cache = new Map();
    this.cacheConfig = {
      ttl: (config.cacheTTL || MODEL_CONFIG.CACHE_TTL_MINUTES) * 60 * 1000, // Convert to ms
      enabled: config.enableCache !== false
    };

    // Performance metrics
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0
    };
  }

  /**
   * Make API request with automatic fallback to mock data
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @param {Function} mockFallback - Mock function to use as fallback
   * @returns {Promise} API response or mock data
   */
  async apiRequest(endpoint, options = {}, mockFallback) {
    const startTime = Date.now();
    this.metrics.requestCount++;

    // If not using backend, use mock immediately
    if (!this.useBackend) {
      if (import.meta.env.DEV) {
        console.log(`[AI Engine Core] Using mock data for ${endpoint}`);
      }
      return mockFallback?.() || null;
    }

    try {
      const url = `${this.baseURL}${endpoint}`;
      const token = localStorage.getItem('auth_token');

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Track performance
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;

      return result.data || result;
    } catch (error) {
      this.metrics.errorCount++;

      if (import.meta.env.DEV) {
        console.warn(`[AI Engine Core] API request failed for ${endpoint}, using mock data:`, error.message);
      }

      // Fallback to mock data
      return mockFallback?.() || null;
    }
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null
   */
  getCached(key) {
    if (!this.cacheConfig.enabled) return null;

    const cached = this.cache.get(key);

    if (!cached) {
      this.metrics.cacheMisses++;
      return null;
    }

    // Check if cache expired
    if (Date.now() - cached.timestamp > this.cacheConfig.ttl) {
      this.cache.delete(key);
      this.metrics.cacheMisses++;
      return null;
    }

    this.metrics.cacheHits++;
    return cached.value;
  }

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} customTTL - Custom TTL in milliseconds (optional)
   */
  setCached(key, value, customTTL) {
    if (!this.cacheConfig.enabled) return;

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: customTTL || this.cacheConfig.ttl
    });

    // Simple cache size management (max 100 items)
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  /**
   * Clear cache
   * @param {string} pattern - Optional pattern to match keys (simple substring match)
   */
  clearCache(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const hitRate = this.metrics.cacheHits /
                   (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;

    return {
      size: this.cache.size,
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      hitRate: (hitRate * 100).toFixed(2) + '%'
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const avgResponseTime = this.metrics.requestCount > 0
      ? this.metrics.totalResponseTime / this.metrics.requestCount
      : 0;

    const errorRate = this.metrics.requestCount > 0
      ? (this.metrics.errorCount / this.metrics.requestCount) * 100
      : 0;

    return {
      requestCount: this.metrics.requestCount,
      errorCount: this.metrics.errorCount,
      errorRate: errorRate.toFixed(2) + '%',
      avgResponseTime: Math.round(avgResponseTime) + 'ms',
      cache: this.getCacheStats(),
      uptime: Date.now() - this.lastTraining
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      totalResponseTime: 0
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config) {
    if (config.cacheTTL !== undefined) {
      this.cacheConfig.ttl = config.cacheTTL * 60 * 1000;
    }
    if (config.enableCache !== undefined) {
      this.cacheConfig.enabled = config.enableCache;
    }
    if (config.confidence !== undefined) {
      this.confidence = config.confidence;
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      version: this.version,
      confidence: this.confidence,
      useBackend: this.useBackend,
      baseURL: this.baseURL,
      cache: {
        enabled: this.cacheConfig.enabled,
        ttl: this.cacheConfig.ttl / 60000 + ' minutes'
      }
    };
  }
}

export default AIEngineCore;
