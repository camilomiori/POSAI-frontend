import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Brain,
  Zap,
  AlertTriangle,
  Target,
  Activity,
  BarChart3,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { AdvancedChart, PieChart, LineChart, BarChart } from '../components/charts';
import { useAuth, useNotifications, useToast } from '../hooks';
import { apiService, aiEngine } from '../services';
import { formatARS, formatDateTime, formatPercentage } from '../utils/formatters';
import { NOTIFICATION_TYPES, USER_ROLES } from '../utils/constants';

const Dashboard = () => {
  const { user, hasPermission, isAdmin, isSupervisor } = useAuth();
  const { addNotification } = useNotifications();
  const { success, error, ai } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [dashboardData, setDashboardData] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [marketAnalysis, setMarketAnalysis] = useState(null);

  // Cargar datos del dashboard
  const loadDashboardData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      setRefreshing(!showLoader);

      // Cargar datos principales en paralelo
      const [
        dashboardResponse,
        insightsResponse,
        marketResponse,
        systemMetrics
      ] = await Promise.all([
        apiService.getDashboardData({ timeRange }),
        aiEngine.getBusinessInsights(),
        aiEngine.getMarketAnalysis(),
        aiEngine.getSystemMetrics()
      ]);

      setDashboardData(dashboardResponse);
      setAiInsights(insightsResponse);
      setMarketAnalysis(marketResponse);

      // Generar predicciones para productos top
      const topProducts = dashboardResponse.topProducts || [];
      const productPredictions = await Promise.all(
        topProducts.slice(0, 5).map(async (product) => {
          const prediction = await aiEngine.predictDemand(product.id, 7);
          return { ...product, prediction };
        })
      );
      setPredictions(productPredictions);

      // Mostrar insights críticos como notificaciones
      insightsResponse
        .filter(insight => insight.priority === 'urgent' || insight.priority === 'high')
        .forEach(insight => {
          addNotification({
            title: insight.title,
            message: insight.message,
            type: insight.type === 'ai' ? NOTIFICATION_TYPES.AI : NOTIFICATION_TYPES.WARNING
          });
        });

      ai('Dashboard actualizado con insights de IA');
      
    } catch (err) {
      console.error('Error loading dashboard:', err);
      error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar datos al montar y cuando cambie el rango
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [timeRange]);

  // KPIs calculados
  const kpis = useMemo(() => {
    if (!dashboardData) return [];

    return [
      {
        title: 'Ventas del Período',
        value: formatARS.format(dashboardData.kpis?.totalSales || 0),
        change: dashboardData.kpis?.salesGrowth || 0,
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        target: formatARS.format(dashboardData.kpis?.salesTarget || 0)
      },
      {
        title: 'Órdenes Procesadas',
        value: (dashboardData.kpis?.totalOrders || 0).toLocaleString(),
        change: dashboardData.kpis?.ordersGrowth || 0,
        icon: ShoppingCart,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        target: (dashboardData.kpis?.ordersTarget || 0).toLocaleString()
      },
      {
        title: 'Ticket Promedio',
        value: formatARS.format(dashboardData.kpis?.avgTicket || 0),
        change: dashboardData.kpis?.ticketGrowth || 0,
        icon: BarChart3,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        target: formatARS.format(dashboardData.kpis?.ticketTarget || 0)
      },
      {
        title: 'Productos Activos',
        value: (dashboardData.kpis?.activeProducts || 0).toLocaleString(),
        change: dashboardData.kpis?.productsGrowth || 0,
        icon: Package,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        target: (dashboardData.kpis?.productsTarget || 0).toLocaleString()
      }
    ];
  }, [dashboardData]);

  // Configuración de gráficos
  const chartData = useMemo(() => {
    if (!dashboardData) return { sales: [], categories: [], hourly: [] };

    return {
      sales: dashboardData.salesChart || [],
      categories: dashboardData.categoryChart || [],
      hourly: dashboardData.hourlyChart || []
    };
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando dashboard inteligente...</p>
          <p className="text-sm text-gray-400 mt-2">Analizando datos con IA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Inteligente</h1>
          <p className="text-gray-600 mt-1">
            Panel de control con análisis de IA • Última actualización: {formatDateTime(Date.now())}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Selector de período */}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 bg-white/80 backdrop-blur-sm"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>

          {/* Botón refresh */}
          <Button
            variant="outline"
            onClick={() => loadDashboardData(false)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          {/* Indicador IA */}
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-700">IA Activa</span>
          </div>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl ${kpi.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${kpi.color}`} />
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
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
                  <h3 className="text-sm font-medium text-gray-500">{kpi.title}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                  {kpi.target && (
                    <p className="text-xs text-gray-400 mt-1">
                      Objetivo: {kpi.target}
                    </p>
                  )}
                </div>

                {/* Progress bar hacia objetivo */}
                {kpi.target && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          isPositive ? 'bg-green-500' : 'bg-orange-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, Math.abs(kpi.change) * 10)}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Insights Panel */}
      {aiInsights.length > 0 && (
        <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-emerald-600" />
              Insights de Inteligencia Artificial
              <Badge variant="ai" size="sm">Tiempo Real</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {aiInsights.slice(0, 4).map((insight, index) => {
                const getIconByType = (type) => {
                  switch (type) {
                    case 'trend': return TrendingUp;
                    case 'alert': return AlertTriangle;
                    case 'forecast': return Activity;
                    default: return Zap;
                  }
                };

                const getColorByPriority = (priority) => {
                  switch (priority) {
                    case 'urgent': return 'text-red-600 bg-red-50';
                    case 'high': return 'text-orange-600 bg-orange-50';
                    case 'medium': return 'text-blue-600 bg-blue-50';
                    default: return 'text-green-600 bg-green-50';
                  }
                };

                const Icon = getIconByType(insight.type);
                const colorClass = getColorByPriority(insight.priority);

                return (
                  <div key={index} className="flex items-start gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100">
                    <div className={`w-10 h-10 rounded-xl ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                        <Badge 
                          variant={insight.priority === 'urgent' ? 'destructive' : 'secondary'} 
                          size="sm"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{insight.message}</p>
                      {insight.action && (
                        <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                          {insight.action} →
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Ventas en el tiempo */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Evolución de Ventas
              <Badge variant="default" size="sm">Con Predicción IA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdvancedChart
              data={chartData.sales}
              type="line"
              height={300}
              aiInsights={true}
              showBrush={true}
              title=""
            />
          </CardContent>
        </Card>

        {/* Distribución por categorías */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Ventas por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart
              data={chartData.categories}
              height={300}
              aiAnalysis={true}
              showPercentages={true}
            />
          </CardContent>
        </Card>

        {/* Ventas por hora */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Patrón Horario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={chartData.hourly}
              height={300}
              orientation="vertical"
              aiRanking={true}
              colorScheme="performance"
            />
          </CardContent>
        </Card>
      </div>

      {/* Predicciones y Market Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Predicciones de productos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Predicciones de Demanda
              <Badge variant="ai" size="sm">IA</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <p className="text-sm text-gray-600">Stock actual: {product.stock}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      <span className="font-bold text-gray-900">
                        {product.prediction?.predictedSales || 0} unidades
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Próximos 7 días • {product.prediction?.confidence || 0}% confianza
                    </p>
                    {product.prediction?.recommendation && (
                      <Badge 
                        variant={product.prediction.recommendation === 'reorder' ? 'warning' : 'secondary'}
                        size="sm"
                        className="mt-1"
                      >
                        {product.prediction.recommendation === 'reorder' ? 'Reponer' : 'Monitorear'}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Analysis */}
        {marketAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Análisis de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-600">{marketAnalysis.marketShare}%</p>
                  <p className="text-sm text-gray-600">Market Share</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Posición</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="success" size="sm">Precios: {marketAnalysis.pricePosition}</Badge>
                      <Badge variant="info" size="sm">Calidad: {marketAnalysis.qualityPosition}</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Competidores</p>
                    {marketAnalysis.competitorAnalysis?.slice(0, 2).map((comp, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg mb-1">
                        <span className="text-xs font-medium">{comp.name}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{comp.share}%</span>
                          {comp.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : comp.trend === 'down' ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : (
                            <div className="w-3 h-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Quick Actions para diferentes roles */}
      {(isAdmin || isSupervisor) && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Button variant="outline" size="sm" className="gap-2">
                <Package className="w-4 h-4" />
                Gestionar Stock
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Nueva Venta
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Brain className="w-4 h-4" />
                Centro IA
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Reportes
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Users className="w-4 h-4" />
                Usuarios
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;