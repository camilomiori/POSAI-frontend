import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input, 
  Badge,
  Select,
  Checkbox,
  Label,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // Optimized icon imports
  Settings,
  Brain,
  Zap,
  Shield,
  Bell,
  Database,
  Cpu,
  BarChart3,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Plus,
  Minus,
  Sliders
} from '../components/ui';
import { useAuth } from '../hooks';
import useToast from '../hooks/useToast';
import { apiService, getAiEngine } from '../services';
import { formatDateTime } from '../utils/formatters';

const Configuracion = () => {
  const { user, hasPermission, isAdmin } = useAuth();
  const { success, error, warning, ai } = useToast();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    predictionAccuracy: 0.85,
    autoOptimization: true,
    realTimeAnalysis: true,
    priceOptimization: true,
    inventoryPrediction: true,
    customerSegmentation: true,
    marketAnalysis: false,
    notifications: {
      criticalAlerts: true,
      dailyReports: true,
      priceChanges: false,
      stockAlerts: true
    },
    thresholds: {
      lowStockAlert: 10,
      highDemandThreshold: 80,
      priceVariationLimit: 15,
      confidenceLevel: 75
    },
    modelSettings: {
      trainingFrequency: 'weekly',
      dataRetention: 365,
      useExternalData: false,
      learningRate: 0.01
    }
  });
  
  const [systemConfig, setSystemConfig] = useState({
    language: 'es',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    autoBackup: true,
    auditLog: true,
    sessionTimeout: 30
  });
  
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [modelStats, setModelStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Cargar configuración
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const aiEngine = (await getAiEngine()).default;
      
      const [
        aiConfigResponse,
        systemConfigResponse,
        modelStatsResponse,
        activityResponse
      ] = await Promise.all([
        aiEngine.getConfiguration(),
        apiService.getSystemConfiguration(),
        aiEngine.getModelStatistics(),
        apiService.getRecentActivity({ limit: 10 })
      ]);
      
      if (aiConfigResponse) setAiConfig(aiConfigResponse);
      if (systemConfigResponse) setSystemConfig(systemConfigResponse);
      setModelStats(modelStatsResponse);
      setRecentActivity(activityResponse.data || []);
      
    } catch (err) {
      console.error('Error loading configuration:', err);
      error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!hasPermission('manage_system')) {
      warning('No tienes permisos para modificar la configuración');
      return;
    }

    try {
      setSaving(true);
      const aiEngine = (await getAiEngine()).default;
      
      await Promise.all([
        aiEngine.updateConfiguration(aiConfig),
        apiService.updateSystemConfiguration(systemConfig)
      ]);
      
      success('Configuración guardada exitosamente');
      ai('Sistema reconfigurado con nuevos parámetros de IA');
      
    } catch (err) {
      error('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleResetAIModel = async () => {
    if (!window.confirm('¿Estás seguro de que quieres resetear el modelo de IA? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setSaving(true);
      const aiEngine = (await getAiEngine()).default;
      await aiEngine.resetModel();
      success('Modelo de IA reseteado exitosamente');
      loadConfiguration();
    } catch (err) {
      error('Error al resetear el modelo de IA');
    } finally {
      setSaving(false);
    }
  };

  const handleRetrainModel = async () => {
    try {
      setSaving(true);
      const aiEngine = (await getAiEngine()).default;
      await aiEngine.retrainModel();
      success('Reentrenamiento del modelo iniciado');
      ai('Modelo de IA en proceso de reentrenamiento');
    } catch (err) {
      error('Error al iniciar el reentrenamiento');
    } finally {
      setSaving(false);
    }
  };

  const handleExportConfig = () => {
    const config = { aiConfig, systemConfig };
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pos-ai-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success('Configuración exportada');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las configuraciones de IA y sistema
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="gap-2"
          >
            <Sliders className="w-4 h-4" />
            {showAdvancedSettings ? 'Ocultar' : 'Mostrar'} Avanzadas
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportConfig}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>
          
          <Button
            onClick={handleSaveConfiguration}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Guardar Cambios
          </Button>
        </div>
      </div>

      {/* Estado del Sistema IA */}
      <Card className="border-l-4 border-l-emerald-500 bg-gradient-to-r from-emerald-50/50 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-emerald-600" />
            Estado del Sistema de IA
            <Badge variant="ai" size="sm">
              {aiConfig.enabled ? 'Activo' : 'Inactivo'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
              <p className="text-2xl font-bold text-emerald-600">
                {modelStats?.accuracy ? (modelStats.accuracy * 100).toFixed(1) : '85.2'}%
              </p>
              <p className="text-sm text-gray-600">Precisión Actual</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {modelStats?.predictionsToday || '247'}
              </p>
              <p className="text-sm text-gray-600">Predicciones Hoy</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-600">
                {modelStats?.lastTraining ? formatDateTime(modelStats.lastTraining).split(' ')[0] : 'Ayer'}
              </p>
              <p className="text-sm text-gray-600">Último Entrenamiento</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-orange-200">
              <p className="text-2xl font-bold text-orange-600">
                {modelStats?.dataPoints || '15.2K'}
              </p>
              <p className="text-sm text-gray-600">Puntos de Datos</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModelDialog(true)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              Ver Estadísticas Detalladas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetrainModel}
              disabled={saving}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              Reentrenar Modelo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuraciones Principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Configuración de IA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Configuración de IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Funcionalidades principales */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Funcionalidades</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">IA Habilitada</Label>
                    <p className="text-xs text-gray-500">Activar/desactivar todo el sistema de IA</p>
                  </div>
                  <Checkbox
                    checked={aiConfig.enabled}
                    onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, enabled: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Optimización Automática</Label>
                    <p className="text-xs text-gray-500">Aplicar optimizaciones automáticamente</p>
                  </div>
                  <Checkbox
                    checked={aiConfig.autoOptimization}
                    onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, autoOptimization: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Análisis en Tiempo Real</Label>
                    <p className="text-xs text-gray-500">Procesar datos en tiempo real</p>
                  </div>
                  <Checkbox
                    checked={aiConfig.realTimeAnalysis}
                    onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, realTimeAnalysis: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Optimización de Precios</Label>
                    <p className="text-xs text-gray-500">Sugerir precios optimizados</p>
                  </div>
                  <Checkbox
                    checked={aiConfig.priceOptimization}
                    onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, priceOptimization: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Predicción de Inventario</Label>
                    <p className="text-xs text-gray-500">Predecir demanda de productos</p>
                  </div>
                  <Checkbox
                    checked={aiConfig.inventoryPrediction}
                    onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, inventoryPrediction: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Configuración de notificaciones */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Notificaciones IA</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Alertas Críticas</Label>
                  <Checkbox
                    checked={aiConfig.notifications.criticalAlerts}
                    onCheckedChange={(checked) => setAiConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, criticalAlerts: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Reportes Diarios</Label>
                  <Checkbox
                    checked={aiConfig.notifications.dailyReports}
                    onCheckedChange={(checked) => setAiConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, dailyReports: checked }
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm">Alertas de Stock</Label>
                  <Checkbox
                    checked={aiConfig.notifications.stockAlerts}
                    onCheckedChange={(checked) => setAiConfig(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, stockAlerts: checked }
                    }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración del Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configuración del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Configuraciones básicas */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">General</h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Idioma</Label>
                  <Select 
                    value={systemConfig.language} 
                    onChange={(value) => setSystemConfig(prev => ({ ...prev, language: value }))}
                    options={[
                      { value: "es", label: "Español" },
                      { value: "en", label: "English" },
                      { value: "pt", label: "Português" }
                    ]}
                    placeholder="Seleccionar idioma"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Moneda</Label>
                  <Select 
                    value={systemConfig.currency} 
                    onValueChange={(value) => setSystemConfig(prev => ({ ...prev, currency: value }))}
                  >
                    <option value="ARS">Peso Argentino (ARS)</option>
                    <option value="USD">Dólar (USD)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="BRL">Real (BRL)</option>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Tema</Label>
                  <Select 
                    value={systemConfig.theme} 
                    onValueChange={(value) => setSystemConfig(prev => ({ ...prev, theme: value }))}
                  >
                    <option value="light">Claro</option>
                    <option value="dark">Oscuro</option>
                    <option value="auto">Automático</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Configuraciones de seguridad */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Seguridad</h4>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Tiempo de Sesión (minutos)</Label>
                  <Input
                    type="number"
                    value={systemConfig.sessionTimeout}
                    onChange={(e) => setSystemConfig(prev => ({ 
                      ...prev, 
                      sessionTimeout: parseInt(e.target.value) || 30 
                    }))}
                    min="5"
                    max="480"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Backup Automático</Label>
                    <p className="text-xs text-gray-500">Crear backups diarios automáticos</p>
                  </div>
                  <Checkbox
                    checked={systemConfig.autoBackup}
                    onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, autoBackup: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Log de Auditoría</Label>
                    <p className="text-xs text-gray-500">Registrar todas las acciones</p>
                  </div>
                  <Checkbox
                    checked={systemConfig.auditLog}
                    onCheckedChange={(checked) => setSystemConfig(prev => ({ ...prev, auditLog: checked }))}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuraciones Avanzadas */}
      {showAdvancedSettings && (
        <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Configuraciones Avanzadas
              <Badge variant="warning" size="sm">Cuidado</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Umbrales de IA */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Umbrales y Límites</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Alerta Stock Bajo</Label>
                  <Input
                    type="number"
                    value={aiConfig.thresholds.lowStockAlert}
                    onChange={(e) => setAiConfig(prev => ({
                      ...prev,
                      thresholds: { ...prev.thresholds, lowStockAlert: parseInt(e.target.value) || 10 }
                    }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Umbral Alta Demanda (%)</Label>
                  <Input
                    type="number"
                    value={aiConfig.thresholds.highDemandThreshold}
                    onChange={(e) => setAiConfig(prev => ({
                      ...prev,
                      thresholds: { ...prev.thresholds, highDemandThreshold: parseInt(e.target.value) || 80 }
                    }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Límite Variación Precio (%)</Label>
                  <Input
                    type="number"
                    value={aiConfig.thresholds.priceVariationLimit}
                    onChange={(e) => setAiConfig(prev => ({
                      ...prev,
                      thresholds: { ...prev.thresholds, priceVariationLimit: parseInt(e.target.value) || 15 }
                    }))}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Nivel de Confianza Mínimo (%)</Label>
                  <Input
                    type="number"
                    value={aiConfig.thresholds.confidenceLevel}
                    onChange={(e) => setAiConfig(prev => ({
                      ...prev,
                      thresholds: { ...prev.thresholds, confidenceLevel: parseInt(e.target.value) || 75 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Configuración del Modelo */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Configuración del Modelo</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Frecuencia de Entrenamiento</Label>
                  <Select 
                    value={aiConfig.modelSettings.trainingFrequency}
                    onValueChange={(value) => setAiConfig(prev => ({
                      ...prev,
                      modelSettings: { ...prev.modelSettings, trainingFrequency: value }
                    }))}
                  >
                    <option value="daily">Diario</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensual</option>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Retención de Datos (días)</Label>
                  <Input
                    type="number"
                    value={aiConfig.modelSettings.dataRetention}
                    onChange={(e) => setAiConfig(prev => ({
                      ...prev,
                      modelSettings: { ...prev.modelSettings, dataRetention: parseInt(e.target.value) || 365 }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Acciones Peligrosas */}
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-medium text-red-900 mb-3">Acciones Peligrosas</h4>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetAIModel}
                  disabled={saving}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Resetear Modelo IA
                </Button>
              </div>
              <p className="text-xs text-red-600 mt-2">
                Esta acción eliminará todos los datos de entrenamiento y configuraciones del modelo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actividad Reciente */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateTime(activity.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Estadísticas del Modelo */}
      <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              Estadísticas Detalladas del Modelo
            </DialogTitle>
          </DialogHeader>

          {modelStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {(modelStats.accuracy * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-gray-600">Precisión General</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {modelStats.totalPredictions?.toLocaleString() || '12.5K'}
                  </p>
                  <p className="text-sm text-gray-600">Predicciones Total</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Métricas por Módulo</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Predicción de Demanda</span>
                    <Badge variant="success">
                      {((modelStats.moduleAccuracy?.demand || 0.87) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Optimización de Precios</span>
                    <Badge variant="info">
                      {((modelStats.moduleAccuracy?.pricing || 0.82) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span className="text-sm">Segmentación de Clientes</span>
                    <Badge variant="warning">
                      {((modelStats.moduleAccuracy?.segmentation || 0.79) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModelDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Configuracion;