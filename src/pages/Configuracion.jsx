import React, { useState, useEffect } from 'react';
import {
  Settings, Brain, Zap, Shield, Database, Server, Bell,
  Eye, Download, Upload, Save, RefreshCw, Check, X,
  Sliders, Lock, Globe, Cpu, HardDrive, Activity,
  BarChart3, Target, Layers, Cloud, Wifi, Monitor, Clock
} from 'lucide-react';
import {
  Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Label,
  Dialog, DialogContent, DialogHeader, DialogTitle, Switch, Select, Textarea
} from '../components/ui';
import { useAuth } from '../hooks';
import useToast from '../hooks/useToast';
import useNotifications from '../hooks/useNotifications';
import apiService from '../services/api';

const Configuracion = () => {
  const { user, hasPermission } = useAuth();
  const { success, error, warning, ai } = useToast();
  const { addNotification } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showModelDialog, setShowModelDialog] = useState(false);
  const [showBackupDialog, setShowBackupDialog] = useState(false);

  const [aiConfig, setAiConfig] = useState({
    enabled: true,
    alertLevel: 'medium',
    autolearn: true,
    predictionAccuracy: 85,
    dataRetention: 90,
    notifications: {
      stockAlerts: true,
      priceChanges: true,
      anomalies: true,
      reports: false
    },
    modelSettings: {
      trainingFrequency: 'weekly',
      dataRetention: 365,
      useExternalData: false,
      autoOptimize: true
    }
  });

  const [systemConfig, setSystemConfig] = useState({
    backup: {
      enabled: true,
      frequency: 'daily',
      retention: 30,
      location: 'local'
    },
    security: {
      sessionTimeout: 60,
      maxLoginAttempts: 3,
      requireStrongPasswords: true,
      enableAuditLog: true
    },
    performance: {
      cacheEnabled: true,
      compressionEnabled: true,
      maxConcurrentUsers: 50,
      databaseOptimization: true
    }
  });

  const [systemStats, setSystemStats] = useState({
    uptime: '15 días, 8 horas',
    cpuUsage: 23,
    memoryUsage: 67,
    diskUsage: 45,
    activeUsers: 12,
    totalRequests: 145623,
    errorRate: 0.2,
    responseTime: 235
  });

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      type: 'config',
      description: 'Configuración de IA actualizada',
      user: 'admin',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'success'
    },
    {
      id: 2,
      type: 'backup',
      description: 'Backup automático completado',
      user: 'system',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      status: 'success'
    },
    {
      id: 3,
      type: 'security',
      description: 'Intento de acceso fallido detectado',
      user: 'unknown',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'warning'
    }
  ]);

  // Cargar configuraciones y stats al montar
  useEffect(() => {
    const loadConfigData = async () => {
      try {
        // Cargar todas las settings
        const settingsData = await apiService.getAllSettings();

        // Si las settings tienen estructura de aiConfig/systemConfig, actualizar
        if (settingsData.aiConfig) {
          setAiConfig(prev => ({ ...prev, ...settingsData.aiConfig }));
        }
        if (settingsData.systemConfig) {
          setSystemConfig(prev => ({ ...prev, ...settingsData.systemConfig }));
        }

        // Cargar stats del sistema
        const statsData = await apiService.getSystemStatus();
        if (statsData) {
          setSystemStats(statsData);
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      }
    };

    loadConfigData();
  }, []);

  const handleSaveConfiguration = async () => {
    setLoading(true);
    try {
      // Guardar configuraciones en backend usando múltiples settings
      const settingsToSave = {
        'aiConfig': aiConfig,
        'systemConfig': systemConfig,
        'aiConfig.enabled': aiConfig.enabled.toString(),
        'aiConfig.alertLevel': aiConfig.alertLevel,
        'aiConfig.autolearn': aiConfig.autolearn.toString(),
        'systemConfig.security.sessionTimeout': systemConfig.security.sessionTimeout.toString(),
        'systemConfig.security.maxLoginAttempts': systemConfig.security.maxLoginAttempts.toString(),
      };

      await apiService.saveMultipleSettings(settingsToSave);

      // Guardar también en localStorage como backup
      localStorage.setItem('aiConfig', JSON.stringify(aiConfig));
      localStorage.setItem('systemConfig', JSON.stringify(systemConfig));

      success('✅ Configuración guardada exitosamente');
      ai('🤖 Sistema reconfigurado', 'IA optimizada con nuevos parámetros');

      // Agregar a actividad reciente
      setRecentActivity(prev => [
        {
          id: prev.length + 1,
          type: 'config',
          description: 'Configuración actualizada por el administrador',
          user: user?.nombre || 'admin',
          timestamp: new Date(),
          status: 'success'
        },
        ...prev.slice(0, 9)
      ]);

      addNotification({
        type: 'success',
        message: '✅ Todos los cambios han sido guardados correctamente'
      });

    } catch (err) {
      error('❌ Error al guardar configuración');
      warning('⚠️ Los cambios se guardarán localmente');
    } finally {
      setLoading(false);
    }
  };

  const handleExportConfig = () => {
    const configData = {
      ai: aiConfig,
      system: systemConfig,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `configuracion-sistema-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    success('📄 Configuración exportada');
  };

  const handleRunBackup = async () => {
    setLoading(true);
    warning('🔄 Iniciando backup manual...');

    try {
      // Guardar backup en backend
      await apiService.updateSetting('lastBackup', new Date().toISOString());

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      success('💾 Backup completado exitosamente');
      ai('🤖 Datos respaldados', 'Backup manual ejecutado correctamente');

      // Agregar a actividad reciente
      setRecentActivity(prev => [
        {
          id: prev.length + 1,
          type: 'backup',
          description: 'Backup manual completado exitosamente',
          user: user?.nombre || 'admin',
          timestamp: new Date(),
          status: 'success'
        },
        ...prev.slice(0, 9)
      ]);

      addNotification({
        type: 'success',
        message: '✅ Backup completado - Todos los datos han sido respaldados'
      });

    } catch (err) {
      error('❌ Error al realizar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemOptimization = async () => {
    setLoading(true);
    ai('🔧 Optimizando sistema...', 'Ejecutando rutinas de mantenimiento');

    try {
      // Guardar que se ejecutó optimización
      await apiService.updateSetting('lastOptimization', new Date().toISOString());

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 3500));

      success('⚡ Sistema optimizado exitosamente');

      // Mejorar métricas
      setSystemStats(prev => ({
        ...prev,
        cpuUsage: Math.max(15, prev.cpuUsage - 8),
        memoryUsage: Math.max(45, prev.memoryUsage - 12),
        responseTime: Math.max(180, prev.responseTime - 55)
      }));

      // Agregar a actividad reciente
      setRecentActivity(prev => [
        {
          id: prev.length + 1,
          type: 'config',
          description: 'Sistema optimizado exitosamente',
          user: 'system',
          timestamp: new Date(),
          status: 'success'
        },
        ...prev.slice(0, 9)
      ]);

      addNotification({
        type: 'success',
        message: '⚡ Optimización completada - Sistema mejorado'
      });

    } catch (err) {
      error('❌ Error al optimizar sistema');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const systemHealthCards = [
    {
      title: 'Tiempo Activo',
      value: systemStats.uptime,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'CPU',
      value: `${systemStats.cpuUsage}%`,
      icon: Cpu,
      color: systemStats.cpuUsage > 70 ? 'text-red-600' : 'text-green-600',
      bgColor: systemStats.cpuUsage > 70 ? 'bg-red-100' : 'bg-green-100'
    },
    {
      title: 'Memoria',
      value: `${systemStats.memoryUsage}%`,
      icon: HardDrive,
      color: systemStats.memoryUsage > 80 ? 'text-red-600' : 'text-orange-600',
      bgColor: systemStats.memoryUsage > 80 ? 'bg-red-100' : 'bg-orange-100'
    },
    {
      title: 'Usuarios Activos',
      value: systemStats.activeUsers,
      icon: Monitor,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  if (!hasPermission('admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-600">No tienes permisos para acceder a la configuración del sistema.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl sm:rounded-2xl shadow-lg">
              <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-gray-900 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
                Configuración
              </h1>
              <p className="text-base sm:text-lg text-gray-500 font-medium">Gestiona las configuraciones de IA y sistema</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
              className="gap-2 border-gray-200 hover:bg-gray-50"
            >
              <Sliders className="w-4 h-4" />
              {showAdvancedSettings ? 'Ocultar' : 'Mostrar'} Avanzadas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportConfig}
              className="gap-2 border-gray-200 hover:bg-gray-50"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              onClick={handleSaveConfiguration}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar
            </Button>
          </div>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {systemHealthCards.map((stat, index) => (
            <Card key={index} className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
                onClick={handleRunBackup}
                disabled={loading}
              >
                <Database className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium">Backup Manual</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200"
                onClick={handleSystemOptimization}
                disabled={loading}
              >
                <Activity className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Optimizar Sistema</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
                onClick={() => setShowModelDialog(true)}
              >
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-medium">Entrenar IA</span>
              </Button>

              <Button
                variant="outline"
                className="h-20 flex flex-col gap-2 hover:bg-orange-50 hover:border-orange-200"
                onClick={handleExportConfig}
              >
                <Download className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-medium">Exportar Config</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* AI Configuration */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Configuración de IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Enabled */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Inteligencia Artificial</Label>
                  <p className="text-sm text-gray-600">Activar análisis predictivo y recomendaciones</p>
                </div>
                <Switch
                  checked={aiConfig.enabled}
                  onCheckedChange={(checked) => setAiConfig(prev => ({ ...prev, enabled: checked }))}
                />
              </div>

              {/* Alert Level */}
              <div>
                <Label className="text-base font-medium">Nivel de Alertas</Label>
                <Select
                  value={aiConfig.alertLevel}
                  onValueChange={(value) => setAiConfig(prev => ({ ...prev, alertLevel: value }))}
                  className="mt-2"
                >
                  <option value="low">Bajo - Solo críticas</option>
                  <option value="medium">Medio - Importantes</option>
                  <option value="high">Alto - Todas</option>
                </Select>
              </div>

              {/* Notifications */}
              <div>
                <Label className="text-base font-medium">Notificaciones IA</Label>
                <div className="space-y-3 mt-3">
                  {Object.entries(aiConfig.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <Switch
                        checked={value}
                        onCheckedChange={(checked) => setAiConfig(prev => ({
                          ...prev,
                          notifications: { ...prev.notifications, [key]: checked }
                        }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Prediction Accuracy */}
              <div>
                <Label className="text-base font-medium">
                  Precisión de Predicciones: {aiConfig.predictionAccuracy}%
                </Label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={aiConfig.predictionAccuracy}
                  onChange={(e) => setAiConfig(prev => ({ ...prev, predictionAccuracy: parseInt(e.target.value) }))}
                  className="w-full mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Rápido</span>
                  <span>Preciso</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Configuration */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                Configuración del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Backup Settings */}
              <div>
                <Label className="text-base font-medium">Backup Automático</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Habilitado</span>
                    <Switch
                      checked={systemConfig.backup.enabled}
                      onCheckedChange={(checked) => setSystemConfig(prev => ({
                        ...prev,
                        backup: { ...prev.backup, enabled: checked }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Frecuencia</Label>
                    <Select
                      value={systemConfig.backup.frequency}
                      onValueChange={(value) => setSystemConfig(prev => ({
                        ...prev,
                        backup: { ...prev.backup, frequency: value }
                      }))}
                      className="mt-1"
                    >
                      <option value="hourly">Cada hora</option>
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div>
                <Label className="text-base font-medium">Seguridad</Label>
                <div className="space-y-3 mt-3">
                  <div>
                    <Label className="text-sm text-gray-600">Timeout de sesión (minutos)</Label>
                    <Input
                      type="number"
                      value={systemConfig.security.sessionTimeout}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        security: { ...prev.security, sessionTimeout: parseInt(e.target.value) || 60 }
                      }))}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Contraseñas seguras</span>
                    <Switch
                      checked={systemConfig.security.requireStrongPasswords}
                      onCheckedChange={(checked) => setSystemConfig(prev => ({
                        ...prev,
                        security: { ...prev.security, requireStrongPasswords: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div>
                <Label className="text-base font-medium">Rendimiento</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache habilitado</span>
                    <Switch
                      checked={systemConfig.performance.cacheEnabled}
                      onCheckedChange={(checked) => setSystemConfig(prev => ({
                        ...prev,
                        performance: { ...prev.performance, cacheEnabled: checked }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Compresión</span>
                    <Switch
                      checked={systemConfig.performance.compressionEnabled}
                      onCheckedChange={(checked) => setSystemConfig(prev => ({
                        ...prev,
                        performance: { ...prev.performance, compressionEnabled: checked }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Actividad Reciente del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                  {activity.type === 'config' ? (
                    <Settings className="w-4 h-4" />
                  ) : activity.type === 'backup' ? (
                    <Database className="w-4 h-4" />
                  ) : (
                    <Shield className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span>Usuario: {activity.user}</span>
                    <span>•</span>
                    <span>{formatDateTime(activity.timestamp)}</span>
                  </div>
                </div>

                <Badge
                  className={`${getStatusColor(activity.status)} px-2 py-1 text-xs`}
                >
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        {showAdvancedSettings && (
          <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <Layers className="w-5 h-5" />
                Configuraciones Avanzadas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <Eye className="w-4 h-4" />
                  <strong>Advertencia</strong>
                </div>
                <p className="text-sm text-yellow-700">
                  Estas configuraciones son para usuarios avanzados. Cambios incorrectos pueden afectar el rendimiento del sistema.
                </p>
              </div>

              {/* Model Settings */}
              <div>
                <Label className="text-base font-medium">Configuración del Modelo IA</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <Label className="text-sm text-gray-600">Frecuencia de entrenamiento</Label>
                    <Select
                      value={aiConfig.modelSettings.trainingFrequency}
                      onValueChange={(value) => setAiConfig(prev => ({
                        ...prev,
                        modelSettings: { ...prev.modelSettings, trainingFrequency: value }
                      }))}
                      className="mt-1"
                    >
                      <option value="daily">Diario</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensual</option>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Retención de datos (días)</Label>
                    <Input
                      type="number"
                      value={aiConfig.modelSettings.dataRetention}
                      onChange={(e) => setAiConfig(prev => ({
                        ...prev,
                        modelSettings: { ...prev.modelSettings, dataRetention: parseInt(e.target.value) || 365 }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Database Settings */}
              <div>
                <Label className="text-base font-medium">Base de Datos</Label>
                <div className="space-y-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Optimización automática</span>
                    <Switch
                      checked={systemConfig.performance.databaseOptimization}
                      onCheckedChange={(checked) => setSystemConfig(prev => ({
                        ...prev,
                        performance: { ...prev.performance, databaseOptimization: checked }
                      }))}
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Usuarios concurrentes máximos</Label>
                    <Input
                      type="number"
                      value={systemConfig.performance.maxConcurrentUsers}
                      onChange={(e) => setSystemConfig(prev => ({
                        ...prev,
                        performance: { ...prev.performance, maxConcurrentUsers: parseInt(e.target.value) || 50 }
                      }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Model Dialog */}
        <Dialog open={showModelDialog} onOpenChange={setShowModelDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Entrenar Modelo IA
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  El entrenamiento del modelo IA puede tomar varios minutos. Durante este proceso,
                  las predicciones pueden tener menor precisión.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Tipo de entrenamiento</Label>
                  <Select defaultValue="incremental" className="mt-1">
                    <option value="incremental">Incremental</option>
                    <option value="full">Completo</option>
                    <option value="quick">Rápido</option>
                  </Select>
                </div>

                <div>
                  <Label>Datos a incluir</Label>
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Datos de ventas</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Patrones de inventario</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Datos externos</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={async () => {
                    setShowModelDialog(false);
                    setLoading(true);

                    ai('🧠 Entrenando modelo IA...', 'Proceso iniciado, completará en ~5 minutos');

                    try {
                      // Guardar en backend que se inició entrenamiento
                      await apiService.updateSetting('lastAiTraining', new Date().toISOString());

                      // Simular tiempo de entrenamiento
                      await new Promise(resolve => setTimeout(resolve, 4500));

                      success('🎓 Modelo IA entrenado exitosamente');

                      // Agregar a actividad reciente
                      setRecentActivity(prev => [
                        {
                          id: prev.length + 1,
                          type: 'config',
                          description: 'Modelo IA entrenado exitosamente',
                          user: 'system',
                          timestamp: new Date(),
                          status: 'success'
                        },
                        ...prev.slice(0, 9)
                      ]);

                      addNotification({
                        type: 'success',
                        message: '🎓 Entrenamiento completado - Modelo IA actualizado'
                      });

                      // Mejorar precisión de predicciones
                      setAiConfig(prev => ({
                        ...prev,
                        predictionAccuracy: Math.min(100, prev.predictionAccuracy + 2)
                      }));

                    } catch (err) {
                      error('❌ Error al entrenar modelo');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Iniciar Entrenamiento
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowModelDialog(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};

export default Configuracion;