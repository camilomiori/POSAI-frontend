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
  XCircle,
  Clock,
  Sparkles,
  Gauge,
  Star,
  Lightbulb
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
  
  // Estados para nuevas funcionalidades avanzadas
  const [advancedStockAlerts, setAdvancedStockAlerts] = useState([]);
  const [purchasePatterns, setPurchasePatterns] = useState(null);

  // TEMPORAL: Mock data para testing
  React.useEffect(() => {
    setAdvancedStockAlerts([
      {
        id: 'dash_1',
        productName: 'Filtro de Aceite K&N',
        category: 'filtros',
        currentStock: 2,
        reorderPoint: 10,
        daysToStockout: 1,
        salesVelocity: 2.5,
        trend: 'increasing',
        level: 'urgent',
        recommendedAction: 'REPOSICIÓN INMEDIATA: Ordenar 20 unidades HOY',
        predictedLoss: 45000
      },
      {
        id: 'dash_2',
        productName: 'Cadena 520 DID',
        category: 'transmision',
        currentStock: 5,
        reorderPoint: 8,
        daysToStockout: 4,
        salesVelocity: 1.2,
        trend: 'stable',
        level: 'critical',
        recommendedAction: 'Programar reposición esta semana: 15 unidades',
        predictedLoss: 12000
      }
    ]);

    setPurchasePatterns({
      insights: [
        { 
          type: 'peak_hours', 
          title: 'Horas pico detectadas', 
          description: 'Mayor actividad entre 15:00 y 16:00',
          impact: 'high',
          confidence: 0.87
        }
      ],
      hourlyPatterns: [
        { hour: '15:00', salesIndex: 1.5, avgTransactions: 52, customerFlow: 'alto' },
        { hour: '16:00', salesIndex: 1.6, avgTransactions: 56, customerFlow: 'alto' }
      ],
      dailyPatterns: [
        { day: 'Viernes', salesIndex: 1.3, avgDaily: 230000, transactions: 50 }
      ]
    });
  }, []);
  
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

  // Estados adicionales para reportes del backend
  const [inventoryReport, setInventoryReport] = useState(null);
  const [customersReport, setCustomersReport] = useState(null);
  const [productsReport, setProductsReport] = useState(null);

  // Estados para gestión de caja
  const [cashMetrics, setCashMetrics] = useState(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashModalType, setCashModalType] = useState('view'); // 'open', 'close', 'movement', 'view'

  // Estado para ordenamiento de top productos
  const [productSortBy, setProductSortBy] = useState('quantity'); // 'quantity' o 'revenue'
  
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
      .sort((a, b) => b.quantity - a.quantity) // Ordenar por cantidad vendida
      .slice(0, 10) // Top 10 productos
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

    // 6. Métricas de eficiencia y rendimiento
    const operationalEfficiency = Math.min(100, 85 + (todaySales.length > 50 ? 10 : 0) + (dailyComparison.growth.revenue > 0 ? 5 : -5));

    // 7. Comparativa semanal (hoy vs hace 7 días aproximado)
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const endSevenDaysAgo = new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000);
    const sevenDaysAgoSales = allSales.filter(sale => {
      const saleDate = new Date(sale.date || sale.timestamp);
      return saleDate >= sevenDaysAgo && saleDate < endSevenDaysAgo;
    });
    const sevenDaysAgoRevenue = sevenDaysAgoSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    const weeklyComparison = sevenDaysAgoRevenue > 0
      ? ((todayRevenue - sevenDaysAgoRevenue) / sevenDaysAgoRevenue * 100)
      : todayRevenue > 0 ? 100 : 0;

    // 8. Crecimiento general (promedio últimos 3 días)
    const threeDaysAgo = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const threeDaysRevenue = allSales
      .filter(sale => {
        const saleDate = new Date(sale.date || sale.timestamp);
        return saleDate >= threeDaysAgo;
      })
      .reduce((sum, sale) => sum + (sale.total || 0), 0);

    const avgRevenueLastThreeDays = threeDaysRevenue / 3;
    const growthRate = avgRevenueLastThreeDays > 0
      ? ((todayRevenue - avgRevenueLastThreeDays) / avgRevenueLastThreeDays * 100)
      : 0;

    return {
      hourlyData,
      topProducts,
      dailyComparison,
      trends,
      summary,
      metrics: {
        operationalEfficiency: Math.round(operationalEfficiency * 10) / 10,
        weeklyComparison: Math.round(weeklyComparison * 10) / 10,
        growthRate: Math.round(growthRate * 10) / 10,
        activeProductCount: topProducts.length,
        peakHour: bestHour.hour,
        averageTransactionValue: dailyComparison.today.avgTicket
      },
      lastUpdated: new Date().toISOString()
    };
  }, []);

  // Función para generar gráfico de ventas desde historial
  const generateSalesChartFromHistory = useCallback((allSales, timeRange) => {
    const now = new Date();
    const data = [];

    // Determinar el número de puntos según el rango
    const points = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    // Crear buckets de datos para cada día/período
    for (let i = points - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      // Filtrar ventas de ese día
      const daySales = allSales.filter(sale => {
        const saleDate = new Date(sale.date || sale.timestamp || sale.createdAt);
        return saleDate >= startOfDay && saleDate <= endOfDay;
      });

      const totalAmount = daySales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalOrders = daySales.length;

      // Formatear nombre según el rango
      let name;
      if (timeRange === '7d') {
        name = date.toLocaleDateString('es-AR', { weekday: 'short' });
      } else if (timeRange === '30d') {
        name = date.getDate() + '/' + (date.getMonth() + 1);
      } else {
        name = date.getDate() + '/' + (date.getMonth() + 1);
      }

      data.push({
        name,
        value: Math.round(totalAmount),
        orders: totalOrders
      });
    }

    return data;
  }, []);

  // Función para generar gráfico de categorías desde productos
  const generateCategoryChartFromProducts = useCallback((topProducts) => {
    if (!topProducts || topProducts.length === 0) return [];

    // Agrupar por categoría - ahora el backend devuelve el campo 'category' directamente
    const categoryMap = new Map();
    let totalQuantity = 0;

    topProducts.forEach(product => {
      const category = product.category || 'Otros';
      const quantity = product.quantity || product.sales || 1;
      totalQuantity += quantity;

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { quantity: 0, count: 0 });
      }
      const current = categoryMap.get(category);
      current.quantity += quantity;
      current.count += 1;
    });

    // Convertir a formato de gráfico con colores
    const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#F97316'];
    const data = Array.from(categoryMap.entries())
      .map(([name, { quantity }], index) => ({
        name: name || 'Otros',
        value: quantity,
        percentage: totalQuantity > 0 ? ((quantity / totalQuantity) * 100).toFixed(1) : 0,
        color: colors[index % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 categorías

    return data.length > 0 ? data : [];
  }, []);

  // Función para generar actividad reciente desde datos reales
  const generateRecentActivity = useCallback((allSales, lowStockItems) => {
    const activities = [];
    const now = Date.now();

    // Agregar ventas recientes (últimas 5)
    const recentSales = allSales
      .sort((a, b) => new Date(b.date || b.timestamp) - new Date(a.date || a.timestamp))
      .slice(0, 5);

    recentSales.forEach(sale => {
      const saleTime = new Date(sale.date || sale.timestamp);
      const diffMinutes = Math.floor((now - saleTime) / (1000 * 60));

      let timeText;
      if (diffMinutes < 1) {
        timeText = 'Ahora';
      } else if (diffMinutes < 60) {
        timeText = `Hace ${diffMinutes} min`;
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        timeText = `Hace ${hours}h`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        timeText = `Hace ${days}d`;
      }

      activities.push({
        type: 'sale',
        message: 'Venta completada',
        amount: formatARS(sale.total || 0),
        time: timeText,
        timestamp: saleTime
      });
    });

    // Agregar alertas de stock bajo (últimas 3)
    if (lowStockItems && lowStockItems.length > 0) {
      lowStockItems.slice(0, 3).forEach((item, index) => {
        activities.push({
          type: 'alert',
          message: 'Stock bajo',
          amount: item.name || 'Producto',
          time: `Hace ${15 + index * 20} min`,
          timestamp: new Date(now - (15 + index * 20) * 60 * 1000)
        });
      });
    }

    // Ordenar por timestamp y tomar las primeras 5
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, []);

  // Función separada para cargar datos de IA (MOVIDA ANTES DE loadData)
  const loadAiData = useCallback(async () => {
    try {
      const aiEngine = (await getAiEngine()).default;

      // Cargar datos de IA en paralelo para mejor rendimiento
      const [insights, marketRecommendations, marketAnalysis] = await Promise.allSettled([
        aiEngine.getBusinessInsights(),
        aiEngine.getMarketAnalysis(),
        aiEngine.getCustomerSegmentation()
      ]);

      // Procesar insights
      if (insights.status === 'fulfilled') {
        setAiInsights(insights.value.slice(0, 6)); // Limitar a 6 insights principales
      }

      // Cargar predicciones de productos críticos en paralelo (solo 3 productos para mejor rendimiento)
      const criticalProducts = [1, 2, 3]; // Reducido a 3 productos críticos
      const predictionPromises = criticalProducts.map(async (productId) => {
        try {
          const prediction = await aiEngine.predictDemand(productId, 7);
          if (prediction) {
            return {
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
            };
          }
        } catch (err) {
          console.warn(`Error predicting for product ${productId}:`, err);
          return null;
        }
      });

      const productPredictions = (await Promise.allSettled(predictionPromises))
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => result.value);

      setPredictions(productPredictions);

      // Cargar recomendaciones de IA
      const aiRecommendationsData = await aiEngine.getRecommendations([]);
      setAiRecommendations(aiRecommendationsData.slice(0, 5));
      
      // Cargar alertas críticas tradicionales
      const alerts = await aiEngine.getCriticalAlerts();
      setCriticalAlerts(alerts);
      
      // Cargar nuevas funcionalidades avanzadas
      const stockAlerts = await aiEngine.getAdvancedStockAlerts();
      setAdvancedStockAlerts(stockAlerts.slice(0, 5)); // Top 5 alertas más críticas
      
      const patterns = await aiEngine.analyzePurchasePatterns();
      setPurchasePatterns(patterns);
      
      // Cargar análisis de mercado
      const market = await aiEngine.getMarketAnalysis();
      setMarketAnalysis(market);
      
      // Cargar métricas de performance IA
      const systemMetrics = await aiEngine.getSystemMetrics();
      setPerformanceMetrics({
        aiAccuracy: systemMetrics.accuracy?.demandPrediction || 0.94,
        predictionsToday: systemMetrics.predictionsToday || 47,
        insightsGenerated: insights.status === 'fulfilled' ? insights.value?.length || 0 : 0,
        optimizationsApplied: systemMetrics.dataPoints?.rules || 12,
        processingTime: systemMetrics.processingTime?.avgPrediction || '245ms',
        modelVersion: systemMetrics.modelVersion || '3.2.1',
        dataPoints: systemMetrics.dataPoints?.total || systemMetrics.predictionsToday || 125847
      });
      
      // Notificar sobre nuevos insights críticos
      const criticalInsights = insights.status === 'fulfilled' ?
        (insights.value?.filter(i => i.priority === 'urgent' || i.priority === 'high') || []) : [];
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

      // Cargar datos básicos de forma síncrona primero
      const allSales = salesHistoryService.getAllSales();
      const todayStats = salesHistoryService.getTodayMetrics();
      const cashMetrics = cashRegisterService.getTodayMetrics();

      setSalesHistory(allSales);
      setTodayMetrics(todayStats);
      setCashMetrics(cashMetrics);

      // Generar datos de reportes basados en ventas reales
      const reportsData = generateReportsData(allSales, todayStats);
      setReportsData(reportsData);

      // Convertir timeRange a formato del backend
      const periodMap = {
        '7d': 'week',
        '30d': 'month',
        '90d': 'quarter'
      };
      const period = periodMap[timeRange] || 'month';

      // Cargar múltiples endpoints del backend en paralelo
      const [dashboardResponse, salesReportResponse, productsReportResponse, customersReportResponse, inventoryReportResponse] = await Promise.allSettled([
        apiService.getDashboardData(period),
        apiService.getSalesReport(period),
        apiService.getProductsReport(period),
        apiService.getCustomersReport(),
        apiService.getInventoryReport()
      ]);

      // Iniciar carga de AI en paralelo (no esperar resultado)
      loadAiData();

      // Combinar datos de múltiples endpoints
      if (dashboardResponse.status === 'fulfilled') {
        const dashData = dashboardResponse.value;
        const salesData = salesReportResponse.status === 'fulfilled' ? salesReportResponse.value : null;
        const productsData = productsReportResponse.status === 'fulfilled' ? productsReportResponse.value : null;
        const customersData = customersReportResponse.status === 'fulfilled' ? customersReportResponse.value : null;
        const inventoryData = inventoryReportResponse.status === 'fulfilled' ? inventoryReportResponse.value : null;

        // Guardar reportes en el estado
        setInventoryReport(inventoryData);
        setCustomersReport(customersData);
        setProductsReport(productsData);

        // Generar actividad reciente desde datos reales
        const recentActivities = generateRecentActivity(allSales, inventoryData?.lowStockItems || []);
        setRecentActivity(recentActivities);

        // Construir estructura completa de dashboard
        const combinedData = {
          kpis: {
            // Datos principales del backend
            totalSales: dashData.kpis?.totalSales || 0,
            salesGrowth: dashData.kpis?.growth?.sales || 0,
            totalOrders: dashData.kpis?.totalTransactions || 0,
            ordersGrowth: dashData.kpis?.growth?.transactions || 0,
            avgTicket: dashData.kpis?.averageTicket || 0,
            ticketGrowth: 0, // Calcular en frontend si es necesario

            // Productos activos del inventario
            activeProducts: inventoryData?.summary?.totalProducts || 0,
            productsGrowth: dashData.kpis?.growth?.customers || 0,

            // Metas (usar valores por defecto si no están en backend)
            salesTarget: dashData.kpis?.totalSales ? Math.round(dashData.kpis.totalSales * 1.15) : 0,
            ordersTarget: dashData.kpis?.totalTransactions ? Math.round(dashData.kpis.totalTransactions * 1.10) : 0,
            ticketTarget: dashData.kpis?.averageTicket ? Math.round(dashData.kpis.averageTicket * 1.05) : 0,
            productsTarget: inventoryData?.summary?.totalProducts ? Math.round(inventoryData.summary.totalProducts * 1.08) : 0
          },
          charts: {
            // Generar gráfico de ventas basado en datos reales de salesHistory
            salesChart: allSales.length > 0 ? generateSalesChartFromHistory(allSales, timeRange) : dashData.charts?.salesChart || [],

            // Generar gráfico de categorías basado en top productos de reportsData (datos reales de ventas)
            categoryChart: reportsData?.topProducts && reportsData.topProducts.length > 0
              ? generateCategoryChartFromProducts(reportsData.topProducts)
              : (productsData?.topProducts ? generateCategoryChartFromProducts(productsData.topProducts) : dashData.charts?.categoryChart || [])
          }
        };

        setDashboardData(combinedData);
      }
      
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
        },
        charts: {
          salesChart: [
            { name: 'Ene', value: 4200000, orders: 285 },
            { name: 'Feb', value: 3800000, orders: 260 },
            { name: 'Mar', value: 5100000, orders: 340 },
            { name: 'Abr', value: 4700000, orders: 310 },
            { name: 'May', value: 5800000, orders: 380 },
            { name: 'Jun', value: 4890000, orders: 342 }
          ],
          categoryChart: [
            { name: 'Neumáticos', value: 35, color: '#3B82F6' },
            { name: 'Aceites y Lubricantes', value: 25, color: '#8B5CF6' },
            { name: 'Sistema de Frenos', value: 20, color: '#10B981' },
            { name: 'Transmisión', value: 12, color: '#F59E0B' },
            { name: 'Otros', value: 8, color: '#EF4444' }
          ]
        }
      });
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, loadAiData]); // loadData depende de timeRange y loadAiData

  // Inicializar datos al montar
  useEffect(() => {
    loadData(true); // Cargar datos al montar el componente
  }, []); // Solo al montar

  // Recargar datos cuando cambia el timeRange
  useEffect(() => {
    if (!loading) {
      loadData(false); // No mostrar loading cuando solo cambia timeRange
    }
  }, [timeRange, loading]); // Depender de timeRange y loading

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header Moderno */}
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5" />
        <div className="relative px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Saludo y Estado */}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                    Dashboard
                  </h1>
                  <p className="text-base sm:text-lg text-gray-500 font-medium">
                    Hola {user?.nombre || 'Usuario'} 👋 - Vista ejecutiva en tiempo real
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-emerald-700 font-semibold">Sistema Activo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">Actualizado {formatDateTime(Date.now())}</span>
                </div>
              </div>
            </div>
            
            {/* Controles */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 border border-white/30">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-transparent border-0 text-sm font-medium text-gray-700 focus:outline-none"
                >
                  <option value="7d">7 días</option>
                  <option value="30d">30 días</option>
                  <option value="90d">90 días</option>
                  <option value="1y">1 año</option>
                </select>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadData(false)}
                disabled={refreshing}
                className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-500' : 'text-gray-600'}`} />
                Actualizar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={exportDashboardData}
                className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 gap-2"
              >
                <Download className="w-4 h-4 text-gray-600" />
                Exportar
              </Button>

              <Button
                variant={showAiInsights ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setShowAiInsights(!showAiInsights)}
                className={`gap-2 ${showAiInsights ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' : 'bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80'}`}
              >
                <Brain className="w-4 h-4" />
                {showAiInsights ? 'IA Activa' : 'Activar IA'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* KPIs Grid Moderno */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Métricas Clave
            </h2>
            <div className="text-sm text-gray-500">Datos en tiempo real</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              const isPositive = kpi.change >= 0;
              const progress = kpi.target ? Math.min(100, (parseFloat(kpi.value.replace(/[^0-9.-]/g, '')) / kpi.target) * 100) : null;
              
              return (
                <Card 
                  key={index} 
                  className="group relative overflow-hidden bg-white/60 backdrop-blur-xl border-white/30 hover:bg-white/80 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer"
                  onClick={() => {
                    setSelectedMetric(selectedMetric === index ? null : index);
                    kpi.action && kpi.action();
                  }}
                >
                  <CardContent className="p-6">
                    {/* Header con icono y trend */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-2xl ${kpi.bgColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${kpi.color}`} />
                      </div>
                      
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
                          isPositive 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isPositive ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isPositive ? '+' : ''}{kpi.change.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {/* Valor principal */}
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                        {kpi.title}
                      </p>
                      <p className="text-3xl font-black text-gray-900 tracking-tight">
                        {kpi.value}
                      </p>
                    </div>
                    
                    {/* Barra de progreso mejorada */}
                    {progress !== null && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Progreso</span>
                          <span className="font-semibold text-gray-700">{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200/50 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-1000 ${
                              progress >= 90 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                              progress >= 70 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 
                              'bg-gradient-to-r from-blue-400 to-blue-600'
                            }`}
                            style={{ width: `${Math.min(100, progress)}%` }}
                          />
                        </div>
                        {kpi.target && (
                          <p className="text-xs text-gray-500">
                            Meta: {typeof kpi.target === 'number' && kpi.target > 1000 ? formatPrice(kpi.target) : kpi.target.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Indicador de estado */}
                    <div className="absolute top-3 right-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isPositive ? 'bg-emerald-500' : 'bg-red-500'
                      } opacity-60 group-hover:opacity-100 transition-opacity`} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Alertas Inteligentes de Stock - Solo las críticas para Dashboard */}
        {advancedStockAlerts.filter(alert => alert.level === 'urgent').length > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Alertas Críticas de Stock
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/ai-center')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Ver AI Center
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {advancedStockAlerts.filter(alert => alert.level === 'urgent').map((alert, index) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <div>
                        <h4 className="font-semibold text-red-900">{alert.productName}</h4>
                        <p className="text-sm text-red-700">Stock: {alert.currentStock} unidades • {alert.daysToStockout} día{alert.daysToStockout !== 1 ? 's' : ''} restante{alert.daysToStockout !== 1 ? 's' : ''}</p>
                        <p className="text-xs text-red-600 mt-1">{alert.recommendedAction}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-red-600">
                        Pérdida estimada: {formatPrice(alert.predictedLoss)}
                      </div>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => navigate('/productos')}
                        className="mt-2"
                      >
                        Gestionar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas de Caja */}
        {cashMetrics && (
          <Card className={`border-l-4 ${
            !cashMetrics.isOpen 
              ? 'border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent' 
              : 'border-l-green-500 bg-gradient-to-r from-green-50/50 to-transparent'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className={`w-5 h-5 ${cashMetrics.isOpen ? 'text-green-600' : 'text-red-600'}`} />
                  Estado de Caja Registradora
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/ventas')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Ir a Ventas
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center justify-between p-4 ${
                cashMetrics.isOpen 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              } rounded-lg`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    cashMetrics.isOpen 
                      ? 'bg-green-500 animate-pulse' 
                      : 'bg-red-500'
                  }`} />
                  <div>
                    <h4 className={`font-semibold ${
                      cashMetrics.isOpen ? 'text-green-900' : 'text-red-900'
                    }`}>
                      Caja {cashMetrics.isOpen ? 'Abierta' : 'Cerrada'}
                    </h4>
                    <p className={`text-sm ${
                      cashMetrics.isOpen ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {cashMetrics.isOpen 
                        ? `Abierta desde hace ${Math.floor((Date.now() - (cashMetrics.openTime || Date.now())) / (1000 * 60 * 60))} horas`
                        : 'La caja debe estar abierta para procesar ventas'
                      }
                    </p>
                    {cashMetrics.isOpen && (
                      <p className="text-xs text-green-600 mt-1">
                        Efectivo actual: {formatPrice(cashMetrics.currentAmount)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {!cashMetrics.isOpen && (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleCashOperation('open')}
                    >
                      Abrir Caja
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumen del Día */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Resumen de Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hora de inicio</span>
                  <span className="text-sm font-semibold text-gray-900">{cashMetrics?.openTime ? new Date(cashMetrics.openTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '08:30'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Horas activas</span>
                  <span className="text-sm font-semibold text-gray-900">{reportsData?.trends?.totalHoursActive || (new Date().getHours() - 8)} horas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Mejor hora</span>
                  <span className="text-sm font-semibold text-emerald-600">{reportsData?.trends?.peakHour || '15:00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Promedio/hora</span>
                  <span className="text-sm font-semibold text-blue-600">{reportsData?.trends?.averageHourlyRevenue || formatPrice(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Comparativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Vs. Ayer</span>
                  {reportsData?.dailyComparison?.growth?.revenue ? (
                    <div className="flex items-center gap-1">
                      {reportsData.dailyComparison.growth.revenue >= 0 ? (
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3 text-red-500" />
                      )}
                      <span className={`text-sm font-semibold ${reportsData.dailyComparison.growth.revenue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {reportsData.dailyComparison.growth.revenue >= 0 ? '+' : ''}{reportsData.dailyComparison.growth.revenue.toFixed(1)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ventas hoy</span>
                  <span className="text-sm font-semibold text-gray-900">{reportsData?.dailyComparison?.today?.sales || 0} ventas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ventas ayer</span>
                  <span className="text-sm font-semibold text-gray-600">{reportsData?.dailyComparison?.yesterday?.sales || 0} ventas</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Meta mensual</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {dashboardData?.kpis?.salesTarget && dashboardData?.kpis?.totalSales
                      ? Math.round((dashboardData.kpis.totalSales / dashboardData.kpis.salesTarget) * 100)
                      : 0}% completada
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Clientes Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total atendidos</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {todayMetrics?.totalSales || 0} clientes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total registrados</span>
                  <span className="text-sm font-semibold text-blue-600">
                    {customersReport?.summary?.totalCustomers || 0} clientes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Clientes activos</span>
                  <span className="text-sm font-semibold text-emerald-600">
                    {customersReport?.summary?.activeCustomers || 0} clientes
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ticket promedio</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-amber-600">
                      {formatPrice(todayMetrics?.averageTicket || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos de Análisis */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {dashboardData?.charts?.salesChart && (
            <Card className="bg-white/60 backdrop-blur-xl border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Tendencia de Ventas ({timeRange})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AdvancedChart 
                  data={dashboardData.charts.salesChart} 
                  type="area"
                  height={300}
                />
              </CardContent>
            </Card>
          )}

          {dashboardData?.charts?.categoryChart && (
            <Card className="bg-white/60 backdrop-blur-xl border-white/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  Ventas por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PieChart 
                  data={dashboardData.charts.categoryChart} 
                  height={300}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Análisis por Horas y Productos */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Ventas por Horas */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Ventas por Horas - Hoy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BarChart
                data={reportsData?.hourlyData && reportsData.hourlyData.length > 0
                  ? reportsData.hourlyData
                      .filter(h => h.revenue > 0 || h.sales > 0) // Solo mostrar horas con actividad
                      .map(h => ({
                        hour: h.hour,
                        sales: h.revenue,
                        customers: h.sales
                      }))
                  : (reportsData?.hourlyData ? [] : [ // Mostrar vacío si reportsData está cargado pero sin datos
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
                    ])}
                height={280}
              />
            </CardContent>
          </Card>

          {/* Productos Críticos */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Inventario Crítico
                </div>
                <Badge variant="warning">
                  {inventoryReport?.summary?.lowStockCount || 0} productos
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 overflow-y-auto">
              <div className="space-y-3">
                {inventoryReport?.lowStockItems && inventoryReport.lowStockItems.length > 0 ? (
                  inventoryReport.lowStockItems.map((product, index) => {
                    const stockPercentage = product.minStock > 0 ? (product.stock / product.minStock) * 100 : 0;
                    const isCritical = stockPercentage < 30;

                    return (
                      <div key={product.id || index} className={`p-3 rounded-lg border ${
                        isCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900 text-sm">{product.name}</h4>
                          <Badge variant={isCritical ? 'destructive' : 'warning'}>
                            {isCritical ? 'Crítico' : 'Bajo'}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Stock actual: {product.stock}</span>
                          <span className="text-gray-600">Mínimo: {product.minStock}</span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${
                                isCritical ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(100, stockPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay productos con stock bajo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grid Lateral con Información Detallada */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Estadísticas del Período */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Estadísticas del Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(dashboardData?.kpis?.totalSales || todayMetrics?.totalAmount || 0)}
                  </div>
                  <div className="text-sm text-blue-700">Total Facturado</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {timeRange === '7d' ? '7 días' : timeRange === '30d' ? '30 días' : timeRange === '90d' ? '90 días' : '1 año'}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-emerald-50 rounded-lg">
                    <div className="text-lg font-bold text-emerald-600">
                      {dashboardData?.kpis?.totalOrders || todayMetrics?.totalSales || 0}
                    </div>
                    <div className="text-xs text-emerald-700">Ventas</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {formatPrice(dashboardData?.kpis?.avgTicket || todayMetrics?.averageTicket || 0)}
                    </div>
                    <div className="text-xs text-purple-700">Ticket Prom.</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Mejor día:</span>
                    <span className="font-semibold text-gray-900">
                      {reportsData?.trends?.bestDay || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Crecimiento:</span>
                    <span className={`font-semibold ${
                      (dashboardData?.kpis?.salesGrowth || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {(dashboardData?.kpis?.salesGrowth || 0) >= 0 ? '+' : ''}
                      {(dashboardData?.kpis?.salesGrowth || 0).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actividad Reciente */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Actividad Reciente
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-64 overflow-y-auto">
              <div className="space-y-3">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'sale' ? 'bg-green-500' :
                          activity.type === 'alert' ? 'bg-red-500' :
                          activity.type === 'ai' ? 'bg-emerald-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.amount}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{activity.time}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Productos */}
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-600" />
                Top Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(reportsData?.topProducts || productsReport?.topProducts || []).length > 0 ? (
                  (reportsData?.topProducts || productsReport?.topProducts || []).slice(0, 5).map((product, index) => (
                    <div key={product.id || index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate('/productos')}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.quantity || product.sales || 0} vendidos</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {product.formattedRevenue || formatPrice(product.revenue || 0)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No hay datos de productos disponibles</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Rendimiento Final */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Eficiencia Operativa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{reportsData?.metrics?.operationalEfficiency || 85}%</div>
                <div className="text-xs text-gray-500">
                  {(reportsData?.metrics?.operationalEfficiency || 85) > 90 ? 'Excelente rendimiento' : 'Buen rendimiento'}
                </div>
                <div className="mt-2 flex items-center justify-center">
                  <div className="w-16 h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-2 bg-emerald-500 rounded-full"
                      style={{ width: `${(reportsData?.metrics?.operationalEfficiency || 85)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Estado de IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-semibold text-green-600">Operativo</span>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {predictions && predictions.length > 0 ? 'Analizando tendencias' : 'Sistema listo'}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Precisión:</span>
                    <span className="text-green-600 font-medium">
                      {performanceMetrics?.accuracy || (reportsData?.metrics?.operationalEfficiency ? Math.min(99, Math.round(reportsData.metrics.operationalEfficiency + 5)) : 94)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Análisis:</span>
                    <span className="text-blue-600 font-medium">
                      {predictions?.length || reportsData?.summary?.totalSales || 0} trans.
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Tiempo resp:</span>
                    <span className="text-purple-600 font-medium">
                      {performanceMetrics?.processingTime || '120ms'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Comparativo Semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold ${(reportsData?.metrics?.weeklyComparison || 15.2) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {(reportsData?.metrics?.weeklyComparison || 15.2) >= 0 ? '+' : ''}{(reportsData?.metrics?.weeklyComparison || 15.2).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">vs semana anterior</div>
                <div className="mt-2">
                  {/* Mini gráfico de barras comparativo */}
                  <div className="flex justify-center items-end space-x-1 h-8">
                    {[0.6, 0.8, 0.7, 1.0, 0.9, 0.8, 1.0].map((height, index) => (
                      <div
                        key={index}
                        className={`w-2 bg-gradient-to-t rounded-sm ${
                          index < 4 ? 'from-gray-300 to-gray-400' : 'from-blue-400 to-blue-500'
                        }`}
                        style={{ height: `${height * 24}px` }}
                        title={index < 4 ? 'Semana anterior' : 'Esta semana'}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Sem. ant.</span>
                    <span>Esta sem.</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/60 backdrop-blur-xl border-white/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Crecimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className={`text-2xl font-bold ${(reportsData?.metrics?.growthRate || 28.7) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {(reportsData?.metrics?.growthRate || 28.7) >= 0 ? '+' : ''}{(reportsData?.metrics?.growthRate || 28.7).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">vs período anterior</div>
                <div className="mt-2 flex items-center justify-center">
                  {(reportsData?.metrics?.growthRate || 28.7) >= 0 ? (
                    <>
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium ml-1">Tendencia positiva</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-600 font-medium ml-1">Tendencia negativa</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas de Empleados */}
        <Card className="bg-white/60 backdrop-blur-xl border-white/30">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Rendimiento del Equipo
              </div>
              <Badge variant="secondary" size="sm">
                {user ? '1 activo' : '0 activos'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Métricas del usuario actual */}
              {user && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{user.name || 'Usuario Actual'}</h4>
                        <p className="text-xs text-gray-600">{user.role === 'admin' ? 'Administrador' : user.role === 'supervisor' ? 'Supervisor' : 'Cajero'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">En línea</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {todayMetrics?.totalSales || 12}
                      </div>
                      <div className="text-xs text-gray-600">Ventas Hoy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(todayMetrics?.totalAmount || 245000)}
                      </div>
                      <div className="text-xs text-gray-600">Facturación</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {formatPrice(todayMetrics?.averageTicket || 20416)}
                      </div>
                      <div className="text-xs text-gray-600">Ticket Prom.</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {Math.floor((Date.now() - (cashMetrics?.openTime || Date.now() - 8*60*60*1000)) / (1000 * 60 * 60))}h
                      </div>
                      <div className="text-xs text-gray-600">Tiempo Activo</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">Eficiencia del turno</span>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1 bg-gray-200 rounded-full">
                          <div className="w-10 h-1 bg-green-500 rounded-full"></div>
                        </div>
                        <span className="text-xs font-medium text-green-600">87%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comparativo de rendimiento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Tu Desempeño</div>
                  <div className="text-xs text-gray-500 mt-1">Hoy</div>
                  <div className="text-lg font-bold text-blue-600 mt-1">
                    <Star className="w-4 h-4 inline text-yellow-500 fill-current" />
                    {todayMetrics?.totalSales || 0} ventas
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Facturación Hoy</div>
                  <div className="text-xs text-gray-500 mt-1">Total procesado</div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    {formatPrice(todayMetrics?.totalAmount || 0)}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-semibold text-gray-700">Meta Diaria</div>
                  <div className="text-xs text-gray-500 mt-1">Progreso actual</div>
                  <div className="text-lg font-bold text-green-600 mt-1">
                    {dashboardData?.kpis?.salesTarget
                      ? Math.min(100, Math.round(((todayMetrics?.totalAmount || 0) / dashboardData.kpis.salesTarget) * 100))
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Rankings rápidos */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-700 mb-3">Tu Rendimiento Hoy</h5>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                      <span className="font-semibold text-gray-900">{user?.name || 'Usuario'}</span>
                    </div>
                    <span className="text-blue-600 font-bold">{todayMetrics?.totalSales || 0} ventas</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="text-center p-2 bg-white rounded border border-gray-200">
                      <div className="text-xs text-gray-500">Facturación</div>
                      <div className="text-sm font-bold text-gray-900">{formatPrice(todayMetrics?.totalAmount || 0)}</div>
                    </div>
                    <div className="text-center p-2 bg-white rounded border border-gray-200">
                      <div className="text-xs text-gray-500">Ticket Prom.</div>
                      <div className="text-sm font-bold text-gray-900">{formatPrice(todayMetrics?.averageTicket || 0)}</div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 text-center mt-2 p-2 bg-blue-50 rounded">
                    💡 Tip: Los rankings de equipo se mostrarán cuando haya múltiples usuarios activos
                  </div>
                </div>
              </div>
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
    </div>
  );
};

export default DashboardSimple;