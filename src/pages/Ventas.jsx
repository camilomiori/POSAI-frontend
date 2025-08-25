import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Scanner,
  CreditCard,
  DollarSign,
  Percent,
  User,
  Receipt,
  Zap,
  TrendingUp,
  Star,
  Package,
  AlertCircle,
  CheckCircle
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
  DialogFooter
} from '../components/ui';
import { useCart, useAuth, useToast, useDebounce } from '../hooks';
import { apiService, aiEngine } from '../services';
import { formatARS } from '../utils/formatters';
import { PAYMENT_METHODS, INVOICE_TYPES, PRODUCT_CATEGORIES } from '../utils/constants';

const Ventas = () => {
  const { user, hasPermission } = useAuth();
  const { 
    items: cartItems, 
    totalItems, 
    subtotal, 
    discountPercent, 
    discountAmount, 
    total,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    applyDiscount
  } = useCart();
  const { success, error, warning, ai } = useToast();

  // Estados principales
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    cuit: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [invoiceType, setInvoiceType] = useState(INVOICE_TYPES.C);
  const [processing, setProcessing] = useState(false);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, []);

  // Buscar productos cuando cambie el término de búsqueda
  useEffect(() => {
    if (debouncedSearch) {
      searchProducts();
    } else {
      loadProducts();
    }
  }, [debouncedSearch, selectedCategory]);

  // Generar recomendaciones cuando cambie el carrito
  useEffect(() => {
    if (cartItems.length > 0) {
      generateRecommendations();
    } else {
      setRecommendations([]);
    }
  }, [cartItems]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 50
      });
      setProducts(response.data || []);
    } catch (err) {
      error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.getProducts({
        search: debouncedSearch,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        limit: 50
      });
      setProducts(response.data || []);
    } catch (err) {
      error('Error en la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      const aiRecommendations = await aiEngine.getRecommendations(cartItems);
      setRecommendations(aiRecommendations);
      
      if (aiRecommendations.length > 0) {
        ai(`IA sugiere ${aiRecommendations.length} productos complementarios`);
      }
    } catch (err) {
      console.error('Error generating recommendations:', err);
    }
  };

  const handleAddToCart = (product) => {
    try {
      addItem(product, 1);
      success(`${product.name} agregado al carrito`);
    } catch (err) {
      warning(err.message);
    }
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    updateQuantity(productId, newQuantity);
  };

  const handleRemoveFromCart = (productId) => {
    const item = cartItems.find(item => item.id === productId);
    removeItem(productId);
    success(`${item?.name} eliminado del carrito`);
  };

  const handleApplyDiscount = (percent) => {
    applyDiscount(percent);
    success(`Descuento del ${percent}% aplicado`);
  };

  const processSale = async () => {
    if (isEmpty) {
      warning('El carrito está vacío');
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        items: cartItems.map(item => ({
          id: item.id,
          code: item.code,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        })),
        subtotal,
        discountPercent,
        discountAmount,
        total,
        paymentMethod,
        invoiceType,
        customer: customerInfo,
        cajeroId: user.id,
        cajeroNombre: user.nombre
      };

      const response = await apiService.createSale(saleData);
      
      if (response.success !== false) {
        success('Venta procesada exitosamente');
        clearCart();
        setCustomerInfo({ name: '', email: '', cuit: '', phone: '' });
        setShowCheckout(false);
        
        // Mostrar número de venta
        ai(`Venta #${response.id} registrada. Total: ${formatARS.format(total)}`);
      }
    } catch (err) {
      error('Error al procesar la venta');
    } finally {
      setProcessing(false);
    }
  };

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !debouncedSearch || 
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.code.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, debouncedSearch, selectedCategory]);

  const getStockStatus = (stock, reorderPoint) => {
    if (stock === 0) return { status: 'sin-stock', color: 'bg-red-100 text-red-800', label: 'Sin Stock' };
    if (stock <= reorderPoint) return { status: 'bajo', color: 'bg-yellow-100 text-yellow-800', label: 'Stock Bajo' };
    return { status: 'normal', color: 'bg-green-100 text-green-800', label: 'Disponible' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      
      {/* Panel de Productos */}
      <div className="lg:col-span-2 space-y-4">
        
        {/* Header de búsqueda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              
              {/* Barra de búsqueda */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar productos por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por categoría */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {Object.values(PRODUCT_CATEGORIES).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Escáner de código */}
              <Button variant="outline" size="icon">
                <Scanner className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grid de productos */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Cargando productos...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock, product.reorderPoint);
                const inCart = cartItems.find(item => item.id === product.id);
                
                return (
                  <Card key={product.id} className="group hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-4">
                      
                      {/* Header del producto */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">{product.code}</p>
                        </div>
                        
                        {/* AI Score */}
                        {product.aiScore > 0.8 && (
                          <Badge variant="ai" size="sm" className="ml-2">
                            <Star className="w-3 h-3 mr-1" />
                            Top
                          </Badge>
                        )}
                      </div>

                      {/* Precio y stock */}
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <p className="text-lg font-bold text-gray-900">
                            {formatARS.format(product.price)}
                          </p>
                          {product.suggestedPrice && product.suggestedPrice !== product.price && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              IA: {formatARS.format(product.suggestedPrice)}
                            </p>
                          )}
                        </div>
                        
                        <Badge size="sm" className={stockStatus.color}>
                          {stockStatus.label}
                        </Badge>
                      </div>

                      {/* Stock info */}
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {product.stock} disponibles
                        </span>
                        {product.fastMoving && (
                          <Badge variant="secondary" size="sm">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Rápido
                          </Badge>
                        )}
                      </div>

                      {/* Acciones */}
                      <div className="flex items-center gap-2">
                        {inCart ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(product.id, inCart.quantity - 1)}
                              disabled={inCart.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm font-semibold min-w-[2rem] text-center">
                              {inCart.quantity}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuantity(product.id, inCart.quantity + 1)}
                              disabled={inCart.quantity >= product.stock}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFromCart(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.stock === 0}
                            className="flex-1 gap-2"
                            size="sm"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recomendaciones de IA */}
        {recommendations.length > 0 && (
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Zap className="w-5 h-5" />
                Recomendaciones de IA
                <Badge variant="ai" size="sm">Inteligente</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendations.slice(0, 3).map((rec, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-emerald-200">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{rec.product.name}</h4>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {formatARS.format(rec.product.price)}
                        </p>
                        <p className="text-xs text-emerald-600">{rec.confidence * 100}% match</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">{rec.reason}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToCart(rec.product)}
                      className="w-full text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Panel del Carrito */}
      <div className="space-y-4">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Carrito
                {totalItems > 0 && (
                  <Badge variant="default" className="ml-2">
                    {totalItems} items
                  </Badge>
                )}
              </div>
              
              {!isEmpty && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col">
            {isEmpty ? (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Carrito vacío</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Agrega productos para comenzar una venta
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Items del carrito */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                          {item.name}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          
                          <span className="px-2 py-1 bg-white border rounded text-sm font-semibold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900">
                            {formatARS.format(item.subtotal)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatARS.format(item.price)} c/u
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Descuento */}
                <div className="space-y-3 mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">Descuento</span>
                  </div>
                  
                  <div className="flex gap-2">
                    {[5, 10, 15, 20].map(percent => (
                      <Button
                        key={percent}
                        variant="outline"
                        size="sm"
                        onClick={() => handleApplyDiscount(percent)}
                        className="flex-1 text-xs"
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                  
                  {discountPercent > 0 && (
                    <div className="text-sm text-yellow-700">
                      Descuento aplicado: {discountPercent}% (-{formatARS.format(discountAmount)})
                    </div>
                  )}
                </div>

                {/* Totales */}
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg border">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatARS.format(subtotal)}</span>
                  </div>
                  
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Descuento:</span>
                      <span>-{formatARS.format(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatARS.format(total)}</span>
                  </div>
                </div>

                {/* Botón de checkout */}
                <Button
                  onClick={() => setShowCheckout(true)}
                  className="w-full gap-2 mt-4"
                  size="lg"
                >
                  <CreditCard className="w-4 h-4" />
                  Procesar Venta
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Checkout */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Finalizar Venta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información del cliente */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Información del Cliente
              </h4>
              
              <Input
                placeholder="Nombre del cliente"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
              />
              
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Email"
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                />
                <Input
                  placeholder="Teléfono"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              
              <Input
                placeholder="CUIT (opcional)"
                value={customerInfo.cuit}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, cuit: e.target.value }))}
              />
            </div>

            {/* Método de pago */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Método de Pago
              </h4>
              
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PAYMENT_METHODS.CASH}>Efectivo</SelectItem>
                  <SelectItem value={PAYMENT_METHODS.CREDIT_CARD}>Tarjeta de Crédito</SelectItem>
                  <SelectItem value={PAYMENT_METHODS.DEBIT_CARD}>Tarjeta de Débito</SelectItem>
                  <SelectItem value={PAYMENT_METHODS.TRANSFER}>Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de factura */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Tipo de Factura</h4>
              
              <Select value={invoiceType} onValueChange={setInvoiceType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={INVOICE_TYPES.A}>Factura A</SelectItem>
                  <SelectItem value={INVOICE_TYPES.B}>Factura B</SelectItem>
                  <SelectItem value={INVOICE_TYPES.C}>Factura C</SelectItem>
                  <SelectItem value={INVOICE_TYPES.X}>Factura X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Resumen */}
            <div className="p-3 bg-gray-50 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>Items:</span>
                <span>{totalItems}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatARS.format(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Descuento:</span>
                  <span>-{formatARS.format(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-1 border-t">
                <span>Total:</span>
                <span>{formatARS.format(total)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={processSale}
              disabled={processing}
              loading={processing}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {processing ? 'Procesando...' : 'Confirmar Venta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ventas;