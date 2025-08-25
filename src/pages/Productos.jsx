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
  Archive
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Checkbox,
  Label,
  Textarea
} from '../components/ui';
import { PieChart, BarChart } from '../components/charts';
import { useAuth, useToast, useDebounce } from '../hooks';
import { apiService, aiEngine } from '../services';
import { formatARS, formatDateTime, formatPercentage } from '../utils/formatters';
import { PRODUCT_CATEGORIES, DEMAND_TRENDS } from '../utils/constants';

const Productos = () => {
  const { user, hasPermission, isAdmin, isSupervisor } = useAuth();
  const { success, error, warning, ai } = useToast();

  // Estados principales
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Estados para modales
  const [showProductModal, setShowProductModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Estados para analytics
  const [productAnalytics, setProductAnalytics] = useState(null);
  const [categoryAnalytics, setCategoryAnalytics] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);

  // Form data para producto
  const [productForm, setProductForm] = useState({
    name: '',
    code: '',
    category: '',
    price: '',
    cost: '',
    stock: '',
    reorderPoint: '',
    description: '',
    supplier: '',
    brand: '',
    tags: ''
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
  }, [debouncedSearch, selectedCategory, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({
        search: debouncedSearch,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sortBy,
        sortOrder,
        limit: 100
      });
      setProducts(response.data || []);
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

      // Cargar recomendaciones de IA
      const recommendations = await aiEngine.getBusinessInsights();
      setAiRecommendations(recommendations.filter(r => r.type === 'ai'));

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
      cost: '',
      stock: '',
      reorderPoint: '',
      description: '',
      supplier: '',
      brand: '',
      tags: ''
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
      cost: product.cost?.toString() || '',
      stock: product.stock?.toString() || '',
      reorderPoint: product.reorderPoint?.toString() || '',
      description: product.description || '',
      supplier: product.supplier || '',
      brand: product.brand || '',
      tags: product.tags?.join(', ') || ''
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price) || 0,
        cost: parseFloat(productForm.cost) || 0,
        stock: parseInt(productForm.stock) || 0,
        reorderPoint: parseInt(productForm.reorderPoint) || 0,
        tags: productForm.tags.split(',').map(t => t.trim()).filter(Boolean)
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

  // Bulk operations
  const handleBulkOperation = async (operation) => {
    if (selectedProducts.length === 0) {
      warning('Seleccione productos para la operación masiva');
      return;
    }

    try {
      const updates = selectedProducts.map(id => ({
        id,
        operation,
        data: {} // Se completará según la operación
      }));

      await apiService.bulkUpdateProducts(updates);
      success(`Operación masiva aplicada a ${selectedProducts.length} productos`);
      setSelectedProducts([]);
      loadProducts();
    } catch (err) {
      error('Error en operación masiva');
    }
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
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedProducts.length} productos • Con inteligencia artificial
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasPermission('manage_products') && (
            <>
              <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Operaciones Masivas
              </Button>
              <Button onClick={handleCreateProduct} className="gap-2">
                <Plus className="w-4 h-4" />
                Nuevo Producto
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros y controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            
            {/* Búsqueda */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, código o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <div className="flex items-center gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.values(PRODUCT_CATEGORIES).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Nombre A-Z</SelectItem>
                  <SelectItem value="name-desc">Nombre Z-A</SelectItem>
                  <SelectItem value="price-asc">Precio menor</SelectItem>
                  <SelectItem value="price-desc">Precio mayor</SelectItem>
                  <SelectItem value="stock-asc">Stock menor</SelectItem>
                  <SelectItem value="stock-desc">Stock mayor</SelectItem>
                  <SelectItem value="aiScore-desc">AI Score</SelectItem>
                </SelectContent>
              </Select>

              {/* Toggle vista */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Button variant="outline" size="icon" onClick={() => loadProducts()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Selección masiva */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedProducts.length} productos seleccionados
                </span>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedProducts([])}>
                    Cancelar
                  </Button>
                  <Button size="sm" onClick={() => setShowBulkModal(true)}>
                    Acciones
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Grid/List de productos */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock, product.reorderPoint);
            const isSelected = selectedProducts.includes(product.id);
            
            return (
              <Card key={product.id} className={`group hover:shadow-lg transition-all duration-200 ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''
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
                        {formatARS.format(product.price)}
                      </span>
                      {product.suggestedPrice && product.suggestedPrice !== product.price && (
                        <div className="text-right">
                          <p className="text-xs text-emerald-600 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {formatARS.format(product.suggestedPrice)}
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
                      <tr key={product.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
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
                              {formatARS.format(product.price)}
                            </p>
                            {product.suggestedPrice && product.suggestedPrice !== product.price && (
                              <p className="text-xs text-emerald-600 flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                {formatARS.format(product.suggestedPrice)}
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Producto *</Label>
                <Input
                  id="name"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  placeholder="Ej: Cubierta 80/100-21"
                />
              </div>

              <div>
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  value={productForm.code}
                  onChange={(e) => setProductForm({...productForm, code: e.target.value})}
                  placeholder="Ej: XR-250-01"
                />
              </div>

              <div>
                <Label htmlFor="category">Categoría *</Label>
                <Select 
                  value={productForm.category} 
                  onValueChange={(value) => setProductForm({...productForm, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(PRODUCT_CATEGORIES).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="price">Precio de Venta *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="cost">Precio de Costo</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={productForm.cost}
                    onChange={(e) => setProductForm({...productForm, cost: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="stock">Stock Inicial *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({...productForm, stock: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="reorderPoint">Punto de Reorden</Label>
                  <Input
                    id="reorderPoint"
                    type="number"
                    value={productForm.reorderPoint}
                    onChange={(e) => setProductForm({...productForm, reorderPoint: e.target.value})}
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">Proveedor</Label>
                <Input
                  id="supplier"
                  value={productForm.supplier}
                  onChange={(e) => setProductForm({...productForm, supplier: e.target.value})}
                  placeholder="Nombre del proveedor"
                />
              </div>

              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={productForm.brand}
                  onChange={(e) => setProductForm({...productForm, brand: e.target.value})}
                  placeholder="Marca del producto"
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={productForm.tags}
                  onChange={(e) => setProductForm({...productForm, tags: e.target.value})}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={productForm.description}
                onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                placeholder="Descripción detallada del producto..."
                className="h-20"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveProduct} className="gap-2">
              <CheckCircle className="w-4 h-4" />
              {editingProduct ? 'Actualizar' : 'Crear'} Producto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Operaciones Masivas */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Operaciones Masivas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {selectedProducts.length > 0 
                ? `Aplicar a ${selectedProducts.length} productos seleccionados`
                : 'Seleccione productos para realizar operaciones masivas'
              }
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleBulkOperation('updatePrice')}
                disabled={selectedProducts.length === 0}
              >
                <DollarSign className="w-4 h-4" />
                Actualizar Precios
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleBulkOperation('updateStock')}
                disabled={selectedProducts.length === 0}
              >
                <Package className="w-4 h-4" />
                Actualizar Stock
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleBulkOperation('changeCategory')}
                disabled={selectedProducts.length === 0}
              >
                <Filter className="w-4 h-4" />
                Cambiar Categoría
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleBulkOperation('archive')}
                disabled={selectedProducts.length === 0}
              >
                <Archive className="w-4 h-4" />
                Archivar
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleBulkOperation('export')}
                disabled={selectedProducts.length === 0}
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>

              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => handleBulkOperation('duplicate')}
                disabled={selectedProducts.length === 0}
              >
                <Copy className="w-4 h-4" />
                Duplicar
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancelar
            </Button>
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
                      {formatARS.format(productAnalytics.product.price)}
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
                              {formatARS.format(productAnalytics.optimization.currentPrice)}
                            </p>
                            <p className="text-xs text-gray-600">Precio Actual</p>
                          </div>
                          <div className="text-center p-3 bg-emerald-50 rounded-lg">
                            <p className="text-lg font-bold text-emerald-600">
                              {formatARS.format(productAnalytics.optimization.suggestedPrice)}
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