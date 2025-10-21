// services/api.js
import { API_CONFIG, MESSAGES } from '../utils/constants';
import { networkStatus, offlineUtils } from '../utils/offline';

/**
 * API Service - Maneja todas las comunicaciones con el backend
 * Incluye manejo de errores, retry logic, y mock data para desarrollo
 */
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.isOnline = networkStatus.isOnline();

    // Subscribe to network status changes
    this.unsubscribeNetworkStatus = networkStatus.addListener((isOnline) => {
      this.isOnline = isOnline;
      if (isOnline) {
        this.onConnectionRestore?.();
      } else {
        this.onConnectionLost?.();
        offlineUtils.showOfflineNotification();
      }
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
      if (import.meta.env.DEV) {
        console.log(`[MOCK API] ${options.method || 'GET'} ${endpoint} - Using mock data directly`);
      }
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
          const errorMessage = await this.handleErrorResponse(response);
          const error = new Error(errorMessage);
          error.statusCode = response.status; // Agregar código de status al error
          throw error;
        }

        const data = await response.json();
        return this.handleSuccessResponse(data);
        
      } catch (error) {
        lastError = error;

        // No reintentar en errores de cliente (4xx) ni abort
        if (error.name === 'AbortError' ||
            error.statusCode === 400 ||
            error.statusCode === 401 ||
            error.statusCode === 403 ||
            error.statusCode === 404 ||
            error.statusCode === 409) { // Conflict (ej: SKU duplicado)
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
      const response = await this.post('/auth/login', {
        email: credentials.username, // Backend espera email
        password: credentials.password
      });

      if (response.token) {
        this.setAuthToken(response.token);
      }

      // Adaptar respuesta del backend al formato esperado por frontend
      return {
        success: true,
        token: response.token,
        user: {
          id: response.user.id,
          nombre: response.user.name, // Backend usa 'name', frontend 'nombre'
          email: response.user.email,
          role: response.user.role.toLowerCase(), // Normalizar rol
          tenantId: response.user.tenantId
        }
      };
    } catch (error) {
      console.error('Backend login failed:', error.message, 'Status:', error.statusCode);

      // Si es error de autenticación o validación (400, 401, 403), NO usar fallback mock
      if (error.statusCode === 400 ||
          error.statusCode === 401 ||
          error.statusCode === 403) {
        throw new Error('Credenciales incorrectas');
      }

      // Si es rate limit (429), informar al usuario
      if (error.statusCode === 429) {
        throw new Error('Demasiados intentos. Espera un momento e intenta nuevamente.');
      }

      // Solo usar mock si backend no está disponible (network error, 500, etc.)
      console.warn('Backend no disponible, usando mock');
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
   * Categorías
   */
  async getCategories(filters = {}) {
    try {
      const response = await this.get('/categories', filters);
      const categories = response.data || response;

      // Si no hay categorías, usar defaults
      if (!Array.isArray(categories) || categories.length === 0) {
        console.warn('No categories found in backend, using defaults');
        return [
          { id: '1', name: 'Bebidas' },
          { id: '2', name: 'Alimentos' },
          { id: '3', name: 'Limpieza' },
          { id: '4', name: 'Electrónica' }
        ];
      }

      return categories;
    } catch (error) {
      console.warn('Backend getCategories failed, using defaults:', error.message);
      return [
        { id: '1', name: 'Bebidas' },
        { id: '2', name: 'Alimentos' },
        { id: '3', name: 'Limpieza' },
        { id: '4', name: 'Electrónica' }
      ];
    }
  }

  /**
   * Productos
   */
  async getProducts(filters = {}) {
    try {
      const response = await this.get('/products', filters);
      const products = response.data || response;

      // Adaptar productos: convertir category object a string
      const adaptedProducts = products.map(product => ({
        ...product,
        code: product.sku, // Mapear backend sku a frontend code
        category: product.category?.name || product.category || 'Sin categoría',
        // Extraer supplier si el backend incluye suppliers relation
        supplier: Array.isArray(product.suppliers) && product.suppliers.length > 0
          ? (product.suppliers[0].supplier?.name || product.suppliers[0].supplier?.nombre || '')
          : (product.supplier?.name || product.supplier || ''),
        // brand ahora es un campo directo en el modelo
        brand: product.brand || ''
      }));

      return {
        data: adaptedProducts,
        total: response.total || products.length
      };
    } catch (error) {
      console.warn('Backend getProducts failed, using mock:', error.message);
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
      // Obtener categorías para mapear nombre → ID
      const categories = await this.getCategories();

      // Verificar que categories sea un array antes de usar .find()
      let category = Array.isArray(categories)
        ? categories.find(c => c.name === productData.category)
        : null;

      // Si no existe la categoría, crearla automáticamente
      if (!category) {
        try {
          const createdCategoryRaw = await this.createCategory({ name: productData.category });
          category = createdCategoryRaw?.data || createdCategoryRaw;
        } catch (err) {
          throw new Error(`No se pudo crear la categoría "${productData.category}". ${err.message}`);
        }
      }

      // Adaptar formato para el backend
      const backendData = {
        name: productData.name,
        sku: productData.code, // El backend usa SKU
        barcode: productData.barcode || productData.code,
        price: parseFloat(productData.price),
        cost: productData.cost ? parseFloat(productData.cost) : parseFloat(productData.price) * 0.6,
        stock: parseInt(productData.stock),
        minStock: productData.reorderPoint ? parseInt(productData.reorderPoint) : 10,
        description: productData.description || '',
        categoryId: category.id
      };

      // Mapear supplier -> id: buscar por nombre y si no existe, crear y usar su id
      const supplierName = (productData.supplier || '').trim();
      if (supplierName) {
        try {
          const suppliersRaw = await this.getSuppliers({ search: supplierName, limit: 100 });
          const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : (suppliersRaw.data || []);
          let supplierObj = suppliers.find(s => (s.name || s.nombre || '').trim() === supplierName) || null;

          if (!supplierObj) {
            const createdRaw = await this.createSupplier({ name: supplierName });
            const created = createdRaw?.data || createdRaw;
            supplierObj = created || null;
          }

          if (supplierObj && supplierObj.id) {
            backendData.supplierId = supplierObj.id;
          }
        } catch (err) {
          // Si falla la búsqueda/creación del supplier, continuar sin él
        }
      }

      // Enviar brand
      if (productData.brand) backendData.brand = productData.brand;

      const result = await this.post('/products', backendData);

      // Adaptar respuesta de vuelta
      // result may be { success, data }
      const created = result?.data || result;
      return {
        ...created,
        category: category?.name || productData.category,
        supplier: productData.supplier || '',
        brand: productData.brand || ''
      };
    } catch (error) {
      console.error('Backend createProduct error:', error);
      throw error; // Propagar el error en lugar de usar mock
    }
  }

  async updateProduct(id, productData) {
    try {
      // Obtener categorías para mapear nombre → ID
      const categories = await this.getCategories();
      let category = Array.isArray(categories)
        ? categories.find(c => c.name === productData.category)
        : null;

      // Si no existe la categoría, crearla automáticamente
      if (!category) {
        try {
          const createdCategoryRaw = await this.createCategory({ name: productData.category });
          category = createdCategoryRaw?.data || createdCategoryRaw;
        } catch (err) {
          throw new Error(`No se pudo crear la categoría "${productData.category}". ${err.message}`);
        }
      }

      // Construir payload con formato backend
      const backendData = {
        name: productData.name,
        sku: productData.code,
        barcode: productData.barcode || productData.code,
        price: parseFloat(productData.price),
        cost: productData.cost ? parseFloat(productData.cost) : parseFloat(productData.price) * 0.6,
        stock: parseInt(productData.stock),
        minStock: productData.reorderPoint ? parseInt(productData.reorderPoint) : 10,
        description: productData.description || '',
        categoryId: category.id
      };

      // Mapear supplier -> supplierId
      const supplierName = (productData.supplier || '').trim();
      if (supplierName) {
        try {
          const suppliersRaw = await this.getSuppliers({ search: supplierName, limit: 100 });
          const suppliers = Array.isArray(suppliersRaw) ? suppliersRaw : (suppliersRaw.data || []);
          let supplierObj = suppliers.find(s => (s.name || s.nombre || '').trim() === supplierName) || null;

          if (!supplierObj) {
            const createdRaw = await this.createSupplier({ name: supplierName });
            const created = createdRaw?.data || createdRaw;
            supplierObj = created || null;
          }

          if (supplierObj && supplierObj.id) {
            backendData.supplierId = supplierObj.id;
          }
        } catch (err) {
          // Si falla la búsqueda/creación del supplier, continuar sin él
        }
      } else {
        // Si el campo está vacío, enviar null para eliminar el proveedor
        backendData.supplierId = null;
      }

      // Enviar brand
      if (productData.brand) backendData.brand = productData.brand;

      console.log('[DEBUG] backendData a enviar:', backendData);
      return await this.put(`/products/${id}`, backendData);
    } catch (error) {
      console.error('Backend updateProduct error:', error);
      throw error;
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
      // Adaptar datos del frontend al formato del backend
      const backendSaleData = {
        customerId: saleData.customerId || null,
        items: saleData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        subtotal: saleData.subtotal,
        tax: saleData.tax || 0,
        discount: saleData.discount || 0,
        total: saleData.total,
        paymentMethod: this.mapPaymentMethod(saleData.paymentMethod),
        paymentStatus: 'PAID',
        cashAmount: saleData.cashAmount || null,
        changeAmount: saleData.changeAmount || null
      };

      const response = await this.post('/sales', backendSaleData);
      return response;
    } catch (error) {
      console.warn('Backend createSale failed, using mock:', error.message);
      return {
        id: Date.now(),
        ...saleData,
        status: 'completed',
        createdAt: Date.now()
      };
    }
  }

  // Helper para mapear métodos de pago del frontend al backend
  mapPaymentMethod(method) {
    const methodMap = {
      'efectivo': 'CASH',
      'tarjeta_credito': 'CREDIT_CARD',
      'tarjeta_debito': 'DEBIT_CARD',
      'transferencia': 'TRANSFER'
    };
    return methodMap[method] || 'CASH';
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
  async getDashboardData(period = 'month') {
    try {
      return await this.get('/reports/dashboard', { period });
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

  async getSalesReport(period = 'month', startDate = null, endDate = null) {
    try {
      const params = { period };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      return await this.get('/reports/sales', params);
    } catch (error) {
      console.warn('Backend getSalesReport failed, using mock:', error.message);
      return {
        summary: {
          totalSales: 0,
          totalTransactions: 0,
          averageTicket: 0,
          totalItems: 0,
          period
        }
      };
    }
  }

  async getProductsReport(period = 'month') {
    try {
      return await this.get('/reports/products', { period });
    } catch (error) {
      console.warn('Backend getProductsReport failed, using mock:', error.message);
      const { generateCategoryData } = await import('./mockData');
      return {
        topProducts: [],
        period
      };
    }
  }

  async getCustomersReport() {
    try {
      return await this.get('/reports/customers');
    } catch (error) {
      console.warn('Backend getCustomersReport failed, using mock:', error.message);
      return {
        summary: {
          totalCustomers: 0,
          activeCustomers: 0,
          inactiveCustomers: 0
        }
      };
    }
  }

  async getInventoryReport() {
    try {
      const response = await this.get('/reports/inventory');
      // Extraer los datos si la respuesta tiene estructura { success, data }
      return response.data || response;
    } catch (error) {
      console.warn('Backend getInventoryReport failed, using mock:', error.message);
      // Generar mock data realista con productos activos
      const mockProducts = [
        { id: 1, name: 'Neumático Michelin 185/65R15', sku: 'NEU-MICH-001', stock: 25, minStock: 5 },
        { id: 2, name: 'Batería BOSCH S4 12V 60Ah', sku: 'BAT-BOSCH-001', stock: 8, minStock: 3 },
        { id: 3, name: 'Aceite Castrol Edge 5W30', sku: 'ACE-CAST-001', stock: 45, minStock: 10 },
        { id: 4, name: 'Filtro de Aire K&N', sku: 'FIL-AIR-001', stock: 2, minStock: 10 },
        { id: 5, name: 'Cadena 520 DID', sku: 'CAD-520-001', stock: 5, minStock: 8 },
        { id: 6, name: 'Pastillas de Freno Brembo', sku: 'PAS-BREM-001', stock: 18, minStock: 5 },
        { id: 7, name: 'Correas de Transmisión', sku: 'COR-TRANS-001', stock: 12, minStock: 4 },
        { id: 8, name: 'Amortiguadores Monroe', sku: 'AMO-MUNR-001', stock: 6, minStock: 3 },
        { id: 9, name: 'Bujías NGK Iridium', sku: 'BUJ-NGK-001', stock: 35, minStock: 8 },
        { id: 10, name: 'Sensores Bosch', sku: 'SEN-BOSCH-001', stock: 9, minStock: 4 }
      ];

      const lowStockItems = mockProducts.filter(p => p.stock <= p.minStock);

      return {
        summary: {
          totalProducts: mockProducts.length,
          lowStockCount: lowStockItems.length
        },
        lowStockItems: lowStockItems
      };
    }
  }

  async getFinancialReport(period = 'month') {
    try {
      return await this.get('/reports/financial', { period });
    } catch (error) {
      return {
        type: 'financial',
        data: [],
        generatedAt: Date.now(),
        period
      };
    }
  }

  async getSalesAnalytics(period = 'month') {
    try {
      return await this.get('/reports/sales-analytics', { period });
    } catch (error) {
      return {
        type: 'sales-analytics',
        data: [],
        generatedAt: Date.now(),
        period
      };
    }
  }

  /**
   * Configuración del Sistema
   */
  async getSystemConfiguration() {
    try {
      return await this.get('/settings');
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
      return await this.put('/settings', config);
    } catch (error) {
      // Simular guardado local
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }
  }

  async getStoreSettings() {
    try {
      return await this.get('/settings/store');
    } catch (error) {
      return {
        name: 'POS AI Restaurant',
        address: 'Av. Reforma 123, Col. Centro, CDMX',
        phone: '+52 55 1234 5678',
        email: 'contacto@pos-ai.com'
      };
    }
  }

  async updateStoreSettings(settings) {
    try {
      return await this.put('/settings/store', settings);
    } catch (error) {
      return { success: true };
    }
  }

  /**
   * Gestión de Clientes
   */
  async getCustomers(filters = {}) {
    try {
      return await this.get('/customers', filters);
    } catch (error) {
      return { data: [], total: 0 };
    }
  }

  async getCustomer(id) {
    try {
      return await this.get(`/customers/${id}`);
    } catch (error) {
      return null;
    }
  }

  async createCustomer(customerData) {
    try {
      return await this.post('/customers', customerData);
    } catch (error) {
      return {
        id: Date.now(),
        ...customerData,
        createdAt: Date.now()
      };
    }
  }

  async updateCustomer(id, customerData) {
    try {
      return await this.put(`/customers/${id}`, customerData);
    } catch (error) {
      return { id, ...customerData, updatedAt: Date.now() };
    }
  }

  async deleteCustomer(id) {
    try {
      return await this.delete(`/customers/${id}`);
    } catch (error) {
      return { success: true };
    }
  }

  /**
   * Gestión de Categorías
   */
  // ...categories management handled by single getCategories implementation above

  async createCategory(categoryData) {
    try {
      return await this.post('/categories', categoryData);
    } catch (error) {
      return {
        id: Date.now(),
        ...categoryData,
        createdAt: Date.now()
      };
    }
  }

  /**
   * Gestión de Proveedores
   */
  async getSuppliers(filters = {}) {
    try {
      return await this.get('/suppliers', filters);
    } catch (error) {
      return { data: [], total: 0 };
    }
  }

  async createSupplier(supplierData) {
    try {
      return await this.post('/suppliers', supplierData);
    } catch (error) {
      return {
        id: Date.now(),
        ...supplierData,
        createdAt: Date.now()
      };
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
   * Gestión de Usuarios
   */
  async getUsers(filters = {}) {
    try {
      return await this.get('/users', filters);
    } catch (error) {
      return { data: [], total: 0 };
    }
  }

  async getUser(id) {
    try {
      return await this.get(`/users/${id}`);
    } catch (error) {
      return null;
    }
  }

  async createUser(userData) {
    try {
      return await this.post('/users', userData);
    } catch (error) {
      return {
        id: Date.now(),
        ...userData,
        createdAt: Date.now()
      };
    }
  }

  async updateUser(id, userData) {
    try {
      return await this.put(`/users/${id}`, userData);
    } catch (error) {
      return { id, ...userData, updatedAt: Date.now() };
    }
  }

  async deleteUser(id) {
    try {
      return await this.delete(`/users/${id}`);
    } catch (error) {
      return { success: true };
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

  async getUserPreferences(userId) {
    try {
      const response = await this.get(`/users/${userId}/preferences`);
      return response.data || response;
    } catch (error) {
      // Retornar preferencias por defecto en caso de error
      return {
        theme: 'light',
        notifications: true,
        emailAlerts: true,
        soundEnabled: true,
        language: 'es',
        timezone: 'America/Argentina/Buenos_Aires'
      };
    }
  }

  async updateUserPreferences(userId, preferences) {
    try {
      const response = await this.post(`/users/${userId}/preferences`, preferences);
      return response.data || response;
    } catch (error) {
      // En caso de error, guardar localmente y retornar los mismos datos
      localStorage.setItem(`userPreferences_${userId}`, JSON.stringify(preferences));
      return preferences;
    }
  }

  // ================================
  // SETTINGS / CONFIGURACIÓN
  // ================================

  async getAllSettings() {
    try {
      const response = await this.get('/settings');
      return response.data || response;
    } catch (error) {
      // Retornar configuración por defecto si falla
      return {
        aiConfig: {
          enabled: true,
          alertLevel: 'medium',
          autolearn: true,
          predictionAccuracy: 85,
          dataRetention: 90
        },
        systemConfig: {
          backup: { enabled: true, frequency: 'daily', retention: 30 },
          security: { sessionTimeout: 60, maxLoginAttempts: 3 }
        }
      };
    }
  }

  async getSetting(key) {
    try {
      const response = await this.get(`/settings/${key}`);
      return response.data?.value || response;
    } catch (error) {
      return null;
    }
  }

  async updateSetting(key, value, type = 'JSON') {
    try {
      const response = await this.put(`/settings/${key}`, {
        value: typeof value === 'string' ? value : JSON.stringify(value)
      });
      return response.data || response;
    } catch (error) {
      // Guardar localmente como fallback
      localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      return { key, value };
    }
  }

  async saveMultipleSettings(settings) {
    try {
      // Guardar múltiples settings en paralelo
      const responses = await Promise.all(
        Object.entries(settings).map(([key, value]) =>
          this.updateSetting(key, value)
        )
      );
      return responses;
    } catch (error) {
      // Guardar todo localmente como fallback
      Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem(`setting_${key}`, JSON.stringify(value));
      });
      return settings;
    }
  }

  async getSystemStatus() {
    try {
      // Este endpoint podría existir o usamos mock data
      const response = await this.get('/system/status');
      return response.data || response;
    } catch (error) {
      // Retornar datos mock para system stats
      return {
        uptime: '15 días, 8 horas',
        cpuUsage: Math.floor(Math.random() * 40) + 10,
        memoryUsage: Math.floor(Math.random() * 50) + 30,
        diskUsage: Math.floor(Math.random() * 60) + 20,
        activeUsers: Math.floor(Math.random() * 50) + 5,
        totalRequests: Math.floor(Math.random() * 500000) + 100000,
        errorRate: (Math.random() * 2).toFixed(2),
        responseTime: Math.floor(Math.random() * 300) + 100
      };
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