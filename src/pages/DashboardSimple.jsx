import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  BarChart3,
  Brain,
  AlertTriangle,
  Target,
  TrendingUp,
  Zap,
  Activity,
  TrendingDown,
  Users,
  Calendar,
  Bell,
  RefreshCw,
  Settings,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Share,
  Maximize,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { AdvancedChart, PieChart, LineChart, BarChart } from '../components/charts/ChartsSimple';
import { apiService, getAiEngine, salesHistoryService, cashRegisterService } from '../services';
import { formatPrice, formatDateTime, formatPercentage, formatARS } from '../utils/formatters';
import { useAuth, useNotifications, useToast } from '../hooks';
import { NOTIFICATION_TYPES, DEMAND_TRENDS } from '../utils/constants';
import { CashRegisterModal } from '../components/common';

const DashboardSimple = () => {
  const navigate = useNavigate();
  const { user, hasPermission, isAdmin, isSupervisor } = useAuth();
  const { addNotification } = useNotifications();
  const { success, error, info, ai } = useToast();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  
  // Estados para ventas
  const [salesHistory, setSalesHistory] = useState([]);
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [salesFilter, setSalesFilter] = useState('today'); // 'today', 'week', 'month', 'all'
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [chartsData, setChartsData] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showAiInsights, setShowAiInsights] = useState(true);
  const [reportsData, setReportsData] = useState(null);
  
  // Estados para gestión de caja
  const [cashMetrics, setCashMetrics] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState('view'); // 'open', 'close', 'movement', 'view'
  
  // KPIs calculados con memoización (DEBE estar antes de cualquier return)
  const kpis = useMemo(() => {
    if (!dashboardData?.kpis) return [];
    
    // Usar datos reales de ventas si están disponibles
    const realTotalSales = todayMetrics?.totalAmount || 0;
    const realTotalOrders = todayMetrics?.totalSales || 0;
    const realAvgTicket = todayMetrics?.averageTicket || 0;
    
    const baseKpis = [
      {
        title: 'Ventas de Hoy',
        value: formatARS(realTotalSales > 0 ? realTotalSales : dashboardData?.kpis?.totalSales ?? 0),
        change: dashboardData?.kpis?.salesGrowth ?? 0,
        target: dashboardData?.kpis?.salesTarget ?? 0,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        action: () => navigate('/ventas'),
        realData: realTotalSales > 0
      },
      {
        title: 'Ventas Procesadas',
        value: (realTotalOrders > 0 ? realTotalOrders : dashboardData?.kpis?.totalOrders ?? 0).toLocaleString(),
        change: dashboardData?.kpis?.ordersGrowth ?? 0,
        target: dashboardData?.kpis?.ordersTarget ?? 0,
        icon: ShoppingCart,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        action: () => navigate('/ventas'),
        realData: realTotalOrders > 0
      },
      {
        title: 'Ticket Promedio',
        value: formatARS(realAvgTicket > 0 ? realAvgTicket : dashboardData?.kpis?.avgTicket ?? 0),
        change: dashboardData?.kpis?.ticketGrowth ?? 0,
        target: dashboardData?.kpis?.ticketTarget ?? 0,
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        action: () => info('Ver detalles de tickets promedio')
      },
      {
        title: 'Productos Activos',
        value: (dashboardData?.kpis?.activeProducts ?? 0).toLocaleString(),
        change: dashboardData?.kpis?.productsGrowth ?? 0,
        target: dashboardData?.kpis?.productsTarget ?? 0,
        icon: Package,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        action: () => navigate('/productos')
      }
    ];
    
    // Agregar KPI de IA si está disponible
    if (performanceMetrics) {
      baseKpis.push({
        title: 'Precisión IA',
        value: `${(performanceMetrics.aiAccuracy * 100).toFixed(1)}%`,
        change: 2.3, // Simulado
        icon: Brain,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        action: () => navigate('/ai-center')
      });
    }
    
    return baseKpis;
  }, [dashboardData, performanceMetrics, navigate, info, todayMetrics]);

  // Filtrar ventas según el filtro seleccionado
  const filteredSales = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    switch (salesFilter) {
      case 'today':
        return salesHistory.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= today;
        });
      case 'week':
        return salesHistory.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= weekAgo;
        });
      case 'month':
        return salesHistory.filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= monthAgo;
        });
      case 'all':
      default:
        return salesHistory;
    }
  }, [salesHistory, salesFilter]);

  // Función para generar datos de reportes basados en ventas reales
  const generateReportsData = useCallback((allSales, todayStats) => {
    if (!allSales || allSales.length === 0) {
      return {
        hourlyData: [],
        topProducts: [],
        dailyComparison: {},
        trends: {},
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          avgTicket: 0,
          bestHour: 'N/A',
          topProduct: 'N/A'
        }
      };
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Ventas de hoy
    const todaySales = allSales.filter(sale => {
      const saleDate = new Date(sale.date || sale.timestamp);
      return saleDate >= today;
    });

    // Ventas de ayer para comparación
    const yesterdaySales = allSales.filter(sale => {
      const saleDate = new Date(sale.date || sale.timestamp);
      return saleDate >= yesterday && saleDate < today;
    });

    // 1. Datos por horas (0-23)
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourSales = todaySales.filter(sale => {
        const saleDate = new Date(sale.date || sale.timestamp);
        return saleDate.getHours() === hour;
      });
      
      const revenue = hourSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      
      hourlyData.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        sales: hourSales.length,
        revenue,
        formattedRevenue: formatARS(revenue)
      });
    }

    // 2. Top productos (simulado basado en ventas)
    const productSales = {};
    todaySales.forEach(sale => {
      if (sale.items) {
        sale.items.forEach(item => {
          const productId = item.id || item.productId;
          if (!productSales[productId]) {
            productSales[productId] = {
              id: productId,
              name: item.name || `Producto ${productId}`,
              quantity: 0,
              revenue: 0,
              category: item.category || 'General'
            };
          }
          productSales[productId].quantity += item.quantity || 1;
          productSales[productId].revenue += (item.price || 0) * (item.quantity || 1);
        });
      }
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        ...product,
        formattedRevenue: formatARS(product.revenue)
      }));

    // 3. Comparación diaria
    const todayRevenue = todaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const yesterdayRevenue = yesterdaySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    
    const dailyComparison = {
      today: {
        sales: todaySales.length,
        revenue: todayRevenue,
        formattedRevenue: formatARS(todayRevenue),
        avgTicket: todaySales.length > 0 ? todayRevenue / todaySales.length : 0
      },
      yesterday: {
        sales: yesterdaySales.length,
        revenue: yesterdayRevenue,
        formattedRevenue: formatARS(yesterdayRevenue),
        avgTicket: yesterdaySales.length > 0 ? yesterdayRevenue / yesterdaySales.length : 0
      },
      growth: {
        sales: yesterdaySales.length > 0 ? ((todaySales.length - yesterdaySales.length) / yesterdaySales.length * 100) : 0,
        revenue: yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100) : 0
      }
    };

    // 4. Tendencias y análisis
    const bestHour = hourlyData.reduce((best, current) => 
      current.revenue > best.revenue ? current : best, hourlyData[0] || { hour: 'N/A' }
    );

    const trends = {
      peakHour: bestHour.hour,
      peakRevenue: formatARS(bestHour.revenue),
      totalHoursActive: hourlyData.filter(h => h.sales > 0).length,
      averageHourlyRevenue: formatARS(todayRevenue / 24),
      growthTrend: dailyComparison.growth.revenue > 0 ? 'up' : dailyComparison.growth.revenue < 0 ? 'down' : 'stable'
    };

    // 5. Resumen ejecutivo
    const summary = {
      totalSales: todaySales.length,
      totalRevenue: todayRevenue,
      formattedRevenue: formatARS(todayRevenue),
      avgTicket: formatARS(dailyComparison.today.avgTicket),
      bestHour: bestHour.hour,
      topProduct: topProducts[0]?.name || 'N/A',
      growthRate: `${dailyComparison.growth.revenue > 0 ? '+' : ''}${dailyComparison.growth.revenue.toFixed(1)}%`
    };

    return {
      hourlyData,
      topProducts,
      dailyComparison,
      trends,
      summary,
      lastUpdated: new Date().toISOString()
    };
  }, []);

  // Función separada para cargar datos de IA (MOVIDA ANTES DE loadData)
  const loadAiData = useCallback(async () => {
    try {
      const aiEngine = (await getAiEngine()).default;
      
      // Cargar insights de IA
      const insights = await aiEngine.getBusinessInsights();
      setAiInsights(insights.slice(0, 6)); // Limitar a 6 insights principales
      
      // Cargar predicciones de productos críticos
      const criticalProducts = [1, 2, 3, 4, 5]; // IDs de productos críticos
      const productPredictions = [];
      for (const productId of criticalProducts) {
        const prediction = await aiEngine.predictDemand(productId, 7);
        if (prediction) {
          productPredictions.push({
            id: productId,
            name: prediction?.productName || 'Producto desconocido',
            currentStock: prediction?.factors?.currentStock ?? 0,
            prediction: {
              predictedSales: prediction?.predictedSales ?? 0,
              confidence: prediction?.confidence ?? 0,
              recommendation: prediction?.recommendation || 'Sin recomendación',
              daysToStockout: prediction?.daysToStockout ?? 0,
              revenueImpact: prediction?.profitImpact?.expectedProfit ?? 0
            }
          });
        }
      }
      setPredictions(productPredictions);
      
      // Cargar recomendaciones de IA
      const recommendations = await aiEngine.getRecommendations([]);
      setAiRecommendations(recommendations.slice(0, 5));
      
      // Cargar alertas críticas
      const alerts = await aiEngine.getCriticalAlerts();
      setCriticalAlerts(alerts);
      
      // Cargar análisis de mercado
      const market = await aiEngine.getMarketAnalysis();
      setMarketAnalysis(market);
      
      // Cargar métricas de performance IA
      const systemMetrics = await aiEngine.getSystemMetrics();
      setPerformanceMetrics({
        aiAccuracy: systemMetrics.accuracy?.demandPrediction || 0.94,
        predictionsToday: systemMetrics.predictionsToday || 47,
        insightsGenerated: insights.length,
        optimizationsApplied: systemMetrics.dataPoints?.rules || 12,
        processingTime: systemMetrics.processingTime?.avgPrediction || '245ms',
        modelVersion: systemMetrics.modelVersion || '3.2.1',
        dataPoints: systemMetrics.dataPoints?.total || systemMetrics.predictionsToday || 125847
      });
      
      // Notificar sobre nuevos insights críticos
      const criticalInsights = insights.filter(i => i.priority === 'urgent' || i.priority === 'high');
      if (criticalInsights.length > 0) {
        addNotification({
          type: NOTIFICATION_TYPES.AI,
          title: `${criticalInsights.length} nuevos insights críticos`,
          message: 'IA ha detectado oportunidades importantes',
          timestamp: Date.now()
        });
      }
      
      ai('Dashboard actualizado con análisis de IA avanzado');
      
    } catch (aiError) {
      console.error('Error loading AI data:', aiError);
      info('Datos de IA no disponibles, usando análisis básico');
    }
  }, []); // loadAiData no depende de ningún estado/props

  const loadData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Datos básicos del dashboard con período seleccionado
      const response = await apiService.getDashboardData({ timeRange });
      setDashboardData(response);
      
      // Cargar historial de ventas reales desde localStorage
      const allSales = salesHistoryService.getAllSales();
      const todayStats = salesHistoryService.getTodayMetrics();
      
      setSalesHistory(allSales);
      setTodayMetrics(todayStats);
      
      // Generar datos de reportes basados en ventas reales
      const reportsData = generateReportsData(allSales, todayStats);
      setReportsData(reportsData);
      
      // Cargar métricas de caja
      const cashMetrics = cashRegisterService.getTodayMetrics();
      setCashMetrics(cashMetrics);
      
      // Cargar datos de IA de forma asíncrona
      await loadAiData();
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      error('Error al cargar el dashboard. Usando datos de demostración.');
      
      // Datos de demostración realistas para el POS
      setDashboardData({
        kpis: {
          totalSales: 4890000,
          salesGrowth: 28.7,
          totalOrders: 342,
          ordersGrowth: 18.5,
          avgTicket: 14298,
          ticketGrowth: 8.7,
          topProduct: 'Neumático Michelin Energy XM2 185/65R15',
          activeProducts: 156,
          productsGrowth: 12.3,
          salesTarget: 5200000,
          ordersTarget: 380,
          ticketTarget: 15000,
          productsTarget: 180
        }
      });
      
      // Agregar insights básicos de IA (sin cargar aiEngine)
      setAiInsights([
        {
          type: 'trend',
          title: 'Pico de demanda detectado',
          message: 'IA predice incremento del 35% en neumáticos por cambio estacional.',
          priority: 'high'
        },
        {
          type: 'opportunity',
          title: 'Oportunidad de venta cruzada',
          message: 'Clientes de neumáticos tienen 78% probabilidad de necesitar alineación.',
          priority: 'medium'
        }
      ]);
      
      // Agregar métricas de performance de IA
      setPerformanceMetrics({
        aiAccuracy: 0.967,
        predictionsToday: 47,
        insightsGenerated: 23,
        optimizationsApplied: 12,
        modelVersion: '3.2.1',
        lastTraining: new Date().toISOString(),
        processingTime: '0.234s',
        dataPoints: 125847
      });
      
      // Agregar alertas críticas
      setCriticalAlerts([
        {
          title: 'Stock crítico - Neumático Michelin',
          message: 'Michelin Energy XM2 185/65R15: Solo 4 unidades. Producto estrella con alta rotación.',
          action: 'Orden de compra urgente',
          priority: 'urgent'
        },
        {
          title: 'Oportunidad de mercado',
          message: 'Demanda de baterías incrementó 23% esta semana. Considerar promoción especial.',
          action: 'Crear promoción',
          priority: 'high'
        }
      ]);
      
      // Agregar predicciones de productos
      setPredictions([
        {
          id: 1,
          name: 'Neumático Michelin Energy XM2 185/65R15',
          currentStock: 4,
          prediction: {
            predictedSales: 18,
            confidence: 96,
            recommendation: 'reorder_urgent',
            daysToStockout: 2,
            suggestedOrder: 45,
            revenueImpact: 67500
          }
        },
        {
          id: 2,
          name: 'Aceite Castrol GTX 15W-40 4L',
          currentStock: 12,
          prediction: {
            predictedSales: 8,
            confidence: 89,
            recommendation: 'reorder',
            daysToStockout: 3,
            suggestedOrder: 24,
            revenueImpact: 28800
          }
        }
      ]);
      
      // Agregar recomendaciones de IA
      setAiRecommendations([
        {
          type: 'cross_selling',
          title: 'Promoción Neumático + Alineación',
          message: 'Ofrecer servicio de alineación con descuento del 15% en compra de neumáticos.',
          impact: 'high',
          probability: 78,
          revenueIncrease: 11200
        },
        {
          type: 'price_optimization',
          title: 'Ajuste dinámico - Frenos Brembo',
          message: 'Reducir precio 3.2% mantendrá competitividad vs. competencia.',
          impact: 'medium',
          probability: 67,
          revenueIncrease: 5400
        }
      ]);
      
      // Agregar análisis de mercado
      setMarketAnalysis({
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
            category: 'Sistema de frenos',
            trend: 'stable',
            change: 5.3,
            analysis: 'Crecimiento estable, oportunidad en frenos cerámicos'
          }
        ],
        opportunities: [
          {
            title: 'Servicios de instalación premium',
            description: 'Expandir a servicios de instalación de alta gama con garantía extendida',
            potentialRevenue: 125000,
            probability: 78,
            timeframe: '3 meses'
          },
          {
            title: 'Alianza con talleres locales',
            description: 'Red de partners para referidos mutuos y descuentos cruzados',
            potentialRevenue: 89000,
            probability: 85,
            timeframe: '2 meses'
          }
        ]
      });
      
      // Agregar datos para gráficos
      setChartsData({
        salesData: [
          { name: 'Ene', value: 4200000, orders: 285 },
          { name: 'Feb', value: 3800000, orders: 260 },
          { name: 'Mar', value: 5100000, orders: 340 },
          { name: 'Abr', value: 4700000, orders: 310 },
          { name: 'May', value: 5800000, orders: 380 },
          { name: 'Jun', value: 4890000, orders: 342 }
        ],
        categoryData: [
          { name: 'Neumáticos', value: 35, color: '#3B82F6' },
          { name: 'Aceites y Lubricantes', value: 25, color: '#8B5CF6' },
          { name: 'Sistema de Frenos', value: 20, color: '#10B981' },
          { name: 'Transmisión', value: 12, color: '#F59E0B' },
          { name: 'Otros', value: 8, color: '#EF4444' }
        ],
        hourlyData: [
          { hour: '09:00', sales: 180000, customers: 12 },
          { hour: '10:00', sales: 250000, customers: 18 },
          { hour: '11:00', sales: 320000, customers: 24 },
          { hour: '12:00', sales: 290000, customers: 20 },
          { hour: '13:00', sales: 210000, customers: 15 },
          { hour: '14:00', sales: 380000, customers: 28 },
          { hour: '15:00', sales: 420000, customers: 32 },
          { hour: '16:00', sales: 460000, customers: 35 },
          { hour: '17:00', sales: 380000, customers: 29 },
          { hour: '18:00', sales: 320000, customers: 25 }
        ]
      });
      
      // Agregar actividad reciente
      setRecentActivity([
        {
          id: 1,
          type: 'sale',
          message: 'Venta de neumático Michelin - $37,500',
          time: 'Hace 3 min',
          status: 'success'
        },
        {
          id: 2,
          type: 'order',
          message: 'Orden #2847 completada - Cambio de aceite',
          time: 'Hace 12 min',
          status: 'info'
        },
        {
          id: 3,
          type: 'inventory',
          message: 'Stock crítico: Pastillas de freno Brembo',
          time: 'Hace 25 min',
          status: 'warning'
        },
        {
          id: 4,
          type: 'customer',
          message: 'Nuevo cliente registrado - Juan Pérez',
          time: 'Hace 45 min',
          status: 'success'
        },
        {
          id: 5,
          type: 'ai',
          message: 'IA detectó oportunidad de venta cruzada',
          time: 'Hace 1 hora',
          status: 'ai'
        }
      ]);
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, loadAiData]); // loadData depende de timeRange y loadAiData

  // Inicializar datos
  useEffect(() => {
    loadData(); // Cargar datos al montar el componente
  }, [loadData]);

  // Efecto para recargar datos cuando cambia el timeRange
  useEffect(() => {
    console.log('TimeRange changed, reloading data:', timeRange);
    loadData();
  }, [timeRange, loadData]);

  // Función para manejar acciones rápidas
  const handleQuickAction = (action) => {
    switch (action) {
      case 'nueva-venta':
        navigate('/ventas');
        break;
      case 'inventario':
        navigate('/productos');
        break;
      case 'ai-center':
        navigate('/ai-center');
        break;
      case 'configuracion':
        if (hasPermission('manage_system')) {
          navigate('/configuracion');
        } else {
          error('No tienes permisos para acceder a configuración');
        }
        break;
      case 'usuarios':
        if (isAdmin) {
          navigate('/administracion');
        } else {
          error('Solo administradores pueden gestionar usuarios');
        }
        break;
      case 'reportes':
        info('Función de reportes próximamente disponible');
        break;
      default:
        info('Función en desarrollo');
    }
  };
  
  // Función para aplicar recomendación de IA
  const applyAiRecommendation = async (recommendation) => {
    try {
      ai(`Aplicando recomendación: ${recommendation.title}`);
      // Aquí iría la lógica para aplicar la recomendación
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular proceso
      success('Recomendación aplicada exitosamente');
      loadData(false); // Refresh sin loader
    } catch (err) {
      error('Error al aplicar la recomendación');
    }
  };
  
  // Función para exportar datos
  const exportDashboardData = () => {
    const dataToExport = {
      kpis: dashboardData?.kpis,
      insights: aiInsights,
      predictions: predictions,
      exportedAt: new Date().toISOString(),
      period: timeRange
    };
    
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `dashboard-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    success('Datos exportados exitosamente');
  };

  // Funciones para gestión de caja
  const handleCashOperation = (type) => {
    setCashModalType(type);
    setShowCashModal(true);
  };

  const handleCashSuccess = () => {
    // Recargar datos después de operación de caja
    loadData(false);
  };

  // Early return para loading (después de todos los hooks)
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles avanzados */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Dashboard Inteligente
            {refreshing && <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />}
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <span>Bienvenido, {user?.nombre || 'Usuario'}</span>
            <span>•</span>
            <span>Última actualización: {formatDateTime(Date.now())}</span>
            {performanceMetrics && (
              <>
                <span>•</span>
                <span className="text-emerald-600 font-medium">
                  IA: {(performanceMetrics.aiAccuracy * 100).toFixed(1)}% precisión
                </span>
              </>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Selector de período */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 bg-white/90 backdrop-blur-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
          </div>

          {/* Botones de acción */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportDashboardData}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>

          {/* Toggle AI Insights */}
          <Button
            variant={showAiInsights ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAiInsights(!showAiInsights)}
            className="gap-2"
          >
            <Brain className="w-4 h-4" />
            {showAiInsights ? 'IA On' : 'IA Off'}
          </Button>
          
          {/* Indicador IA */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">IA Activa</span>
          </div>
        </div>
      </div>

      {/* KPIs Grid Mejorado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          const progress = kpi.target ? Math.min(100, (parseFloat(kpi.value.replace(/[^0-9.-]/g, '')) / kpi.target) * 100) : null;
          
          return (
            <Card 
              key={index} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer group ${
                selectedMetric === index ? 'ring-2 ring-blue-500 shadow-lg' : ''
              }`}
              onClick={() => {
                setSelectedMetric(selectedMetric === index ? null : index);
                kpi.action && kpi.action();
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${kpi.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? '+' : ''}{kpi.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    {kpi.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mb-1">
                    {kpi.value}
                  </p>
                  {kpi.target && (
                    <p className="text-xs text-gray-400">
                      Meta: {typeof kpi.target === 'number' && kpi.target > 1000 ? formatPrice(kpi.target) : kpi.target.toLocaleString()}
                    </p>
                  )}
                </div>
                
                {/* Barra de progreso hacia meta */}
                {progress !== null && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          progress >= 90 ? 'bg-green-500' : progress >= 70 ? 'bg-yellow-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {progress.toFixed(0)}% de la meta
                    </p>
                  </div>
                )}
                
                {/* Indicador de interactividad */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gestión de Caja */}
      {cashMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Control de Caja
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                cashMetrics.isOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {cashMetrics.isOpen ? '🟢 Abierta' : '🔴 Cerrada'}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {cashMetrics.formattedCurrentAmount}
                </div>
                <div className="text-sm text-blue-700">Dinero en Caja</div>
                {cashMetrics.isOpen && (
                  <div className="text-xs text-gray-600 mt-1">
                    Esperado: {cashMetrics.formattedExpectedAmount}
                  </div>
                )}
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {cashMetrics.formattedTotalSales}
                </div>
                <div className="text-sm text-green-700">Ventas Efectivo</div>
                <div className="text-xs text-gray-600 mt-1">
                  {cashMetrics.salesCount} operaciones
                </div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatARS(cashMetrics.payments.card)}
                </div>
                <div className="text-sm text-purple-700">Ventas Tarjeta</div>
                <div className="text-xs text-gray-600 mt-1">
                  + {formatARS(cashMetrics.payments.transfer)} transferencias
                </div>
              </div>
              
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {cashMetrics.movementsCount}
                </div>
                <div className="text-sm text-orange-700">Movimientos</div>
                <div className="text-xs text-gray-600 mt-1">
                  Hoy
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-6">
              {!cashMetrics.isOpen ? (
                <Button 
                  onClick={() => handleCashOperation('open')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Abrir Caja
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => handleCashOperation('view')}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Estado
                  </Button>
                  <Button 
                    onClick={() => handleCashOperation('movement')}
                    variant="outline"
                    size="sm"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Movimientos
                  </Button>
                  <Button 
                    onClick={() => handleCashOperation('close')}
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Cerrar Caja
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-green-600 font-semibold">✅ Sistema funcionando correctamente</div>
            <div className="text-sm text-gray-500 mt-2">
              Datos cargados: {dashboardData ? 'Sí' : 'No'}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Producto destacado: {dashboardData?.kpis?.topProduct || 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Meta de ventas:</span>
                <span className="font-semibold">{formatPrice(dashboardData?.kpis?.salesTarget || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Meta de órdenes:</span>
                <span className="font-semibold">{(dashboardData?.kpis?.ordersTarget || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Progreso:</span>
                <span className="font-semibold text-green-600">94.0%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Eficiencia:</span>
                <span className="font-semibold text-blue-600">Excelente</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tendencia:</span>
                <span className="font-semibold text-green-600">↗ Creciendo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Proyección:</span>
                <span className="font-semibold text-purple-600">+32% mensual</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sección de IA Avanzada */}
      {showAiInsights && aiInsights.length > 0 && (
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              Insights de Inteligencia Artificial
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                En Tiempo Real
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {aiInsights.map((insight, index) => {
                const getIconByType = (type) => {
                  switch (type) {
                    case 'trend': return TrendingUp;
                    case 'alert': return AlertTriangle;
                    case 'forecast': return Activity;
                    case 'ai': return Brain;
                    default: return Zap;
                  }
                };
                
                const getColorByPriority = (priority) => {
                  switch (priority) {
                    case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
                    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
                    case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
                    default: return 'text-green-600 bg-green-50 border-green-200';
                  }
                };
                
                const Icon = getIconByType(insight.type);
                const colorClass = getColorByPriority(insight.priority);
                
                return (
                  <div key={index} className={`flex items-start gap-3 p-4 rounded-xl bg-white/90 backdrop-blur-sm border transition-all duration-200 hover:shadow-md ${colorClass}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'urgent' ? 'destructive' : insight.priority === 'high' ? 'warning' : 'secondary'} 
                          size="sm"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{insight.message}</p>
                      
                      {insight.action && (
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => info(`Acción: ${insight.action}`)}
                            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            {insight.action} <ArrowUpRight className="w-3 h-3" />
                          </button>
                          
                          {insight.impact && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              insight.impact === 'positive' ? 'bg-green-100 text-green-700' : 
                              insight.impact === 'negative' ? 'bg-red-100 text-red-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {insight.impact === 'positive' ? '📈' : insight.impact === 'negative' ? '📉' : '📊'} Impacto
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas de Performance IA */}
      {performanceMetrics && (
        <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Rendimiento de IA
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                v{performanceMetrics.modelVersion}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {(performanceMetrics.aiAccuracy * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Precisión del Modelo</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performanceMetrics.predictionsToday}
                </div>
                <div className="text-sm text-gray-600">Predicciones Hoy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performanceMetrics.insightsGenerated}
                </div>
                <div className="text-sm text-gray-600">Insights Generados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {performanceMetrics.optimizationsApplied}
                </div>
                <div className="text-sm text-gray-600">Optimizaciones</div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Datos procesados: {performanceMetrics?.dataPoints?.toLocaleString() || '0'} puntos</span>
                <span>Tiempo de procesamiento: {performanceMetrics?.processingTime || '0ms'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Alertas Críticas
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {criticalAlerts.length}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert, index) => (
                <div key={index} className={`flex items-start gap-3 p-4 rounded-lg border ${
                  alert.priority === 'urgent' 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    alert.priority === 'urgent' ? 'text-red-600' : 'text-orange-600'
                  }`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      alert.priority === 'urgent' ? 'text-red-900' : 'text-orange-900'
                    }`}>
                      {alert.title}
                    </h4>
                    <p className={`text-sm mt-1 ${
                      alert.priority === 'urgent' ? 'text-red-700' : 'text-orange-700'
                    }`}>
                      {alert.message}
                    </p>
                    <button className={`mt-2 text-xs px-3 py-1 rounded-full border font-medium ${
                      alert.priority === 'urgent' 
                        ? 'text-red-700 border-red-300 hover:bg-red-100' 
                        : 'text-orange-700 border-orange-300 hover:bg-orange-100'
                    }`}>
                      {alert.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predicciones de Productos */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Predicciones de Demanda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((product, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{product.name}</h4>
                      <p className="text-sm text-gray-600">Stock actual: {product.currentStock} unidades</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      product.prediction.recommendation === 'reorder_urgent' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {product.prediction.confidence}% confianza
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    <div>
                      <div className="text-gray-600">Ventas predichas</div>
                      <div className="font-semibold">{product.prediction.predictedSales} unidades</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Días hasta agotarse</div>
                      <div className={`font-semibold ${
                        product.prediction.daysToStockout <= 3 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {product.prediction.daysToStockout} días
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Orden sugerida</div>
                      <div className="font-semibold text-blue-600">{product.prediction.suggestedOrder} unidades</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Impacto en ingresos</div>
                      <div className="font-semibold text-green-600">{formatPrice(product.prediction.revenueImpact)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones de IA Mejoradas */}
      {showAiInsights && aiRecommendations.length > 0 && (
        <Card className="border-l-4 border-l-indigo-500 bg-gradient-to-r from-indigo-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Recomendaciones Inteligentes
                <Badge variant="ai" size="sm">
                  {aiRecommendations.length} disponibles
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai-center')}
                className="gap-2"
              >
                <Maximize className="w-4 h-4" />
                Ver todas
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiRecommendations.slice(0, 3).map((recommendation, index) => {
                const getTypeIcon = (type) => {
                  switch (type) {
                    case 'cross_selling': return TrendingUp;
                    case 'price_optimization': return BarChart3;
                    case 'inventory_optimization': return Package;
                    case 'customer_retention': return Users;
                    case 'upselling': return Target;
                    default: return Zap;
                  }
                };
                
                const TypeIcon = getTypeIcon(recommendation.type);
                
                return (
                  <div key={index} className="p-4 border border-indigo-200 rounded-xl bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200">
                    <div className="flex items-start gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        recommendation.impact === 'high' 
                          ? 'bg-green-100 text-green-600 border border-green-200' 
                          : 'bg-blue-100 text-blue-600 border border-blue-200'
                      }`}>
                        <TypeIcon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{recommendation.title}</h4>
                          <div className="flex gap-2">
                            <Badge 
                              variant={recommendation.impact === 'high' ? 'success' : 'default'} 
                              size="sm"
                            >
                              {recommendation.probability}% prob.
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{recommendation.message}</p>
                        
                        {recommendation.products && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {recommendation.products.map((product, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                                {product}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            +{formatPrice(recommendation.revenueIncrease)}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => applyAiRecommendation(recommendation)}
                            className="gap-2"
                          >
                            <Zap className="w-4 h-4" />
                            Aplicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análisis de Mercado */}
      {marketAnalysis && (
        <Card className="border-l-4 border-l-cyan-500 bg-gradient-to-r from-cyan-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              Análisis de Mercado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Tendencias por Categoría */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Tendencias por Categoría</h4>
                <div className="space-y-3">
                  {marketAnalysis.trends && marketAnalysis.trends.map((trend, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-white/80 border border-gray-100">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        trend.trend === 'up' ? 'bg-green-100 text-green-600' : 
                        trend.trend === 'down' ? 'bg-red-100 text-red-600' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {trend.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : trend.trend === 'down' ? (
                          <TrendingDown className="w-4 h-4" />
                        ) : (
                          <Activity className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="font-medium text-gray-900">{trend.category}</h5>
                          <span className={`text-sm font-semibold ${
                            trend.trend === 'up' ? 'text-green-600' : 
                            trend.trend === 'down' ? 'text-red-600' : 
                            'text-gray-600'
                          }`}>
                            {trend.trend === 'up' ? '+' : trend.trend === 'down' ? '-' : ''}{Math.abs(trend.change)}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{trend.analysis}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Oportunidades de Negocio */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Oportunidades de Negocio</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {marketAnalysis.opportunities && marketAnalysis.opportunities.map((opportunity, index) => (
                    <div key={index} className="p-4 rounded-lg bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200">
                      <div className="flex justify-between items-start mb-3">
                        <h5 className="font-semibold text-gray-900">{opportunity.title}</h5>
                        <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs rounded-full">
                          {opportunity.probability}% éxito
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{opportunity.description}</p>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {formatPrice(opportunity.potentialRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">Potencial en {opportunity.timeframe}</div>
                        </div>
                        <button className="px-3 py-1 bg-cyan-600 text-white text-xs rounded-full hover:bg-cyan-700">
                          Explorar oportunidad
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección de Gráficos y Visualizaciones */}
      {chartsData.salesData && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Análisis Visual</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ventas Mensuales</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <LineChart data={chartsData.salesData} title="" />
              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-green-600">+18.7%</div>
                  <div className="text-gray-500">vs mes anterior</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-blue-600">$4.9M</div>
                  <div className="text-gray-500">Promedio mensual</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-purple-600">314</div>
                  <div className="text-gray-500">Órdenes promedio</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Distribución por Categoría</h3>
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <PieChart data={chartsData.categoryData} title="" />
              <div className="mt-4 space-y-2">
                {chartsData.categoryData.slice(0, 3).map((category, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: category.color }}></div>
                      <span className="text-gray-700">{category.name}</span>
                    </div>
                    <span className="font-semibold">{category.value}%</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Análisis de Tendencias</h3>
                  <Activity className="w-5 h-5 text-cyan-600" />
                </div>
                <AdvancedChart data={chartsData.salesData} type="area" title="" />
                <div className="mt-4 grid grid-cols-4 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-blue-600">Pico</div>
                    <div className="text-gray-500">16:00 hrs</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600">Valle</div>
                    <div className="text-gray-500">13:00 hrs</div>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-600">Tendencia</div>
                    <div className="text-gray-500">↗ Creciente</div>
                  </div>
                  <div>
                    <div className="font-semibold text-orange-600">Proyección</div>
                    <div className="text-gray-500">+24% mes</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
                <Bell className="w-5 h-5 text-orange-600" />
              </div>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      activity.status === 'success' ? 'bg-green-500' :
                      activity.status === 'warning' ? 'bg-yellow-500' :
                      activity.status === 'info' ? 'bg-blue-500' :
                      activity.status === 'ai' ? 'bg-purple-500' : 'bg-gray-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Horas</h3>
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <BarChart data={chartsData.hourlyData} title="" />
              <div className="mt-4 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Hora pico: 16:00 - $460,000</span>
                  <span>35 clientes</span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Mes</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Meta de Ventas</span>
                    <span className="text-sm font-medium">{formatPrice(5200000)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>{formatPrice(4890000)} completado</span>
                    <span>94%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Nuevos Clientes</span>
                    <span className="text-sm font-medium">245</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full" style={{ width: '81%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>Meta: 300</span>
                    <span>81%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Productos Vendidos</span>
                    <span className="text-sm font-medium">1,847</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                    <span>Meta: 2,100</span>
                    <span>88%</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Historial de Ventas Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas Recientes */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Ventas Recientes
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={salesFilter}
                  onChange={(e) => setSalesFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-2 py-1"
                >
                  <option value="today">Hoy</option>
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mes</option>
                  <option value="all">Todas</option>
                </select>
                <Button size="sm" variant="outline" onClick={() => loadData(false)}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No hay ventas registradas para este período</p>
                <p className="text-xs text-gray-400">Las ventas aparecerán aquí automáticamente</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredSales.slice(0, 20).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        sale.documentType === 'invoice' ? 'bg-blue-100 text-blue-600' :
                        sale.documentType === 'quote' ? 'bg-purple-100 text-purple-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {sale.documentType === 'invoice' ? '📄' :
                         sale.documentType === 'quote' ? '📋' : '💰'}
                      </div>
                      <div>
                        <div className="font-medium text-sm">
                          {sale.id}
                          <Badge size="xs" className="ml-2 bg-green-100 text-green-700">Real</Badge>
                        </div>
                        <div className="text-xs text-gray-600">
                          {sale.customer?.name || 'Consumidor Final'} • 
                          {sale.items?.length || 0} productos • 
                          {formatDateTime(new Date(sale.date))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{formatARS(sale.total)}</div>
                      <div className="text-xs text-gray-500 uppercase">
                        {sale.payment?.method === 'cash' ? 'Efectivo' :
                         sale.payment?.method === 'card' ? 'Tarjeta' :
                         sale.payment?.method === 'credit' ? 'Crédito' :
                         sale.payment?.method === 'transfer' ? 'Transferencia' :
                         'Pendiente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métricas del Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              Métricas de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayMetrics ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatARS(todayMetrics.totalAmount)}</div>
                  <div className="text-sm text-green-700">Total Vendido</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">{todayMetrics.totalSales}</div>
                    <div className="text-xs text-blue-700">Ventas</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">{formatARS(todayMetrics.averageTicket)}</div>
                    <div className="text-xs text-purple-700">Ticket Prom.</div>
                  </div>
                </div>
                
                {Object.keys(todayMetrics.paymentMethods).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Métodos de Pago</h4>
                    <div className="space-y-2">
                      {Object.entries(todayMetrics.paymentMethods).map(([method, count]) => (
                        <div key={method} className="flex justify-between text-sm">
                          <span className="capitalize">
                            {method === 'cash' ? 'Efectivo' :
                             method === 'card' ? 'Tarjeta' :
                             method === 'credit' ? 'Crédito' :
                             method === 'transfer' ? 'Transferencia' :
                             method}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin datos para hoy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reportes Diarios */}
      {reportsData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Reportes Diarios
            </h2>
            <div className="text-sm text-gray-500">
              Actualizado: {formatDateTime(reportsData.lastUpdated)}
            </div>
          </div>

          {/* Resumen Ejecutivo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen Ejecutivo - {new Date().toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{reportsData.summary.totalSales}</div>
                  <div className="text-sm text-blue-700">Ventas Hoy</div>
                  <div className="text-xs text-green-600 font-medium mt-1">{reportsData.summary.growthRate}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{reportsData.summary.formattedRevenue}</div>
                  <div className="text-sm text-green-700">Ingresos</div>
                  <div className="text-xs text-gray-600">Ticket prom: {reportsData.summary.avgTicket}</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{reportsData.trends.peakHour}</div>
                  <div className="text-sm text-purple-700">Hora Pico</div>
                  <div className="text-xs text-gray-600">{reportsData.trends.peakRevenue}</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-bold text-orange-600">{reportsData.summary.topProduct}</div>
                  <div className="text-sm text-orange-700">Top Producto</div>
                  <div className="text-xs text-gray-600">{reportsData.trends.totalHoursActive}h activo</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráficos de Reportes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ventas por Hora */}
            <Card>
              <CardHeader>
                <CardTitle>Ventas por Hora - Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <BarChart 
                    data={reportsData.hourlyData}
                    xDataKey="hour"
                    yDataKey="sales"
                    color="#3B82F6"
                    title="Ventas"
                  />
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>• Promedio por hora: {reportsData.trends.averageHourlyRevenue}</p>
                  <p>• Horas activas: {reportsData.trends.totalHoursActive} de 24</p>
                </div>
              </CardContent>
            </Card>

            {/* Top Productos */}
            <Card>
              <CardHeader>
                <CardTitle>Top Productos - Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                {reportsData.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {reportsData.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-500' :
                            'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              {product.quantity} vendidos • {product.category}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-600">{product.formattedRevenue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No hay datos de productos para hoy</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Comparación Diaria */}
            <Card>
              <CardHeader>
                <CardTitle>Comparación Día a Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                    <div>
                      <div className="font-medium text-blue-900">Hoy</div>
                      <div className="text-sm text-blue-700">
                        {reportsData.dailyComparison.today.sales} ventas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        {reportsData.dailyComparison.today.formattedRevenue}
                      </div>
                      <div className="text-sm text-blue-700">
                        {formatARS(reportsData.dailyComparison.today.avgTicket)} promedio
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">Ayer</div>
                      <div className="text-sm text-gray-700">
                        {reportsData.dailyComparison.yesterday.sales} ventas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-600">
                        {reportsData.dailyComparison.yesterday.formattedRevenue}
                      </div>
                      <div className="text-sm text-gray-700">
                        {formatARS(reportsData.dailyComparison.yesterday.avgTicket)} promedio
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 border border-dashed border-gray-300 rounded-lg">
                    <div className="font-medium text-gray-900">Crecimiento</div>
                    <div className="text-right">
                      <div className={`text-xl font-bold flex items-center gap-1 ${
                        reportsData.dailyComparison.growth.revenue > 0 ? 'text-green-600' : 
                        reportsData.dailyComparison.growth.revenue < 0 ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {reportsData.dailyComparison.growth.revenue > 0 ? (
                          <ArrowUpRight className="w-5 h-5" />
                        ) : reportsData.dailyComparison.growth.revenue < 0 ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : null}
                        {reportsData.dailyComparison.growth.revenue > 0 ? '+' : ''}
                        {reportsData.dailyComparison.growth.revenue.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Ventas: {reportsData.dailyComparison.growth.sales > 0 ? '+' : ''}
                        {reportsData.dailyComparison.growth.sales.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tendencias y Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tendencias e Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="font-medium text-emerald-900 mb-1">Rendimiento General</div>
                    <div className="text-sm text-emerald-700">
                      Tendencia: <span className="font-medium capitalize">
                        {reportsData.trends.growthTrend === 'up' ? '📈 Creciente' :
                         reportsData.trends.growthTrend === 'down' ? '📉 Decreciente' :
                         '📊 Estable'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hora más productiva:</span>
                      <span className="font-medium">{reportsData.trends.peakHour}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Ingresos promedio/hora:</span>
                      <span className="font-medium">{reportsData.trends.averageHourlyRevenue}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Horas con actividad:</span>
                      <span className="font-medium">{reportsData.trends.totalHoursActive}h de 24h</span>
                    </div>
                  </div>

                  {reportsData.trends.growthTrend === 'up' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-sm text-green-800">
                        <strong>💡 Insight:</strong> Las ventas están creciendo. 
                        Considera aumentar el stock para la hora pico ({reportsData.trends.peakHour}).
                      </div>
                    </div>
                  )}

                  {reportsData.trends.growthTrend === 'down' && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-sm text-orange-800">
                        <strong>⚠️ Atención:</strong> Las ventas están bajando. 
                        Revisa estrategias de promoción y atención al cliente.
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Panel de Acciones Rápidas Mejorado */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center justify-between">
            <span>Acciones Rápidas</span>
            <span className="text-sm text-gray-500">Rol: {user?.role || 'Usuario'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button 
              onClick={() => handleQuickAction('nueva-venta')}
              className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 text-center transition-all duration-200 group"
            >
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-blue-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Nueva Venta</span>
            </button>
            
            <button 
              onClick={() => handleQuickAction('inventario')}
              className="p-4 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 text-center transition-all duration-200 group"
            >
              <Package className="w-8 h-8 mx-auto mb-2 text-green-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Inventario</span>
            </button>
            
            <button 
              onClick={() => handleQuickAction('ai-center')}
              className="p-4 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 text-center transition-all duration-200 group"
            >
              <Brain className="w-8 h-8 mx-auto mb-2 text-purple-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Centro IA</span>
            </button>
            
            <button 
              onClick={() => handleQuickAction('reportes')}
              className="p-4 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 text-center transition-all duration-200 group"
            >
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-orange-600 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Reportes</span>
            </button>
            
            {(isAdmin || isSupervisor) && (
              <>
                <button 
                  onClick={() => handleQuickAction('usuarios')}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-200 text-center transition-all duration-200 group"
                >
                  <Users className="w-8 h-8 mx-auto mb-2 text-indigo-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Usuarios</span>
                </button>
                
                <button 
                  onClick={() => handleQuickAction('configuracion')}
                  className="p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 text-center transition-all duration-200 group"
                >
                  <Settings className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Configuración</span>
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Gestión de Caja */}
      <CashRegisterModal
        isOpen={showCashModal}
        onClose={() => setShowCashModal(false)}
        type={cashModalType}
        onSuccess={handleCashSuccess}
      />
    </div>
  );
};

export default DashboardSimple;

// TODO: Próximas mejoras
// - Añadir más gráficos interactivos
// - Implementar filtros avanzados
// - Agregar comparación entre períodos
// - Añadir alertas personalizables
// - Implementar dashboard personalizable por usuario