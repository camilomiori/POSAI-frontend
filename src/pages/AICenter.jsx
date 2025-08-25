import React, { useState, useEffect, useMemo } from 'react';
import {
  Brain,
  Zap,
  TrendingUp,
  TrendingDown,
  Target,
  Eye,
  Settings,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Network,
  Gauge,
  Lightbulb,
  Users,
  Package,
  DollarSign,
  ArrowRight,
  Download,
  Upload,
  Filter,
  Search
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Badge,
  Input,
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
import { AdvancedChart, PieChart, LineChart, BarChart } from '../components/charts';
import { useAuth, useNotifications, useToast } from '../hooks';
import { aiEngine, apiService } from '../services';
import { formatARS, formatDateTime, formatPercentage } from '../utils/formatters';

const AICenter = () => {
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const { success, error, ai, warning } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [customerSegmentation, setCustomerSegmentation] = useState([]);
  const [inventoryOptimization, setInventoryOptimization] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [aiStatus, setAiStatus] = useState('optimal');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos

  // Estados para filtros y análisis personalizado
  const [analysisFilter, setAnalysisFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedInsightType, setSelectedInsightType] = useState('all');

  // Cargar todos los datos de IA
  const loadAIData = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const [
        metricsResponse,
        insightsResponse,
        marketResponse,
        segmentationResponse,
        inventoryResponse
      ] = await Promise.all([
        aiEngine.getSystemMetrics(),
        aiEngine.getBusinessInsights(),
        aiEngine.getMarketAnalysis(),
        aiEngine.getCustomerSegmentation(),
        aiEngine.optimizeInventory()
      ]);

      setSystemMetrics(metricsResponse);
      setInsights(insightsResponse);
      setMarketAnalysis(marketResponse);
      setCustomerSegmentation(segmentationResponse);
      setInventoryOptimization(inventoryResponse);

      // Generar predicciones para productos seleccionados
      const productsResponse = await apiService.getProducts({ limit: 10 });
      const productPredictions = await Promise.all(
        (productsResponse.data || []).slice(0, 5).map(async (product) => {
          const prediction = await aiEngine.predictDemand(product.id, 14);
          const optimization = await aiEngine.optimizePrice(product.id);
          return { ...product, prediction, optimization };
        })
      );
      setPredictions(productPredictions);

      setAiStatus(metricsResponse.status || 'optimal');
      ai('Centro de IA actualizado con éxito');

    } catch (err) {
      console.error('Error loading AI data:', err);
      error('Error al cargar datos de IA');
      setAiStatus('error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh
  useEffect(() => {
    loadAIData();
  }, [timeRange]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAIData(false);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Filtrar insights por tipo
  const filteredInsights = useMemo(() => {
    if (selectedInsightType === 'all') return insights;
    return insights.filter(insight => insight.type === selectedInsightType);
  }, [insights, selectedInsightType]);

  // Métricas del sistema IA
  const aiMetrics = useMemo(() => {
    if (!systemMetrics) return [];

    return [
      {
        title: 'Predicciones Hoy',
        value: systemMetrics.predictionsToday?.toLocaleString() || '0',
        icon: Brain,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        trend: '+12%'
      },
      {
        title: 'Precisión Promedio',
        value: `${(systemMetrics.accuracy?.demandPrediction * 100).toFixed(1)}%`,
        icon: Target,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        trend: '+2.3%'
      },
      {
        title: 'Tiempo de Respuesta',
        value: systemMetrics.processingTime?.avgPrediction || '0ms',
        icon: Zap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        trend: '-5ms'
      },
      {
        title: 'Datos Analizados',
        value: systemMetrics.dataPoints?.salesAnalyzed?.toLocaleString() || '0',
        icon: Database,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        trend: '+156'
      }
    ];
  }, [systemMetrics]);

  // Generar predicción personalizada
  const generateCustomPrediction = async (productId, days = 7) => {
    try {
      setLoading(true);
      const prediction = await aiEngine.predictDemand(productId, days);
      const optimization = await aiEngine.optimizePrice(productId);
      
      setSelectedProduct({ prediction, optimization });
      setShowPredictionModal(true);
      success('Predicción generada con éxito');
    } catch (err) {
      error('Error al generar predicción');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'alert': return AlertTriangle;
      case 'forecast': return Activity;
      case 'ai': return Brain;
      default: return Lightbulb;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Inicializando IA...</p>
          <p className="text-sm text-gray-400 mt-2">Analizando patrones y generando insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header del Centro IA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Centro de Inteligencia Artificial
          </h1>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            Sistema de análisis avanzado y predicciones
            <Badge variant="ai" className="ml-2">
              <Brain className="w-3 h-3 mr-1" />
              v{systemMetrics?.modelVersion || '2.1.0'}
            </Badge>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Estado del sistema */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${getStatusColor(aiStatus)}`}>
            <div className={`w-2 h-2 rounded-full ${aiStatus === 'optimal' ? 'bg-green-500 animate-pulse' : 'bg-current'}`} />
            <span className="text-sm font-medium capitalize">{aiStatus}</span>
          </div>

          {/* Auto-refresh toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            Auto-refresh
          </Button>

          {/* Manual refresh */}
          <Button
            variant="outline"
            onClick={() => loadAIData(false)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas del Sistema IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {aiMetrics.map((metric, index) => {
          const Icon = metric.icon;
          
          return (
            <Card key={index} className="relative overflow-hidden border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${metric.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <Badge variant="secondary" size="sm">
                    {metric.trend}
                  </Badge>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{metric.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                </div>

                {/* Progress bar animado */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${Math.random() * 40 + 60}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights y Alertas IA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Insights */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Insights de IA
                <Badge variant="ai" size="sm">Tiempo Real</Badge>
              </CardTitle>
              
              <Select value={selectedInsightType} onValueChange={setSelectedInsightType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="trend">Tendencias</SelectItem>
                  <SelectItem value="alert">Alertas</SelectItem>
                  <SelectItem value="forecast">Pronósticos</SelectItem>
                  <SelectItem value="ai">IA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredInsights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                const priorityColors = {
                  urgent: 'border-l-red-500 bg-red-50/50',
                  high: 'border-l-orange-500 bg-orange-50/50',
                  medium: 'border-l-blue-500 bg-blue-50/50',
                  low: 'border-l-green-500 bg-green-50/50'
                };

                return (
                  <div key={index} className={`p-4 rounded-lg border-l-4 ${priorityColors[insight.priority]}`}>
                    <div className="flex items-start gap-3">
                      <Icon className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
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
                          <Button variant="outline" size="sm" className="text-xs">
                            {insight.action}
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                        
                        {insight.impact && (
                          <div className="mt-2 text-xs text-gray-500">
                            Impacto: {insight.impact}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Panel de Control IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Control del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              
              {/* Status del modelo */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Modelo IA</span>
                  <Badge variant="success" size="sm">Activo</Badge>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>Versión: {systemMetrics?.modelVersion}</p>
                  <p>Última actualización: {formatDateTime(systemMetrics?.lastTraining)}</p>
                  <p>Confianza: {(systemMetrics?.overallConfidence * 100).toFixed(1)}%</p>
                </div>
              </div>

              {/* Configuración de auto-refresh */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Intervalo de actualización</label>
                <Select value={refreshInterval.toString()} onValueChange={(val) => setRefreshInterval(parseInt(val))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 segundos</SelectItem>
                    <SelectItem value="30">30 segundos</SelectItem>
                    <SelectItem value="60">1 minuto</SelectItem>
                    <SelectItem value="300">5 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Acciones rápidas */}
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Exportar Modelo
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Upload className="w-4 h-4" />
                  Importar Datos
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Re-entrenar Modelo
                </Button>
              </div>

              {/* Próxima actualización */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Próxima Actualización</span>
                </div>
                <p className="text-xs text-blue-700">
                  {formatDateTime(systemMetrics?.nextUpdate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Predicciones de Productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Predicciones de Demanda
            <Badge variant="ai" size="sm">Machine Learning</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {predictions.map((product, index) => (
              <div key={product.id} className="p-4 border rounded-xl hover:shadow-md transition-shadow bg-gradient-to-br from-white to-blue-50/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">{product.name}</h4>
                    <p className="text-xs text-gray-500">{product.code}</p>
                  </div>
                  <Badge variant="ai" size="sm">
                    {product.prediction?.confidence}% confianza
                  </Badge>
                </div>

                <div className="space-y-3">
                  {/* Predicción de ventas */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Ventas predichas (14d):</span>
                    <span className="font-bold text-blue-600">
                      {product.prediction?.predictedSales || 0} unidades
                    </span>
                  </div>

                  {/* Stock actual */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Stock actual:</span>
                    <span className={`font-medium ${
                      product.stock <= product.reorderPoint ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {product.stock} unidades
                    </span>
                  </div>

                  {/* Optimización de precio */}
                  {product.optimization && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Precio sugerido:</span>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">
                          {formatARS.format(product.optimization.suggestedPrice)}
                        </span>
                        <div className="text-xs text-gray-500">
                          {product.optimization.potentialIncrease > 0 ? '+' : ''}
                          {product.optimization.potentialIncrease}%
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recomendación */}
                  <div className="pt-2 border-t">
                    <Badge 
                      variant={product.prediction?.recommendation === 'reorder' ? 'warning' : 'secondary'}
                      size="sm"
                      className="w-full justify-center"
                    >
                      {product.prediction?.recommendation === 'reorder' ? 'Reponer Stock' : 'Monitorear'}
                    </Badge>
                  </div>

                  {/* Botón de análisis detallado */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateCustomPrediction(product.id, 30)}
                    className="w-full gap-2 text-xs"
                  >
                    <Eye className="w-3 h-3" />
                    Análisis Detallado
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análisis de Mercado y Segmentación */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Análisis de Mercado */}
        {marketAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Análisis de Mercado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Market Share */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{marketAnalysis.marketShare}%</p>
                  <p className="text-sm text-blue-700">Market Share</p>
                </div>

                {/* Posicionamiento */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Precios</p>
                    <Badge variant="success" size="sm">{marketAnalysis.pricePosition}</Badge>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Calidad</p>
                    <Badge variant="info" size="sm">{marketAnalysis.qualityPosition}</Badge>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Servicio</p>
                    <Badge variant="success" size="sm">{marketAnalysis.servicePosition}</Badge>
                  </div>
                </div>

                {/* Competidores */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Principales Competidores</h4>
                  <div className="space-y-2">
                    {marketAnalysis.competitorAnalysis?.slice(0, 3).map((comp, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{comp.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{comp.share}%</span>
                          {comp.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3 text-green-500" />
                          ) : comp.trend === 'down' ? (
                            <TrendingDown className="w-3 h-3 text-red-500" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Segmentación de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Segmentación de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerSegmentation.map((segment, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-gray-900">{segment.segment}</h4>
                    <Badge 
                      style={{ backgroundColor: segment.color + '20', color: segment.color }}
                      size="sm"
                    >
                      {segment.count} clientes
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-600">Ticket promedio:</p>
                      <p className="font-semibold">{formatARS.format(segment.avgTicket)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Frecuencia:</p>
                      <p className="font-semibold">{segment.frequency}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${segment.revenue}%`,
                          backgroundColor: segment.color
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{segment.revenue}% de ingresos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimización de Inventario */}
      {inventoryOptimization && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Optimización de Inventario
              <Badge variant="ai" size="sm">Automático</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {formatARS.format(inventoryOptimization.totalValue)}
                </p>
                <p className="text-sm text-gray-600">Valor Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {inventoryOptimization.criticalItems.length}
                </p>
                <p className="text-sm text-gray-600">Items Críticos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {inventoryOptimization.overStockItems.length}
                </p>
                <p className="text-sm text-gray-600">Exceso Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {inventoryOptimization.fastMovingItems.length}
                </p>
                <p className="text-sm text-gray-600">Rotación Rápida</p>
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Recomendaciones de IA</h4>
              {inventoryOptimization.recommendations?.slice(0, 5).map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    rec.priority === 'urgent' ? 'bg-red-100' : rec.priority === 'high' ? 'bg-orange-100' : 'bg-blue-100'
                  }`}>
                    {rec.type === 'reorder' ? (
                      <Package className="w-4 h-4 text-red-600" />
                    ) : rec.type === 'promotion' ? (
                      <DollarSign className="w-4 h-4 text-orange-600" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-gray-900">{rec.product}</h5>
                      <Badge 
                        variant={rec.priority === 'urgent' ? 'destructive' : 'secondary'} 
                        size="sm"
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{rec.reason}</p>
                    <p className="text-xs text-blue-600 font-medium">{rec.impact}</p>
                  </div>
                  
                  <Button variant="outline" size="sm" className="text-xs">
                    Aplicar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Predicción Detallada */}
      <Dialog open={showPredictionModal} onOpenChange={setShowPredictionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              Análisis Detallado de IA
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* Información del producto */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedProduct.prediction?.productName}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Predicción (30 días):</p>
                    <p className="font-bold text-purple-600">
                      {selectedProduct.prediction?.predictedSales} unidades
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Confianza:</p>
                    <p className="font-bold text-green-600">
                      {selectedProduct.prediction?.confidence}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Gráfico de tendencia semanal */}
              {selectedProduct.prediction?.weeklyTrend && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Tendencia Semanal Predicha</h4>
                  <AdvancedChart
                    data={selectedProduct.prediction.weeklyTrend.map(item => ({
                      name: item.day,
                      value: item.prediction,
                      confidence: item.confidence
                    }))}
                    type="line"
                    height={200}
                    aiInsights={false}
                  />
                </div>
              )}

              {/* Factores que influyen */}
              {selectedProduct.prediction?.factors && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Factores de Análisis</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">AI Score:</span>
                        <span className="font-medium">
                          {(selectedProduct.prediction.factors.aiScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Factor Estacional:</span>
                        <span className="font-medium">
                          {selectedProduct.prediction.factors.seasonalFactor.toFixed(2)}x
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Stock Actual:</span>
                        <span className="font-medium">
                          {selectedProduct.prediction.factors.currentStock}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Punto Reorden:</span>
                        <span className="font-medium">
                          {selectedProduct.prediction.factors.reorderPoint}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimización de precios */}
              {selectedProduct.optimization && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Optimización de Precios</h4>
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Precio Actual:</p>
                        <p className="font-bold text-gray-900">
                          {formatARS.format(selectedProduct.optimization.currentPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Precio Sugerido:</p>
                        <p className="font-bold text-emerald-600">
                          {formatARS.format(selectedProduct.optimization.suggestedPrice)}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-emerald-700">
                      <p className="font-medium mb-1">Razonamiento IA:</p>
                      <p>{selectedProduct.optimization.reasoning}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Métricas de rentabilidad */}
              {selectedProduct.prediction?.profitImpact && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Impacto en Rentabilidad</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">
                        {formatARS.format(selectedProduct.prediction.profitImpact.expectedProfit)}
                      </p>
                      <p className="text-xs text-blue-700">Ganancia Esperada</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-lg font-bold text-green-600">
                        {selectedProduct.prediction.profitImpact.marginPercent}%
                      </p>
                      <p className="text-xs text-green-700">Margen</p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-600">
                        {selectedProduct.prediction.profitImpact.riskLevel === 'high' ? 'Alto' : 'Bajo'}
                      </p>
                      <p className="text-xs text-gray-700">Riesgo</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPredictionModal(false)}>
              Cerrar
            </Button>
            <Button className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Análisis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AICenter;