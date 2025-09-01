import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  DollarSign,
  Receipt,
  User,
  Calculator,
  Zap,
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Printer,
  Package,
  Tag,
  Sparkles
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
  Textarea
} from '../components/ui';
import { useAuth } from '../hooks';
import useCart from '../hooks/useCart';
import useToast from '../hooks/useToast';
import useDebounce from '../hooks/useDebounce';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import { apiService, getAiEngine } from '../services';
import { salesHistoryService } from '../services/salesHistory';
import { cashRegisterService } from '../services/cashRegister';
import { TicketPreview } from '../components/common';
import { formatARS, formatDateTime } from '../utils/formatters';
import { PAYMENT_METHODS, INVOICE_TYPES, PRODUCT_CATEGORIES } from '../utils/constants';

// Datos de productos de ejemplo para autopartes
const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: 'Filtro de Aceite',
    category: 'filtros',
    price: 15000,
    stock: 25,
    code: 'FIL001',
    brand: 'Fram'
  },
  {
    id: 2,
    name: 'Pastillas de Freno',
    category: 'frenos',
    price: 28000,
    stock: 12,
    code: 'FRE002',
    brand: 'Fras-le'
  },
  {
    id: 3,
    name: 'Batería 12V 75Ah',
    category: 'electricidad',
    price: 85000,
    stock: 8,
    code: 'BAT003',
    brand: 'Moura'
  },
  {
    id: 4,
    name: 'Neumático 185/65 R15',
    category: 'neumaticos',
    price: 120000,
    stock: 16,
    code: 'NEU004',
    brand: 'Pirelli'
  },
  {
    id: 5,
    name: 'Kit de Embrague',
    category: 'transmision',
    price: 95000,
    stock: 6,
    code: 'EMB005',
    brand: 'LuK'
  },
  {
    id: 6,
    name: 'Amortiguador Delantero',
    category: 'suspension',
    price: 45000,
    stock: 10,
    code: 'AMO006',
    brand: 'Monroe'
  }
];

const CATEGORIES = [
  { value: 'all', label: 'Todas las categorías' },
  { value: 'filtros', label: 'Filtros' },
  { value: 'frenos', label: 'Frenos' },
  { value: 'electricidad', label: 'Electricidad' },
  { value: 'neumaticos', label: 'Neumáticos' },
  { value: 'transmision', label: 'Transmisión' },
  { value: 'suspension', label: 'Suspensión' },
  { value: 'encendido', label: 'Encendido' }
];

const VentasFacturacion = () => {
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
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    cuit: '',
    phone: '',
    address: ''
  });
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH || 'cash');
  const [invoiceType, setInvoiceType] = useState('C');
  const [processing, setProcessing] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showDiscountDialog, setShowDiscountDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [currentTicketData, setCurrentTicketData] = useState(null);
  const [documentType, setDocumentType] = useState('sale'); // 'sale', 'quote', 'invoice'
  const [customDiscount, setCustomDiscount] = useState({ type: 'percentage', value: 0 });

  // Estados IA
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiAssistantActive, setAiAssistantActive] = useState(false);
  const [salesInsights, setSalesInsights] = useState(null);
  const [priceRecommendations, setPriceRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const barcodeInputRef = useRef(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Helper para hacer focus al input de código de barras
  const focusBarcodeInput = useCallback(() => {
    setTimeout(() => {
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
        barcodeInputRef.current.select();
      }
    }, 100);
  }, []);

  // Filtrar productos  
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !debouncedSearch || 
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        product.brand.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      return matchesSearch && product.stock > 0;
    });
  }, [products, debouncedSearch]);

  // Auto-focus al cargar la página
  useEffect(() => {
    focusBarcodeInput();
  }, [focusBarcodeInput]);

  // Agregar producto por código de barras
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => 
      p.code === barcodeInput.toUpperCase() || 
      p.id.toString() === barcodeInput
    );
    
    if (product) {
      handleAddToCart(product);
      setBarcodeInput('');
      // Volver a hacer focus al input después de agregar producto
      focusBarcodeInput();
    } else {
      warning(`Producto no encontrado: ${barcodeInput}`);
      setBarcodeInput('');
      focusBarcodeInput();
    }
  };

  // Obtener sugerencias de IA
  const getAISuggestions = async () => {
    if (cartItems.length === 0) {
      setAiSuggestions([]);
      setSalesInsights(null);
      return;
    }

    try {
      setLoadingAI(true);
      
      // Simular llamada al servicio IA
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const cartTotal = total;
      const cartCategories = [...new Set(cartItems.map(item => {
        const product = products.find(p => p.id === item.id);
        return product?.category;
      }).filter(Boolean))];

      // Generar sugerencias inteligentes basadas en el carrito
      const suggestions = [];
      const insights = {
        message: '',
        recommendations: [],
        savings: 0,
        crossSelling: []
      };

      // Lógica de recomendaciones cross-selling
      if (cartCategories.includes('filtros')) {
        const oilSuggestion = products.find(p => p.name.includes('Aceite') || p.category === 'lubricantes');
        if (!cartItems.find(item => item.id === oilSuggestion?.id)) {
          suggestions.push({
            id: 'cross-oil',
            type: 'cross-sell',
            title: '🛢️ Combo: Filtro + Aceite',
            description: 'Los clientes que compran filtros suelen necesitar aceite',
            product: oilSuggestion || { id: 99, name: 'Aceite Motor 15W40', price: 25000 },
            confidence: 92
          });
        }
      }

      if (cartCategories.includes('frenos')) {
        suggestions.push({
          id: 'cross-brake-fluid',
          type: 'cross-sell',
          title: '🛑 Líquido de Frenos',
          description: 'Recomendado cambiar el líquido con pastillas nuevas',
          product: { id: 98, name: 'Líquido Frenos DOT 4', price: 8000 },
          confidence: 89
        });
      }

      if (cartCategories.includes('electricidad')) {
        suggestions.push({
          id: 'cross-battery-care',
          type: 'maintenance',
          title: '⚡ Mantenimiento Recomendado',
          description: 'Revisar terminales y nivel de electrolito cada 6 meses',
          confidence: 95
        });
      }

      // Sugerencias de descuentos
      if (cartTotal > 200000) {
        suggestions.push({
          id: 'discount-bulk',
          type: 'discount',
          title: '💰 Descuento por Volumen',
          description: 'Compra mayor a $200.000 - 5% de descuento disponible',
          discount: 5,
          confidence: 100
        });
        insights.savings = cartTotal * 0.05;
      }

      // Análisis de tendencias
      if (cartItems.length >= 3) {
        insights.message = `Venta múltiple detectada. Cliente frecuente potencial. Sugerir programa de fidelización.`;
        insights.recommendations = [
          'Ofrecer descuentos por fidelidad',
          'Recomendar kit de mantenimiento completo',
          'Programar próxima revisión'
        ];
      } else {
        insights.message = `Venta focalizada en ${cartCategories[0]}. Cliente con necesidad específica.`;
        insights.recommendations = [
          'Cross-selling de productos complementarios',
          'Información técnica adicional',
          'Garantía extendida'
        ];
      }

      setAiSuggestions(suggestions);
      setSalesInsights(insights);
      
      ai(`🤖 IA activada: ${suggestions.length} sugerencias generadas`);
      
    } catch (err) {
      console.error('Error obteniendo sugerencias IA:', err);
      error('Error al obtener sugerencias de IA');
    } finally {
      setLoadingAI(false);
    }
  };

  // Activar/desactivar IA
  const toggleAIAssistant = () => {
    setAiAssistantActive(!aiAssistantActive);
    
    if (!aiAssistantActive) {
      ai('🚀 Asistente IA activado - Analizando carrito...');
      if (cartItems.length > 0) {
        getAISuggestions();
      }
    } else {
      setAiSuggestions([]);
      setSalesInsights(null);
      success('⏸️ Asistente IA desactivado');
    }
  };

  // Efecto para actualizar sugerencias cuando cambia el carrito
  useEffect(() => {
    if (cartItems.length > 0 && aiAssistantActive) {
      const timer = setTimeout(() => {
        getAISuggestions();
      }, 800);
      return () => clearTimeout(timer);
    } else if (cartItems.length === 0) {
      // Limpiar sugerencias cuando el carrito está vacío
      setAiSuggestions([]);
      setSalesInsights(null);
    }
  }, [cartItems, aiAssistantActive]);

  // Agregar producto al carrito
  const handleAddToCart = (product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      code: product.code,
      brand: product.brand
    });
    success(`${product.name} agregado al carrito`);
  };

  // Aplicar sugerencia de IA
  const applySuggestion = (suggestion) => {
    if (suggestion.type === 'cross-sell' && suggestion.product) {
      handleAddToCart(suggestion.product);
      ai(`✨ Sugerencia aplicada: ${suggestion.product.name}`);
    } else if (suggestion.type === 'discount' && suggestion.discount) {
      applyDiscount(suggestion.discount);
      ai(`💰 Descuento aplicado: ${suggestion.discount}%`);
    }
  };

  // Aplicar descuento personalizado
  const handleCustomDiscount = () => {
    if (customDiscount.value > 0) {
      if (customDiscount.type === 'percentage') {
        applyDiscount(customDiscount.value);
        success(`Descuento del ${customDiscount.value}% aplicado`);
      } else {
        // Calcular porcentaje equivalente del monto fijo
        const percentage = (customDiscount.value / subtotal) * 100;
        applyDiscount(percentage);
        success(`Descuento de ${formatARS(customDiscount.value)} aplicado`);
      }
      setShowDiscountDialog(false);
      setCustomDiscount({ type: 'percentage', value: 0 });
    }
  };

  // Generar presupuesto
  const generateQuote = async () => {
    if (isEmpty) {
      warning('El carrito está vacío');
      return;
    }

    // Para presupuestos siempre requerir nombre
    if (!customerInfo.name.trim()) {
      warning('Ingrese los datos del cliente');
      setShowCustomerDialog(true);
      return;
    }

    try {
      setProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));

      const quoteNumber = `PRES-${Date.now().toString().slice(-6)}`;
      
      const quoteData = {
        id: quoteNumber,
        items: cartItems,
        customer: customerInfo,
        payment: {
          method: 'pending',
          amount: total
        },
        subtotal,
        discountAmount: subtotal - total,
        discountPercent,
        total,
        documentType: 'quote',
        invoiceType: 'QUOTE',
        date: new Date(),
        timestamp: Date.now()
      };

      // Mostrar preview del presupuesto
      setCurrentTicketData(quoteData);
      setShowTicketDialog(true);
      setShowCustomerDialog(false);
      
    } catch (err) {
      error('Error al generar presupuesto');
    } finally {
      setProcessing(false);
    }
  };

  // Procesar venta
  const processSale = async () => {
    if (isEmpty) {
      warning('El carrito está vacío');
      return;
    }

    // Solo validar datos de cliente si NO es consumidor final
    if (invoiceType !== 'C' && !customerInfo.name.trim()) {
      warning('Ingrese los datos del cliente');
      setShowCustomerDialog(true);
      return;
    }

    try {
      setProcessing(true);

      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      const documentNumber = documentType === 'invoice' 
        ? `FC-${Date.now().toString().slice(-6)}`
        : `VTA-${Date.now().toString().slice(-6)}`;

      const saleData = {
        id: documentNumber,
        items: cartItems,
        customer: customerInfo,
        payment: {
          method: paymentMethod,
          amount: total
        },
        subtotal,
        discountAmount: subtotal - total,
        discountPercent,
        total,
        documentType,
        invoiceType,
        date: new Date(),
        timestamp: Date.now(),
        aiAssisted: aiAssistantActive,
        suggestions: aiSuggestions.length
      };

      // Mostrar preview del ticket antes de completar la venta
      setCurrentTicketData(saleData);
      setShowTicketDialog(true);
      setShowPaymentDialog(false);

    } catch (err) {
      error('Error al procesar la operación');
    } finally {
      setProcessing(false);
    }
  };

  // Completar venta después de imprimir ticket
  const completeSale = (ticketData) => {
    try {
      // Guardar en historial
      salesHistoryService.addSale(ticketData);
      
      // Registrar en caja si está abierta y es venta (no presupuesto)
      if (ticketData.documentType !== 'quote' && cashRegisterService.isOpen()) {
        cashRegisterService.addSale({
          id: ticketData.id,
          timestamp: ticketData.timestamp,
          total: ticketData.total,
          paymentMethod: ticketData.payment?.method || 'cash',
          items: ticketData.items
        });
      }
      
      // Mostrar confirmación
      if (ticketData.documentType === 'invoice') {
        success(`📄 Factura procesada - ${ticketData.id}`);
      } else if (ticketData.documentType === 'quote') {
        success(`📄 Presupuesto generado - ${ticketData.id}`);
      } else {
        success(`✅ Venta procesada - ${ticketData.id}`);
      }
      
      if (aiAssistantActive) {
        ai(`🤖 IA: Operación completada con ${aiSuggestions.length} sugerencias aplicadas`);
      }

      // Limpiar datos
      clearCart();
      setCustomerInfo({
        name: '',
        email: '',
        cuit: '',
        phone: '',
        address: ''
      });
      setInvoiceType('C'); // Resetear a consumidor final por defecto
      setAiSuggestions([]);
      setSalesInsights(null);
      setShowTicketDialog(false);
      setCurrentTicketData(null);
      
      // Volver a hacer focus al input de código de barras para la siguiente venta
      focusBarcodeInput();
    } catch (err) {
      error('Error al completar la venta');
    }
  };

  // Atajos de teclado
  useKeyboardShortcuts({
    'F1': () => {
      // Focus en el input de código de barras
      focusBarcodeInput();
    },
    'F2': () => {
      // Abrir dialog de descuento si hay productos en el carrito
      if (!isEmpty) {
        setShowDiscountDialog(true);
      }
    },
    'F3': () => {
      // Procesar venta si hay productos en el carrito
      if (!isEmpty) {
        setShowPaymentDialog(true);
      }
    },
    'Escape': () => {
      // Cerrar todos los modals
      setShowCustomerDialog(false);
      setShowPaymentDialog(false);
      setShowDiscountDialog(false);
    }
  }, [isEmpty, setShowDiscountDialog, setShowPaymentDialog, setShowCustomerDialog]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sistema de Ventas</h1>
              <p className="text-gray-600 mt-1">
                Procesamiento inteligente con IA para autopartes
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={toggleAIAssistant}
                variant={aiAssistantActive ? "default" : "outline"}
                className={aiAssistantActive ? 
                  "bg-gradient-to-r from-purple-500 to-blue-600 text-white" : 
                  "border-purple-300 text-purple-700 hover:bg-purple-50"
                }
              >
                <Brain className="w-4 h-4 mr-2" />
                {aiAssistantActive ? 'IA Activa' : 'Activar IA'}
                {loadingAI && <div className="ml-2 w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
              </Button>
            </div>
          </div>

          {/* AI Status Indicator */}
          {aiAssistantActive && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    🤖 Asistente IA Activo
                  </p>
                  <p className="text-xs text-purple-700">
                    Analizando patrones de compra • Sugerencias en tiempo real • Optimización de precios
                  </p>
                </div>
                <Badge variant="secondary" size="sm" className="ml-auto bg-purple-700 text-white border-purple-800">
                  {cartItems.length === 0 ? '0' : aiSuggestions.length} sugerencias
                </Badge>
              </div>
            </div>
          )}

          {/* Panel de Shortcuts */}
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">Atajos de Teclado</h3>
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <span><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">F1</kbd> Código de barras</span>
                <span><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">F2</kbd> Descuento</span>
                <span><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">F3</kbd> Procesar</span>
                <span><kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Esc</kbd> Cerrar</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel de Entrada de Productos */}
          <div className="lg:col-span-2">
            {/* Scanner de Código de Barras */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Agregar Productos
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        ref={barcodeInputRef}
                        placeholder="Escanear código de barras o ingrese código..."
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        className="text-lg"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Códigos de prueba: FIL001, FRE002, BAT003, NEU004, EMB005, AMO006
                      </p>
                    </div>
                    <Button type="submit" disabled={!barcodeInput.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Catálogo Compacto (solo si necesitan buscar manualmente) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Búsqueda Manual
                  </span>
                  <Badge variant="secondary" size="sm">
                    {filteredProducts.length} productos
                  </Badge>
                </CardTitle>
                
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por nombre, código o marca..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Lista compacta de productos */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">{product.brand} • Stock: {product.stock}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-green-600 text-sm">
                          {formatARS(product.price)}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Agregar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No se encontraron productos</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sugerencias de IA */}
            {aiAssistantActive && aiSuggestions.length > 0 && (
              <Card className="mt-6 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-900">
                    <Sparkles className="w-5 h-5" />
                    Sugerencias Inteligentes de IA
                    <Badge variant="secondary" size="sm" className="bg-purple-700 text-white border-purple-800">
                      {aiSuggestions.length} recomendaciones
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {aiSuggestions.map((suggestion, index) => (
                      <div key={suggestion.id} className="bg-white/80 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {suggestion.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {suggestion.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={suggestion.type === 'cross-sell' ? 'default' : 
                                        suggestion.type === 'discount' ? 'secondary' : 'outline'} 
                                size="sm"
                              >
                                {suggestion.type === 'cross-sell' ? 'Venta Cruzada' : 
                                 suggestion.type === 'discount' ? 'Descuento' : 'Mantenimiento'}
                              </Badge>
                              <span className="text-xs text-purple-600 font-medium">
                                {suggestion.confidence}% confianza
                              </span>
                            </div>
                          </div>
                          
                          {(suggestion.type === 'cross-sell' || suggestion.type === 'discount') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => applySuggestion(suggestion)}
                              className="ml-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                            >
                              Aplicar
                            </Button>
                          )}
                        </div>
                        
                        {suggestion.product && (
                          <div className="mt-3 p-3 bg-purple-50 rounded border-l-4 border-l-purple-300">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{suggestion.product.name}</span>
                              <span className="text-green-600 font-bold">
                                {formatARS(suggestion.product.price)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel de Carrito y Checkout */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrito de Compras
                  {totalItems > 0 && (
                    <Badge variant="default" size="sm">
                      {totalItems} productos
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                {isEmpty ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>El carrito está vacío</p>
                    <p className="text-sm">Agregue productos para continuar</p>
                  </div>
                ) : (
                  <>
                    {/* Items del carrito */}
                    <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">{item.brand}</p>
                            <p className="text-sm font-bold text-green-600">
                              {formatARS(item.price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Resumen */}
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatARS(subtotal)}</span>
                      </div>
                      {discountPercent > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Descuento ({discountPercent}%):</span>
                          <span>-{formatARS(discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">{formatARS(total)}</span>
                      </div>
                    </div>

                    {/* Botones de descuento */}
                    <div className="border-t pt-2 mb-4">
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setShowDiscountDialog(true)}
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          disabled={discountPercent > 0}
                        >
                          💰 Descuento
                        </Button>
                        {discountPercent > 0 && (
                          <Button
                            onClick={() => applyDiscount(0)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            ❌
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => setShowPaymentDialog(true)}
                        className="w-full"
                        size="lg"
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        Procesar Venta
                      </Button>
                      
                      <Button
                        onClick={() => {
                          clearCart();
                          setAiSuggestions([]);
                          setSalesInsights(null);
                          if (aiAssistantActive) {
                            success('🗑️ Carrito limpiado - Análisis IA reiniciado');
                          }
                        }}
                        variant="ghost"
                        className="w-full text-red-600 hover:text-red-700"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar Carrito
                      </Button>
                    </div>
                  </>
                )}

                {/* Insights de IA */}
                {aiAssistantActive && salesInsights && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900 text-sm">Análisis IA</h4>
                        <p className="text-xs text-blue-700 mt-1">{salesInsights.message}</p>
                        
                        {salesInsights.savings > 0 && (
                          <div className="mt-2 p-2 bg-green-100 rounded border border-green-200">
                            <p className="text-xs font-medium text-green-800">
                              💰 Ahorro potencial: {formatARS(salesInsights.savings)}
                            </p>
                          </div>
                        )}
                        
                        {salesInsights.recommendations.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-blue-800 mb-1">Recomendaciones:</p>
                            <ul className="space-y-1">
                              {salesInsights.recommendations.map((rec, i) => (
                                <li key={i} className="text-xs text-blue-700">• {rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de Cliente */}
        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                {invoiceType === 'QUOTE' ? 'Presupuesto - Datos del Cliente' :
                 invoiceType === 'A' ? 'Factura A - Datos del Cliente (Obligatorio)' :
                 invoiceType === 'B' ? 'Factura B - Datos del Cliente' :
                 'Datos del Cliente'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Información para factura A */}
              {invoiceType === 'A' && (
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <p className="text-sm text-amber-800">
                    <strong>Factura A:</strong> Se requieren datos completos del cliente (Responsable Inscripto)
                  </p>
                </div>
              )}
              
              {/* Información para factura B */}
              {invoiceType === 'B' && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Factura B:</strong> Se requiere al menos el nombre del cliente
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nombre {invoiceType === 'A' || invoiceType === 'B' || invoiceType === 'QUOTE' ? '*' : ''}
                </label>
                <Input
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                  placeholder={invoiceType === 'A' ? "Razón social completa" : "Nombre del cliente"}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  CUIT {invoiceType === 'A' ? '*' : ''}
                </label>
                <Input
                  value={customerInfo.cuit}
                  onChange={(e) => setCustomerInfo({...customerInfo, cuit: e.target.value})}
                  placeholder="20-12345678-9"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                  placeholder="email@ejemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <Input
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                  placeholder="+54 11 1234-5678"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Dirección {invoiceType === 'A' ? '*' : ''}
                </label>
                <Textarea
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                  placeholder={invoiceType === 'A' ? "Dirección fiscal completa" : "Dirección (opcional)"}
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomerDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (invoiceType === 'QUOTE') {
                    setDocumentType('quote');
                    generateQuote();
                  } else {
                    setDocumentType('invoice');
                    processSale();
                  }
                }}
                disabled={
                  // Para factura A: requiere nombre, CUIT y dirección
                  invoiceType === 'A' 
                    ? (!customerInfo.name.trim() || !customerInfo.cuit?.trim() || !customerInfo.address.trim())
                    // Para presupuestos y factura B: solo requiere nombre
                    : (invoiceType === 'B' || invoiceType === 'QUOTE') && !customerInfo.name.trim()
                }
              >
                {invoiceType === 'QUOTE' ? 'Generar Presupuesto' : 'Procesar Factura'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Descuentos */}
        <Dialog open={showDiscountDialog} onOpenChange={setShowDiscountDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Aplicar Descuento
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Tipo de descuento</label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={customDiscount.type === 'percentage' ? 'default' : 'outline'}
                    onClick={() => setCustomDiscount({ type: 'percentage', value: 0 })}
                    className="w-full"
                  >
                    Porcentaje (%)
                  </Button>
                  <Button
                    variant={customDiscount.type === 'fixed' ? 'default' : 'outline'}
                    onClick={() => setCustomDiscount({ type: 'fixed', value: 0 })}
                    className="w-full"
                  >
                    Monto Fijo ($)
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {customDiscount.type === 'percentage' ? 'Porcentaje de descuento' : 'Monto de descuento'}
                </label>
                <Input
                  type="number"
                  min="0"
                  max={customDiscount.type === 'percentage' ? "100" : subtotal.toString()}
                  value={customDiscount.value === 0 ? '' : customDiscount.value}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || value === null) {
                      setCustomDiscount({...customDiscount, value: 0});
                    } else {
                      setCustomDiscount({...customDiscount, value: parseFloat(value) || 0});
                    }
                  }}
                  placeholder={customDiscount.type === 'percentage' ? 'Ej: 10' : 'Ej: 5000'}
                />
              </div>
              
              {customDiscount.value > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900 font-medium">Vista previa:</p>
                  <div className="text-sm text-blue-800 mt-1">
                    <p>Subtotal: {formatARS(subtotal)}</p>
                    <p>Descuento: -{customDiscount.type === 'percentage' 
                      ? `${customDiscount.value}% (${formatARS(subtotal * customDiscount.value / 100)})` 
                      : formatARS(customDiscount.value)}
                    </p>
                    <p className="font-bold">Total: {formatARS(
                      customDiscount.type === 'percentage' 
                        ? subtotal * (1 - customDiscount.value / 100)
                        : subtotal - customDiscount.value
                    )}</p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDiscountDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCustomDiscount}
                disabled={customDiscount.value <= 0}
              >
                Aplicar Descuento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Procesamiento */}
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Procesar Venta
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Tipo de factura */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Factura</label>
                <Select 
                  value={invoiceType} 
                  onChange={setInvoiceType}
                  options={[
                    { value: 'C', label: 'Factura C - Consumidor Final' },
                    { value: 'A', label: 'Factura A - Responsable Inscripto' },
                    { value: 'B', label: 'Factura B - Responsable Inscripto' },
                    { value: 'QUOTE', label: 'Presupuesto' }
                  ]}
                />
              </div>

              {/* Forma de pago */}
              <div>
                <label className="block text-sm font-medium mb-1">Forma de Pago</label>
                <Select 
                  value={paymentMethod} 
                  onChange={setPaymentMethod}
                  options={[
                    { value: 'cash', label: '💵 Efectivo' },
                    { value: 'card', label: '💳 Tarjeta de Débito' },
                    { value: 'credit', label: '🏦 Tarjeta de Crédito' },
                    { value: 'transfer', label: '🔄 Transferencia' }
                  ]}
                  placeholder="Seleccionar método"
                />
              </div>
              
              {/* Resumen del total */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total a cobrar:</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatARS(total)}
                  </span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  // Si es consumidor final (C) - procesar directo
                  if (invoiceType === 'C') {
                    setDocumentType('invoice');
                    setShowPaymentDialog(false);
                    processSale();
                  } else {
                    // Si es factura A, B o presupuesto, requiere datos del cliente
                    setShowPaymentDialog(false);
                    setShowCustomerDialog(true);
                  }
                }}
                disabled={processing}
                className="gap-2"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {invoiceType === 'C' ? 'Procesar Venta' : 'Continuar'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Ticket Preview */}
        {showTicketDialog && currentTicketData && (
          <Dialog open={showTicketDialog} onOpenChange={(open) => !open && setShowTicketDialog(false)}>
            <DialogContent className="max-w-md p-0">
              <TicketPreview
                saleData={currentTicketData}
                onPrint={() => completeSale(currentTicketData)}
                onClose={() => {
                  setShowTicketDialog(false);
                  setCurrentTicketData(null);
                  // Si el usuario cierra sin imprimir, limpiar carrito de todas formas
                  setTimeout(() => completeSale(currentTicketData), 100);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default VentasFacturacion;