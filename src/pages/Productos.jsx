import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Star,
  Zap,
  RefreshCw,
  Settings,
  Grid,
  List,
  SortAsc,
  SortDesc,
  MoreVertical,
  Copy,
  Archive,
  DollarSign
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  Select,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Checkbox,
  Label,
  Textarea
} from '../components/ui';
import { PieChart, BarChart } from '../components/charts/ChartsSimple';
import { useAuth, useToast, useDebounce } from '../hooks';
import { apiService, getAiEngine } from '../services';
import { formatPrice, formatDateTime, formatPercentage } from '../utils/formatters';
import { PRODUCT_CATEGORIES, DEMAND_TRENDS } from '../utils/constants';

const Productos = () => {
  const { user, hasPermission, isAdmin, isSupervisor } = useAuth();
  const { success, error, warning, ai } = useToast();

  // Estados principales
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Opciones para los Select
  const categoryOptions = [
    { value: 'all', label: 'Todas las categorías' },
    { value: 'Neumáticos', label: 'Neumáticos' },
    { value: 'Accesorios', label: 'Accesorios' },
    { value: 'Transmisión', label: 'Transmisión' },
    { value: 'Filtros', label: 'Filtros' },
    { value: 'Frenos', label: 'Frenos' },
    { value: 'Motor', label: 'Motor' },
    { value: 'Carrocería', label: 'Carrocería' },
    { value: 'Electricidad', label: 'Electricidad' }
  ];

  const supplierOptions = [
    { value: 'all', label: 'Todos los proveedores' },
    { value: 'Acme Parts', label: 'Acme Parts' },
    { value: 'Neuma S.A.', label: 'Neuma S.A.' },
    { value: 'Moto Parts', label: 'Moto Parts' },
    { value: 'Filter Pro', label: 'Filter Pro' },
    { value: 'Brake Systems', label: 'Brake Systems' }
  ];

  const brandOptions = [
    { value: 'all', label: 'Todas las marcas' },
    { value: 'MotoMax', label: 'MotoMax' },
    { value: 'TireMax', label: 'TireMax' },
    { value: 'ChainMax', label: 'ChainMax' },
    { value: 'K&N', label: 'K&N' },
    { value: 'BrakeMax', label: 'BrakeMax' }
  ];

  const stockFilterOptions = [
    { value: 'all', label: 'Todo el stock' },
    { value: 'available', label: 'En stock (>0)' },
    { value: 'low', label: 'Stock bajo' },
    { value: 'out', label: 'Sin stock (0)' },
    { value: 'overstocked', label: 'Exceso de stock' }
  ];

  const sortOptions = [
    { value: 'name-asc', label: 'Nombre A-Z' },
    { value: 'name-desc', label: 'Nombre Z-A' },
    { value: 'price-asc', label: 'Precio menor a mayor' },
    { value: 'price-desc', label: 'Precio mayor a menor' },
    { value: 'stock-asc', label: 'Stock menor a mayor' },
    { value: 'stock-desc', label: 'Stock mayor a menor' },
    { value: 'created-desc', label: 'Más recientes' },
    { value: 'created-asc', label: 'Más antiguos' }
  ];

  // Función para manejar cambio de ordenamiento
  const handleSortChange = (sortValue) => {
    const [field, order] = sortValue.split('-');
    setSortBy(field);
    setSortOrder(order);
  };

  // Función para limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSupplier('all');
    setSelectedBrand('all');
    setStockFilter('all');
    setPriceRange({ min: '', max: '' });
  };

  // Función para obtener el conteo de filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedSupplier !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    if (stockFilter !== 'all') count++;
    if (priceRange.min !== '' || priceRange.max !== '') count++;
    return count;
  };
  
  // Estados para modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [bulkOperation, setBulkOperation] = useState(null);
  const [bulkOperationData, setBulkOperationData] = useState({});
  
  // Estados para analytics
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiOptimizations, setAiOptimizations] = useState([]);
  const [demandForecast, setDemandForecast] = useState([]);
  const [pricingInsights, setPricingInsights] = useState([]);

  // Form data para producto
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    stock: '',
    reorderPoint: '',
    description: '',
    supplier: '',
    brand: ''
  });

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Cargar productos
  useEffect(() => {
    loadProducts();
    loadAnalytics();
  }, []);

  // Filtrar y buscar productos
  useEffect(() => {
    loadProducts();
  }, [debouncedSearch, selectedCategory, selectedSupplier, selectedBrand, stockFilter, priceRange, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({
        search: debouncedSearch,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        supplier: selectedSupplier !== 'all' ? selectedSupplier : undefined,
        brand: selectedBrand !== 'all' ? selectedBrand : undefined,
        sortBy,
        sortOrder,
        limit: 100
      });
      
      // Aplicar filtros locales si la API no los maneja
      let filteredProducts = response.data || [];
      
      // Filtrar por búsqueda
      if (debouncedSearch) {
        filteredProducts = filteredProducts.filter(product =>
          product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          product.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (product.supplier && product.supplier.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
          (product.brand && product.brand.toLowerCase().includes(debouncedSearch.toLowerCase()))
        );
      }
      
      // Filtrar por categoría
      if (selectedCategory && selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.category === selectedCategory
        );
      }
      
      // Filtrar por proveedor
      if (selectedSupplier && selectedSupplier !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.supplier === selectedSupplier
        );
      }
      
      // Filtrar por marca
      if (selectedBrand && selectedBrand !== 'all') {
        filteredProducts = filteredProducts.filter(product => 
          product.brand === selectedBrand
        );
      }
      
      // Filtrar por stock
      if (stockFilter && stockFilter !== 'all') {
        filteredProducts = filteredProducts.filter(product => {
          switch (stockFilter) {
            case 'available':
              return product.stock > 0;
            case 'low':
              return product.stock <= (product.reorderPoint || 10);
            case 'out':
              return product.stock === 0;
            case 'overstocked':
              return product.stock > (product.reorderPoint || 10) * 3;
            default:
              return true;
          }
        });
      }
      
      // Filtrar por rango de precios
      if (priceRange.min !== '' || priceRange.max !== '') {
        filteredProducts = filteredProducts.filter(product => {
          const price = product.price;
          const min = priceRange.min === '' ? 0 : parseFloat(priceRange.min);
          const max = priceRange.max === '' ? Infinity : parseFloat(priceRange.max);
          return price >= min && price <= max;
        });
      }
      
      setProducts(filteredProducts);
    } catch (err) {
      error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      // Generar analytics de productos
      const analytics = {
        totalProducts: 0,
        totalValue: 0,
        lowStockItems: 0,
        topPerformers: []
      };

      // Cargar datos AI en paralelo
      const [
        recommendations,
        optimizations,
        forecast,
        insights
      ] = await Promise.all([
        aiEngine.getBusinessInsights(),
        aiEngine.getInventoryOptimizations(),
        aiEngine.getDemandForecast(),
        aiEngine.getPricingInsights()
      ]);
      
      setAiRecommendations(recommendations.filter(r => r.type === 'ai'));
      setAiOptimizations(optimizations || []);
      setDemandForecast(forecast || []);
      setPricingInsights(insights || []);

      // Analytics por categoría
      const categoryData = Object.values(PRODUCT_CATEGORIES).map(category => ({
        name: category,
        value: Math.floor(Math.random() * 50) + 10,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));
      setCategoryAnalytics(categoryData);

    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Filtros y ordenamiento
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Aplicar filtros adicionales
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [products, selectedCategory, sortBy, sortOrder]);

  // Handlers para CRUD
  const handleCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      code: '',
      category: '',
      price: '',
      stock: '',
      reorderPoint: '',
      description: '',
      supplier: '',
      brand: ''
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name || '',
      code: product.code || '',
      category: product.category || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      reorderPoint: product.reorderPoint?.toString() || '',
      description: product.description || '',
      supplier: product.supplier || '',
      brand: product.brand || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        stock: parseInt(productForm.stock) || 0,
        reorderPoint: parseInt(productForm.reorderPoint) || 0
      };

      if (editingProduct) {
        await apiService.updateProduct(editingProduct.id, productData);
        success('Producto actualizado exitosamente');
      } else {
        await apiService.createProduct(productData);
        success('Producto creado exitosamente');
      }

      setShowProductModal(false);
      loadProducts();
    } catch (err) {
      error('Error al guardar producto');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Está seguro que desea eliminar este producto?')) return;

    try {
      await apiService.deleteProduct(productId);
      success('Producto eliminado exitosamente');
      loadProducts();
    } catch (err) {
      error('Error al eliminar producto');
    }
  };

  // Bulk operations - Iniciar una operación
  const initBulkOperation = (operation) => {
    if (selectedProducts.length === 0) {
      warning('Seleccione productos para la operación masiva');
      return;
    }
    setBulkOperation(operation);
    setBulkOperationData({});
  };

  // Ejecutar operación masiva
  const executeBulkOperation = async () => {
    if (!bulkOperation || selectedProducts.length === 0) return;

    try {
      const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
      let confirmMessage = '';
      let updatedProducts = [];

      switch (bulkOperation) {
        case 'updatePrice':
          const { priceMode, priceValue, roundingMode } = bulkOperationData;
          if (!priceValue || isNaN(priceValue)) {
            error('Por favor ingrese un valor válido');
            return;
          }
          
          updatedProducts = selectedProductsData.map(product => {
            let newPrice = product.price;
            
            if (priceMode === 'percentage') {
              newPrice = product.price * (1 + parseFloat(priceValue) / 100);
            } else if (priceMode === 'fixed') {
              newPrice = parseFloat(priceValue);
            } else if (priceMode === 'increase') {
              newPrice = product.price + parseFloat(priceValue);
            } else if (priceMode === 'decrease') {
              newPrice = Math.max(0, product.price - parseFloat(priceValue));
            }
            
            // Aplicar redondeo
            switch (roundingMode) {
              case 'round':
                newPrice = Math.round(newPrice);
                break;
              case 'ceil':
                newPrice = Math.ceil(newPrice);
                break;
              case 'floor':
                newPrice = Math.floor(newPrice);
                break;
              case 'round_to_5':
                newPrice = Math.round(newPrice / 5) * 5;
                break;
              case 'round_to_10':
                newPrice = Math.round(newPrice / 10) * 10;
                break;
              case 'round_to_50':
                newPrice = Math.round(newPrice / 50) * 50;
                break;
              case 'round_to_100':
                newPrice = Math.round(newPrice / 100) * 100;
                break;
              case 'ending_9':
                newPrice = Math.ceil(newPrice) - 0.01;
                break;
              case 'ending_99':
                newPrice = Math.ceil(newPrice / 10) * 10 - 0.01;
                break;
              default:
                // 'none' - mantener decimales
                newPrice = Math.round(newPrice * 100) / 100; // Solo redondear a 2 decimales
                break;
            }
            
            return { ...product, price: Math.max(0, newPrice) };
          });
          
          confirmMessage = `¿Aplicar cambio de precios a ${selectedProducts.length} productos?`;
          break;

        case 'updateStock':
          const { stockMode, stockValue } = bulkOperationData;
          if (!stockValue || isNaN(stockValue)) {
            error('Por favor ingrese un valor válido');
            return;
          }
          
          updatedProducts = selectedProductsData.map(product => {
            let newStock = product.stock;
            if (stockMode === 'add') {
              newStock = product.stock + parseInt(stockValue);
            } else if (stockMode === 'subtract') {
              newStock = Math.max(0, product.stock - parseInt(stockValue));
            } else if (stockMode === 'set') {
              newStock = parseInt(stockValue);
            }
            return { ...product, stock: newStock };
          });
          
          confirmMessage = `¿Aplicar cambio de stock a ${selectedProducts.length} productos?`;
          break;

        case 'changeCategory':
          const { newCategory } = bulkOperationData;
          if (!newCategory) {
            error('Por favor seleccione una categoría');
            return;
          }
          
          updatedProducts = selectedProductsData.map(product => ({
            ...product,
            category: newCategory
          }));
          
          confirmMessage = `¿Cambiar categoría a "${newCategory}" para ${selectedProducts.length} productos?`;
          break;

        case 'updateReorderPoint':
          const { reorderMode, reorderValue } = bulkOperationData;
          if (!reorderValue || isNaN(reorderValue)) {
            error('Por favor ingrese un valor válido');
            return;
          }
          
          updatedProducts = selectedProductsData.map(product => {
            let newReorderPoint = product.reorderPoint || 0;
            if (reorderMode === 'set') {
              newReorderPoint = parseInt(reorderValue);
            } else if (reorderMode === 'percentage') {
              newReorderPoint = Math.round(product.stock * (parseInt(reorderValue) / 100));
            }
            return { ...product, reorderPoint: newReorderPoint };
          });
          
          confirmMessage = `¿Actualizar punto de reorden para ${selectedProducts.length} productos?`;
          break;

        case 'export':
          const dataStr = JSON.stringify(selectedProductsData, null, 2);
          const dataBlob = new Blob([dataStr], { type: 'application/json' });
          const url = URL.createObjectURL(dataBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `productos_exportados_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          success(`${selectedProducts.length} productos exportados`);
          closeBulkModal();
          return;

        case 'duplicate':
          const duplicatedProducts = selectedProductsData.map(product => ({
            ...product,
            id: Date.now() + Math.random(),
            name: `${product.name} (Copia)`,
            code: `${product.code}-COPY`,
            stock: 0
          }));
          
          setProducts(prevProducts => [...prevProducts, ...duplicatedProducts]);
          success(`${selectedProducts.length} productos duplicados`);
          closeBulkModal();
          return;

        case 'archive':
          confirmMessage = `¿Archivar ${selectedProducts.length} productos seleccionados?`;
          // Simular archivado removiendo de la lista
          setProducts(prevProducts => 
            prevProducts.filter(product => !selectedProducts.includes(product.id))
          );
          break;

        default:
          error('Operación no implementada');
          return;
      }

      if (confirmMessage && !window.confirm(confirmMessage)) {
        return;
      }

      // Aplicar cambios localmente para las operaciones que los necesiten
      if (['updatePrice', 'updateStock', 'changeCategory', 'updateReorderPoint'].includes(bulkOperation)) {
        setProducts(prevProducts => 
          prevProducts.map(product => {
            const updatedProduct = updatedProducts.find(up => up.id === product.id);
            return updatedProduct || product;
          })
        );
      }

      // Simular llamada a API
      await apiService.bulkUpdateProducts(selectedProducts.map(id => ({
        id,
        operation: bulkOperation,
        data: bulkOperationData
      })));

      success(`Operación masiva aplicada a ${selectedProducts.length} productos`);
      closeBulkModal();
      
    } catch (err) {
      error('Error en operación masiva: ' + err.message);
    }
  };

  // Cerrar modal de operaciones masivas
  const closeBulkModal = () => {
    setShowBulkModal(false);
    setBulkOperation(null);
    setBulkOperationData({});
    setSelectedProducts([]);
  };

  // Analytics helpers
  const getStockStatus = (stock, reorderPoint) => {
    if (stock === 0) {
      return { status: 'out', color: 'bg-red-100 text-red-800', label: 'Sin Stock' };
    } else if (stock <= reorderPoint) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', label: 'Stock Bajo' };
    } else {
      return { status: 'normal', color: 'bg-green-100 text-green-800', label: 'Disponible' };
    }
  };

  const getDemandTrendIcon = (trend) => {
    switch (trend) {
      case DEMAND_TRENDS.UP:
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case DEMAND_TRENDS.DOWN:
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  // Product analytics para modal
  const generateProductAnalytics = async (product) => {
    try {
      const [prediction, optimization] = await Promise.all([
        aiEngine.predictDemand(product.id, 30),
        aiEngine.optimizePrice(product.id)
      ]);

      setProductAnalytics({
        product,
        prediction,
        optimization,
        generatedAt: Date.now()
      });
      setShowAnalyticsModal(true);
    } catch (err) {
      error('Error al generar analytics');
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Gestión de Productos</h1>
          <div className="flex items-center gap-3">
            <p className="text-gray-600">
              {filteredAndSortedProducts.length} productos encontrados
            </p>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Con IA integrada
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('manage_products') && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowBulkModal(true)}
                className="h-12 px-6 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Operaciones Masivas
              </Button>
              <Button 
                onClick={handleCreateProduct} 
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Producto
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="space-y-4">
        {/* Barra principal de búsqueda */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Búsqueda principal */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Buscar por nombre, código, marca o proveedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-base bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>

              {/* Controles principales */}
              <div className="flex items-center gap-3">
                {/* Botón de filtros avanzados */}
                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="h-12 px-4 relative"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtros
                  {getActiveFiltersCount() > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 bg-blue-600 text-white min-w-[20px] h-5 text-xs"
                    >
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>

                {/* Ordenamiento */}
                <div className="relative">
                  <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
                  <Select 
                    value={`${sortBy}-${sortOrder}`} 
                    onChange={handleSortChange}
                    options={sortOptions}
                    placeholder="Ordenar por"
                    className="w-56 h-12 pl-10 bg-white border-gray-200 shadow-sm"
                  />
                </div>

                {/* Toggle vista */}
                <div className="flex items-center border rounded-lg bg-gray-50">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-10"
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-10"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                <Button variant="outline" size="icon" onClick={() => loadProducts()} className="h-12 w-12">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filtros avanzados */}
        {showAdvancedFilters && (
          <Card className="shadow-sm border-blue-200 bg-blue-50/30">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    Filtros Avanzados
                  </h3>
                  
                  {getActiveFiltersCount() > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Limpiar filtros
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* Categoría */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Categoría</Label>
                    <Select 
                      value={selectedCategory} 
                      onChange={setSelectedCategory}
                      options={categoryOptions}
                      placeholder="Todas las categorías"
                      className="w-full"
                    />
                  </div>

                  {/* Proveedor */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Proveedor</Label>
                    <Select 
                      value={selectedSupplier} 
                      onChange={setSelectedSupplier}
                      options={supplierOptions}
                      placeholder="Todos los proveedores"
                      className="w-full"
                    />
                  </div>

                  {/* Marca */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Marca</Label>
                    <Select 
                      value={selectedBrand} 
                      onChange={setSelectedBrand}
                      options={brandOptions}
                      placeholder="Todas las marcas"
                      className="w-full"
                    />
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Estado de Stock</Label>
                    <Select 
                      value={stockFilter} 
                      onChange={setStockFilter}
                      options={stockFilterOptions}
                      placeholder="Todo el stock"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Rango de precios */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Rango de Precios</Label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Precio mínimo"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                        className="w-full"
                      />
                    </div>
                    <span className="text-gray-500 text-sm">hasta</span>
                    <div className="flex-1">
                      <Input
                        type="number"
                        placeholder="Precio máximo"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Resumen de filtros activos */}
                {getActiveFiltersCount() > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-blue-200">
                    {searchTerm && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Búsqueda: "{searchTerm}"
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedCategory !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Categoría: {categoryOptions.find(c => c.value === selectedCategory)?.label}
                        <button 
                          onClick={() => setSelectedCategory('all')}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedSupplier !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Proveedor: {supplierOptions.find(s => s.value === selectedSupplier)?.label}
                        <button 
                          onClick={() => setSelectedSupplier('all')}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {selectedBrand !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Marca: {brandOptions.find(b => b.value === selectedBrand)?.label}
                        <button 
                          onClick={() => setSelectedBrand('all')}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {stockFilter !== 'all' && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Stock: {stockFilterOptions.find(s => s.value === stockFilter)?.label}
                        <button 
                          onClick={() => setStockFilter('all')}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {(priceRange.min !== '' || priceRange.max !== '') && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                        Precio: ${priceRange.min || '0'} - ${priceRange.max || '∞'}
                        <button 
                          onClick={() => setPriceRange({min: '', max: ''})}
                          className="ml-2 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selección masiva */}
        {selectedProducts.length > 0 && (
          <Card className="shadow-sm border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-blue-900">
                    {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''} seleccionado{selectedProducts.length > 1 ? 's' : ''}
                  </span>
                  <Badge className="bg-blue-600 text-white">
                    ${products.filter(p => selectedProducts.includes(p.id)).reduce((sum, p) => sum + (p.price * p.stock), 0).toLocaleString()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSelectedProducts([])} 
                    className="text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    Cancelar selección
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => setShowBulkModal(true)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Acciones masivas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* AI Recommendations Banner */}
      {aiRecommendations.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 mb-1">
                  Recomendaciones de IA para Inventario
                </h3>
                <div className="space-y-2">
                  {aiRecommendations.slice(0, 2).map((rec, index) => (
                    <p key={index} className="text-sm text-emerald-700">
                      • {rec.message}
                    </p>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200">
                Ver Todas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Optimizaciones y Pronósticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Optimizaciones de IA */}
        {aiOptimizations.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Optimizaciones Sugeridas
                <Badge variant="ai" size="sm">{aiOptimizations.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {aiOptimizations.slice(0, 3).map((opt, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{opt.product}</h4>
                      <p className="text-xs text-gray-600 mt-1">{opt.suggestion}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" size="sm">{opt.impact}</Badge>
                        <span className="text-xs text-green-600 font-medium">+{opt.potentialSavings}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pronóstico de Demanda */}
        {demandForecast.length > 0 && (
          <Card className="border-purple-200 bg-purple-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                Pronóstico de Demanda
                <Badge variant="ai" size="sm">30 días</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {demandForecast.slice(0, 4).map((forecast, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{forecast.product}</p>
                        <p className="text-xs text-gray-600">{forecast.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-purple-600">{forecast.predictedDemand} un.</p>
                      <p className="text-xs text-gray-500">{forecast.confidence}% confianza</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Grid/List de productos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.reorderPoint);
            const isSelected = selectedProducts.includes(product.id);
            
            return (
              <Card key={product.id} className={`group hover:shadow-lg transition-all duration-200 ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200' : 'hover:border-gray-300'
              }`}>
                <CardContent className="p-4">
                  
                  {/* Header del producto */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                      />
                      {product.aiScore > 0.8 && (
                        <Badge variant="ai" size="sm">
                          <Star className="w-3 h-3 mr-1" />
                          Top
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => generateProductAnalytics(product)}>
                        <BarChart3 className="w-4 h-4" />
                      </Button>
                      {hasPermission('manage_products') && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Info del producto */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500">{product.code}</p>
                    <Badge variant="secondary" size="sm" className="mt-1">
                      {product.category}
                    </Badge>
                  </div>

                  {/* Precio y stock */}
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      {product.suggestedPrice && product.suggestedPrice !== product.price && (
                        <div className="text-right">
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatPrice(product.suggestedPrice)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Stock: {product.stock}</span>
                      <Badge size="sm" className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Métricas AI */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {getDemandTrendIcon(product.demandTrend)}
                      <span className="text-gray-600">
                        {product.demandTrend === DEMAND_TRENDS.UP ? 'Alta demanda' : 
                         product.demandTrend === DEMAND_TRENDS.DOWN ? 'Baja demanda' : 'Estable'}
                      </span>
                    </div>
                    
                    {product.fastMoving && (
                      <Badge variant="success" size="sm">Rápido</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Vista de Lista */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedProducts.length === filteredAndSortedProducts.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProducts(filteredAndSortedProducts.map(p => p.id));
                          } else {
                            setSelectedProducts([]);
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Producto</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Categoría</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Precio</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Stock</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Tendencia</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">AI Score</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedProducts.map((product) => {
                    const stockStatus = getStockStatus(product.stock, product.reorderPoint);
                    const isSelected = selectedProducts.includes(product.id);
                    
                    return (
                      <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : ''}`}>
                        <td className="px-4 py-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedProducts([...selectedProducts, product.id]);
                              } else {
                                setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                              }
                            }}
                          />
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{product.code}</p>
                            </div>
                            {product.aiScore > 0.8 && (
                              <Badge variant="ai" size="sm">
                                <Star className="w-3 h-3 mr-1" />
                                Top
                              </Badge>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <Badge variant="secondary" size="sm">
                            {product.category}
                          </Badge>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatPrice(product.price)}
                            </p>
                            {product.suggestedPrice && product.suggestedPrice !== product.price && (
                              <p className="text-xs text-emerald-600 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {formatPrice(product.suggestedPrice)}
                              </p>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{product.stock}</span>
                            <Badge size="sm" className={stockStatus.color}>
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {getDemandTrendIcon(product.demandTrend)}
                            <span className="text-sm">
                              {product.demandTrend === DEMAND_TRENDS.UP ? 'Alta' : 
                               product.demandTrend === DEMAND_TRENDS.DOWN ? 'Baja' : 'Estable'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(product.aiScore || 0) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {((product.aiScore || 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => generateProductAnalytics(product)}>
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                            {hasPermission('manage_products') && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics por categoría */}
      {categoryAnalytics.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Distribución por Categoría
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PieChart
                data={categoryAnalytics}
                height={300}
                aiAnalysis={true}
                showPercentages={true}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Top Categorías por Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={categoryAnalytics}
                height={300}
                aiRanking={true}
                colorScheme="performance"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Producto */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {editingProduct ? 'Actualizar información del producto' : 'Agregar un nuevo producto al inventario'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Información básica */}
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Información Básica
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                      Nombre del Producto *
                    </Label>
                    <Input
                      id="name"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      placeholder="Ej: Cubierta 80/100-21"
                      className="mt-1 h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="code" className="text-sm font-medium text-gray-700">
                      Código del Producto *
                    </Label>
                    <Input
                      id="code"
                      value={productForm.code}
                      onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                      placeholder="Ej: XR-250-01"
                      className="mt-1 h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                      Categoría *
                    </Label>
                    <div className="mt-1">
                      <Select 
                        value={productForm.category} 
                        onChange={(value) => setProductForm({...productForm, category: value})}
                        options={categoryOptions.filter(opt => opt.value !== 'all')}
                        placeholder="Seleccionar categoría"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700">
                      Precio de Venta *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      placeholder="0.00"
                      className="mt-1 h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Inventario */}
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Control de Inventario
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700">
                      Stock Inicial *
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                      placeholder="0"
                      className="mt-1 h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="reorderPoint" className="text-sm font-medium text-gray-700">
                      Punto de Reorden
                    </Label>
                    <Input
                      id="reorderPoint"
                      type="number"
                      min="0"
                      value={productForm.reorderPoint}
                      onChange={(e) => setProductForm({...productForm, reorderPoint: e.target.value})}
                      placeholder="10"
                      className="mt-1 h-11"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Información Adicional
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="supplier" className="text-sm font-medium text-gray-700">
                      Proveedor
                    </Label>
                    <Input
                      id="supplier"
                      value={productForm.supplier}
                      onChange={(e) => setProductForm({...productForm, supplier: e.target.value})}
                      placeholder="Nombre del proveedor"
                      className="mt-1 h-11"
                    />
                  </div>

                  <div>
                    <Label htmlFor="brand" className="text-sm font-medium text-gray-700">
                      Marca
                    </Label>
                    <Input
                      id="brand"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                      placeholder="Marca del producto"
                      className="mt-1 h-11"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Descripción detallada del producto..."
                    className="mt-1 h-24 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-gray-100 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowProductModal(false)}
              className="h-11 px-6"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProduct} 
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {editingProduct ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Operaciones Masivas */}
      <Dialog open={showBulkModal} onOpenChange={closeBulkModal}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  Operaciones Masivas
                  {bulkOperation && (
                    <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-800">
                      {selectedProducts.length} producto{selectedProducts.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {!bulkOperation 
                    ? 'Selecciona una operación para aplicar a múltiples productos' 
                    : 'Configura los parámetros de la operación seleccionada'
                  }
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {!bulkOperation ? (
            // Vista de selección de operación
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 font-medium">
                  {selectedProducts.length > 0 
                    ? `${selectedProducts.length} productos seleccionados`
                    : 'Seleccione productos para realizar operaciones masivas'
                  }
                </p>
                {selectedProducts.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Productos: {products.filter(p => selectedProducts.includes(p.id)).map(p => p.name).join(', ')}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col"
                  onClick={() => initBulkOperation('updatePrice')}
                  disabled={selectedProducts.length === 0}
                >
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Actualizar Precios</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col"
                  onClick={() => initBulkOperation('updateStock')}
                  disabled={selectedProducts.length === 0}
                >
                  <Package className="w-5 h-5 text-blue-600" />
                  <span>Actualizar Stock</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col"
                  onClick={() => initBulkOperation('changeCategory')}
                  disabled={selectedProducts.length === 0}
                >
                  <Filter className="w-5 h-5 text-purple-600" />
                  <span>Cambiar Categoría</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col"
                  onClick={() => initBulkOperation('updateReorderPoint')}
                  disabled={selectedProducts.length === 0}
                >
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <span>Punto de Reorden</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col"
                  onClick={() => initBulkOperation('export')}
                  disabled={selectedProducts.length === 0}
                >
                  <Download className="w-5 h-5 text-teal-600" />
                  <span>Exportar</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col"
                  onClick={() => initBulkOperation('duplicate')}
                  disabled={selectedProducts.length === 0}
                >
                  <Copy className="w-5 h-5 text-indigo-600" />
                  <span>Duplicar</span>
                </Button>

                <Button 
                  variant="outline" 
                  className="gap-2 h-16 flex-col text-red-600 hover:text-red-700"
                  onClick={() => initBulkOperation('archive')}
                  disabled={selectedProducts.length === 0}
                >
                  <Archive className="w-5 h-5" />
                  <span>Archivar</span>
                </Button>
              </div>
            </div>
          ) : (
            // Vista de configuración de operación
            <div className="space-y-4">
              {/* Actualizar Precios */}
              {bulkOperation === 'updatePrice' && (
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Actualizar Precios</h4>
                    <p className="text-sm text-green-700">
                      Configurar cómo actualizar los precios de {selectedProducts.length} productos
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Tipo de cambio</Label>
                    <Select 
                      value={bulkOperationData.priceMode || 'percentage'}
                      onChange={(value) => setBulkOperationData({...bulkOperationData, priceMode: value})}
                      options={[
                        { value: 'percentage', label: 'Porcentaje (%)' },
                        { value: 'increase', label: 'Aumentar cantidad fija' },
                        { value: 'decrease', label: 'Disminuir cantidad fija' },
                        { value: 'fixed', label: 'Establecer precio fijo' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <Label>Valor</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={
                        bulkOperationData.priceMode === 'percentage' ? 'Ej: 10 (para +10%)' :
                        bulkOperationData.priceMode === 'fixed' ? 'Nuevo precio' : 'Cantidad'
                      }
                      value={bulkOperationData.priceValue || ''}
                      onChange={(e) => setBulkOperationData({...bulkOperationData, priceValue: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Redondeo</Label>
                    <Select 
                      value={bulkOperationData.roundingMode || 'round'}
                      onChange={(value) => setBulkOperationData({...bulkOperationData, roundingMode: value})}
                      options={[
                        { value: 'none', label: 'Sin redondeo (mantener decimales)' },
                        { value: 'round', label: 'Redondeo normal (ej: 10.4 → 10, 10.6 → 11)' },
                        { value: 'ceil', label: 'Redondear hacia arriba (ej: 10.1 → 11)' },
                        { value: 'floor', label: 'Redondear hacia abajo (ej: 10.9 → 10)' },
                        { value: 'round_to_5', label: 'Redondear a múltiplos de 5 (ej: 12 → 10, 13 → 15)' },
                        { value: 'round_to_10', label: 'Redondear a múltiplos de 10 (ej: 24 → 20, 27 → 30)' },
                        { value: 'round_to_50', label: 'Redondear a múltiplos de 50 (ej: 75 → 100)' },
                        { value: 'round_to_100', label: 'Redondear a múltiplos de 100 (ej: 150 → 200)' },
                        { value: 'ending_9', label: 'Terminar en .99 (ej: 10.50 → 10.99)' },
                        { value: 'ending_99', label: 'Terminar en .99 por decenas (ej: 15 → 19.99)' }
                      ]}
                    />
                  </div>
                  
                  {/* Vista previa */}
                  {bulkOperationData.priceValue && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h5 className="font-medium text-gray-800 mb-2">Vista Previa con Redondeo</h5>
                      <div className="space-y-1 text-sm max-h-32 overflow-y-auto">
                        {products.filter(p => selectedProducts.includes(p.id)).slice(0, 3).map(product => {
                          let newPrice = product.price;
                          const priceValue = parseFloat(bulkOperationData.priceValue);
                          const roundingMode = bulkOperationData.roundingMode || 'round';
                          
                          // Calcular nuevo precio
                          if (bulkOperationData.priceMode === 'percentage') {
                            newPrice = product.price * (1 + priceValue / 100);
                          } else if (bulkOperationData.priceMode === 'fixed') {
                            newPrice = priceValue;
                          } else if (bulkOperationData.priceMode === 'increase') {
                            newPrice = product.price + priceValue;
                          } else if (bulkOperationData.priceMode === 'decrease') {
                            newPrice = Math.max(0, product.price - priceValue);
                          }
                          
                          // Aplicar redondeo
                          switch (roundingMode) {
                            case 'round':
                              newPrice = Math.round(newPrice);
                              break;
                            case 'ceil':
                              newPrice = Math.ceil(newPrice);
                              break;
                            case 'floor':
                              newPrice = Math.floor(newPrice);
                              break;
                            case 'round_to_5':
                              newPrice = Math.round(newPrice / 5) * 5;
                              break;
                            case 'round_to_10':
                              newPrice = Math.round(newPrice / 10) * 10;
                              break;
                            case 'round_to_50':
                              newPrice = Math.round(newPrice / 50) * 50;
                              break;
                            case 'round_to_100':
                              newPrice = Math.round(newPrice / 100) * 100;
                              break;
                            case 'ending_9':
                              newPrice = Math.ceil(newPrice) - 0.01;
                              break;
                            case 'ending_99':
                              newPrice = Math.ceil(newPrice / 10) * 10 - 0.01;
                              break;
                            default:
                              // 'none' - mantener decimales
                              newPrice = Math.round(newPrice * 100) / 100;
                              break;
                          }
                          
                          newPrice = Math.max(0, newPrice);
                          
                          return (
                            <div key={product.id} className="flex justify-between items-center">
                              <span className="text-gray-600 flex-1 truncate pr-2">{product.name}</span>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500">${product.price.toFixed(2)}</span>
                                <span className="text-gray-400">→</span>
                                <span className="font-medium text-green-600">${newPrice.toFixed(2)}</span>
                                <Badge 
                                  variant="secondary" 
                                  className="text-xs bg-green-100 text-green-700"
                                >
                                  {((newPrice - product.price) / product.price * 100).toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                        {selectedProducts.length > 3 && (
                          <p className="text-gray-500 text-xs pt-2 border-t">
                            ...y {selectedProducts.length - 3} productos más
                          </p>
                        )}
                      </div>
                      
                      {/* Resumen de redondeo */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-600">
                          <strong>Redondeo aplicado:</strong> {
                            {
                              'none': 'Sin redondeo',
                              'round': 'Redondeo normal',
                              'ceil': 'Hacia arriba',
                              'floor': 'Hacia abajo',
                              'round_to_5': 'Múltiplos de 5',
                              'round_to_10': 'Múltiplos de 10',
                              'round_to_50': 'Múltiplos de 50',
                              'round_to_100': 'Múltiplos de 100',
                              'ending_9': 'Terminación .99',
                              'ending_99': 'Terminación .99 por decenas'
                            }[roundingMode] || 'Redondeo normal'
                          }
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actualizar Stock */}
              {bulkOperation === 'updateStock' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">Actualizar Stock</h4>
                    <p className="text-sm text-blue-700">
                      Modificar el stock de {selectedProducts.length} productos
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Tipo de operación</Label>
                    <Select 
                      value={bulkOperationData.stockMode || 'add'}
                      onChange={(value) => setBulkOperationData({...bulkOperationData, stockMode: value})}
                      options={[
                        { value: 'add', label: 'Agregar al stock actual' },
                        { value: 'subtract', label: 'Quitar del stock actual' },
                        { value: 'set', label: 'Establecer stock fijo' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="Cantidad de unidades"
                      value={bulkOperationData.stockValue || ''}
                      onChange={(e) => setBulkOperationData({...bulkOperationData, stockValue: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* Cambiar Categoría */}
              {bulkOperation === 'changeCategory' && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-800 mb-2">Cambiar Categoría</h4>
                    <p className="text-sm text-purple-700">
                      Asignar nueva categoría a {selectedProducts.length} productos
                    </p>
                  </div>
                  
                  <div>
                    <Label>Nueva categoría</Label>
                    <Select 
                      value={bulkOperationData.newCategory || ''}
                      onChange={(value) => setBulkOperationData({...bulkOperationData, newCategory: value})}
                      options={categoryOptions.filter(opt => opt.value !== 'all')}
                      placeholder="Seleccionar categoría"
                    />
                  </div>
                </div>
              )}

              {/* Actualizar Punto de Reorden */}
              {bulkOperation === 'updateReorderPoint' && (
                <div className="space-y-4">
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">Punto de Reorden</h4>
                    <p className="text-sm text-orange-700">
                      Configurar punto de reorden para {selectedProducts.length} productos
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Label>Método de cálculo</Label>
                    <Select 
                      value={bulkOperationData.reorderMode || 'set'}
                      onChange={(value) => setBulkOperationData({...bulkOperationData, reorderMode: value})}
                      options={[
                        { value: 'set', label: 'Valor fijo' },
                        { value: 'percentage', label: 'Porcentaje del stock actual' }
                      ]}
                    />
                  </div>
                  
                  <div>
                    <Label>
                      {bulkOperationData.reorderMode === 'percentage' ? 'Porcentaje (%)' : 'Cantidad'}
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      placeholder={
                        bulkOperationData.reorderMode === 'percentage' ? 'Ej: 20 (20% del stock)' : 'Cantidad mínima'
                      }
                      value={bulkOperationData.reorderValue || ''}
                      onChange={(e) => setBulkOperationData({...bulkOperationData, reorderValue: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="border-t border-gray-100 pt-4">
            {bulkOperation ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setBulkOperation(null)}
                  className="h-11 px-6"
                >
                  Atrás
                </Button>
                <Button 
                  onClick={executeBulkOperation} 
                  className="h-11 px-6 bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                  Aplicar Cambios
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={closeBulkModal}
                className="h-11 px-6"
              >
                Cerrar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Analytics de Producto */}
      <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Analytics de Producto con IA
            </DialogTitle>
          </DialogHeader>

          {productAnalytics && (
            <div className="space-y-6">
              {/* Header del producto */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">
                  {productAnalytics.product.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Stock Actual:</p>
                    <p className="font-bold text-gray-900">{productAnalytics.product.stock}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Precio:</p>
                    <p className="font-bold text-gray-900">
                      {formatPrice(productAnalytics.product.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">AI Score:</p>
                    <p className="font-bold text-blue-600">
                      {((productAnalytics.product.aiScore || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Categoría:</p>
                    <p className="font-bold text-gray-900">{productAnalytics.product.category}</p>
                  </div>
                </div>
              </div>

              {/* Predicción y Optimización */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Predicción de demanda */}
                {productAnalytics.prediction && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Predicción de Demanda (30 días)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">
                            {productAnalytics.prediction.predictedSales}
                          </p>
                          <p className="text-sm text-blue-700">Unidades predichas</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Confianza:</p>
                            <p className="font-semibold text-green-600">
                              {productAnalytics.prediction.confidence}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Días hasta agotamiento:</p>
                            <p className="font-semibold text-orange-600">
                              {productAnalytics.prediction.daysToStockout}
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 border-t">
                          <Badge 
                            variant={productAnalytics.prediction.recommendation === 'reorder' ? 'warning' : 'secondary'}
                            className="w-full justify-center"
                          >
                            {productAnalytics.prediction.recommendation === 'reorder' ? 'Reponer Stock' : 'Monitorear'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Optimización de precios */}
                {productAnalytics.optimization && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Optimización de Precios</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-lg font-bold text-gray-900">
                              {formatPrice(productAnalytics.optimization.currentPrice)}
                            </p>
                            <p className="text-xs text-gray-600">Precio Actual</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <p className="text-lg font-bold text-emerald-600">
                              {formatPrice(productAnalytics.optimization.suggestedPrice)}
                            </p>
                            <p className="text-xs text-emerald-700">Precio Sugerido</p>
                          </div>
                        </div>

                        <div className="text-sm">
                          <p className="text-gray-600 mb-1">Cambio potencial:</p>
                          <p className={`font-semibold ${
                            parseFloat(productAnalytics.optimization.potentialIncrease) >= 0 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {productAnalytics.optimization.potentialIncrease > 0 ? '+' : ''}
                            {productAnalytics.optimization.potentialIncrease}%
                          </p>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-xs text-gray-600 mb-1">Razonamiento IA:</p>
                          <p className="text-sm text-gray-800">
                            {productAnalytics.optimization.reasoning}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalyticsModal(false)}>
              Cerrar
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Reporte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Productos;