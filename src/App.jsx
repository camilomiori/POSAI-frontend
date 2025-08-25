import React, { useState } from 'react';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Brain, 
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Search,
  Zap
} from 'lucide-react';
import Button from './components/ui/Button';

function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [cartItems, setCartItems] = useState([]);

  // Mock data
  const kpis = [
    { title: 'Ventas del Día', value: '$85,400', icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Órdenes', value: '24', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Productos', value: '156', icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Clientes', value: '48', icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const productos = [
    { id: 1, name: 'Cubierta 80/100-21', price: 56000, stock: 12, category: 'Neumáticos' },
    { id: 2, name: 'Cámara 21" reforzada', price: 9800, stock: 25, category: 'Accesorios' },
    { id: 3, name: 'Kit cadena y coronas', price: 89000, stock: 8, category: 'Transmisión' },
    { id: 4, name: 'Filtro de aire K&N', price: 25000, stock: 35, category: 'Filtros' },
  ];

  const addToCart = (product) => {
    const existing = cartItems.find(item => item.id === product.id);
    if (existing) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }
  };

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200/50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">POS AI System</h1>
                <p className="text-xs text-gray-500">Sistema Inteligente v2.1.0</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-emerald-700">IA Activa</span>
              </div>
              <Button variant="outline">Usuario Demo</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        
        {/* Sidebar */}
        <aside className="w-64 bg-white/95 backdrop-blur-lg border-r border-neutral-200/50 shadow-lg min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                { id: 'ventas', label: 'Ventas', icon: ShoppingCart },
                { id: 'productos', label: 'Productos', icon: Package },
                { id: 'ai', label: 'Centro IA', icon: Brain },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${
                      activeSection === item.id
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'hover:bg-neutral-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'ai' && (
                      <div className="ml-auto flex items-center gap-1">
                        <Zap className="w-3 h-3 text-emerald-500" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          
          {/* Dashboard */}
          {activeSection === 'dashboard' && (
            <div className="p-6 space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Dashboard Inteligente</h2>
                <p className="text-gray-600 mt-1">Panel de control con análisis de IA</p>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpis.map((kpi, index) => {
                  const Icon = kpi.icon;
                  return (
                    <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 shadow-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${kpi.bg} flex items-center justify-center`}>
                          <Icon className={`w-6 h-6 ${kpi.color}`} />
                        </div>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">{kpi.title}</h3>
                        <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* AI Insights */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-emerald-200/50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-gray-900">Insights de IA</h3>
                  <div className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                    Tiempo Real
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-900 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Tendencia Positiva
                    </h4>
                    <p className="text-sm text-green-700 mt-1">Las ventas aumentaron 15.3% esta semana</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Predicción IA
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">Se espera incremento del 8% próximos 7 días</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ventas */}
          {activeSection === 'ventas' && (
            <div className="flex h-screen">
              {/* Productos */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Productos</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      className="pl-10 pr-4 py-2 border border-neutral-200 rounded-2xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productos.map((producto) => (
                    <div key={producto.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-neutral-200/50 shadow-lg p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900">{producto.name}</h3>
                        <p className="text-sm text-gray-500">{producto.category}</p>
                      </div>
                      
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-lg font-bold text-gray-900">
                          ${producto.price.toLocaleString()}
                        </span>
                        <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                          Stock: {producto.stock}
                        </div>
                      </div>

                      <Button 
                        onClick={() => addToCart(producto)}
                        className="w-full gap-2"
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrito */}
              <div className="w-80 bg-white/95 backdrop-blur-lg border-l border-neutral-200/50 shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Carrito ({cartItems.length})
                </h3>

                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Carrito vacío</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {cartItems.map((item) => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                          <h4 className="font-medium text-gray-900 text-sm">{item.name}</h4>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                            <span className="font-semibold">${(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold">Total:</span>
                        <span className="text-xl font-bold text-blue-600">${total.toLocaleString()}</span>
                      </div>
                      <Button className="w-full">Procesar Venta</Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Otras secciones */}
          {activeSection === 'productos' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Gestión de Productos</h2>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-neutral-200/50 shadow-lg p-6">
                <p className="text-gray-600">Módulo de productos en desarrollo...</p>
              </div>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-6">Centro de Inteligencia Artificial</h2>
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-3xl border border-emerald-200/50 shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-8 h-8 text-emerald-600" />
                  <h3 className="text-xl font-semibold text-emerald-900">Sistema de IA Activo</h3>
                </div>
                <p className="text-emerald-700 mb-4">El motor de inteligencia artificial está analizando patrones y generando insights en tiempo real.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900">Predicciones Hoy</h4>
                    <p className="text-2xl font-bold text-purple-600">1,247</p>
                  </div>
                  <div className="bg-white/80 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900">Precisión Promedio</h4>
                    <p className="text-2xl font-bold text-green-600">94.3%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;