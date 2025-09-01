// services/api.js
import { API_CONFIG, MESSAGES } from '../utils/constants';

/**
 * API Service - Maneja todas las comunicaciones con el backend
 * Incluye manejo de errores, retry logic, y mock data para desarrollo
 */
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.isOnline = navigator.onLine;
    
    // Event listener para estado de conexión
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onConnectionRestore?.();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onConnectionLost?.();
    });
  }

  /**
   * Realiza una petición HTTP con retry automático
   * @param {string} endpoint - Endpoint de la API
   * @param {Object} options - Opciones de fetch
   * @returns {Promise} Respuesta de la API
   */
  async request(endpoint, options = {}) {
    // En modo desarrollo, usar mock data directamente sin errores
    if (API_CONFIG.MOCK_MODE || this.baseURL.includes('mock')) {
      console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint} - Using mock data directly`);
      // Simular delay de red más corto
      await new Promise(resolve => setTimeout(resolve, 100));
      // NO lanzar error, sino ir directo al catch de cada método
      throw new Error('Mock mode - using fallback data');
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...this.getAuthHeaders(),
      },
      timeout: this.timeout,
      ...options
    };

    // Verificar conexión
    if (!this.isOnline) {
      throw new Error(MESSAGES.ERROR.NETWORK);
    }

    let lastError;
    
    // Retry logic
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const response = await fetch(url, {
          ...defaultOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(await this.handleErrorResponse(response));
        }
        
        const data = await response.json();
        return this.handleSuccessResponse(data);
        
      } catch (error) {
        lastError = error;
        
        // No reintentar en ciertos tipos de errores
        if (error.name === 'AbortError' || 
            error.message.includes('401') || 
            error.message.includes('403')) {
          break;
        }
        
        // Esperar antes del siguiente intento
        if (attempt < this.retryAttempts) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  /**
   * GET request
   */
  async get(endpoint, params = {}) {
    const url = new URL(endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    return this.request(url.toString(), { method: 'GET' });
  }

  /**
   * POST request
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH request
   */
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Upload file
   */
  async upload(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (error) {
            resolve({ success: true });
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add auth headers
      const authHeaders = this.getAuthHeaders();
      Object.keys(authHeaders).forEach(key => {
        xhr.setRequestHeader(key, authHeaders[key]);
      });
      
      xhr.send(formData);
    });
  }

  // Métodos específicos de la aplicación

  /**
   * Autenticación
   */
  async login(credentials) {
    try {
      const response = await this.post('/auth/login', credentials);
      
      if (response.token) {
        this.setAuthToken(response.token);
      }
      
      return response;
    } catch (error) {
      // Fallback a mock para desarrollo
      return this.mockLogin(credentials);
    }
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } catch (error) {
      console.warn('Logout failed:', error);
    } finally {
      this.clearAuthToken();
    }
  }

  async refreshToken() {
    try {
      const response = await this.post('/auth/refresh');
      if (response.token) {
        this.setAuthToken(response.token);
      }
      return response;
    } catch (error) {
      this.clearAuthToken();
      throw error;
    }
  }

  /**
   * Productos
   */
  async getProducts(filters = {}) {
    try {
      return await this.get('/products', filters);
    } catch (error) {
      // Fallback a mock data
      const { MOCK_PRODUCTS } = await import('./mockData');
      return { data: MOCK_PRODUCTS, total: MOCK_PRODUCTS.length };
    }
  }

  async getProduct(id) {
    try {
      return await this.get(`/products/${id}`);
    } catch (error) {
      const { MOCK_PRODUCTS } = await import('./mockData');
      return MOCK_PRODUCTS.find(p => p.id === parseInt(id));
    }
  }

  async createProduct(productData) {
    try {
      return await this.post('/products', productData);
    } catch (error) {
      // Mock creation
      return { 
        id: Date.now(), 
        ...productData, 
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  }

  async updateProduct(id, productData) {
    try {
      return await this.put(`/products/${id}`, productData);
    } catch (error) {
      return { id, ...productData, updatedAt: Date.now() };
    }
  }

  async deleteProduct(id) {
    try {
      return await this.delete(`/products/${id}`);
    } catch (error) {
      return { success: true };
    }
  }

  async bulkUpdateProducts(updates) {
    try {
      return await this.patch('/products/bulk', { updates });
    } catch (error) {
      return { success: true, updated: updates.length };
    }
  }

  /**
   * Ventas
   */
  async getSales(filters = {}) {
    try {
      return await this.get('/sales', filters);
    } catch (error) {
      const { MOCK_SALES } = await import('./mockData');
      return { data: MOCK_SALES, total: MOCK_SALES.length };
    }
  }

  async createSale(saleData) {
    try {
      return await this.post('/sales', saleData);
    } catch (error) {
      return { 
        id: Date.now(), 
        ...saleData, 
        status: 'completed',
        createdAt: Date.now()
      };
    }
  }

  async getSaleById(id) {
    try {
      return await this.get(`/sales/${id}`);
    } catch (error) {
      const { MOCK_SALES } = await import('./mockData');
      return MOCK_SALES.find(s => s.id === parseInt(id));
    }
  }

  /**
   * IA y Analytics
   */
  async getPrediction(productId, days = 7) {
    try {
      return await this.post('/ai/predict', { productId, days });
    } catch (error) {
      const aiEngine = (await import('./aiEngine')).default;
      return aiEngine.predictDemand(productId, days);
    }
  }

  async getRecommendations(cartItems) {
    try {
      return await this.post('/ai/recommendations', { cartItems });
    } catch (error) {
      const aiEngine = (await import('./aiEngine')).default;
      return aiEngine.getRecommendations(cartItems);
    }
  }

  async optimizePrice(productId) {
    try {
      return await this.post('/ai/optimize-price', { productId });
    } catch (error) {
      const aiEngine = (await import('./aiEngine')).default;
      return aiEngine.optimizePrice(productId);
    }
  }

  async getBusinessInsights() {
    try {
      return await this.get('/ai/insights');
    } catch (error) {
      const aiEngine = (await import('./aiEngine')).default;
      return aiEngine.getBusinessInsights();
    }
  }

  async getMarketAnalysis() {
    try {
      return await this.get('/ai/market-analysis');
    } catch (error) {
      const aiEngine = (await import('./aiEngine')).default;
      return aiEngine.getMarketAnalysis();
    }
  }

  async getCustomerSegmentation() {
    try {
      return await this.get('/ai/customer-segmentation');
    } catch (error) {
      const aiEngine = (await import('./aiEngine')).default;
      return aiEngine.getCustomerSegmentation();
    }
  }

  /**
   * Dashboard y reportes
   */
  async getDashboardData(dateRange = {}) {
    try {
      return await this.get('/dashboard', dateRange);
    } catch (error) {
      const { generateSalesChartData, generateCategoryData, generateHourlyData } = await import('./mockData');
      return {
        salesChart: generateSalesChartData(30),
        categoryChart: generateCategoryData(),
        hourlyChart: generateHourlyData(),
        kpis: {
          totalSales: 2450000,
          totalOrders: 156,
          avgTicket: 15705,
          topProduct: 'Cubierta 80/100-21'
        }
      };
    }
  }

  async getReports(type, filters = {}) {
    try {
      return await this.get(`/reports/${type}`, filters);
    } catch (error) {
      return { 
        type, 
        data: [], 
        generatedAt: Date.now(),
        filters 
      };
    }
  }

  /**
   * Configuración del Sistema
   */
  async getSystemConfiguration() {
    try {
      return await this.get('/system/config');
    } catch (error) {
      return {
        language: 'es',
        currency: 'ARS',
        timezone: 'America/Argentina/Buenos_Aires',
        dateFormat: 'DD/MM/YYYY',
        theme: 'light',
        autoBackup: true,
        auditLog: true,
        sessionTimeout: 30
      };
    }
  }

  async updateSystemConfiguration(config) {
    try {
      return await this.put('/system/config', config);
    } catch (error) {
      // Simular guardado local
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  }

  /**
   * Actividad del Sistema
   */
  async getRecentActivity(filters = {}) {
    try {
      return await this.get('/system/activity', filters);
    } catch (error) {
      return {
        data: [
          {
            action: 'Configuración actualizada',
            description: 'Parámetros de IA modificados',
            timestamp: Date.now() - 300000
          },
          {
            action: 'Modelo reentrenado',
            description: 'Proceso automático completado',
            timestamp: Date.now() - 3600000
          },
          {
            action: 'Backup creado',
            description: 'Backup automático diario',
            timestamp: Date.now() - 86400000
          }
        ]
      };
    }
  }

  /**
   * Estadísticas del Usuario
   */
  async getUserStats(userId) {
    try {
      return await this.get(`/users/${userId}/stats`);
    } catch (error) {
      return {
        monthlySales: 124500,
        monthlyTransactions: 47,
        averageTicket: 2649,
        monthlyHours: 186,
        salesChange: '+15.2%',
        transactionsChange: '+8%',
        ticketChange: '+3.1%',
        hoursChange: '+12h',
        achievements: [
          {
            title: 'Vendedor del Mes',
            description: 'Mejor performance del equipo',
            date: 'Diciembre 2024'
          }
        ]
      };
    }
  }

  async getUserActivity(userId, filters = {}) {
    try {
      return await this.get(`/users/${userId}/activity`, filters);
    } catch (error) {
      return {
        data: [
          {
            type: 'sale',
            description: 'Venta completada',
            amount: 45600,
            timestamp: Date.now() - 1800000
          },
          {
            type: 'login',
            description: 'Inicio de sesión',
            timestamp: Date.now() - 28800000
          }
        ]
      };
    }
  }

  async getUserSalesHistory(userId, filters = {}) {
    try {
      return await this.get(`/users/${userId}/sales-history`, filters);
    } catch (error) {
      // Generar datos mock para el gráfico
      const days = filters.days || 30;
      const data = [];
      for (let i = days; i >= 0; i--) {
        data.push({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          value: Math.floor(Math.random() * 50000) + 10000,
          transactions: Math.floor(Math.random() * 10) + 1
        });
      }
      return { data };
    }
  }

  // Métodos auxiliares privados

  getAuthHeaders() {
    const token = this.getAuthToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  setAuthToken(token) {
    localStorage.setItem('auth_token', token);
  }

  clearAuthToken() {
    localStorage.removeItem('auth_token');
  }

  async handleErrorResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      return errorData.message || MESSAGES.ERROR.GENERAL;
    }
    
    switch (response.status) {
      case 401:
        this.clearAuthToken();
        return MESSAGES.ERROR.UNAUTHORIZED;
      case 403:
        return MESSAGES.ERROR.UNAUTHORIZED;
      case 404:
        return MESSAGES.ERROR.NOT_FOUND;
      case 422:
        return MESSAGES.ERROR.VALIDATION;
      case 500:
        return MESSAGES.ERROR.GENERAL;
      default:
        return `Error ${response.status}: ${response.statusText}`;
    }
  }

  handleSuccessResponse(data) {
    // Aquí se pueden agregar transformaciones globales a las respuestas exitosas
    return data;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Mock login para desarrollo
  mockLogin(credentials) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockToken = 'mock_jwt_token_' + Date.now();
        this.setAuthToken(mockToken);
        
        resolve({
          success: true,
          token: mockToken,
          user: {
            id: 1,
            nombre: credentials.username || 'Usuario Demo',
            email: `${credentials.username || 'demo'}@posai.com`,
            role: credentials.role || 'cajero'
          }
        });
      }, 1000);
    });
  }

  // Callbacks para eventos de conexión
  onConnectionRestore = null;
  onConnectionLost = null;
}

// Exportar instancia singleton
const apiService = new ApiService();
export default apiService;