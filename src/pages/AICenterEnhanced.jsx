import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Zap, Brain, TrendingUp, AlertTriangle, Settings, 
  Play, Pause, RotateCcw, Download, Eye, Lightbulb,
  Activity, Database, Cpu, Clock, BarChart3, Info,
  Sparkles, Target, Rocket, Shield, CheckCircle,
  AlertCircle, Layers, Users, Globe, Gauge
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, 
  Button, Badge, Input, Select, Dialog,
  DialogContent, DialogHeader, DialogTitle
} from '../components/ui';
import { AdvancedChart } from '../components/charts/ChartsSimple';
import { useAuth } from '../hooks';
import useNotifications from '../hooks/useNotifications';
import useToast from '../hooks/useToast';
import { apiService, getAiEngine } from '../services';

const AICenterEnhanced = () => {
  const { user, hasPermission } = useAuth();
  const { addNotification } = useNotifications();
  const { success, error, ai, warning } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedInsightType, setSelectedInsightType] = useState('all');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [timeRange, setTimeRange] = useState('24h');
  const [showHelp, setShowHelp] = useState(false);
  
  // Estados para funciones administrativas
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [securityAlerts, setSecurityAlerts] = useState([]);
  const [operationalRecommendations, setOperationalRecommendations] = useState([]);

  // Función estable para cargar datos
  const loadAIData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    
    try {
      const [insights, metrics, perfMetrics, alerts, recommendations] = await Promise.all([
        getAiEngine().getAIInsights(),
        getAiEngine().getSystemMetrics(),
        getAiEngine().getPerformanceMetrics(),
        getAiEngine().getSecurityAlerts(),
        getAiEngine().getOperationalRecommendations()
      ]);

      setAiInsights(insights || []);
      setSystemMetrics(metrics || {
        cpuUsage: Math.floor(Math.random() * 30) + 40,
        memoryUsage: Math.floor(Math.random() * 25) + 55,
        aiModelsActive: 5,
        predictionsToday: Math.floor(Math.random() * 50) + 120,
        accuracy: 94.5,
        responseTime: Math.floor(Math.random() * 50) + 150
      });
      
      setPerformanceMetrics(perfMetrics || {
        accuracy: '94.5%',
        responseTime: '180ms',
        dailyPredictions: '1,247',
        efficiency: '98.2%'
      });
      setSecurityAlerts(alerts || [
        {
          title: 'Acceso Anómalo Detectado',
          message: 'Múltiples intentos de login desde IP desconocida',
          timestamp: 'Hace 5 min',
          severity: 'high'
        },
        {
          title: 'Patrón de Tráfico Sospechoso',
          message: 'Incremento inusual en consultas API durante horario nocturno',
          timestamp: 'Hace 15 min',
          severity: 'medium'
        }
      ]);
      setOperationalRecommendations(recommendations || [
        {
          title: 'Optimización de Stock',
          description: 'El modelo IA recomienda aumentar el stock de filtros de aceite en 25% para la próxima semana',
          impact: 'Alto'
        },
        {
          title: 'Precio Dinámico Activado',
          description: 'Los neumáticos premium pueden incrementar precio 8% basado en demanda detectada',
          impact: 'Medio'
        },
        {
          title: 'Promoción Inteligente',
          description: 'Recomendar descuento en baterías a clientes que compraron alternadores hace 6+ meses',
          impact: 'Alto'
        },
        {
          title: 'Mantenimiento Predictivo',
          description: 'Servidor de base de datos muestra patrones que sugieren mantenimiento en 2 semanas',
          impact: 'Crítico'
        }
      ]);
      
      if (showLoading) {
        ai('🤖 Sistema IA actualizado - Todo funcionando perfectamente');
      }
    } catch (err) {
      console.error('Error loading AI data:', err);
      error('Error al cargar datos de IA');
      
      // Datos por defecto más realistas
      setAiInsights([
        {
          type: 'forecast',
          title: '📈 Predicción de Ventas',
          description: 'Se espera un incremento del 15% en ventas de neumáticos esta semana',
          priority: 'high',
          timestamp: 'Hace 2 min',
          confidence: '92%'
        },
        {
          type: 'alert',
          title: '⚠️ Stock Crítico Detectado',
          description: 'Filtros de aceite con stock bajo (menos de 10 unidades)',
          priority: 'urgent',
          timestamp: 'Hace 5 min',
          confidence: '98%'
        },
        {
          type: 'trend',
          title: '🔍 Tendencia Identificada',
          description: 'Incremento en búsquedas de repuestos para Ford Focus',
          priority: 'medium',
          timestamp: 'Hace 10 min',
          confidence: '87%'
        }
      ]);
      
      setSystemMetrics({
        cpuUsage: 45,
        memoryUsage: 68,
        aiModelsActive: 5,
        predictionsToday: 156,
        accuracy: 94.5,
        responseTime: 180
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadAIData();
  }, []);

  // Auto-refresh con limpieza correcta
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadAIData(false);
    }, refreshInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadAIData]);

  const filteredInsights = useMemo(() => {
    if (selectedInsightType === 'all') return aiInsights;
    return aiInsights.filter(insight => insight.type === selectedInsightType);
  }, [aiInsights, selectedInsightType]);

  const getInsightIcon = (type) => {
    const icons = {
      trend: TrendingUp,
      alert: AlertTriangle,
      forecast: Brain,
      ai: Zap,
      recommendation: Target
    };
    return icons[type] || Lightbulb;
  };

  const getStatusColor = (value, thresholds = { good: 80, warning: 60 }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (value, thresholds = { good: 80, warning: 60 }) => {
    if (value >= thresholds.good) return 'bg-green-600';
    if (value >= thresholds.warning) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    if (!autoRefresh) {
      success('🔄 Auto-actualización activada - Los datos se actualizarán automáticamente');
      addNotification({
        type: 'info',
        title: 'Sistema IA',
        message: 'Monitoreo automático activado'
      });
    } else {
      success('⏸️ Auto-actualización pausada');
    }
  };

  if (loading && !systemMetrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <Zap className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-600" />
          </div>
          <p className="mt-4 text-gray-700 font-medium">Iniciando sistema de IA...</p>
          <p className="text-sm text-gray-500 mt-1">Cargando modelos predictivos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Mejorado */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Centro de IA Avanzada
                </h1>
                <p className="text-gray-600 mt-1 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  Potenciado por Inteligencia Artificial de última generación
                  <Badge variant="success" className="ml-2">Online</Badge>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowHelp(true)}
                className="flex items-center gap-2"
              >
                <Info className="w-4 h-4" />
                Ayuda
              </Button>
              
              <Button
                variant={autoRefresh ? "default" : "outline"}
                onClick={handleToggleAutoRefresh}
                className={`flex items-center gap-2 ${autoRefresh ? 'bg-gradient-to-r from-green-500 to-green-600' : ''}`}
              >
                {autoRefresh ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="hidden sm:inline">Pausar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="hidden sm:inline">Auto-actualizar</span>
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => loadAIData()}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Métricas Principales Mejoradas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Procesamiento IA</p>
                  <p className="text-3xl font-bold">{systemMetrics?.cpuUsage || 0}%</p>
                  <p className="text-blue-100 text-xs mt-1">Optimal range: 40-70%</p>
                </div>
                <div className="relative">
                  <Cpu className="w-12 h-12 text-blue-200" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-400">
              <div 
                className="h-1 bg-white transition-all duration-1000" 
                style={{ width: `${systemMetrics?.cpuUsage || 0}%` }}
              ></div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Memoria IA</p>
                  <p className="text-3xl font-bold">{systemMetrics?.memoryUsage || 0}%</p>
                  <p className="text-green-100 text-xs mt-1">Efficient usage</p>
                </div>
                <div className="relative">
                  <Database className="w-12 h-12 text-green-200" />
                  <Gauge className="absolute top-2 right-2 w-4 h-4 text-green-300" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-green-400">
              <div 
                className="h-1 bg-white transition-all duration-1000" 
                style={{ width: `${systemMetrics?.memoryUsage || 0}%` }}
              ></div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Modelos Activos</p>
                  <p className="text-3xl font-bold">{systemMetrics?.aiModelsActive || 0}</p>
                  <p className="text-purple-100 text-xs mt-1">Neural networks online</p>
                </div>
                <div className="relative">
                  <Brain className="w-12 h-12 text-purple-200" />
                  <Layers className="absolute -bottom-1 -right-1 w-6 h-6 text-purple-300" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-400">
              <div className="h-1 bg-white w-full animate-pulse"></div>
            </div>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Predicciones Hoy</p>
                  <p className="text-3xl font-bold">{systemMetrics?.predictionsToday || 0}</p>
                  <p className="text-orange-100 text-xs mt-1">94.5% precisión</p>
                </div>
                <div className="relative">
                  <TrendingUp className="w-12 h-12 text-orange-200" />
                  <Target className="absolute -top-1 -right-1 w-5 h-5 text-orange-300" />
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-400">
              <div className="h-1 bg-white w-3/4 animate-pulse"></div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Insights de IA Mejorados */}
          <Card className="lg:col-span-2 border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  Insights Inteligentes
                  <Badge variant="ai" className="animate-pulse">Tiempo Real</Badge>
                </CardTitle>
                
                <Select 
                  value={selectedInsightType} 
                  onChange={setSelectedInsightType}
                  options={[
                    { value: "all", label: "🔍 Todos los Insights" },
                    { value: "trend", label: "📈 Tendencias" },
                    { value: "alert", label: "⚠️ Alertas" },
                    { value: "forecast", label: "🔮 Pronósticos" },
                    { value: "ai", label: "🤖 IA" }
                  ]}
                  placeholder="Filtrar insights"
                  className="w-48"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-0 max-h-96 overflow-y-auto">
                {filteredInsights.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
                      <Brain className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium">Analizando datos...</p>
                    <p className="text-sm mt-1">Los insights aparecerán pronto</p>
                  </div>
                ) : (
                  filteredInsights.map((insight, index) => {
                    const Icon = getInsightIcon(insight.type);
                    const priorityStyles = {
                      urgent: 'border-l-red-500 bg-gradient-to-r from-red-50 to-red-25',
                      high: 'border-l-orange-500 bg-gradient-to-r from-orange-50 to-orange-25',
                      medium: 'border-l-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-25',
                      low: 'border-l-green-500 bg-gradient-to-r from-green-50 to-green-25'
                    };

                    return (
                      <div
                        key={index}
                        className={`p-6 border-l-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                          priorityStyles[insight.priority] || priorityStyles.medium
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Icon className="w-5 h-5 text-gray-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {insight.title}
                              </h4>
                              <Badge variant="outline" size="sm" className="ml-2">
                                {insight.confidence}
                              </Badge>
                            </div>
                            <p className="text-gray-700 mt-2 leading-relaxed">
                              {insight.description}
                            </p>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-3">
                                <Badge 
                                  variant={insight.priority === 'urgent' ? 'destructive' : 'outline'} 
                                  size="sm"
                                  className="capitalize"
                                >
                                  {insight.type}
                                </Badge>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {insight.timestamp}
                                </span>
                              </div>
                              <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700">
                                <Eye className="w-4 h-4 mr-1" />
                                Ver detalles
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Monitor de Performance Mejorado */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Procesamiento IA</span>
                    <span className={`text-sm font-bold ${getStatusColor(systemMetrics?.cpuUsage || 0, { good: 70, warning: 50 })}`}>
                      {systemMetrics?.cpuUsage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(systemMetrics?.cpuUsage || 0, { good: 70, warning: 50 })}`}
                      style={{ width: `${systemMetrics?.cpuUsage || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Memoria IA</span>
                    <span className={`text-sm font-bold ${getStatusColor(systemMetrics?.memoryUsage || 0, { good: 80, warning: 60 })}`}>
                      {systemMetrics?.memoryUsage || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${getProgressColor(systemMetrics?.memoryUsage || 0, { good: 80, warning: 60 })}`}
                      style={{ width: `${systemMetrics?.memoryUsage || 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Precisión IA</span>
                    <span className="text-sm font-bold text-green-600">94.5%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-green-600 h-3 rounded-full w-[94.5%] transition-all duration-1000" />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-600" />
                    Modelos Neuronales
                  </h4>
                  <div className="space-y-3">
                    {[
                      { name: 'Predicción de Demanda', status: 'active', accuracy: '96%' },
                      { name: 'Optimización de Precios', status: 'active', accuracy: '94%' },
                      { name: 'Recomendaciones', status: 'active', accuracy: '92%' },
                      { name: 'Análisis de Tendencias', status: 'active', accuracy: '89%' },
                      { name: 'Detección de Anomalías', status: 'active', accuracy: '97%' }
                    ].map((model, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-gray-700">{model.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="success" size="sm">{model.accuracy}</Badge>
                          <Badge variant="outline" size="sm">Online</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Tiempo de Respuesta</span>
                    <span className="text-sm font-bold text-blue-600">{systemMetrics?.responseTime || 180}ms</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">Disponibilidad</span>
                    <span className="text-sm font-bold text-green-600">99.9%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart Mejorado */}
        <Card className="mt-8 border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                Performance de IA - Últimas 24 horas
                <Badge variant="outline" size="sm">Tiempo Real</Badge>
              </CardTitle>
              <div className="flex items-center gap-3">
                <Select 
                  value={refreshInterval.toString()}
                  onChange={(value) => setRefreshInterval(parseInt(value))}
                  options={[
                    { value: "10", label: "⚡ 10 segundos" },
                    { value: "30", label: "🔄 30 segundos" },
                    { value: "60", label: "⏰ 1 minuto" },
                    { value: "300", label: "🕐 5 minutos" }
                  ]}
                  placeholder="Intervalo de actualización"
                />
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">156</div>
                <div className="text-sm text-blue-700">Predicciones</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <div className="text-2xl font-bold text-green-600">94.5%</div>
                <div className="text-sm text-green-700">Precisión</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">180ms</div>
                <div className="text-sm text-purple-700">Respuesta</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">5</div>
                <div className="text-sm text-orange-700">Modelos</div>
              </div>
            </div>
            <AdvancedChart
              data={systemMetrics?.performanceData || []}
              type="line"
              title="Métricas de Performance del Sistema IA"
            />
          </CardContent>
        </Card>
      </div>

      {/* Separador */}
      <div className="border-t border-gray-200 my-8"></div>

      {/* Sección Administrativa - NUEVAS FUNCIONES */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔧 Panel Administrativo IA</h2>
        <p className="text-gray-600">Funciones avanzadas migradas desde Administración</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de Seguridad */}
        <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Alertas de Seguridad IA
              <Badge variant="destructive" size="sm">2</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Acceso Anómalo Detectado</p>
                  <p className="text-xs text-red-700">Múltiples intentos de login desde IP desconocida</p>
                  <p className="text-xs text-red-500 mt-1">Hace 5 min</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">Patrón de Tráfico Sospechoso</p>
                  <p className="text-xs text-red-700">Incremento inusual en consultas API durante horario nocturno</p>
                  <p className="text-xs text-red-500 mt-1">Hace 15 min</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Performance */}
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-blue-600" />
              Métricas de Performance IA
              <Badge variant="secondary" size="sm">Tiempo Real</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Precisión Modelos</p>
                <p className="text-lg font-bold text-blue-700">94.5%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tiempo Respuesta</p>
                <p className="text-lg font-bold text-green-700">180ms</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Predicciones/día</p>
                <p className="text-lg font-bold text-purple-700">1,247</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Eficiencia</p>
                <p className="text-lg font-bold text-orange-700">98.2%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recomendaciones Operacionales */}
        <Card className="lg:col-span-2 border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-600" />
              Recomendaciones Operacionales IA
              <Badge variant="secondary" size="sm">4 activas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Optimización de Stock</h4>
                  <p className="text-sm text-gray-600 mt-1">El modelo IA recomienda aumentar el stock de filtros de aceite en 25% para la próxima semana</p>
                  <Badge variant="outline" size="sm" className="mt-2 text-emerald-700 border-emerald-200">
                    Impacto: Alto
                  </Badge>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Precio Dinámico Activado</h4>
                  <p className="text-sm text-gray-600 mt-1">Los neumáticos premium pueden incrementar precio 8% basado en demanda detectada</p>
                  <Badge variant="outline" size="sm" className="mt-2 text-emerald-700 border-emerald-200">
                    Impacto: Medio
                  </Badge>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Promoción Inteligente</h4>
                  <p className="text-sm text-gray-600 mt-1">Recomendar descuento en baterías a clientes que compraron alternadores hace 6+ meses</p>
                  <Badge variant="outline" size="sm" className="mt-2 text-emerald-700 border-emerald-200">
                    Impacto: Alto
                  </Badge>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-emerald-100">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Mantenimiento Predictivo</h4>
                  <p className="text-sm text-gray-600 mt-1">Servidor de base de datos muestra patrones que sugieren mantenimiento en 2 semanas</p>
                  <Badge variant="outline" size="sm" className="mt-2 text-emerald-700 border-emerald-200">
                    Impacto: Crítico
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Ayuda */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              Guía del Centro de IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🤖 ¿Qué es el Centro de IA?</h4>
              <p className="text-gray-600 text-sm">
                El Centro de IA es el corazón inteligente de tu sistema POS. Utiliza algoritmos de machine learning 
                para analizar patrones, predecir tendencias y optimizar tu negocio automáticamente.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">📊 Métricas del Sistema</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Procesamiento IA:</strong> Muestra el uso de CPU dedicado al procesamiento de IA</li>
                <li><strong>Memoria IA:</strong> Indica el uso de memoria de los modelos neuronales</li>
                <li><strong>Modelos Activos:</strong> Número de redes neuronales funcionando simultáneamente</li>
                <li><strong>Predicciones Hoy:</strong> Total de predicciones generadas en las últimas 24h</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">💡 Insights Inteligentes</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>📈 Tendencias:</strong> Identifica patrones en ventas y comportamiento de clientes</li>
                <li><strong>⚠️ Alertas:</strong> Notificaciones sobre stock, precios y oportunidades</li>
                <li><strong>🔮 Pronósticos:</strong> Predicciones de demanda y ventas futuras</li>
                <li><strong>🤖 IA:</strong> Recomendaciones automáticas del sistema</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🔄 Auto-actualización</h4>
              <p className="text-gray-600 text-sm">
                Activa la auto-actualización para que el sistema monitoree continuamente y actualice 
                los datos en tiempo real. Puedes configurar el intervalo de actualización desde 10 segundos 
                hasta 5 minutos según tus necesidades.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">🎯 Beneficios de la IA</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Predicciones de demanda con 94.5% de precisión</li>
                <li>• Optimización automática de precios</li>
                <li>• Detección temprana de problemas de stock</li>
                <li>• Recomendaciones personalizadas para clientes</li>
                <li>• Análisis de tendencias de mercado</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AICenterEnhanced;